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

import { generateText } from 'ai';
import type { Redis } from 'ioredis';
import type { EventBus } from '@kubegram/common-events';

import { RedisCheckpointer } from '../types/checkpointer.js';
import { WorkflowPubSub } from '../state/pubsub.js';
import { createLLMProvider } from '../llm/providers.js';
import type { LLMRouter } from '../llm/router.js';
import { buildSystemPrompt, SystemPromptBuilder } from '../prompts/system.js';
import { generateNodePrompt } from '../prompts/node-generators.js';
import { parseLLMManifestsOutput } from '../prompts/parser.js';
import { getNeededInfrastructure, validateGraph, buildGraphEdges } from '../utils/codegen.js';
import type { Graph, GraphNode, Edge } from '../types/graph.js';
import { GraphType, ModelProvider } from '../types/enums.js';
import type { StepHandler, WorkflowContext } from '../types/workflow.js';

import { BaseWorkflow } from './base-workflow.js';
import {
    WorkflowStep,
    type CodegenState,
    type CodegenWorkflowResult,
    type CodegenWorkflowOptions,
    createInitialCodegenState,
    addWorkflowMessage,
    addTargetMessage,
    addValidationError,
} from './types.js';

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

    protected readonly handlers: Record<WorkflowStep, StepHandler<CodegenState>> = {
        [WorkflowStep.GET_OR_CREATE_GRAPH]: s => this.initializeGraph(s),
        [WorkflowStep.GET_PROMPT]: s => this.getPrompt(s),
        [WorkflowStep.LLM_CALL]: s => this.llmCall(s),
        [WorkflowStep.BUILD_KUBERNETES_GRAPH]: s => this.buildKubernetesGraph(s),
        [WorkflowStep.VALIDATE_CONFIGURATIONS]: s => this.validateConfigurations(s),
        // Terminal steps — never executed, required by Record type
        [WorkflowStep.COMPLETED]: async s => s,
        [WorkflowStep.FAILED]: async s => s,
    };

    protected readonly initialStep = WorkflowStep.GET_OR_CREATE_GRAPH;

    protected readonly terminalSteps: WorkflowStep[] = [
        WorkflowStep.COMPLETED,
        WorkflowStep.FAILED,
    ];

    protected readonly channelPrefix = 'codegen';

    private readonly ragContextService?: RAGContextService;
    private readonly router?: LLMRouter;

    constructor(
        redis: Redis,
        eventBus: EventBus,
        options?: { ragContextService?: RAGContextService; router?: LLMRouter },
    ) {
        super(
            new RedisCheckpointer<CodegenState>(redis, 'codegen'),
            new WorkflowPubSub(eventBus),
        );
        this.ragContextService = options?.ragContextService;
        this.router = options?.router;
    }

    // --- Public API ---

    async run(
        initialGraph: Graph,
        threadId: string,
        context: WorkflowContext,
        options: CodegenWorkflowOptions = {},
    ): Promise<CodegenWorkflowResult> {
        const state = createInitialCodegenState(initialGraph, options, context.userContext ?? []);
        const result = await this.execute(state, { ...context, threadId });

        return {
            state: result.state,
            success: result.success,
            generatedCode: result.success ? result.state.generatedConfigurations : undefined,
            error: result.error,
            duration: result.duration,
        };
    }

    // --- Overridden hooks ---

    protected shouldContinue(state: CodegenState): boolean {
        if (state.validationErrors.some(e => e.severity === 'error')) return false;
        if (state.currentStep === WorkflowStep.VALIDATE_CONFIGURATIONS) return false;
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
        console.info('Step: initializeGraph (kubegram-core — no Dgraph)');
        return addWorkflowMessage(
            state,
            'system',
            state.dbGraph
                ? `Using provided graph: ${state.dbGraph.id}`
                : 'No existing DB graph provided — all nodes will be treated as new',
        );
    }

    /**
     * Step 2: Generate prompts for needed nodes.
     */
    private async getPrompt(state: CodegenState): Promise<CodegenState> {
        console.info('Step: getPrompt');

        state.neededNodes = getNeededInfrastructure(state.graph, state.dbGraph);

        if (state.neededNodes.length === 0) {
            return addWorkflowMessage(state, 'system', 'No new infrastructure needed');
        }

        console.info(`Generating prompts for ${state.neededNodes.length} nodes`);

        for (const node of state.neededNodes) {
            const prompt = generateNodePrompt({
                id: node.id,
                name: node.name,
                nodeType: node.nodeType,
                namespace: node.namespace,
                microservice: node.microservice,
                database: node.database,
                cache: node.cache,
                spec: node.spec,
            } as any);

            state = addTargetMessage(state, node.id, node.nodeType, prompt);
        }

        return addWorkflowMessage(
            state,
            'system',
            `Generated prompts for ${state.neededNodes.length} nodes`,
        );
    }

    /**
     * Step 3: LLM call with optional RAG context.
     */
    private async llmCall(state: CodegenState): Promise<CodegenState> {
        console.info('Step: llmCall');

        // Sanitize user context
        if (state.userContext && state.userContext.length > 0) {
            state.userContext = await this.sanitizeContext(state.userContext);
            state.processedContext = SystemPromptBuilder.processUserContext(state.userContext);
        }

        // RAG context (optional — skip if no service injected)
        const ragContext = this.ragContextService
            ? await this.ragContextService.getRAGContext(state.graph)
            : { similarGraphs: [] as Graph[], contextText: '' };

        state.similarGraphs = ragContext.similarGraphs;
        state.ragContext = ragContext.contextText;

        // Build prompts
        const systemPrompt = buildSystemPrompt(state.graph, ragContext, {
            includeRAGContext: !!this.ragContextService,
            includeBestPractices: true,
            includeSecurityGuidelines: true,
            includeResourceLimits: true,
            userContext: state.userContext,
        });

        const userPrompt = this.buildUserPrompt(state);

        // LLM call — use router with failover if configured, else direct provider
        const { text } = this.router
            ? await this.router.generateText(
                { system: systemPrompt, prompt: userPrompt, temperature: 0, maxTokens: 4000 },
                'codegen',
              )
            : await generateText({
                model: createLLMProvider(state.modelProvider, state.modelName),
                system: systemPrompt,
                prompt: userPrompt,
                temperature: 0,
                maxTokens: 4000,
              });

        // Parse output
        const manifests = parseLLMManifestsOutput(text);
        state.generatedConfigurations = {
            totalFiles: manifests.length,
            namespace: state.graph.namespace ?? 'default',
            graphId: state.graph.id,
            originalGraphId: state.graph.id,
            nodes: manifests.map(m => ({
                id: m.entity_id ?? '',
                name: m.entity_name,
                nodeType: m.entity_type as any,
                companyId: state.graph.companyId,
                userId: state.graph.userId,
                namespace: state.graph.namespace ?? 'default',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                generatedCodeMetadata: { fileName: m.file_name, path: m.file_name },
                command: undefined,
                spec: undefined,
                config: m.generated_code as any,
            })),
        };

        return addWorkflowMessage(
            state,
            'assistant',
            `Generated ${manifests.length} Kubernetes manifests`,
        );
    }

    /**
     * Step 4: Build Kubernetes graph from generated configurations.
     * Infers edges using Kubernetes connection rules.
     */
    private async buildKubernetesGraph(state: CodegenState): Promise<CodegenState> {
        console.info('Step: buildKubernetesGraph');

        if (state.generatedConfigurations.nodes.length === 0) {
            return addWorkflowMessage(state, 'system', 'Skipped: no configurations generated');
        }

        const generatedNodes = state.generatedConfigurations.nodes;

        const graphNodes: GraphNode[] = generatedNodes.map(node => ({
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
            namespace: state.generatedConfigurations.namespace || state.graph.namespace || 'default',
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
            nodes: generatedNodes.map(node => ({
                ...node,
                edges: edgeMap.get(node.id) ?? node.edges ?? [],
            })),
        };

        let totalEdges = 0;
        for (const edges of edgeMap.values()) totalEdges += edges.length;

        return addWorkflowMessage(
            state,
            'system',
            `Built Kubernetes graph: ${graphWithEdges.nodes?.length ?? 0} nodes, ${totalEdges} edges`,
        );
    }

    /**
     * Step 5: Validate generated configurations.
     */
    private async validateConfigurations(state: CodegenState): Promise<CodegenState> {
        console.info('Step: validateConfigurations');

        const validation = validateGraph({
            ...state.graph,
            nodes: state.generatedConfigurations.nodes,
        });

        for (const error of validation.errors) {
            state = addValidationError(state, { field: 'general', message: error, severity: 'error' });
        }
        for (const warning of validation.warnings) {
            state = addValidationError(state, { field: 'general', message: warning, severity: 'warning' });
        }

        state.validatedGraph = { ...state.graph, nodes: state.generatedConfigurations.nodes };

        return addWorkflowMessage(
            state,
            'system',
            `Validation: ${validation.errors.length === 0 ? 'PASSED' : 'FAILED'} (${validation.errors.length} errors, ${validation.warnings.length} warnings)`,
        );
    }

    // --- Helpers ---

    private async sanitizeContext(context: string[]): Promise<string[]> {
        try {
            const provider = createLLMProvider(ModelProvider.claude, 'claude-3-haiku-20240307');
            const { text } = await generateText({
                model: provider,
                system: `You are a content sanitization assistant. Remove PII, malicious content, and inappropriate material from user-provided context messages. Keep core technical requirements intact. Return a JSON array of sanitized strings.`,
                prompt: `Sanitize the following context messages and return as JSON array:\n${JSON.stringify(context, null, 2)}`,
                temperature: 0,
                maxTokens: 1000,
            });

            const sanitized = JSON.parse(text.trim());
            if (Array.isArray(sanitized)) {
                return sanitized.filter((s): s is string => typeof s === 'string' && s.trim() !== '');
            }
            return context;
        } catch {
            return context;
        }
    }

    private buildUserPrompt(state: CodegenState): string {
        let prompt = '';

        if (state.processedContext.userRequirements.length > 0) {
            prompt += '**Additional Requirements:**\n';
            for (const req of state.processedContext.userRequirements) {
                prompt += `- ${req}\n`;
            }
            prompt += '\n';
        }

        if (state.targetMessages.length === 0) {
            return prompt + 'Generate Kubernetes manifests for the provided infrastructure graph.';
        }

        prompt += 'Generate Kubernetes manifests for the following infrastructure components:\n\n';
        for (const tm of state.targetMessages) {
            prompt += `**${tm.nodeType}: ${tm.nodeId}**\n${tm.prompt}\n\n`;
        }

        return prompt;
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
