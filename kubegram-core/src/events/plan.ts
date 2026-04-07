/**
 * Typed domain events for the infrastructure planning workflow.
 *
 * These classes extend DomainEvent from @kubegram/events and can be
 * published directly to EventBus.
 */

import { v4 as uuidv4 } from "uuid";
import { DomainEvent } from "@kubegram/events";

// ---------------------------------------------------------------------------
// Data interfaces
// ---------------------------------------------------------------------------

interface PlanStartedEventData {
  jobId: string;
  userId: string;
  graphId: string;
  planningType: string;
}

interface PlanProgressEventData {
  jobId: string;
  step: string;
  progress: number;
  message: string;
}

interface PlanCompletedEventData {
  jobId: string;
  plan: unknown;
  processingTime: number;
}

interface PlanFailedEventData {
  jobId: string;
  error: string;
}

// ---------------------------------------------------------------------------
// Event classes
// ---------------------------------------------------------------------------

/** Fired when a planning job is accepted and enters the queue. */
export class PlanStartedEvent extends DomainEvent<PlanStartedEventData> {
  constructor(
    jobId: string,
    userId: string,
    graphId: string,
    planningType: string,
    aggregateId?: string,
  ) {
    super(
      "plan.started",
      uuidv4(),
      { jobId, userId, graphId, planningType },
      aggregateId ?? jobId,
    );
  }
}

/** Fired by the workflow at each step boundary to report incremental progress. */
export class PlanProgressEvent extends DomainEvent<PlanProgressEventData> {
  constructor(
    jobId: string,
    step: string,
    progress: number,
    message: string,
    aggregateId?: string,
  ) {
    super(
      "plan.progress",
      uuidv4(),
      { jobId, step, progress, message },
      aggregateId ?? jobId,
    );
  }
}

/** Fired when the infrastructure plan has been generated and validated successfully. */
export class PlanCompletedEvent extends DomainEvent<PlanCompletedEventData> {
  constructor(
    jobId: string,
    plan: unknown,
    processingTime: number,
    aggregateId?: string,
  ) {
    super(
      "plan.completed",
      uuidv4(),
      { jobId, plan, processingTime },
      aggregateId ?? jobId,
    );
  }
}

/** Fired when the planning workflow fails at any step. */
export class PlanFailedEvent extends DomainEvent<PlanFailedEventData> {
  constructor(jobId: string, error: string, aggregateId?: string) {
    super("plan.failed", uuidv4(), { jobId, error }, aggregateId ?? jobId);
  }
}
