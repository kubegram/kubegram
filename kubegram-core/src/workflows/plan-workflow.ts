/**
 * Planning workflow for kubegram-core.
 *
 * Ported from kuberag/src/workflows/plan-workflow.ts.
 * Generates an infrastructure graph from a user request using an LLM.
 *
 * No Dgraph dependency — the SAVE_GRAPH step is intentionally a no-op
 * (the caller decides whether to persist the graph to Dgraph via kuberag).
 */

import { generateText } from "ai";
import { v4 as uuidv4 } from "uuid";
import { type EventCache, type EventBus } from "@kubegram/events";

import { Checkpointer } from "../types/checkpointer.js";
import { WorkflowPubSub } from "../state/pubsub.js";
import { createLLMProvider, LLMProviderFactory } from "../llm/providers.js";
import type { LLMRouter } from "../llm/router.js";
import { validateGraph } from "../utils/codegen.js";
import { type GraphNode } from "../types/graph.js";
import { GraphType, ConnectionType } from "../types/enums.js";
import type { StepHandler, WorkflowContext } from "../types/workflow.js";
import {
  PlanStartedEvent,
  PlanCompletedEvent,
  PlanFailedEvent,
} from "../events/plan.js";

import { BaseWorkflow } from "./base-workflow.js";
import {
  PlanWorkflowStep,
  type PlanState,
  type PlanWorkflowResult,
  type PlanWorkflowOptions,
  createInitialPlanState,
  addWorkflowMessage,
  addValidationError,
} from "./types.js";

export class PlanWorkflow extends BaseWorkflow<PlanState, PlanWorkflowStep> {
  protected readonly steps: PlanWorkflowStep[] = [
    PlanWorkflowStep.ANALYZE_REQUEST,
    PlanWorkflowStep.GENERATE_GRAPH,
    PlanWorkflowStep.VALIDATE_GRAPH,
    PlanWorkflowStep.SAVE_GRAPH,
  ];

  protected readonly handlers: Record<
    PlanWorkflowStep,
    StepHandler<PlanState>
  > = {
    [PlanWorkflowStep.ANALYZE_REQUEST]: (s) => this.analyzeRequest(s),
    [PlanWorkflowStep.GENERATE_GRAPH]: (s) => this.generateGraph(s),
    [PlanWorkflowStep.VALIDATE_GRAPH]: (s) => this.validateGraphStep(s),
    [PlanWorkflowStep.SAVE_GRAPH]: (s) => this.saveGraph(s),
    // Terminal steps — never executed, required by Record type
    [PlanWorkflowStep.COMPLETED]: async (s) => s,
    [PlanWorkflowStep.FAILED]: async (s) => s,
  };

  protected readonly initialStep = PlanWorkflowStep.ANALYZE_REQUEST;

  protected readonly terminalSteps: PlanWorkflowStep[] = [
    PlanWorkflowStep.COMPLETED,
    PlanWorkflowStep.FAILED,
  ];

  protected readonly channelPrefix = "plan";

  private readonly router?: LLMRouter;
  private readonly eventBus: EventBus;

  constructor(
    eventCache: EventCache,
    eventBus: EventBus,
    options?: { router?: LLMRouter },
  ) {
    super(
      new Checkpointer<PlanState>(eventCache, "plan"),
      new WorkflowPubSub(eventBus),
    );
    this.router = options?.router;
    this.eventBus = eventBus;
  }

  // --- Public API ---

