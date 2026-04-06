/**
 * Code generation workflow for kubegram-core.
 *
 * Ported from kuberag/src/workflows/codegen-workflow.ts with these adaptations:
 *
 *  - No Dgraph dependency: the GET_OR_CREATE_GRAPH step simply sets dbGraph from
 *    the pre-fetched existingDbGraph option (provided by kuberag before calling this).
 *  - RAG context is injectable: pass a ragContextService in options, or omit to
 *    skip RAG (workflow degrades gracefully — uses empty context).
 *  - Checkpointer and PubSub accept an ioredis Redis client + EventBus via constructor,
 *    replacing kuberag's internal singletons.
 */

import type { Redis } from "ioredis";
import type { EventBus } from "@kubegram/events";

import { RedisCheckpointer } from "../types/checkpointer.js";
import { WorkflowPubSub } from "../state/pubsub.js";
import type { LLMRouter } from "../llm/router.js";
import { buildClientRegistry } from "../llm/baml-registry.js";
import { b } from "../baml_client/index.js";
import type {
  GraphContext,
  RAGContextInput,
  UserContextInput,
  NodeContext,
} from "../baml_client/types.js";
import { processUserContext } from "../prompts/context-utils.js";
import {
  getNeededInfrastructure,
  validateGraph,
  buildGraphEdges,
} from "../utils/codegen.js";
import type { Graph, GraphNode, Edge } from "../types/graph.js";
import { GraphType } from "../types/enums.js";
import type { StepHandler, WorkflowContext } from "../types/workflow.js";
import {
  CodegenStartedEvent,
  CodegenCompletedEvent,
  CodegenFailedEvent,
} from "../events/codegen.js";

import { BaseWorkflow } from "./base-workflow.js";
import {
  WorkflowStep,
  type CodegenState,
  type CodegenWorkflowResult,
  type CodegenWorkflowOptions,
  createInitialCodegenState,
  addWorkflowMessage,
  addValidationError,
} from "./types.js";

// ---------------------------------------------------------------------------
// Optional injectable RAG context service interface
// ---------------------------------------------------------------------------

export interface RAGContextService {
  getRAGContext(graph: Graph): Promise<{
    similarGraphs: Graph[];
    contextText: string;
  }>;
}

// ---------------------------------------------------------------------------
// CodegenWorkflow
// ---------------------------------------------------------------------------

export class CodegenWorkflow extends BaseWorkflow<CodegenState, WorkflowStep> {
  protected readonly steps: WorkflowStep[] = [
    WorkflowStep.GET_OR_CREATE_GRAPH,
    WorkflowStep.GET_PROMPT,
    WorkflowStep.LLM_CALL,
    WorkflowStep.BUILD_KUBERNETES_GRAPH,
    WorkflowStep.VALIDATE_CONFIGURATIONS,
  ];

  protected readonly handlers: Record<WorkflowStep, StepHandler<CodegenState>> =
    {
      [WorkflowStep.GET_OR_CREATE_GRAPH]: (s) => this.initializeGraph(s),
      [WorkflowStep.GET_PROMPT]: (s) => this.getPrompt(s),
      [WorkflowStep.LLM_CALL]: (s) => this.llmCall(s),
      [WorkflowStep.BUILD_KUBERNETES_GRAPH]: (s) =>
        this.buildKubernetesGraph(s),
      [WorkflowStep.VALIDATE_CONFIGURATIONS]: (s) =>
        this.validateConfigurations(s),
      // Terminal steps — never executed, required by Record type
      [WorkflowStep.COMPLETED]: async (s) => s,
      [WorkflowStep.FAILED]: async (s) => s,
    };

  protected readonly initialStep = WorkflowStep.GET_OR_CREATE_GRAPH;

  protected readonly terminalSteps: WorkflowStep[] = [
    WorkflowStep.COMPLETED,
    WorkflowStep.FAILED,
  ];

  protected readonly channelPrefix = "codegen";

  private readonly ragContextService?: RAGContextService;
  private readonly eventBus: EventBus;

