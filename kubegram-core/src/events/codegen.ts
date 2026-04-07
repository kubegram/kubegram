/**
 * Typed domain events for the code generation workflow.
 *
 * These classes extend DomainEvent from @kubegram/events and can be
 * published directly to EventBus.
 */

import { v4 as uuidv4 } from "uuid";
import { DomainEvent } from "@kubegram/events";

// ---------------------------------------------------------------------------
// Data interfaces
// ---------------------------------------------------------------------------

interface CodegenStartedEventData {
  jobId: string;
  userId: string;
  graphId: string;
  graphData: unknown;
  options: { provider?: string; model?: string };
}

interface CodegenProgressEventData {
  jobId: string;
  step: string;
  progress: number;
  message: string;
}

interface CodegenCompletedEventData {
  jobId: string;
  manifests: unknown[];
  graphId: string;
  processingTime: number;
}

interface CodegenFailedEventData {
  jobId: string;
  error: string;
  step?: string;
  retryable?: boolean;
}

// ---------------------------------------------------------------------------
// Event classes
// ---------------------------------------------------------------------------

/** Fired when a codegen job is accepted and enters the queue. */
export class CodegenStartedEvent extends DomainEvent<CodegenStartedEventData> {
  constructor(
    jobId: string,
    userId: string,
    graphId: string,
    graphData: unknown,
    options: { provider?: string; model?: string } = {},
    aggregateId?: string,
  ) {
    super(
      "codegen.started",
      uuidv4(),
      { jobId, userId, graphId, graphData, options },
      aggregateId ?? jobId,
    );
  }
}

/** Fired by the workflow at each step boundary to report incremental progress. */
export class CodegenProgressEvent extends DomainEvent<CodegenProgressEventData> {
  constructor(
    jobId: string,
    step: string,
    progress: number,
    message: string,
    aggregateId?: string,
  ) {
    super(
      "codegen.progress",
      uuidv4(),
      { jobId, step, progress, message },
      aggregateId ?? jobId,
    );
  }
}

/** Fired when all manifests have been generated and validated successfully. */
export class CodegenCompletedEvent extends DomainEvent<CodegenCompletedEventData> {
  constructor(
    jobId: string,
    manifests: unknown[],
    graphId: string,
    processingTime: number,
    aggregateId?: string,
  ) {
    super(
      "codegen.completed",
      uuidv4(),
      { jobId, manifests, graphId, processingTime },
      aggregateId ?? jobId,
    );
  }
}

/**
 * Fired when the workflow fails at any step.
 * `retryable` signals to the caller whether automatic retry is safe.
 */
export class CodegenFailedEvent extends DomainEvent<CodegenFailedEventData> {
  constructor(
    jobId: string,
    error: string,
    step?: string,
    retryable?: boolean,
    aggregateId?: string,
  ) {
    super(
      "codegen.failed",
      uuidv4(),
      { jobId, error, step, retryable },
      aggregateId ?? jobId,
    );
  }
}