  async run(
    userRequest: string,
    threadId: string,
    context: WorkflowContext,
    options: PlanWorkflowOptions,
  ): Promise<PlanWorkflowResult> {
    if (options.llmProviderOptions) {
      LLMProviderFactory.configure(options.llmProviderOptions);
    }
    const state = createInitialPlanState(userRequest, options);

    // Emit domain event for workflow start
    await this.eventBus.publish(
      new PlanStartedEvent(
        context.jobId,
        context.userId ?? "anonymous",
        options.graph.id,
        "infrastructure_planning",
      ),
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const startTime = Date.now();

    try {
      const result = await this.execute(state, { ...context, threadId });

      // Emit domain event for completion or failure
      if (result.success && result.state.graph) {
        await this.eventBus.publish(
          new PlanCompletedEvent(
            context.jobId,
            { graph: result.state.graph, context: result.state.planContext },
            result.duration,
          ),
        );
      } else if (result.error) {
        await this.eventBus.publish(
          new PlanFailedEvent(context.jobId, result.error),
        );
      }

      return {
        state: result.state,
        success: result.success,
        planResult:
          result.success && result.state.graph
            ? { graph: result.state.graph, context: result.state.planContext }
            : undefined,
        error: result.error,
        duration: result.duration,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.eventBus.publish(
        new PlanFailedEvent(context.jobId, errorMessage),
      );
      throw error;
    }
  }

  // --- Overridden hooks ---

  protected shouldContinue(state: PlanState): boolean {
    if (state.validationErrors.some((e) => e.severity === "error"))
      return false;
    return super.shouldContinue(state);
  }

  // --- Step handlers ---

  private async analyzeRequest(state: PlanState): Promise<PlanState> {
    console.info("Step: analyzeRequest");

    state = addWorkflowMessage(state, "user", state.userRequest);
    state.planContext.push(`User Request: ${state.userRequest}`);

    return addWorkflowMessage(state, "system", "Analyzed user request");
  }

  private async generateGraph(state: PlanState): Promise<PlanState> {
    console.info("Step: generateGraph");

    const systemPrompt = `You are an expert Kubernetes infrastructure architect.

Given a user's application description, produce a JSON object representing a complete
Kubernetes graph. Use concrete Kubernetes primitives — not abstract application-level
concepts. The JSON must have:
  - "name":        string (short graph name)
  - "description": string
  - "nodes":       array of node objects
  - "edges":       array of edge objects

──────────────────────────────────────────
NODE OBJECT SCHEMA
──────────────────────────────────────────
{
  "id":       "<uuid-v4>",
  "name":     "<kebab-case Kubernetes resource name>",
  "nodeType": "<one of the allowed types below>",
  "spec":     { <type-specific fields — see below> }
}

Allowed nodeType values (use ONLY these exact strings):
  Workloads:   DEPLOYMENT, STATEFULSET, DAEMONSET, JOB, CRONJOB
  Pods:        POD
  Networking:  SERVICE, INGRESS, ENDPOINT, NETWORKPOLICY
  Config:      CONFIGMAP, SECRET
  Storage:     PERSISTENTVOLUMECLAIM, PERSISTENTVOLUME, STORAGECLASS, VOLUME
  RBAC:        SERVICEACCOUNT, ROLE, ROLEBINDING, CLUSTERROLE, CLUSTERROLEBINDING
  Scaling:     HORIZONTALPODAUTOSCALER, VERTICALPODAUTOSCALER
  Reliability: PODDISRUPTIONBUDGET
  Cluster:     NAMESPACE, NODE, RESOURCEQUOTA, LIMITRANGE
  External:    EXTERNAL_DEPENDENCY
  Custom:      CUSTOMRESOURCEDEFINITION

──────────────────────────────────────────
DECOMPOSITION RULES — apply in order
──────────────────────────────────────────
1. Every user-facing HTTP/gRPC service → DEPLOYMENT + SERVICE + INGRESS (+ CONFIGMAP, SECRET as needed)
2. Every stateful workload (database, cache, queue) → STATEFULSET + SERVICE + PERSISTENTVOLUMECLAIM + SECRET + CONFIGMAP
3. Every background worker / batch job → DEPLOYMENT (long-running) or JOB/CRONJOB (finite)
4. Every DEPLOYMENT/STATEFULSET that reads config → a CONFIGMAP node wired with CONFIGURES
5. Every DEPLOYMENT/STATEFULSET that reads credentials → a SECRET node wired with CONFIGURES
6. Every STATEFULSET with persistence → a PERSISTENTVOLUMECLAIM node wired with BINDS
7. Namespace scope: wrap all workloads in a NAMESPACE node (one per logical environment)
8. If auto-scaling is required → add a HORIZONTALPODAUTOSCALER wired with SCALES to the DEPLOYMENT
9. If the workload needs a service account with specific permissions → add SERVICEACCOUNT + ROLE + ROLEBINDING

──────────────────────────────────────────
SPEC FIELDS BY NODE TYPE
──────────────────────────────────────────
DEPLOYMENT / STATEFULSET / DAEMONSET:
  { "image": "repo/name:tag", "replicas": 2, "containerPort": 8080,
    "resources": { "requests": { "cpu": "100m", "memory": "128Mi" },
                   "limits":   { "cpu": "500m", "memory": "512Mi" } },
    "labels": { "app": "name" } }

SERVICE:
  { "type": "ClusterIP|NodePort|LoadBalancer", "port": 80, "targetPort": 8080,
    "selector": { "app": "name" } }

INGRESS:
  { "host": "api.example.com", "path": "/", "servicePort": 80,
    "tls": true, "ingressClass": "nginx" }

CONFIGMAP:
  { "data": { "KEY": "value" } }

SECRET:
  { "type": "Opaque|kubernetes.io/tls", "keys": ["DB_PASSWORD", "API_KEY"] }

PERSISTENTVOLUMECLAIM:
  { "storageClass": "standard", "accessMode": "ReadWriteOnce", "storage": "10Gi" }

HORIZONTALPODAUTOSCALER:
  { "minReplicas": 2, "maxReplicas": 10, "targetCPUUtilizationPercentage": 70 }

NAMESPACE:
  { "labels": { "env": "production" } }

──────────────────────────────────────────
EDGE OBJECT SCHEMA
──────────────────────────────────────────
{
  "from":           "<source node id>",
  "to":             "<target node id>",
  "connectionType": "<one of the allowed values below>"
}

Allowed connectionType values:
  INGRESS_ROUTES_TO_SERVICE  — Ingress → Service
  SERVICE_EXPOSES_POD        — Service → Deployment or Service → Pod
  MANAGES                    — Deployment/StatefulSet → ReplicaSet/Pod
  CONFIGURES                 — ConfigMap or Secret → any workload
  CLAIMS                     — PersistentVolumeClaim → PersistentVolume
  BINDS                      — StatefulSet → PersistentVolumeClaim
  SCALES                     — HPA → Deployment or StatefulSet
  AUTHENTICATES              — ServiceAccount → workload
  AUTHORIZES                 — RoleBinding/ClusterRoleBinding → Role/ClusterRole
  BELONGS_TO                 — workload → Namespace
  MONITORS                   — Monitoring node → any workload
  DEPENDS_ON                 — generic cross-service dependency
  CONNECTS_TO                — fallback for unlisted relationships

──────────────────────────────────────────
OUTPUT RULES
──────────────────────────────────────────
- Output ONLY the raw JSON object. No markdown, no explanation, no code fences.
- Every id must be a valid UUID v4.
- Every edge must reference ids that exist in the nodes array.
- Do not use abstract types (MICROSERVICE, DATABASE, CACHE, MESSAGE_QUEUE) unless
  there is absolutely no appropriate K8s primitive — in that case use EXTERNAL_DEPENDENCY.`;

    let userPrompt = `Request: ${state.userRequest}\n\nExisting Context: ${state.planContext.join("\n")}`;

    if (state.graph) {
      userPrompt += `\n\nExisting Graph: ${JSON.stringify(state.graph, null, 2)}
Please modify the existing graph or add to it based on the request. Preserve existing IDs for unchanged nodes.`;
    }

    // Use router with failover if configured, else direct provider
    const { text } = this.router
      ? await this.router.generateText(
          { system: systemPrompt, prompt: userPrompt, temperature: 0.1 },
          "plan",
        )
      : await generateText({
          model: createLLMProvider(state.modelProvider, state.modelName),
          system: systemPrompt,
          prompt: userPrompt,
          temperature: 0.1,
        });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse JSON from LLM response");

    const generatedData = JSON.parse(jsonMatch[0]);

    const nodes: GraphNode[] = (generatedData.nodes ?? []).map(
      (n: { id?: string }) => ({
        ...n,
        id: n.id || uuidv4(),
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );

    // Wire up edges from the LLM's flat edge list, using the LLM-returned connectionType
    const validConnectionTypes = new Set<string>(Object.values(ConnectionType));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    for (const edge of generatedData.edges ?? []) {
      const from = edge.from ?? edge.fromNode ?? edge.source;
      const to = edge.to ?? edge.toNode ?? edge.target;
      const source = nodeMap.get(from);
      const target = nodeMap.get(to);
      if (source && target) {
        const rawType = edge.connectionType as string | undefined;
        const resolvedType: ConnectionType =
          rawType && validConnectionTypes.has(rawType)
            ? (rawType as ConnectionType)
            : ConnectionType.CONNECTS_TO;
        (source.edges ??= []).push({
          connectionType: resolvedType,
          node: target,
        });
      }
    }

    state.graph = {
      id: state.graph?.id || uuidv4(),
      name: generatedData.name || "Generated Graph",
      description: generatedData.description || "Generated from user request",
      graphType: GraphType.KUBERNETES,
      nodes,
      companyId: state.graph?.companyId ?? "",
      userId: state.graph?.userId ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return addWorkflowMessage(
      state,
      "assistant",
      `Generated graph with ${nodes.length} nodes`,
    );
  }

  private async validateGraphStep(state: PlanState): Promise<PlanState> {
    console.info("Step: validateGraph");

    if (!state.graph) throw new Error("No graph generated to validate");

    const validation = validateGraph(state.graph);

    for (const error of validation.errors) {
      state = addValidationError(state, {
        field: "general",
        message: error,
        severity: "error",
      });
    }

    return addWorkflowMessage(
      state,
      "system",
      `Validation complete: ${validation.errors.length} errors`,
    );
  }

  private async saveGraph(state: PlanState): Promise<PlanState> {
    console.info("Step: saveGraph");
    // Graph persistence is handled by the caller (kuberag → Dgraph).
    // This step finalizes the plan and signals completion.
    return addWorkflowMessage(state, "system", "Graph plan finalized");
  }
}

// ---------------------------------------------------------------------------
// Convenience function exports
// ---------------------------------------------------------------------------

export async function runPlanWorkflow(
  userRequest: string,
  threadId: string,
  context: WorkflowContext,
  eventCache: EventCache,
  eventBus: EventBus,
  options: PlanWorkflowOptions,
): Promise<PlanWorkflowResult> {
  const workflow = new PlanWorkflow(eventCache, eventBus);
  return workflow.run(userRequest, threadId, context, options);
}

export async function getPlanWorkflowStatus(
  threadId: string,
  eventCache: EventCache,
  eventBus: EventBus,
): Promise<PlanState | null> {
  const workflow = new PlanWorkflow(eventCache, eventBus);
  return workflow.getStatus(threadId);
}

export async function cancelPlanWorkflow(
  threadId: string,
  eventCache: EventCache,
  eventBus: EventBus,
): Promise<boolean> {
  const workflow = new PlanWorkflow(eventCache, eventBus);
  return workflow.cancel(threadId);
}
