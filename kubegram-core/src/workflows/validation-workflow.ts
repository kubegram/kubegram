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

import { generateText } from 'ai';
import type { Redis } from 'ioredis';
import type { EventBus } from '@kubegram/common-events';
import { v4 as uuidv4 } from 'uuid';

import { RedisCheckpointer } from '../types/checkpointer.js';
import { WorkflowPubSub } from '../state/pubsub.js';
import { createLLMProvider } from '../llm/providers.js';
import type { Graph } from '../types/graph.js';
import { ModelProvider } from '../types/enums.js';
import type { StepHandler, WorkflowContext, WorkflowResult } from '../types/workflow.js';

import { BaseWorkflow } from './base-workflow.js';
import {
    ValidationWorkflowStep,
    WorkflowStatus,
    type ValidationState,
    type ValidationTestCase,
    type SidecarEndpoint,
    type TestResult,
    type ValidationSummary,
    type ValidationWorkflowOptions,
    type ValidationWorkflowResult,
    createInitialValidationState,
    addValidationError,
} from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sleep for `ms` milliseconds. */
const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

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

export class ValidationWorkflow extends BaseWorkflow<ValidationState, ValidationWorkflowStep> {
    protected readonly steps: ValidationWorkflowStep[] = [
        ValidationWorkflowStep.PARSE_API_SCHEMA,
        ValidationWorkflowStep.GENERATE_TEST_CASES,
        ValidationWorkflowStep.TRIGGER_TESTS,
        ValidationWorkflowStep.COLLECT_RESULTS,
        ValidationWorkflowStep.ANALYZE_RESULTS,
    ];

    protected readonly handlers: Record<ValidationWorkflowStep, StepHandler<ValidationState>> = {
        [ValidationWorkflowStep.PARSE_API_SCHEMA]: s => this.parseApiSchema(s),
        [ValidationWorkflowStep.GENERATE_TEST_CASES]: s => this.generateTestCases(s),
        [ValidationWorkflowStep.TRIGGER_TESTS]: s => this.triggerTests(s),
        [ValidationWorkflowStep.COLLECT_RESULTS]: s => this.collectResults(s),
        [ValidationWorkflowStep.ANALYZE_RESULTS]: s => this.analyzeResults(s),
        // Terminal steps — never executed; required to satisfy Record<Step, …>
        [ValidationWorkflowStep.COMPLETED]: async s => s,
        [ValidationWorkflowStep.FAILED]: async s => s,
    };

    protected readonly initialStep = ValidationWorkflowStep.PARSE_API_SCHEMA;

    protected readonly terminalSteps: ValidationWorkflowStep[] = [
        ValidationWorkflowStep.COMPLETED,
        ValidationWorkflowStep.FAILED,
    ];

    protected readonly channelPrefix = 'validation';