  constructor(
    redis: Redis,
    eventBus: EventBus,
    options?: { ragContextService?: RAGContextService; router?: LLMRouter },
  ) {
    super(
      new RedisCheckpointer<CodegenState>(redis, "codegen"),
      new WorkflowPubSub(eventBus),
    );
    this.ragContextService = options?.ragContextService;
    this.eventBus = eventBus;
  }

  // --- Public API ---

  async run(
    initialGraph: Graph,
    threadId: string,
    context: WorkflowContext,
    options: CodegenWorkflowOptions = {},
  ): Promise<CodegenWorkflowResult> {
    const state = createInitialCodegenState(
      initialGraph,
      options,
      context.userContext ?? [],
    );

    // Emit domain event for workflow start
    await this.eventBus.publish(
      new CodegenStartedEvent(
        context.jobId,
        context.userId ?? "anonymous",
        initialGraph.id,
        initialGraph,
        {
          provider: state.modelProvider,
          model: options.modelName,
        },
      ),
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const startTime = Date.now();

    try {
      const result = await this.execute(state, { ...context, threadId });

      // Emit domain event for completion or failure
      if (result.success && result.state.generatedConfigurations) {
        await this.eventBus.publish(
          new CodegenCompletedEvent(
            context.jobId,
            result.state.generatedConfigurations.nodes.map((n) => ({
              id: n.id,
              name: n.name,
              nodeType: n.nodeType,
              namespace: n.namespace,
              config: n.config,
            })),
            initialGraph.id,
            result.duration,
          ),
        );
      } else if (result.error) {
        await this.eventBus.publish(
          new CodegenFailedEvent(
            context.jobId,
            result.error,
            result.state.currentStep,
            result.state.retryCount < result.state.maxRetries,
          ),
        );
      }

      return {
        state: result.state,
        success: result.success,
        generatedCode: result.success
          ? result.state.generatedConfigurations
          : undefined,
        error: result.error,
        duration: result.duration,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.eventBus.publish(
        new CodegenFailedEvent(
          context.jobId,
          errorMessage,
          state.currentStep,
          false,
        ),
      );
      throw error;
    }
  }

  // --- Overridden hooks ---

  protected shouldContinue(state: CodegenState): boolean {
    // Short-circuit conditions (in order of priority):
    //  1. Any 'error'-severity validation error — stop immediately, do not retry.
    //  2. VALIDATE_CONFIGURATIONS is the terminal operational step — never loop back.
    //  3. Step depth guard (max 10) — prevents infinite recursion on runaway graphs.
    if (state.validationErrors.some((e) => e.severity === "error"))
      return false;
    if (state.currentStep === WorkflowStep.VALIDATE_CONFIGURATIONS)
      return false;
    if (state.stepHistory.length >= 10) return false;
    return true;
  }

  protected onStepError(state: CodegenState, error: unknown): CodegenState {
    return { ...super.onStepError(state, error), isRetry: true };
  }

  // --- Step handlers ---

  /**
   * Step 1: Initialize graph state.
   *
   * In kuberag this step fetches/creates the graph in Dgraph.
   * Here, the graph is provided by the caller (kuberag fetches it first).
   * We simply ensure dbGraph is set from the state that was populated via
   * CodegenWorkflowOptions.existingDbGraph → createInitialCodegenState.
   */
  private async initializeGraph(state: CodegenState): Promise<CodegenState> {
    console.info("Step: initializeGraph (kubegram-core — no Dgraph)");
    return addWorkflowMessage(
      state,
      "system",
      state.dbGraph
        ? `Using provided graph: ${state.dbGraph.id}`
        : "No existing DB graph provided — all nodes will be treated as new",
    );
  }

  /**
   * Step 2: Generate prompts for needed nodes.
   */
  private async getPrompt(state: CodegenState): Promise<CodegenState> {
    console.info("Step: getPrompt");

    state.neededNodes = getNeededInfrastructure(state.graph, state.dbGraph);

    if (state.neededNodes.length === 0) {
      return addWorkflowMessage(
        state,
        "system",
        "No new infrastructure needed",
      );
    }

    return addWorkflowMessage(
      state,
      "system",
      `Queued ${state.neededNodes.length} nodes for generation`,
    );
  }

  /**
   * Step 3: LLM call via BAML with optional RAG context.
   */
  private async llmCall(state: CodegenState): Promise<CodegenState> {
    console.info("Step: llmCall");

    // Sanitize user context via BAML (fast Haiku model, best-effort)
    if (state.userContext && state.userContext.length > 0) {
      try {
        state.userContext = await b.SanitizeUserContext(state.userContext);
      } catch {
        // Sanitization is best-effort — proceed with original context on failure
      }
      state.processedContext = processUserContext(state.userContext);
    }

    // RAG context (optional — skip if no service injected)
    const ragContext = this.ragContextService
      ? await this.ragContextService.getRAGContext(state.graph)
      : { similarGraphs: [] as Graph[], contextText: "" };

    state.similarGraphs = ragContext.similarGraphs;
    state.ragContext = ragContext.contextText;

    // Build BAML inputs
    const graphCtx: GraphContext = {
      graph_name: state.graph.name,
      default_namespace: state.graph.namespace ?? "default",
      total_nodes: state.graph.nodes?.length ?? 0,
      node_types: this.buildNodeTypeSummary(state.graph),
    };
    const ragInput: RAGContextInput = {
      context_text: ragContext.contextText || undefined,
    };
    const userCtxInput: UserContextInput = {
      system_messages: state.processedContext.systemMessages,
      user_requirements: state.processedContext.userRequirements,
      planning_context: state.processedContext.planningContext,
    };
    const nodeContexts = state.neededNodes.map((n) => this.buildNodeContext(n));

    // Single BAML call — structured output, no JSON parsing required
    const response = await b.GenerateKubernetesManifests(
      graphCtx,
      nodeContexts,
      ragInput,
      userCtxInput,
      "1.29",
      { clientRegistry: buildClientRegistry(state.modelProvider) },
    );

    const manifests = response.manifests;
    state.generatedConfigurations = {
      totalFiles: manifests.length,
      namespace: state.graph.namespace ?? "default",
      graphId: state.graph.id,
      originalGraphId: state.graph.id,
      nodes: manifests.map((m) => ({
        id: m.entity_id ?? "",
        name: m.entity_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodeType: m.entity_type as any,
        companyId: state.graph.companyId,
        userId: state.graph.userId,
        namespace: state.graph.namespace ?? "default",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatedCodeMetadata: { fileName: m.file_name, path: m.file_name },
        command: undefined,
        spec: undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: m.generated_code as any,
      })),
    };

    return addWorkflowMessage(
      state,
      "assistant",
      `Generated ${manifests.length} Kubernetes manifests`,
    );
  }

  /**
   * Step 4: Build Kubernetes graph from generated configurations.
   * Infers edges using Kubernetes connection rules.
   */
  private async buildKubernetesGraph(
    state: CodegenState,
  ): Promise<CodegenState> {
    console.info("Step: buildKubernetesGraph");

    if (state.generatedConfigurations.nodes.length === 0) {
      return addWorkflowMessage(
        state,
        "system",
        "Skipped: no configurations generated",
      );
    }

    const generatedNodes = state.generatedConfigurations.nodes;

    const graphNodes: GraphNode[] = generatedNodes.map((node) => ({
      id: node.id,
      name: node.name,
      companyId: node.companyId || state.graph.companyId,
      userId: node.userId || state.graph.userId,
      nodeType: node.nodeType,
      namespace: node.namespace,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      edges: node.edges || [],
      spec: node.spec,
      config: node.config,
      orginalNodeName: node.originalNodeName,
      orginalNodeId: node.originalNodeId,
      orginalNodeType: node.originalNodeType,
    }));

    const tempGraph: Graph = {
      id: state.graph.id,
      name: `${state.graph.name}-kubernetes`,
      description: `Kubernetes manifests for: ${state.graph.name}`,
      graphType: GraphType.KUBERNETES,
      namespace:
        state.generatedConfigurations.namespace ||
        state.graph.namespace ||
        "default",
      companyId: state.graph.companyId,
      userId: state.graph.userId,
      nodes: graphNodes,
    };

    const graphWithEdges = buildGraphEdges(tempGraph, {
      inferConnections: true,
      createDefaultEdges: true,
    });

    const edgeMap = new Map<string, Edge[]>();
    for (const node of graphWithEdges.nodes ?? []) {
      if (node.edges?.length) edgeMap.set(node.id, node.edges);
    }

    state.generatedConfigurations = {
      ...state.generatedConfigurations,
      nodes: generatedNodes.map((node) => ({
        ...node,
        edges: edgeMap.get(node.id) ?? node.edges ?? [],
      })),
    };

    let totalEdges = 0;
    for (const edges of edgeMap.values()) totalEdges += edges.length;

    return addWorkflowMessage(
      state,
      "system",
      `Built Kubernetes graph: ${graphWithEdges.nodes?.length ?? 0} nodes, ${totalEdges} edges`,
    );
  }

  /**
   * Step 5: Validate generated configurations.
   */
  private async validateConfigurations(
    state: CodegenState,
  ): Promise<CodegenState> {
    console.info("Step: validateConfigurations");

    const validation = validateGraph({
      ...state.graph,
      nodes: state.generatedConfigurations.nodes,
    });

    for (const error of validation.errors) {
      state = addValidationError(state, {
        field: "general",
        message: error,
        severity: "error",
      });
    }
    for (const warning of validation.warnings) {
      state = addValidationError(state, {
        field: "general",
        message: warning,
        severity: "warning",
      });
    }

    state.validatedGraph = {
      ...state.graph,
      nodes: state.generatedConfigurations.nodes,
    };

    return addWorkflowMessage(
      state,
      "system",
      `Validation: ${validation.errors.length === 0 ? "PASSED" : "FAILED"} (${validation.errors.length} errors, ${validation.warnings.length} warnings)`,
    );
  }

  // --- Helpers ---

  private buildNodeTypeSummary(graph: Graph): string {
    if (!graph.nodes || graph.nodes.length === 0) return "";
    const counts: Record<string, number> = {};
    for (const node of graph.nodes) {
      const t = node.nodeType || "Unknown";
      counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([t, n]) => `${t}: ${n}`)
      .join(", ");
  }

  private buildNodeContext(node: GraphNode): NodeContext {
    const isExternal = !!node.dependencyType;
    const ms = node.microservice;
    const db = node.database;
    const ca = node.cache;
    const mq = node.messageQueue;
    const px = node.proxy;
    const lb = node.loadBalancer;
    const mon = node.monitoring;
    const gw = node.gateway;
    const spec = (node.spec ?? {}) as Record<string, unknown>;

    const envFromSubtype =
      ms?.environmentVariables ??
      db?.environmentVariables ??
      ca?.environmentVariables ??
      mq?.environmentVariables ??
      px?.environmentVariables ??
      lb?.environmentVariables ??
      mon?.environmentVariables ??
      gw?.environmentVariables;
    const envMap: Record<string, string> = {};
    for (const e of envFromSubtype ?? []) {
      if (e.name && e.value) envMap[e.name] = e.value;
    }
    const envVars = Object.keys(envMap).length
      ? JSON.stringify(envMap)
      : spec.env
        ? JSON.stringify(spec.env)
        : undefined;

    const secretsArray = (ms?.secrets ??
      db?.secrets ??
      ca?.secrets ??
      mq?.secrets ??
      px?.secrets ??
      lb?.secrets ??
      mon?.secrets ??
      gw?.secrets ??
      []) as { name: string }[];

    return {
      id: node.id,
      name: node.name,
      node_type: node.nodeType as string,
      k8s_namespace: node.namespace ?? "default",
      is_external: isExternal,

      language: ms?.language ?? (spec.language as string | undefined),
      framework: ms?.framework ?? (spec.framework as string | undefined),
      container_image: ms?.image ?? (spec.image as string | undefined),
      replicas:
        db?.replicaCount ??
        ca?.replicaCount ??
        mq?.replicaCount ??
        (spec.replicas as number | undefined),
      ports: (ms?.ports ??
        (db?.port
          ? [db.port]
          : ca?.port
            ? [ca.port]
            : mq?.port
              ? [mq.port]
              : mon?.port
                ? [mon.port]
                : gw?.port
                  ? [gw.port]
                  : px?.port
                    ? [px.port]
                    : lb?.port
                      ? [lb.port]
                      : (spec.ports ?? []))) as number[],

      engine:
        db?.engine ??
        ca?.engine ??
        mq?.engine ??
        (spec.engine as string | undefined),
      version:
        db?.version ??
        ca?.version ??
        mq?.version ??
        ms?.version ??
        mon?.version ??
        gw?.version ??
        px?.version ??
        lb?.version ??
        (spec.version as string | undefined),
      storage_size:
        db?.storageSize ??
        mon?.storageSize ??
        (spec.storage_size as string | undefined),
      storage_class:
        db?.storageClass ?? (spec.storage_class as string | undefined),
      max_memory: ca?.maxMemory ?? (spec.max_memory as string | undefined),
      persistence:
        ca?.persistenceEnabled ??
        (spec.persistence_enabled as boolean | undefined),
      cluster_mode:
        ca?.clusterMode ?? (spec.cluster_mode as boolean | undefined),

      partitions: mq?.partitions ?? (spec.partitions as number | undefined),
      replication_factor:
        mq?.replicationFactor ??
        (spec.replication_factor as number | undefined),
      management_port: spec.management_port as number | undefined,

      kind: (px?.proxyType ??
        lb?.loadBalancerType ??
        mon?.monitoringType ??
        gw?.gatewayType ??
        spec.kind) as string | undefined,
      algorithm: lb?.algorithm ?? (spec.algorithm as string | undefined),
      upstreams: (px?.upstreams ??
        gw?.upstreams ??
        spec.upstreams ??
        []) as string[],
      backends: (lb?.backends ?? spec.backends ?? []) as string[],
      routes: (gw?.routes ?? spec.routes ?? []) as string[],
      domains: (gw?.domains ?? spec.domains ?? []) as string[],
      tls_enabled:
        px?.tlsEnabled ??
        gw?.tlsEnabled ??
        lb?.tlsEnabled ??
        (spec.tls_enabled as boolean | undefined),
      auth_enabled:
        gw?.authEnabled ??
        mon?.authEnabled ??
        (spec.auth_enabled as boolean | undefined),
      cors_enabled:
        gw?.corsEnabled ?? (spec.cors_enabled as boolean | undefined),
      rate_limit_enabled:
        px?.rateLimitEnabled ??
        gw?.rateLimitEnabled ??
        (spec.rate_limit_enabled as boolean | undefined),

      scrape_interval:
        mon?.scrapeInterval ?? (spec.scrape_interval as string | undefined),
      retention_period:
        mon?.retentionPeriod ?? (spec.retention_period as string | undefined),
      alertmanager:
        mon?.alertmanagerEnabled ??
        (spec.alertmanager_enabled as boolean | undefined),
      health_check_path:
        lb?.healthCheckPath ??
        px?.healthCheckPath ??
        gw?.healthCheckPath ??
        (spec.health_check_path as string | undefined),

      external_host: (spec.host ??
        spec.endpoint ??
        spec.dns_name ??
        spec.url) as string | undefined,
      external_provider: spec.provider as string | undefined,

      env_vars: envVars,
      resources: spec.resources ? JSON.stringify(spec.resources) : undefined,
      secret_names: secretsArray.map((s) => s.name).filter(Boolean),
    };
  }
}

// ---------------------------------------------------------------------------
// Convenience function exports
// ---------------------------------------------------------------------------

export async function runCodegenWorkflow(
  graph: Graph,
  threadId: string,
  context: WorkflowContext,
  redis: Redis,
  eventBus: EventBus,
  options?: CodegenWorkflowOptions & { ragContextService?: RAGContextService },
): Promise<CodegenWorkflowResult> {
  const { ragContextService, ...workflowOptions } = options ?? {};
  const workflow = new CodegenWorkflow(redis, eventBus, { ragContextService });
  return workflow.run(graph, threadId, context, workflowOptions);
}

export async function getCodegenWorkflowStatus(
  threadId: string,
  redis: Redis,
  eventBus: EventBus,
): Promise<CodegenState | null> {
  const workflow = new CodegenWorkflow(redis, eventBus);
  return workflow.getStatus(threadId);
}

export async function cancelCodegenWorkflow(
  threadId: string,
  redis: Redis,
  eventBus: EventBus,
): Promise<boolean> {
  const workflow = new CodegenWorkflow(redis, eventBus);
  return workflow.cancel(threadId);
}
