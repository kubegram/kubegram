/**
 * Workflow types for code generation
 * Copied from kuberag
 */

import { Graph, GraphNode } from '../types/graph.js';
import { GeneratedCodeGraph } from '../types/codegen.js';
import { ModelProvider, ModelName, DEFAULT_MODEL } from '../types/enums.js';
import { BaseWorkflowState } from '../types/workflow.js';

export type { WorkflowContext, WorkflowEvent } from '../types/workflow.js';

export enum WorkflowStep {
  GET_OR_CREATE_GRAPH = 'getOrCreateGraph',
  GET_PROMPT = 'getPrompt',
  LLM_CALL = 'llmCall',
  VALIDATE_CONFIGURATIONS = 'validateConfigurations',
  BUILD_KUBERNETES_GRAPH = 'buildKubernetesGraph',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface WorkflowMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TargetMessage {
  nodeId: string;
  nodeType: string;
  prompt: string;
  priority: number;
}

export interface ValidationError {
  nodeId?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ProcessedContext {
  systemMessages: string[];
  userRequirements: string[];
  planningContext: string[];
}

export interface NodeGenerationRequest {
  node: GraphNode;
  prompt: string;
  priority: number;
  dependencies: string[];
}

export interface CodegenState extends BaseWorkflowState<WorkflowStep, WorkflowStatus> {
  graph: Graph;
  messages: WorkflowMessage[];
  targetMessages: TargetMessage[];
  processedContext?: ProcessedContext;
  generatedCode?: GeneratedCodeGraph;
  validationErrors: ValidationError[];
  llmProvider?: ModelProvider;
  llmModel?: ModelName;
}

export interface PlanState extends BaseWorkflowState<string, WorkflowStatus> {
  userRequest: string;
  graph?: Graph;
  messages: WorkflowMessage[];
  processedContext?: ProcessedContext;
  plan?: any;
  validationErrors: ValidationError[];
}

export interface CodegenWorkflowResult {
  success: boolean;
  generatedCode?: GeneratedCodeGraph;
  error?: string;
  duration: number;
}

export interface PlanWorkflowResult {
  success: boolean;
  plan?: any;
  error?: string;
  duration: number;
}

export interface CodegenWorkflowOptions {
  modelProvider?: ModelProvider;
  modelName?: ModelName;
  enableRAG?: boolean;
  enableValidation?: boolean;
  maxRetries?: number;
  timeout?: number;
}

export function createInitialCodegenState(graph: Graph): CodegenState {
  return {
    currentStep: 'getOrCreateGraph' as WorkflowStep,
    stepHistory: [],
    status: WorkflowStatus.PENDING,
    retryCount: 0,
    maxRetries: 3,
    startTime: new Date().toISOString(),
    graph,
    messages: [],
    targetMessages: [],
    validationErrors: [],
    llmProvider: ModelProvider.claude,
    llmModel: DEFAULT_MODEL[ModelProvider.claude],
  };
}

export function addWorkflowMessage(state: CodegenState, role: 'system' | 'user' | 'assistant', content: string): CodegenState {
  return {
    ...state,
    messages: [
      ...state.messages,
      {
        role,
        content,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function addTargetMessage(state: CodegenState, message: TargetMessage): CodegenState {
  return {
    ...state,
    targetMessages: [...state.targetMessages, message],
  };
}

export function addValidationError(state: CodegenState, error: ValidationError): CodegenState {
  return {
    ...state,
    validationErrors: [...state.validationErrors, error],
  };
}
