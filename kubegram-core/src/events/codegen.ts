/**
 * Typed domain events for the code generation workflow.
 *
 * These classes are plain data carriers — they are NOT wired to WorkflowPubSub
 * or EventBus automatically. Callers must construct and publish them explicitly:
 *
 *   await eventBus.publish(new CodegenStartedEvent(jobId, userId, graphId, graphData, options));
 *
 * For the internal workflow event fan-out (step_started, step_completed, etc.)
 * see WorkflowPubSub in state/pubsub.ts — those use WorkflowEvent, not these classes.
 */

/** Fired when a codegen job is accepted and enters the queue. */
export class CodegenStartedEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly graphId: string,
    public readonly graphData: any,
    public readonly options: any
  ) {}
}

/** Fired by the workflow at each step boundary to report incremental progress. */
export class CodegenProgressEvent {
  constructor(
    public readonly jobId: string,
    public readonly step: string,
    public readonly progress: number,
    public readonly message: string
  ) {}
}

/** Fired when all manifests have been generated and validated successfully. */
export class CodegenCompletedEvent {
  constructor(
    public readonly jobId: string,
    public readonly manifests: any[],
    public readonly graphId: string,
    public readonly processingTime: number
  ) {}
}

/**
 * Fired when the workflow fails at any step.
 * `retryable` signals to the caller whether automatic retry is safe.
 */
export class CodegenFailedEvent {
  constructor(
    public readonly jobId: string,
    public readonly error: string,
    public readonly step?: string,
    public readonly retryable?: boolean
  ) {}
}
