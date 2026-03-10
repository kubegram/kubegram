/**
 * Typed domain events for the infrastructure planning workflow.
 *
 * These classes are plain data carriers — they are NOT wired to WorkflowPubSub
 * or EventBus automatically. See events/codegen.ts for the publishing convention.
 * The PlanWorkflow itself publishes WorkflowEvents (started, completed, etc.)
 * via WorkflowPubSub; these classes are for higher-level application consumers.
 */

/** Fired when a planning job is accepted and enters the queue. */
export class PlanStartedEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly graphId: string,
    public readonly planningType: string
  ) {}
}

/** Fired by the workflow at each step boundary to report incremental progress. */
export class PlanProgressEvent {
  constructor(
    public readonly jobId: string,
    public readonly step: string,
    public readonly progress: number,
    public readonly message: string
  ) {}
}

/** Fired when the infrastructure plan has been generated and validated successfully. */
export class PlanCompletedEvent {
  constructor(
    public readonly jobId: string,
    public readonly plan: any,
    public readonly processingTime: number
  ) {}
}

/** Fired when the planning workflow fails at any step. */
export class PlanFailedEvent {
  constructor(
    public readonly jobId: string,
    public readonly error: string
  ) {}
}
