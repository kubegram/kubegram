/**
 * Planning Agent Workflow
 * 
 * @deprecated Import from @kubegram/kubegram-core instead
 * This module will be removed in kuberag v2.0.0
 * 
 * Generates an infrastructure graph from a user request.
 */

import { generateText } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { dgraphClient } from '../db/client';
import { planCheckpointer } from '../state/checkpointer';
import { planPubSub } from '../state/pubsub';
import { createLLMProvider } from '../llm/providers';
import {
    PlanState,
    PlanWorkflowStep,
    PlanWorkflowResult,
    PlanWorkflowOptions,
    createInitialPlanState,
    addWorkflowMessage,
    addValidationError,
} from './types';
import type { WorkflowContext, StepHandler } from '../types/workflow';
import { BaseWorkflow } from './base-workflow';
import { validateGraph } from '../utils/codegen';
import { Graph, GraphNode } from '../types/graph';
import { GraphType, GraphNodeType } from '../types/enums';

/**
 * Planning workflow
 * 1. ANALYZE_REQUEST - Understand user requirements
 * 2. GENERATE_GRAPH - Generate graph nodes and edges
 * 3. VALIDATE_GRAPH - Validate generated graph
 * 4. SAVE_GRAPH - Save graph to Dgraph
 */
export class PlanWorkflow extends BaseWorkflow<PlanState, PlanWorkflowStep> {
    protected readonly steps: PlanWorkflowStep[] = [
        PlanWorkflowStep.ANALYZE_REQUEST,
        PlanWorkflowStep.GENERATE_GRAPH,
        PlanWorkflowStep.VALIDATE_GRAPH,
        PlanWorkflowStep.SAVE_GRAPH,
    ];

    protected readonly handlers: Record<PlanWorkflowStep, StepHandler<PlanState>> = {
        [PlanWorkflowStep.ANALYZE_REQUEST]: (s) => this.analyzeRequest(s),
        [PlanWorkflowStep.GENERATE_GRAPH]: (s) => this.generateGraph(s),
        [PlanWorkflowStep.VALIDATE_GRAPH]: (s) => this.validateGraph(s),
        [PlanWorkflowStep.SAVE_GRAPH]: (s) => this.saveGraph(s),
        [PlanWorkflowStep.COMPLETED]: async (s) => s,
        [PlanWorkflowStep.FAILED]: async (s) => s,
    };

    protected readonly initialStep = PlanWorkflowStep.ANALYZE_REQUEST;

    protected readonly terminalSteps: PlanWorkflowStep[] = [
        PlanWorkflowStep.COMPLETED,
        PlanWorkflowStep.FAILED,
    ];

    protected readonly channelPrefix = 'plan';

    constructor() {
        super(planCheckpointer, planPubSub as any);
    }

    async run(
        userRequest: string,
        threadId: string,
        context: WorkflowContext,
        options: PlanWorkflowOptions
    ): Promise<PlanWorkflowResult> {
        const state = createInitialPlanState(userRequest, options);
        const result = await this.execute(state, { ...context, threadId });

        return {
            state: result.state,
            success: result.success,
            planResult: result.success && result.state.graph ? {
                graph: result.state.graph,
                context: result.state.planContext
            } : undefined,
            error: result.error,
            duration: result.duration,
        };
    }

    // --- Step Handlers ---

    private async analyzeRequest(state: PlanState): Promise<PlanState> {
        console.info('Step: analyzeRequest');

        // In a real implementation, this would use an LLM to extract requirements
        // For now, we'll just store the request as context
        state = addWorkflowMessage(state, 'user', state.userRequest);
        state.planContext.push(`User Request: ${state.userRequest}`);

        return addWorkflowMessage(state, 'system', 'Analyzed user request');
    }

    private async generateGraph(state: PlanState): Promise<PlanState> {
        console.info('Step: generateGraph');

        const provider = createLLMProvider(state.modelProvider, state.modelName);

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

        try {
            const { text } = await generateText({
                model: provider,
                system: systemPrompt,
                prompt: userPrompt,
                temperature: 0.1,
            });

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse JSON from LLM response');
            }

            const generatedData = JSON.parse(jsonMatch[0]);

            // Default edge inference
            const nodes: GraphNode[] = generatedData.nodes?.map((n: any) => ({
                ...n,
                id: n.id || uuidv4(),
                edges: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })) || [];

            // Construct Graph object
            state.graph = {
                id: uuidv4(), // Temporary ID, will be updated on save if needed
                name: generatedData.name || 'Generated Graph',
                description: generatedData.description || 'Generated from user request',
                graphType: GraphType.MICROSERVICE,
                nodes: nodes,
                companyId: '', // To be filled by context
                userId: '',    // To be filled by context
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            return addWorkflowMessage(state, 'assistant', `Generated graph with ${nodes.length} nodes`);

        } catch (error) {
            console.error('Failed to generate graph:', error);
            throw error;
        }
    }

    private async validateGraph(state: PlanState): Promise<PlanState> {
        console.info('Step: validateGraph');

        if (!state.graph) {
            throw new Error('No graph generated to validate');
        }

        const validation = validateGraph(state.graph);

        for (const error of validation.errors) {
            state = addValidationError(state, {
                field: 'general',
                message: error,
                severity: 'error',
            });
        }

        return addWorkflowMessage(state, 'system', `Validation complete: ${validation.errors.length} errors`);
    }

    private async saveGraph(state: PlanState): Promise<PlanState> {
        console.info('Step: saveGraph');

        // In this workflow we might not always want to save to DB immediately, 
        // but if we do, we can use dgraphClient.
        // For now, we'll assume the interaction ends here and the user can decide to save later
        // or we save strictly if requested.

        // We'll skip actual DB persistence for "Planning" unless explicitly required. 
        // The "Save" step here ensures the graph object is finalized.

        return addWorkflowMessage(state, 'system', 'Graph plan finalized');
    }

    protected shouldContinue(state: PlanState): boolean {
        if (state.validationErrors.some(e => e.severity === 'error')) {
            return false;
        }
        return super.shouldContinue(state);
    }
}

// Export convenience functions
export async function runPlanWorkflow(
    userRequest: string,
    threadId: string,
    context: WorkflowContext,
    options: PlanWorkflowOptions
): Promise<PlanWorkflowResult> {
    const workflow = new PlanWorkflow();
    return await workflow.run(userRequest, threadId, context, options);
}
