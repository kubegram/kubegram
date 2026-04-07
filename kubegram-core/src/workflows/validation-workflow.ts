/**
 * Validation workflow for kubegram-core.
 *
 * After kubegram-operator deploys manifests and confirms pods are Ready, this
 * workflow:
 *  1. Parses the user-provided OpenAPI spec to extract testable endpoints.
 *  2. Uses an LLM to generate representative HTTP test cases per endpoint.
 *  3. Sends test cases to kubegram-server, which proxies them to the injected
 *     kubegram-sidecar pods. Each request carries an X-Kubegram-Validation-ID
 *     header for idempotent tracking via the sidecar's eBPF TC hooks.
 *  4. Polls kubegram-server for results reported back by the sidecars.
 *  5. Uses an LLM to produce a human-readable analysis of pass/fail outcomes.
 *
 * Dependencies injected (no globals):
 *  - Redis client  →  RedisCheckpointer (state persistence)
 *  - EventBus      →  WorkflowPubSub (event fan-out)
 */

import { generateText } from "ai";
import { type EventCache, type EventBus } from "@kubegram/events";
import { v4 as uuidv4 } from "uuid";
import { b } from "../baml_client/index.js";
import type { ValidationTestCaseOutput } from "../baml_client/types.js";

import { Checkpointer } from "../types/checkpointer.js";
import { WorkflowPubSub } from "../state/pubsub.js";
import { createLLMProvider } from "../llm/providers.js";
import type { Graph } from "../types/graph.js";
import type { StepHandler, WorkflowContext } from "../types/workflow.js";

import { BaseWorkflow } from "./base-workflow.js";
import {
  ValidationWorkflowStep,
  type ValidationState,
  type ValidationTestCase,
  type SidecarEndpoint,
  type TestResult,
  type ValidationSummary,
  type ValidationWorkflowOptions,
  type ValidationWorkflowResult,
  createInitialValidationState,
  addValidationError,
} from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sleep for `ms` milliseconds. */
const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

/** Simple exponential backoff poll. Returns when predicate resolves true or maxWaitMs exceeded. */
async function pollWithBackoff(
  predicate: () => Promise<boolean>,
  maxWaitMs: number,
  initialDelayMs = 2000,
): Promise<boolean> {
  let elapsed = 0;
  let delay = initialDelayMs;
  while (elapsed < maxWaitMs) {
    await sleep(delay);
    elapsed += delay;
    if (await predicate()) return true;
    delay = Math.min(delay * 1.5, 15_000);
  }
  return false;
}

// ---------------------------------------------------------------------------
// ValidationWorkflow
// ---------------------------------------------------------------------------

export class ValidationWorkflow extends BaseWorkflow<
  ValidationState,
  ValidationWorkflowStep
