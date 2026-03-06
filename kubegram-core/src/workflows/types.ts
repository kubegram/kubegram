/**
 * Workflow types for kubegram-core
 * Ported from kuberag/src/workflows/types.ts
 * Source of truth for CodegenState, PlanState, and all workflow types.
 */

import type { Graph, GraphNode } from '../types/graph.js';
import type { GeneratedCodeGraph } from '../types/codegen.js';
import { ModelProvider, ModelName, DEFAULT_MODEL } from '../types/enums.js';
import type { BaseWorkflowState } from '../types/workflow.js';

// Re-export base types
export type { WorkflowContext, WorkflowEvent } from '../types/workflow.js';

// ---------------------------------------------------------------------------
// Codegen workflow enums
// ---------------------------------------------------------------------------

export enum WorkflowStep {
    GET_OR_CREATE_GRAPH = 'getOrCreateGraph',
    GET_PROMPT = 'getPrompt',
    LLM_CALL = 'llmCall',
    BUILD_KUBERNETES_GRAPH = 'buildKubernetesGraph',
    VALIDATE_CONFIGURATIONS = 'validateConfigurations',
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

// ---------------------------------------------------------------------------
// Plan workflow enums
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Shared message / validation types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Codegen state
// ---------------------------------------------------------------------------

export interface CodegenState extends BaseWorkflowState<WorkflowStep, WorkflowStatus> {
    // Input graph
    graph: Graph;

    // Workflow messages
    messages: WorkflowMessage[];
    targetMessages: TargetMessage[];

    // Retry flag (kept for backward compat)
    isRetry: boolean;

    // Generated configurations
    generatedConfigurations: GeneratedCodeGraph;

    // Database state (provided externally — kubegram-core does not fetch from Dgraph)
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

export interface CodegenWorkflowResult {
    state: CodegenState;
    success: boolean;
    generatedCode?: GeneratedCodeGraph;
    error?: string;
    duration: number;
}

export interface CodegenWorkflowOptions {
    maxRetries?: number;
    timeout?: number;
    enableRAG?: boolean;
    enableValidation?: boolean;
    modelProvider?: ModelProvider;
    modelName?: ModelName;
    customInstructions?: string;
    /**
     * Existing DB graph — the pre-fetched graph from Dgraph (provided by kuberag).
     * Used to compute the "needed nodes" delta. If omitted, all nodes are treated as new.
     */
    existingDbGraph?: Graph | null;
}

// ---------------------------------------------------------------------------
// Plan state
// ---------------------------------------------------------------------------

export interface PlanState extends BaseWorkflowState<PlanWorkflowStep, PlanWorkflowStatus> {
    messages: WorkflowMessage[];
    userRequest: string;

    graph: Graph;
    planContext: string[];

    isRetry: boolean;
    validationErrors: ValidationError[];

    modelProvider: ModelProvider;
    modelName: ModelName;
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
    graph: Graph;
}

// ---------------------------------------------------------------------------
// Validation workflow enums & types
// ---------------------------------------------------------------------------

export enum ValidationWorkflowStep {
    PARSE_API_SCHEMA = 'parseApiSchema',
    GENERATE_TEST_CASES = 'generateTestCases',
    TRIGGER_TESTS = 'triggerTests',
    COLLECT_RESULTS = 'collectResults',
    ANALYZE_RESULTS = 'analyzeResults',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export interface ValidationTestCase {
    /** UUID used as X-Kubegram-Validation-ID header for idempotent tracking */
    correlationId: string;
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: unknown;
    expectedStatus: number;
    /** JSON Schema for response body validation (optional) */
    expectedSchema?: unknown;
}

export interface SidecarEndpoint {
    namespace: string;
    pod: string;
    podIP: string;
    service: string;
    /** Port that exposes /validate alongside /metrics (default: 9090) */
    validatePort: number;
}

export interface TestResult {
    correlationId: string;
    success: boolean;
    actualStatus: number;
    responseTimeMs: number;
    responseBody?: unknown;
    /** Number of downstream calls observed by eBPF for this request */
    downstreamCalls?: number;
    error?: string;
}

export interface ValidationSummary {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    /** LLM-generated natural language analysis of the results */
    analysisText: string;
}

export interface ValidationState extends BaseWorkflowState<ValidationWorkflowStep, WorkflowStatus> {
    // Input
    graph: Graph;
    /** Raw OpenAPI spec provided by the user (JSON/YAML as object) */
    apiSchema: unknown;
    namespace: string;
    /** Base URL of kubegram-server — used to discover sidecars and proxy test triggers */
    serverBaseUrl: string;

    // Discovered
    sidecarEndpoints: SidecarEndpoint[];

