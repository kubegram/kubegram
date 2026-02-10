/**
 * Generic workflow framework types
 * Provides base types for building reusable step-based workflows
 * with checkpointing, retry logic, and pub/sub event support.
 */

export enum BaseWorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Base workflow state interface.
 * All workflow states must extend this to get automatic execution engine support.
 * Generic over Step (string enum of step names) and Status (string enum of statuses).
 */
export interface BaseWorkflowState<
  Step extends string = string,
  Status extends string = string,
> {
  currentStep: Step;
  stepHistory: Step[];
  status: Status;
  retryCount: number;
  maxRetries: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: string;
  errorDetails?: unknown;
}

/**
 * Step handler function type.
 * Receives the full workflow state and returns an updated state.
 */
export type StepHandler<State> = (state: State) => Promise<State>;

/**
 * Workflow execution result.
 */
export interface WorkflowResult<State> {
  state: State;
  success: boolean;
  error?: string;
  duration: number;
}

/**
 * Options for configuring workflow execution.
 */
export interface WorkflowOptions {
  maxRetries?: number;
  timeout?: number;
}

/**
 * Context passed to the workflow execution engine.
 */
export interface WorkflowContext {
  threadId: string;
  jobId: string;
  userId: string;
  companyId: string;
  userContext?: string[]; // Optional user-provided context messages
}

/**
 * Event published during workflow execution for real-time tracking.
 */
export interface WorkflowEvent {
  type: 'started' | 'step_started' | 'step_completed' | 'step_failed' | 'completed' | 'failed' | 'cancelled';
  workflowId: string;
  step?: string;
  error?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
