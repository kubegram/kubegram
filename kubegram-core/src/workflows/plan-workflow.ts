/**
 * Planning workflow for kubegram-core.
 *
 * Ported from kuberag/src/workflows/plan-workflow.ts.
 * Generates an infrastructure graph from a user request using an LLM.
 *
 * No Dgraph dependency — the SAVE_GRAPH step is intentionally a no-op
 * (the caller decides whether to persist the graph to Dgraph via kuberag).
 */

import { generateText } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import type { Redis } from 'ioredis';
import type { EventBus } from '@kubegram/events';

import { RedisCheckpointer } from '../types/checkpointer.js';
import { WorkflowPubSub } from '../state/pubsub.js';
import { createLLMProvider } from '../llm/providers.js';
import type { LLMRouter } from '../llm/router.js';
import { validateGraph } from '../utils/codegen.js';
import type { Graph, GraphNode } from '../types/graph.js';
import { GraphType } from '../types/enums.js';
import type { StepHandler, WorkflowContext } from '../types/workflow.js';

import { BaseWorkflow } from './base-workflow.js';
import {
    PlanWorkflowStep,
    type PlanState,
    type PlanWorkflowResult,
    type PlanWorkflowOptions,
    createInitialPlanState,
    addWorkflowMessage,
    addValidationError,
} from './types.js';

export class PlanWorkflow extends BaseWorkflow<PlanState, PlanWorkflowStep> {
    protected readonly steps: PlanWorkflowStep[] = [
        PlanWorkflowStep.ANALYZE_REQUEST,
        PlanWorkflowStep.GENERATE_GRAPH,
        PlanWorkflowStep.VALIDATE_GRAPH,
        PlanWorkflowStep.SAVE_GRAPH,
    ];

    protected readonly handlers: Record<PlanWorkflowStep, StepHandler<PlanState>> = {
        [PlanWorkflowStep.ANALYZE_REQUEST]: s => this.analyzeRequest(s),
        [PlanWorkflowStep.GENERATE_GRAPH]: s => this.generateGraph(s),
        [PlanWorkflowStep.VALIDATE_GRAPH]: s => this.validateGraphStep(s),
        [PlanWorkflowStep.SAVE_GRAPH]: s => this.saveGraph(s),
        // Terminal steps — never executed, required by Record type
        [PlanWorkflowStep.COMPLETED]: async s => s,
        [PlanWorkflowStep.FAILED]: async s => s,
    };

    protected readonly initialStep = PlanWorkflowStep.ANALYZE_REQUEST;

    protected readonly terminalSteps: PlanWorkflowStep[] = [
        PlanWorkflowStep.COMPLETED,
        PlanWorkflowStep.FAILED,
    ];

    protected readonly channelPrefix = 'plan';

    private readonly router?: LLMRouter;

    constructor(redis: Redis, eventBus: EventBus, options?: { router?: LLMRouter }) {
        super(
            new RedisCheckpointer<PlanState>(redis, 'plan'),
            new WorkflowPubSub(eventBus),
        );
        this.router = options?.router;
    }

    // --- Public API ---

    async run(
        userRequest: string,
        threadId: string,
        context: WorkflowContext,
        options: PlanWorkflowOptions,
    ): Promise<PlanWorkflowResult> {
        const state = createInitialPlanState(userRequest, options);
        const result = await this.execute(state, { ...context, threadId });

        return {
            state: result.state,
            success: result.success,
            planResult: result.success && result.state.graph
                ? { graph: result.state.graph, context: result.state.planContext }
                : undefined,
            error: result.error,
            duration: result.duration,
        };
    }

    // --- Overridden hooks ---

    protected shouldContinue(state: PlanState): boolean {
        if (state.validationErrors.some(e => e.severity === 'error')) return false;
        return super.shouldContinue(state);
    }

    // --- Step handlers ---

    private async analyzeRequest(state: PlanState): Promise<PlanState> {
        console.info('Step: analyzeRequest');

        state = addWorkflowMessage(state, 'user', state.userRequest);
        state.planContext.push(`User Request: ${state.userRequest}`);

        return addWorkflowMessage(state, 'system', 'Analyzed user request');
    }