    // Generated test cases
    testCases: ValidationTestCase[];
    correlationIds: string[];

    // Results
    testResults: TestResult[];
    validationSummary: ValidationSummary | null;
    validationErrors: ValidationError[];

    // LLM config (mirrors CodegenState convention)
    modelProvider: ModelProvider;
    modelName: ModelName;
}

export interface ValidationWorkflowOptions {
    maxRetries?: number;
    timeout?: number;
    modelProvider?: ModelProvider;
    modelName?: ModelName;
}

export interface ValidationWorkflowResult {
    state: ValidationState;
    success: boolean;
    summary?: ValidationSummary;
    testResults?: TestResult[];
    error?: string;
    duration: number;
}

export function createInitialValidationState(
    graph: Graph,
    namespace: string,
    apiSchema: unknown,
    serverBaseUrl: string,
    options: ValidationWorkflowOptions = {},
): ValidationState {
    return {
        graph,
        apiSchema,
        namespace,
        serverBaseUrl,
        sidecarEndpoints: [],
        testCases: [],
        correlationIds: [],
        testResults: [],
        validationSummary: null,
        validationErrors: [],
        retryCount: 0,
        maxRetries: options.maxRetries ?? 3,
        stepHistory: [],
        currentStep: ValidationWorkflowStep.PARSE_API_SCHEMA,
        status: WorkflowStatus.PENDING,
        modelProvider: options.modelProvider ?? ModelProvider.claude,
        modelName: options.modelName ?? DEFAULT_MODEL[options.modelProvider ?? ModelProvider.claude],
        startTime: new Date().toISOString(),
    };
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isValidCodegenState(state: unknown): state is CodegenState {
    return (
        !!state &&
        typeof state === 'object' &&
        Array.isArray((state as any).messages) &&
        Array.isArray((state as any).stepHistory) &&
        !!(state as any).graph &&
        typeof (state as any).graph === 'object'
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
    return state.status === WorkflowStatus.FAILED && state.retryCount < state.maxRetries;
}

// ---------------------------------------------------------------------------
// Helper factory functions
// ---------------------------------------------------------------------------

export function createInitialCodegenState(
    graph: Graph,
    options: CodegenWorkflowOptions = {},
    userContext: string[] = [],
): CodegenState {
    return {
        graph,
        messages: [],
        targetMessages: [],
        isRetry: false,
        retryCount: 0,
        maxRetries: options.maxRetries ?? 3,
        generatedConfigurations: {
            totalFiles: 0,
            namespace: graph.namespace ?? 'default',
            graphId: graph.id,
            originalGraphId: graph.id,
            nodes: [],
        },
        stepHistory: [],
        currentStep: WorkflowStep.GET_OR_CREATE_GRAPH,
        status: WorkflowStatus.PENDING,
        dbGraph: options.existingDbGraph ?? null,
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
        modelProvider: options.modelProvider ?? ModelProvider.claude,
        modelName: options.modelName ?? DEFAULT_MODEL[options.modelProvider ?? ModelProvider.claude],
        startTime: new Date().toISOString(),
    };
}

export function createInitialPlanState(
    userRequest: string,
    options: PlanWorkflowOptions,
): PlanState {
    return {
        messages: [],
        userRequest: userRequest ?? '',
        graph: options.graph,
        planContext: [],
        isRetry: false,
        retryCount: 0,
        maxRetries: options.maxRetries ?? 3,
        stepHistory: [],
        currentStep: PlanWorkflowStep.ANALYZE_REQUEST,
        status: PlanWorkflowStatus.PENDING,
        validationErrors: [],
        modelProvider: options.modelProvider ?? ModelProvider.claude,
        modelName: options.modelName ?? DEFAULT_MODEL[options.modelProvider ?? ModelProvider.claude],
        startTime: new Date().toISOString(),
    };
}

export function addWorkflowMessage<T extends { messages: WorkflowMessage[] }>(
    state: T,
    role: WorkflowMessage['role'],
    content: string,
): T {
    return {
        ...state,
        messages: [...state.messages, { role, content, timestamp: new Date().toISOString() }],
    };
}

export function addTargetMessage(
    state: CodegenState,
    nodeId: string,
    nodeType: string,
    prompt: string,
    priority: number = 1,
): CodegenState {
    return {
        ...state,
        targetMessages: [...state.targetMessages, { nodeId, nodeType, prompt, priority }],
    };
}

export function addValidationError<T extends { validationErrors: ValidationError[] }>(
    state: T,
    error: ValidationError,
): T {
    return {
        ...state,
        validationErrors: [...state.validationErrors, error],
    };
}
