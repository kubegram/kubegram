/**
 * Code generation workflow implementation
 * Extends BaseWorkflow with 4 codegen-specific steps + retry loop
 * Port of app/workflows/codegen_workflow.py
 */

import { generateText } from 'ai';
import { dgraphClient } from '../db/client';
import { codegenCheckpointer } from '../state/checkpointer';
import { codegenPubSub } from '../state/pubsub';
import { codegenCache } from '../state/cache';
import { ragContextService } from '../rag/context';
import { createLLMProvider } from '../llm/providers';
import { buildSystemPrompt, SystemPromptBuilder } from '../prompts/system';
import { generateNodePrompt } from '../prompts/node-generators';
import { parseLLMManifestsOutput } from '../prompts/parser';
import {
  CodegenState,
  WorkflowStep,
  CodegenWorkflowResult,
  CodegenWorkflowOptions,
  createInitialCodegenState,
  addWorkflowMessage,
  addTargetMessage,
  addValidationError,
} from './types';
import type { WorkflowContext } from '../types/workflow';
import type { StepHandler } from '../types/workflow';
import { BaseWorkflow } from './base-workflow';
import {
  getNeededInfrastructure,
  validateGraph,
  buildGraphEdges,
} from '../utils/codegen';
import { Graph, GraphNode, Edge } from '../types/graph';
import { GraphType, ModelProvider } from '../types/enums';

/**
 * Code generation workflow
 * Extends BaseWorkflow with codegen-specific steps:
 *   1. getOrCreateGraph — fetch/create graph in Dgraph
 *   2. getPrompt — identify needed nodes, generate per-node prompts
 *   3. llmCall — RAG context + LLM invocation + output parsing
 *   4. validateConfigurations — validate generated YAML manifests
 */
export class CodegenWorkflow extends BaseWorkflow<CodegenState, WorkflowStep> {
  // --- BaseWorkflow abstract members ---

  protected readonly steps: WorkflowStep[] = [
    WorkflowStep.GET_OR_CREATE_GRAPH,
    WorkflowStep.GET_PROMPT,
    WorkflowStep.LLM_CALL,
    WorkflowStep.BUILD_KUBERNETES_GRAPH,
    WorkflowStep.VALIDATE_CONFIGURATIONS,
  ];

  protected readonly handlers: Record<WorkflowStep, StepHandler<CodegenState>> = {
    [WorkflowStep.GET_OR_CREATE_GRAPH]: (s) => this.getOrCreateGraph(s),
    [WorkflowStep.GET_PROMPT]: (s) => this.getPrompt(s),
    [WorkflowStep.LLM_CALL]: (s) => this.llmCall(s),
    [WorkflowStep.BUILD_KUBERNETES_GRAPH]: (s) => this.buildKubernetesGraph(s),
    [WorkflowStep.VALIDATE_CONFIGURATIONS]: (s) => this.validateConfigurations(s),
    // Terminal steps — never executed, but required by Record type
    [WorkflowStep.COMPLETED]: async (s) => s,
    [WorkflowStep.FAILED]: async (s) => s,
  };

  protected readonly initialStep = WorkflowStep.GET_OR_CREATE_GRAPH;

  protected readonly terminalSteps: WorkflowStep[] = [
    WorkflowStep.COMPLETED,
    WorkflowStep.FAILED,
  ];

  protected readonly channelPrefix = 'codegen';

  // --- Codegen-specific dependencies ---

  private readonly dgraph = dgraphClient;
  private readonly cache = codegenCache;
  private readonly ragContext = ragContextService;

  constructor() {
    super(codegenCheckpointer, codegenPubSub as any);
  }

  // --- Public API ---

  /**
   * Run the complete code generation workflow
   */
  async run(
    initialGraph: Graph,
    threadId: string,
    context: WorkflowContext,
    options: CodegenWorkflowOptions = {}
  ): Promise<CodegenWorkflowResult> {
    const state = createInitialCodegenState(initialGraph, options, context.userContext || []);
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
    // Stop if we have validation errors
    if (state.validationErrors.some(e => e.severity === 'error')) {
      return false;
    }

    // Stop if we've completed all steps
    if (state.currentStep === WorkflowStep.VALIDATE_CONFIGURATIONS) {
      return false;
    }

    // Stop if we've exceeded max steps
    if (state.stepHistory.length >= 10) {
      return false;
    }

    return true;
  }

  protected onStepError(state: CodegenState, error: unknown): CodegenState {
    const updated = super.onStepError(state, error);
    return { ...updated, isRetry: true };
  }

  // --- Step handlers ---