    private async generateGraph(state: PlanState): Promise<PlanState> {
        console.info('Step: generateGraph');

        const systemPrompt = `You are an expert infrastructure architect.
Create a JSON representation of the infrastructure required for the user's request.
The output must be a valid JSON object with a 'nodes' array and an optional 'edges' array.
Each node must have: id (uuid), name, nodeType (from enums: MICROSERVICE, DATABASE, CACHE, QUEUE, KUBERNETES_CLUSTER, etc.),
and optional spec object.

Example output:
{
  "name": "My Graph",
  "description": "Graph description",
  "nodes": [
    { "id": "uuid1", "name": "api-service", "nodeType": "MICROSERVICE", "spec": { "language": "typescript" } },
    { "id": "uuid2", "name": "main-db", "nodeType": "DATABASE", "spec": { "engine": "postgres" } }
  ]
}`;

        let userPrompt = `Request: ${state.userRequest}\n\nExisting Context: ${state.planContext.join('\n')}`;

        if (state.graph) {
            userPrompt += `\n\nExisting Graph: ${JSON.stringify(state.graph, null, 2)}
Please modify the existing graph or add to it based on the request. Preserve existing IDs for unchanged nodes.`;
        }

        // Use router with failover if configured, else direct provider
        const { text } = this.router
            ? await this.router.generateText(
                { system: systemPrompt, prompt: userPrompt, temperature: 0.1 },
                'plan',
              )
            : await generateText({
                model: createLLMProvider(state.modelProvider, state.modelName),
                system: systemPrompt,
                prompt: userPrompt,
                temperature: 0.1,
              });

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Failed to parse JSON from LLM response');

        const generatedData = JSON.parse(jsonMatch[0]);

        const nodes: GraphNode[] = (generatedData.nodes ?? []).map((n: any) => ({
            ...n,
            id: n.id || uuidv4(),
            edges: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));

        state.graph = {
            id: uuidv4(),
            name: generatedData.name || 'Generated Graph',
            description: generatedData.description || 'Generated from user request',
            graphType: GraphType.MICROSERVICE,
            nodes,
            companyId: '',
            userId: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return addWorkflowMessage(state, 'assistant', `Generated graph with ${nodes.length} nodes`);
    }

    private async validateGraphStep(state: PlanState): Promise<PlanState> {
        console.info('Step: validateGraph');

        if (!state.graph) throw new Error('No graph generated to validate');

        const validation = validateGraph(state.graph);

        for (const error of validation.errors) {
            state = addValidationError(state, { field: 'general', message: error, severity: 'error' });
        }

        return addWorkflowMessage(
            state,
            'system',
            `Validation complete: ${validation.errors.length} errors`,
        );
    }

    private async saveGraph(state: PlanState): Promise<PlanState> {
        console.info('Step: saveGraph');
        // Graph persistence is handled by the caller (kuberag → Dgraph).
        // This step finalizes the plan and signals completion.
        return addWorkflowMessage(state, 'system', 'Graph plan finalized');
    }
}

// ---------------------------------------------------------------------------
// Convenience function exports
// ---------------------------------------------------------------------------

export async function runPlanWorkflow(
    userRequest: string,
    threadId: string,
    context: WorkflowContext,
    redis: Redis,
    eventBus: EventBus,
    options: PlanWorkflowOptions,
): Promise<PlanWorkflowResult> {
    const workflow = new PlanWorkflow(redis, eventBus);
    return workflow.run(userRequest, threadId, context, options);
}

export async function getPlanWorkflowStatus(
    threadId: string,
    redis: Redis,
    eventBus: EventBus,
): Promise<PlanState | null> {
    const workflow = new PlanWorkflow(redis, eventBus);
    return workflow.getStatus(threadId);
}

export async function cancelPlanWorkflow(
    threadId: string,
    redis: Redis,
    eventBus: EventBus,
): Promise<boolean> {
    const workflow = new PlanWorkflow(redis, eventBus);
    return workflow.cancel(threadId);
}
