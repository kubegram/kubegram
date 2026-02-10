/**
 * Workflow types for code generation
 * Port of CodegenGraphState from app/workflows/codegen_workflow.py
 */

import { Graph, GraphNode } from '../types/graph';
import { GeneratedCodeGraph } from '../types/codegen';
import { ModelProvider, ModelName, DEFAULT_MODEL } from '../types/enums';
import { BaseWorkflowState } from '../types/workflow';

// Re-export base types for backward compatibility
export type { WorkflowContext, WorkflowEvent } from '../types/workflow';

// Codegen-specific workflow steps
export enum WorkflowStep {
  GET_OR_CREATE_GRAPH = 'getOrCreateGraph',
  GET_PROMPT = 'getPrompt',
  LLM_CALL = 'llmCall',
  VALIDATE_CONFIGURATIONS = 'validateConfigurations',
  BUILD_KUBERNETES_GRAPH = 'buildKubernetesGraph',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Codegen-specific workflow status
export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// LLM message interface
export interface WorkflowMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Target message interface (for specific node prompts)
export interface TargetMessage {
  nodeId: string;
  nodeType: string;
  prompt: string;
  priority: number;
}

// Validation error interface
export interface ValidationError {
  nodeId?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// Processed context interface
export interface ProcessedContext {
  systemMessages: string[];
  userRequirements: string[];
  planningContext: string[];
}

// Node generation request
export interface NodeGenerationRequest {
  node: GraphNode;
  prompt: string;
  priority: number;
  dependencies: string[];
}

// Codegen state — extends base workflow state with domain-specific fields
export interface CodegenState extends BaseWorkflowState<WorkflowStep, WorkflowStatus> {
  // Input graph
  graph: Graph;

  // Workflow messages
  messages: WorkflowMessage[];
  targetMessages: TargetMessage[];

  // Retry flag (derived from retryCount > 0, but kept for backward compat)
  isRetry: boolean;

  // Generated configurations
  generatedConfigurations: GeneratedCodeGraph;

  // Database state
  dbGraph: Graph | null;

  // Infrastructure needs
  neededNodes: GraphNode[];

  // RAG context
  similarGraphs: Graph[];
  ragContext: string;

  // Context processing
  userContext: string[];
  processedContext: ProcessedContext;

  // Validation state
  validatedGraph: Graph | null;
  validationErrors: ValidationError[];
  missingNodes: string[];

  // LLM configuration
  modelProvider: ModelProvider;
  modelName: ModelName;
}

// Codegen-specific workflow result (extends base with generatedCode)
export interface CodegenWorkflowResult {
  state: CodegenState;
  success: boolean;
  generatedCode?: GeneratedCodeGraph;
  error?: string;
  duration: number;
}

// Codegen-specific workflow options
export interface CodegenWorkflowOptions {
  maxRetries?: number;
  timeout?: number;
  enableRAG?: boolean;
  enableValidation?: boolean;
  modelProvider?: ModelProvider;
  modelName?: ModelName;
  customInstructions?: string;
}

// Type guards
export function isValidCodegenState(state: any): state is CodegenState {
  return (
    state &&
    typeof state === 'object' &&
    Array.isArray(state.messages) &&
    Array.isArray(state.stepHistory) &&
    state.graph &&
    typeof state.graph === 'object'
  );
}

export function isWorkflowComplete(state: CodegenState): boolean {
  return (
    state.status === WorkflowStatus.COMPLETED ||
    state.status === WorkflowStatus.FAILED ||
    state.status === WorkflowStatus.CANCELLED
  );
}

export function shouldRetry(state: CodegenState): boolean {
  return (
    state.status === WorkflowStatus.FAILED &&
    state.retryCount < state.maxRetries
  );
}

// Helper functions

export function createInitialCodegenState(
  graph: Graph,
  options: CodegenWorkflowOptions = {},
  userContext: string[] = []
): CodegenState {
  return {
    graph,
    messages: [],
    targetMessages: [],
    isRetry: false,
    retryCount: 0,
    maxRetries: options.maxRetries || 3,
    generatedConfigurations: {
      totalFiles: 0,
      namespace: graph.namespace || 'default',
      graphId: graph.id,
      originalGraphId: graph.id,
      nodes: [],
    },
    stepHistory: [],
    currentStep: WorkflowStep.GET_OR_CREATE_GRAPH,
    status: WorkflowStatus.PENDING,
    dbGraph: null,
    neededNodes: [],
    similarGraphs: [],
    ragContext: '',
    userContext,
    processedContext: {
      systemMessages: [],
      userRequirements: [],
      planningContext: [],
    },
    validatedGraph: null,
    validationErrors: [],
    missingNodes: [],
    modelProvider: options.modelProvider || ModelProvider.claude,
    modelName: options.modelName || DEFAULT_MODEL[options.modelProvider || ModelProvider.claude],
    startTime: new Date().toISOString(),
  };
}

export function addWorkflowMessage<T extends { messages: WorkflowMessage[] }>(
  state: T,
  role: WorkflowMessage['role'],
  content: string
): T {
  return {
    ...state,
    messages: [...state.messages, {
      role,
      content,
      timestamp: new Date().toISOString(),
    }],
  };
}

export function addTargetMessage(
  state: CodegenState,
  nodeId: string,
  nodeType: string,
  prompt: string,
  priority: number = 1
): CodegenState {
  return {
    ...state,
    targetMessages: [...state.targetMessages, {
      nodeId,
      nodeType,
      prompt,
      priority,
    }],
  };
}


export function addValidationError<T extends { validationErrors: ValidationError[] }>(
  state: T,
  error: ValidationError
): T {
  return {
    ...state,
    validationErrors: [...state.validationErrors, error],
  };
}

// --- Plan Workflow Types ---

export enum PlanWorkflowStep {
  ANALYZE_REQUEST = 'analyzeRequest',
  GENERATE_GRAPH = 'generateGraph',
  VALIDATE_GRAPH = 'validateGraph',
  SAVE_GRAPH = 'saveGraph',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum PlanWorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface PlanWorkflowResult {
  state: PlanState;
  success: boolean;
  planResult?: {
    graph: Graph;
    context: string[];
  };
  error?: string;
  duration: number;
}

export interface PlanWorkflowOptions {
  maxRetries?: number;
  timeout?: number;
  modelProvider?: ModelProvider;
  modelName?: ModelName;
  graph: any; // GraphInput - now required
}

export interface PlanState extends BaseWorkflowState<PlanWorkflowStep, PlanWorkflowStatus> {
  // Input
  messages: WorkflowMessage[];
  userRequest: string; // Can be empty if only graph is provided

  // Output
  graph: Graph; // Always present now
  planContext: string[];

  // Internal
  isRetry: boolean;
  validationErrors: ValidationError[];

  // LLM config
  modelProvider: ModelProvider;
  modelName: ModelName;
}

export function createInitialPlanState(
  userRequest: string,
  options: PlanWorkflowOptions
): PlanState {
  return {
    messages: [],
    userRequest: userRequest || '',
    graph: options.graph, // Required - will error if not provided
    planContext: [],
    isRetry: false,
    retryCount: 0,
    maxRetries: options.maxRetries || 3,
    stepHistory: [],
    currentStep: PlanWorkflowStep.ANALYZE_REQUEST,
    status: PlanWorkflowStatus.PENDING,
    validationErrors: [],
    modelProvider: options.modelProvider || ModelProvider.claude,
    modelName: options.modelName || DEFAULT_MODEL[options.modelProvider || ModelProvider.claude],
    startTime: new Date().toISOString(),
  };
}