  /**
   * Step 1: Get or create graph in Dgraph
   */
  private async getOrCreateGraph(state: CodegenState): Promise<CodegenState> {
    console.info('Step: getOrCreateGraph');

    try {
      // Try to get existing graph
      let dbGraph = await this.dgraph.getGraph(
        state.graph.id,
        state.graph.companyId,
        state.graph.userId
      );

      if (!dbGraph) {
        // Create new graph
        console.info('Creating new graph in Dgraph');
        const graphId = await this.dgraph.createGraph(state.graph);

        // Update graph with assigned ID
        state.graph.id = graphId;

        // Get the created graph
        dbGraph = await this.dgraph.getGraph(graphId, state.graph.companyId, state.graph.userId);
      }

      state.dbGraph = dbGraph;

      return addWorkflowMessage(state, 'system', `Retrieved/created graph: ${dbGraph?.id}`);

    } catch (error) {
      console.error('Failed to get/create graph:', error);
      throw error;
    }
  }

  /**
   * Step 2: Generate prompts for needed nodes
   */
  private async getPrompt(state: CodegenState): Promise<CodegenState> {
    console.info('Step: getPrompt');

    try {
      // Get needed infrastructure (delta)
      state.neededNodes = getNeededInfrastructure(state.graph, state.dbGraph);

      if (state.neededNodes.length === 0) {
        console.info('No new nodes needed for generation');
        return addWorkflowMessage(state, 'system', 'No new infrastructure needed');
      }

      console.info(`Generating prompts for ${state.neededNodes.length} nodes`);

      // Generate prompts for each needed node
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

      return addWorkflowMessage(state, 'system', `Generated prompts for ${state.neededNodes.length} nodes`);

    } catch (error) {
      console.error('Failed to generate prompts:', error);
      throw error;
    }
  }