    constructor(redis: Redis, eventBus: EventBus) {
        super(
            new RedisCheckpointer<ValidationState>(redis, 'validation'),
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
        const state = createInitialValidationState(graph, namespace, apiSchema, serverBaseUrl, options);
        const result = await this.execute(state, { ...context, threadId });

        return {
            state: result.state,
            success: result.success,
            summary: result.success ? result.state.validationSummary ?? undefined : undefined,
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
    private async parseApiSchema(state: ValidationState): Promise<ValidationState> {
        console.info('Step: parseApiSchema');

        // Basic structural validation of the OpenAPI spec
        if (!state.apiSchema || typeof state.apiSchema !== 'object') {
            state = addValidationError(state, {
                field: 'apiSchema',
                message: 'apiSchema must be a non-null object (OpenAPI JSON)',
                severity: 'error',
            });
            return state;
        }

        const schema = state.apiSchema as Record<string, unknown>;
        if (!schema.paths || typeof schema.paths !== 'object') {
            state = addValidationError(state, {
                field: 'apiSchema.paths',
                message: 'OpenAPI spec must contain a "paths" object',
                severity: 'error',
            });
            return state;
        }

        // Discover sidecar pods from kubegram-server's sidecar registry
        const sidecars = await this.discoverSidecars(state.serverBaseUrl, state.namespace);
        if (sidecars.length === 0) {
            state = addValidationError(state, {
                field: 'sidecars',
                message: `No kubegram-sidecar pods found in namespace "${state.namespace}". Ensure pods have kubegram.io/inject: "true" and the sidecar reporter is running.`,
                severity: 'warning',
            });
        }

        return { ...state, sidecarEndpoints: sidecars };
    }

    /**
     * Step 2 — GENERATE_TEST_CASES
     *
     * Uses an LLM to generate one representative HTTP test case per API path.
     * Each case is assigned a UUID correlation ID that will be used as the
     * X-Kubegram-Validation-ID header so the sidecar's eBPF layer can track it.
     */
    private async generateTestCases(state: ValidationState): Promise<ValidationState> {
        console.info('Step: generateTestCases');

        const schema = state.apiSchema as Record<string, unknown>;
        const paths = schema.paths as Record<string, unknown>;
        const pathEntries = Object.entries(paths);

        if (pathEntries.length === 0) {
            state = addValidationError(state, {
                field: 'apiSchema.paths',
                message: 'OpenAPI spec has no paths to generate test cases for',
                severity: 'warning',
            });
            return { ...state, testCases: [], correlationIds: [] };
        }

        const provider = createLLMProvider(state.modelProvider, state.modelName);

        const prompt = [
            'You are an API testing expert. Given the following OpenAPI path definitions,',
            'generate one representative HTTP test request per path+method combination.',
            'Return a JSON array where each element has:',
            '  method: string (GET/POST/PUT/DELETE/PATCH)',
            '  path: string (the exact path from the spec, no base URL)',
            '  headers: object (any Content-Type or Accept headers needed)',
            '  body: object|null (request body for POST/PUT/PATCH, null otherwise)',
            '  expectedStatus: number (most common success HTTP status for this operation)',
            '',
            'OpenAPI paths:',
            JSON.stringify(pathEntries, null, 2),
            '',
            'Return ONLY the JSON array, no markdown fences, no explanation.',
        ].join('\n');

        let testCases: ValidationTestCase[] = [];

        try {
            const { text } = await generateText({
                model: provider,
                prompt,
                temperature: 0,
                maxOutputTokens: 2000,
            });

            const raw = JSON.parse(text.trim()) as Array<Omit<ValidationTestCase, 'correlationId'>>;
            testCases = raw.map(tc => ({ ...tc, correlationId: uuidv4() }));
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            state = addValidationError(state, {
                field: 'generateTestCases',
                message: `LLM failed to generate test cases: ${message}`,
                severity: 'warning',
            });
        }

        const correlationIds = testCases.map(tc => tc.correlationId);
        return { ...state, testCases, correlationIds };
    }

    /**
     * Step 3 — TRIGGER_TESTS
     *
     * Sends the generated test cases to kubegram-server, which proxies them to
     * the sidecar pods for each service in the target namespace. The sidecar
     * issues the actual HTTP requests with the X-Kubegram-Validation-ID header.
     */
    private async triggerTests(state: ValidationState): Promise<ValidationState> {
        console.info('Step: triggerTests');

        if (state.testCases.length === 0) {
            console.warn('No test cases to trigger — skipping');
            return state;
        }

        if (state.sidecarEndpoints.length === 0) {
            state = addValidationError(state, {
                field: 'triggerTests',
                message: 'No sidecar endpoints available — cannot trigger tests',
                severity: 'warning',
            });
            return state;
        }

        // POST test cases to kubegram-server internal proxy endpoint.
        // kubegram-server will fan out to each sidecar pod in the namespace.
        const url = `${state.serverBaseUrl}/api/internal/sidecar/validate`;
        const body = JSON.stringify({
            namespace: state.namespace,
            testCases: state.testCases,
            timeoutSeconds: 30,
        });

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            });

            if (!res.ok) {
                const text = await res.text();
                state = addValidationError(state, {
                    field: 'triggerTests',
                    message: `kubegram-server returned ${res.status}: ${text}`,
                    severity: 'warning',
                });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            state = addValidationError(state, {
                field: 'triggerTests',
                message: `Failed to reach kubegram-server: ${message}`,
                severity: 'warning',
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
    private async collectResults(state: ValidationState): Promise<ValidationState> {
        console.info('Step: collectResults');

        if (state.correlationIds.length === 0) {
            return { ...state, testResults: [] };
        }

        const idsParam = state.correlationIds.join(',');
        const url = `${state.serverBaseUrl}/api/internal/validation/results?correlationIds=${encodeURIComponent(idsParam)}`;

        let testResults: TestResult[] = [];

        const completed = await pollWithBackoff(
            async () => {
                try {
                    const res = await fetch(url);
                    if (res.status === 202) return false; // Still pending
                    if (!res.ok) return false;

                    const data = (await res.json()) as { results: TestResult[]; pending: string[] };
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
                field: 'collectResults',
                message: 'Timed out waiting for sidecar validation results (60s)',
                severity: 'warning',
            });
        }

        return { ...state, testResults };
    }

    /**
     * Step 5 — ANALYZE_RESULTS
     *
     * Uses an LLM to produce a human-readable analysis of the test results
     * and computes the pass/fail summary.
     */
    private async analyzeResults(state: ValidationState): Promise<ValidationState> {
        console.info('Step: analyzeResults');

        const total = state.testCases.length;
        const passed = state.testResults.filter(r => r.success).length;
        const failed = state.testResults.filter(r => !r.success).length;
        const skipped = total - state.testResults.length;

        let analysisText = `Validation complete: ${passed}/${total} tests passed.`;

        if (total > 0) {
            try {
                const provider = createLLMProvider(state.modelProvider, state.modelName);

                const prompt = [
                    'You are a Kubernetes infrastructure validation expert.',
                    'Analyze the following API validation test results and provide a concise summary',
                    '(3-5 sentences) covering: overall health, any failed tests and likely causes,',
                    'and recommended actions if failures exist.',
                    '',
                    'Test cases:',
                    JSON.stringify(state.testCases, null, 2),
                    '',
                    'Results:',
                    JSON.stringify(state.testResults, null, 2),
                    '',
                    'Summary stats:',
                    `  Total: ${total}, Passed: ${passed}, Failed: ${failed}, Skipped: ${skipped}`,
                ].join('\n');

                const { text } = await generateText({
                    model: provider,
                    prompt,
                    temperature: 0.2,
                    maxOutputTokens: 500,
                });

                analysisText = text.trim();
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.warn('LLM analysis failed, using default summary:', message);
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
    private async discoverSidecars(serverBaseUrl: string, namespace: string): Promise<SidecarEndpoint[]> {
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
    redis: Redis,
    eventBus: EventBus,
    options?: ValidationWorkflowOptions,
): Promise<ValidationWorkflowResult> {
    const workflow = new ValidationWorkflow(redis, eventBus);
    return workflow.run(graph, namespace, apiSchema, serverBaseUrl, threadId, context, options);
}

export async function getValidationWorkflowStatus(
    threadId: string,
    redis: Redis,
    eventBus: EventBus,
): Promise<ValidationState | null> {
    const workflow = new ValidationWorkflow(redis, eventBus);
    return workflow.getStatus(threadId);
}

export async function cancelValidationWorkflow(
    threadId: string,
    redis: Redis,
    eventBus: EventBus,
): Promise<boolean> {
    const workflow = new ValidationWorkflow(redis, eventBus);
    return workflow.cancel(threadId);
}
