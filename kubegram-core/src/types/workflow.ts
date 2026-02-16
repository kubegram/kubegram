/**
 * Generic workflow framework types
 * Copied from kuberag
 */

export enum BaseWorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

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

export type StepHandler<State> = (state: State) => Promise<State>;

export interface WorkflowResult<State> {
  state: State;
  success: boolean;
  error?: string;
  duration: number;
}

export interface WorkflowOptions {
  maxRetries?: number;
  timeout?: number;
}

export interface WorkflowContext {
  threadId: string;
  jobId: string;
  userId: string;
  companyId: string;
  userContext?: string[];
}

export interface WorkflowEvent {
  type: 'started' | 'step_started' | 'step_completed' | 'step_failed' | 'completed' | 'failed' | 'cancelled';
  workflowId: string;
  step?: string;
  error?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