  /**
   * Step 3: LLM call with RAG context
   */
  private async llmCall(state: CodegenState): Promise<CodegenState> {
    console.info('Step: llmCall');

    try {
      // Sanitize user context using LLM if provided
      if (state.userContext && state.userContext.length > 0) {
        console.info('Sanitizing user context with LLM...');
        const sanitizedContext = await this.sanitizeContext(state.userContext);
        state.userContext = sanitizedContext;
        
        // Re-process sanitized context
        state.processedContext = SystemPromptBuilder.processUserContext(sanitizedContext);
      }

      // Get RAG context
      const ragContext = await this.ragContext.getRAGContext(state.graph);
      state.similarGraphs = ragContext.similarGraphs;
      state.ragContext = ragContext.contextText;

      // Build system prompt
      const systemPrompt = buildSystemPrompt(state.graph, ragContext, {
        includeRAGContext: true,
        includeBestPractices: true,
        includeSecurityGuidelines: true,
        includeResourceLimits: true,
        userContext: state.userContext,
      });

      // Build user prompt from target messages
      const userPrompt = this.buildUserPrompt(state);

      // Get LLM provider
      const provider = createLLMProvider(state.modelProvider, state.modelName);

      // Generate text
      const { text } = await generateText({
        model: provider,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0,
        maxTokens: 4000,
      });

      // Parse LLM output
      const manifests = parseLLMManifestsOutput(text);
      // Convert to GeneratedCodeGraph
      state.generatedConfigurations = {
        totalFiles: manifests.length,
        namespace: state.graph.namespace || 'default',
        graphId: state.graph.id,
        originalGraphId: state.graph.id,
        nodes: manifests.map(manifest => ({
          id: manifest.entity_id || '',
          name: manifest.entity_name,
          nodeType: manifest.entity_type as any,
          companyId: state.graph.companyId,
          userId: state.graph.userId,
          namespace: state.graph.namespace || 'default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          generatedCodeMetadata: {
            fileName: manifest.file_name,
            path: manifest.file_name,
          },
          command: undefined,
          spec: undefined,
          config: manifest.generated_code as any,
        })),
      };

      return addWorkflowMessage(state, 'assistant', `Generated ${manifests.length} Kubernetes manifests`);

    } catch (error) {
      console.error('LLM call failed:', error);
      throw error;
    }
  }

  /**
   * Step 4: Build Kubernetes graph from generated configurations
   * Converts generated nodes into a transient Graph, infers edges
   * using Kubernetes connection rules, and maps them back onto
   * generatedConfigurations.nodes for validation and user return.
   */
  private async buildKubernetesGraph(state: CodegenState): Promise<CodegenState> {
    console.info('Step: buildKubernetesGraph');

    try {
      if (state.generatedConfigurations.nodes.length === 0) {
        console.info('No generated configurations to build Kubernetes graph from');
        return addWorkflowMessage(state, 'system', 'Skipped Kubernetes graph build: no configurations generated');
      }

      const generatedNodes = state.generatedConfigurations.nodes;

      // Convert GeneratedCodeNode[] to GraphNode[] for edge building
      // Maps the correctly-spelled original* fields to the orginal* fields on GraphNode
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

      // Build transient Graph and infer edges using Kubernetes connection rules
      const tempGraph: Graph = {
        id: state.graph.id,
        name: `${state.graph.name}-kubernetes`,
        description: `Kubernetes manifests generated from graph: ${state.graph.name}`,
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

      // Map inferred edges back onto GeneratedCodeNode[]
      const edgeMap = new Map<string, Edge[]>();
      for (const node of graphWithEdges.nodes || []) {
        if (node.edges && node.edges.length > 0) {
          edgeMap.set(node.id, node.edges);
        }
      }

      state.generatedConfigurations = {
        ...state.generatedConfigurations,
        nodes: generatedNodes.map(node => ({
          ...node,
          edges: edgeMap.get(node.id) || node.edges || [],
        })),
      };

      let totalEdges = 0;
      for (const edges of edgeMap.values()) {
        totalEdges += edges.length;
      }

      return addWorkflowMessage(
        state,
        'system',
        `Built Kubernetes graph with ${graphWithEdges.nodes?.length || 0} nodes and ${totalEdges} edges`
      );

    } catch (error) {
      console.error('Failed to build Kubernetes graph:', error);
      throw error;
    }
  }

  /**
   * Step 5: Validate generated configurations
   */
  private async validateConfigurations(state: CodegenState): Promise<CodegenState> {
    console.info('Step: validateConfigurations');

    try {
      // Validate generated code
      const validation = validateGraph({
        ...state.graph,
        nodes: state.generatedConfigurations.nodes,
      });

      // Add validation errors to state
      for (const error of validation.errors) {
        state = addValidationError(state, {
          field: 'general',
          message: error,
          severity: 'error',
        });
      }

      // Add validation warnings to state
      for (const warning of validation.warnings) {
        state = addValidationError(state, {
          field: 'general',
          message: warning,
          severity: 'warning',
        });
      }

      // Set validated graph
      state.validatedGraph = {
        ...state.graph,
        nodes: state.generatedConfigurations.nodes,
      };

      const isValid = validation.errors.length === 0;

      return addWorkflowMessage(
        state,
        'system',
        `Validation complete: ${isValid ? 'PASSED' : 'FAILED'} (${validation.errors.length} errors, ${validation.warnings.length} warnings)`
      );

    } catch (error) {
      console.error('Validation failed:', error);
      throw error;
    }
  }

  // --- Helpers ---

  /**
   * Sanitize user context using LLM to remove PII and malicious content
   */
  private async sanitizeContext(context: string[]): Promise<string[]> {
    try {
      const provider = createLLMProvider(ModelProvider.claude, 'claude-3-haiku-20240307');
      
      const { text } = await generateText({
        model: provider,
        system: `You are a content sanitization assistant. Your task is to review user-provided context messages and remove any personally identifiable information (PII), malicious content, or inappropriate material. 

Rules:
1. Remove email addresses, phone numbers, names, addresses, and other PII
2. Remove any malicious code, SQL injection attempts, or harmful instructions
3. Remove inappropriate or offensive language
4. Keep the core technical requirements and context intact
5. If a message is entirely inappropriate, replace it with "[REMOVED - Inappropriate content]"
6. Return the sanitized messages as a JSON array of strings

Respond only with the JSON array, no explanations.`,
        prompt: `Sanitize the following context messages and return as JSON array:
${JSON.stringify(context, null, 2)}`,
        temperature: 0,
        maxTokens: 1000,
      });

      // Parse the LLM response
      const sanitized = JSON.parse(text.trim());
      
      // Ensure we have an array of strings
      if (Array.isArray(sanitized)) {
        return sanitized.filter(item => typeof item === 'string' && item.trim() !== '');
      }
      
      // Fallback: return original context if parsing fails
      console.warn('Failed to parse sanitized context, using original');
      return context;
      
    } catch (error) {
      console.error('Context sanitization failed:', error);
      // Fallback: return original context
      return context;
    }
  }

  /**
   * Build user prompt from target messages
   */
  private buildUserPrompt(state: CodegenState): string {
    let prompt = '';

    // Add user requirements from context
    if (state.processedContext.userRequirements.length > 0) {
      prompt += '**Additional Requirements:**\n';
      for (const requirement of state.processedContext.userRequirements) {
        prompt += `- ${requirement}\n`;
      }
      prompt += '\n';
    }

    if (state.targetMessages.length === 0) {
      prompt += 'Generate Kubernetes manifests for the provided infrastructure graph.';
      return prompt;
    }

    prompt += 'Generate Kubernetes manifests for the following infrastructure components:\n\n';

    for (const targetMessage of state.targetMessages) {
      prompt += `**${targetMessage.nodeType}: ${targetMessage.nodeId}**\n`;
      prompt += `${targetMessage.prompt}\n\n`;
    }

    return prompt;
  }
}

// Export convenience functions
export async function runCodegenWorkflow(
  graph: Graph,
  threadId: string,
  context: WorkflowContext,
  options?: CodegenWorkflowOptions
): Promise<CodegenWorkflowResult> {
  const workflow = new CodegenWorkflow();
  return await workflow.run(graph, threadId, context, options);
}

export async function getCodegenWorkflowStatus(threadId: string): Promise<CodegenState | null> {
  const workflow = new CodegenWorkflow();
  return await workflow.getStatus(threadId);
}

export async function cancelCodegenWorkflow(threadId: string): Promise<boolean> {
  const workflow = new CodegenWorkflow();
  return await workflow.cancel(threadId);
}