> {
  protected readonly steps: ValidationWorkflowStep[] = [
    ValidationWorkflowStep.PARSE_API_SCHEMA,
    ValidationWorkflowStep.GENERATE_TEST_CASES,
    ValidationWorkflowStep.TRIGGER_TESTS,
    ValidationWorkflowStep.COLLECT_RESULTS,
    ValidationWorkflowStep.ANALYZE_RESULTS,
  ];

  protected readonly handlers: Record<
    ValidationWorkflowStep,
    StepHandler<ValidationState>
  > = {
    [ValidationWorkflowStep.PARSE_API_SCHEMA]: (s) => this.parseApiSchema(s),
    [ValidationWorkflowStep.GENERATE_TEST_CASES]: (s) =>
      this.generateTestCases(s),
    [ValidationWorkflowStep.TRIGGER_TESTS]: (s) => this.triggerTests(s),
    [ValidationWorkflowStep.COLLECT_RESULTS]: (s) => this.collectResults(s),
    [ValidationWorkflowStep.ANALYZE_RESULTS]: (s) => this.analyzeResults(s),
    // Terminal steps — never executed; required to satisfy Record<Step, …>
    [ValidationWorkflowStep.COMPLETED]: async (s) => s,
    [ValidationWorkflowStep.FAILED]: async (s) => s,
  };

  protected readonly initialStep = ValidationWorkflowStep.PARSE_API_SCHEMA;

  protected readonly terminalSteps: ValidationWorkflowStep[] = [
    ValidationWorkflowStep.COMPLETED,
    ValidationWorkflowStep.FAILED,
  ];

  protected readonly channelPrefix = "validation";

  constructor(eventCache: EventCache, eventBus: EventBus) {
    super(
      new Checkpointer<ValidationState>(eventCache, "validation"),
      new WorkflowPubSub(eventBus),
    );
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async run(
    graph: Graph,
    namespace: string,
    apiSchema: unknown,
    serverBaseUrl: string,
    threadId: string,
    context: WorkflowContext,
    options: ValidationWorkflowOptions = {},
  ): Promise<ValidationWorkflowResult> {
    const state = createInitialValidationState(
      graph,
      namespace,
      apiSchema,
      serverBaseUrl,
      options,
    );
    const result = await this.execute(state, { ...context, threadId });

    return {
      state: result.state,
      success: result.success,
      summary: result.success
        ? (result.state.validationSummary ?? undefined)
        : undefined,
      testResults: result.success ? result.state.testResults : undefined,
      error: result.error,
      duration: result.duration,
    };
  }

  // -------------------------------------------------------------------------
  // Step handlers
  // -------------------------------------------------------------------------

  /**
   * Step 1 — PARSE_API_SCHEMA
   *
   * Validates the user-provided OpenAPI spec and discovers the sidecar pod
   * endpoints for the target namespace from kubegram-server's internal registry.
   */
  private async parseApiSchema(
    state: ValidationState,
  ): Promise<ValidationState> {
    console.info("Step: parseApiSchema");

    // Basic structural validation of the OpenAPI spec
    if (!state.apiSchema || typeof state.apiSchema !== "object") {
      state = addValidationError(state, {
        field: "apiSchema",
        message: "apiSchema must be a non-null object (OpenAPI JSON)",
        severity: "error",
      });
      return state;
    }

    const schema = state.apiSchema as Record<string, unknown>;
    if (!schema.paths || typeof schema.paths !== "object") {
      state = addValidationError(state, {
        field: "apiSchema.paths",
        message: 'OpenAPI spec must contain a "paths" object',
        severity: "error",
      });
      return state;
    }

    // Discover sidecar pods from kubegram-server's sidecar registry
    const sidecars = await this.discoverSidecars(
      state.serverBaseUrl,
      state.namespace,
    );
    if (sidecars.length === 0) {
      state = addValidationError(state, {
        field: "sidecars",
        message: `No kubegram-sidecar pods found in namespace "${state.namespace}". Ensure pods have kubegram.io/inject: "true" and the sidecar reporter is running.`,
        severity: "warning",
      });
    }

    return { ...state, sidecarEndpoints: sidecars };
  }

  /**
   * Step 2 — GENERATE_TEST_CASES
   *
   * Uses an LLM (via BAML) to generate one representative HTTP test case per API path.
   * Each case is assigned a UUID correlation ID that will be used as the
   * X-Kubegram-Validation-ID header so the sidecar's eBPF layer can track it.
   */
  private async generateTestCases(
    state: ValidationState,
  ): Promise<ValidationState> {
    console.info("Step: generateTestCases");

    const schema = state.apiSchema as Record<string, unknown>;
    const paths = schema.paths as Record<string, unknown>;
    const pathEntries = Object.entries(paths);

    if (pathEntries.length === 0) {
      state = addValidationError(state, {
        field: "apiSchema.paths",
        message: "OpenAPI spec has no paths to generate test cases for",
        severity: "warning",
      });
      return { ...state, testCases: [], correlationIds: [] };
    }

    // Transform OpenAPI paths to BAML input format
    const bamlPaths = pathEntries.flatMap(([path, methodsObj]) => {
      if (!methodsObj || typeof methodsObj !== "object") return [];
      const methods = Object.keys(methodsObj as Record<string, unknown>)
        .filter((m) => ["get", "post", "put", "delete", "patch"].includes(m.toLowerCase()))
        .map((m) => m.toUpperCase())
        .join(",");
      if (!methods) return [];
      return [{ path, methods }];
    });

    let testCases: ValidationTestCase[] = [];

    try {
      const response = await b.GenerateValidationTestCases(bamlPaths);

      testCases = response.testCases.map((tc: ValidationTestCaseOutput) => ({
        correlationId: uuidv4(),
        method: tc.method,
        path: tc.path,
        headers: tc.headers,
        body: tc.body ? JSON.parse(tc.body) : null,
        expectedStatus: tc.expectedStatus,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      state = addValidationError(state, {
        field: "generateTestCases",
        message: `LLM failed to generate test cases: ${message}`,
        severity: "warning",
      });
    }

    const correlationIds = testCases.map((tc) => tc.correlationId);
    return { ...state, testCases, correlationIds };
  }

  /**
   * Step 3 — TRIGGER_TESTS
   *
   * Sends each test case to kubegram-server with its specific HTTP method.
   * kubegram-server proxies to sidecar pods which issue the actual HTTP
   * requests using the test case's method, path, headers, and body.
   */
  private async triggerTests(state: ValidationState): Promise<ValidationState> {
    console.info("Step: triggerTests");

    if (state.testCases.length === 0) {
      console.warn("No test cases to trigger — skipping");
      return state;
    }

    if (state.sidecarEndpoints.length === 0) {
      state = addValidationError(state, {
        field: "triggerTests",
        message: "No sidecar endpoints available — cannot trigger tests",
        severity: "warning",
      });
      return state;
    }

    // Send each test case individually with its specific HTTP method
    const baseUrl = `${state.serverBaseUrl}/api/internal/sidecar/validate`;
    const errors: string[] = [];

    for (const testCase of state.testCases) {
      const url = `${baseUrl}?namespace=${encodeURIComponent(state.namespace)}`;
      const body = JSON.stringify({
        correlationId: testCase.correlationId,
        method: testCase.method,
        path: testCase.path,
        headers: testCase.headers,
        body: testCase.body,
        expectedStatus: testCase.expectedStatus,
      });

      try {
        const res = await fetch(url, {
          method: "POST", // The proxy request is always POST, but the test case method is in the body
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (!res.ok) {
          const text = await res.text();
          errors.push(`${testCase.method} ${testCase.path}: ${res.status} ${text}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${testCase.method} ${testCase.path}: ${message}`);
      }
    }

    if (errors.length > 0) {
      state = addValidationError(state, {
        field: "triggerTests",
        message: `Failed to trigger ${errors.length} test(s): ${errors.join("; ")}`,
        severity: "warning",
      });
    }

    return state;
  }

  /**
   * Step 4 — COLLECT_RESULTS
   *
   * Polls kubegram-server for validation results that sidecars have reported
   * back. Uses exponential backoff with a 60-second maximum wait.
   */
  private async collectResults(
    state: ValidationState,
  ): Promise<ValidationState> {
    console.info("Step: collectResults");

    if (state.correlationIds.length === 0) {
      return { ...state, testResults: [] };
    }

    const idsParam = state.correlationIds.join(",");
    const url = `${state.serverBaseUrl}/api/internal/validation/results?correlationIds=${encodeURIComponent(idsParam)}`;

    let testResults: TestResult[] = [];

    const completed = await pollWithBackoff(
      async () => {
        try {
          const res = await fetch(url);
          if (res.status === 202) return false; // Still pending
          if (!res.ok) return false;

          const data = (await res.json()) as {
            results: TestResult[];
            pending: string[];
          };
          testResults = data.results ?? [];
          return (data.pending ?? []).length === 0;
        } catch {
          return false;
        }
      },
      60_000, // 60-second max wait
    );

    if (!completed) {
      state = addValidationError(state, {
        field: "collectResults",
        message: "Timed out waiting for sidecar validation results (60s)",
        severity: "warning",
      });
    }

    return { ...state, testResults };
  }

  /**
   * Step 5 — ANALYZE_RESULTS
   *
   * Uses an LLM via BAML to produce a human-readable analysis of the test results
   * and computes the pass/fail summary.
   */
  private async analyzeResults(
    state: ValidationState,
  ): Promise<ValidationState> {
    console.info("Step: analyzeResults");

    const total = state.testCases.length;
    const passed = state.testResults.filter((r) => r.success).length;
    const failed = state.testResults.filter((r) => !r.success).length;
    const skipped = total - state.testResults.length;

    let analysisText = `Validation complete: ${passed}/${total} tests passed.`;

    if (total > 0) {
      try {
        // Transform data for BAML input
        const bamlTestCases = state.testCases.map((tc) => ({
          correlationId: tc.correlationId,
          method: tc.method,
          path: tc.path,
          expectedStatus: tc.expectedStatus,
        }));

        const bamlResults = state.testResults.map((r) => ({
          correlationId: r.correlationId,
          success: r.success,
          actualStatus: r.actualStatus,
          responseTimeMs: r.responseTimeMs,
          error: r.error ?? undefined,
        }));

        const stats = { total, passed, failed, skipped };

        const response = await b.AnalyzeValidationResults(
          bamlTestCases,
          bamlResults,
          stats,
        );

        analysisText = response.analysisText;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("LLM analysis failed, using default summary:", message);
      }
    }

    const validationSummary: ValidationSummary = {
      total,
      passed,
      failed,
      skipped,
      analysisText,
    };

    return { ...state, validationSummary };
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /**
   * Fetches the list of sidecar pods registered with kubegram-server for a
   * given namespace. kubegram-server populates this registry from the sidecar
   * reporter's periodic pushes (which include podIP).
   */
  private async discoverSidecars(
    serverBaseUrl: string,
    namespace: string,
  ): Promise<SidecarEndpoint[]> {
    try {
      const url = `${serverBaseUrl}/api/internal/sidecars?namespace=${encodeURIComponent(namespace)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = (await res.json()) as { sidecars: SidecarEndpoint[] };
      return data.sidecars ?? [];
    } catch {
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience function exports (mirrors codegen/plan pattern)
// ---------------------------------------------------------------------------

export async function runValidationWorkflow(
  graph: Graph,
  namespace: string,
  apiSchema: unknown,
  serverBaseUrl: string,
  threadId: string,
  context: WorkflowContext,
  eventCache: EventCache,
  eventBus: EventBus,
  options?: ValidationWorkflowOptions,
): Promise<ValidationWorkflowResult> {
  const workflow = new ValidationWorkflow(eventCache, eventBus);
  return workflow.run(
    graph,
    namespace,
    apiSchema,
    serverBaseUrl,
    threadId,
    context,
    options,
  );
}

export async function getValidationWorkflowStatus(
  threadId: string,
  eventCache: EventCache,
  eventBus: EventBus,
): Promise<ValidationState | null> {
  const workflow = new ValidationWorkflow(eventCache, eventBus);
  return workflow.getStatus(threadId);
}

export async function cancelValidationWorkflow(
  threadId: string,
  eventCache: EventCache,
  eventBus: EventBus,
): Promise<boolean> {
  const workflow = new ValidationWorkflow(eventCache, eventBus);
  return workflow.cancel(threadId);
}
