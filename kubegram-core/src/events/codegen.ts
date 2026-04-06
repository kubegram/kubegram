/**
 * Typed domain events for the code generation workflow.
 *
 * These classes extend DomainEvent and can be published directly to EventBus.
 */

import { v4 as uuidv4 } from "uuid";

/** JSON representation of a domain event */
export interface DomainEventJSON {
  id: string;
  type: string;
  occurredOn: string;
  version: number;
  aggregateId?: string;
  metadata?: Record<string, unknown>;
}

/** Base interface for all domain events */
export interface DomainEvent {
  id: string;
  type: string;
  occurredOn: Date;
  version: number;
  aggregateId?: string;
  metadata?: Record<string, unknown>;
  toJSON(): DomainEventJSON;
}

/** Abstract base class for all domain events */
abstract class BaseDomainEvent implements DomainEvent {
  id: string;
  type: string;
  occurredOn: Date;
  version: number;
  aggregateId?: string;
  metadata?: Record<string, unknown>;

  constructor(
    type: string,
    aggregateId?: string,
    metadata?: Record<string, unknown>,
  ) {
    this.id = uuidv4();
    this.type = type;
    this.occurredOn = new Date();
    this.version = 1;
    this.aggregateId = aggregateId;
    this.metadata = metadata;
  }

  toJSON(): DomainEventJSON {
    return {
      id: this.id,
      type: this.type,
      occurredOn: this.occurredOn.toISOString(),
      version: this.version,
      aggregateId: this.aggregateId,
      metadata: this.metadata,
    };
  }
}

/** Fired when a codegen job is accepted and enters the queue. */
export class CodegenStartedEvent extends BaseDomainEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly graphId: string,
    public readonly graphData: unknown,
    public readonly options: { provider?: string; model?: string } = {},
    aggregateId?: string,
  ) {
    super("codegen.started", aggregateId ?? jobId, {
      jobId,
      userId,
      graphId,
      options,
    });
  }

  override toJSON(): DomainEventJSON {
    return {
      ...super.toJSON(),
      jobId: this.jobId,
      userId: this.userId,
      graphId: this.graphId,
      graphData: this.graphData,
      options: this.options,
    } as DomainEventJSON;
  }
}

/** Fired by the workflow at each step boundary to report incremental progress. */
export class CodegenProgressEvent extends BaseDomainEvent {
  constructor(
    public readonly jobId: string,
    public readonly step: string,
    public readonly progress: number,
    public readonly message: string,
    aggregateId?: string,
  ) {
    super("codegen.progress", aggregateId ?? jobId, {
      jobId,
      step,
      progress,
      message,
    });
  }

  override toJSON(): DomainEventJSON {
    return {
      ...super.toJSON(),
      jobId: this.jobId,
      step: this.step,
      progress: this.progress,
      message: this.message,
    } as DomainEventJSON;
  }
}

/** Fired when all manifests have been generated and validated successfully. */
export class CodegenCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly jobId: string,
    public readonly manifests: unknown[],
    public readonly graphId: string,
    public readonly processingTime: number,
    aggregateId?: string,
  ) {
    super("codegen.completed", aggregateId ?? jobId, {
      jobId,
      graphId,
      manifestCount: manifests.length,
      processingTime,
    });
  }

  override toJSON(): DomainEventJSON {
    return {
      ...super.toJSON(),
      jobId: this.jobId,
      manifests: this.manifests,
      graphId: this.graphId,
      processingTime: this.processingTime,
    } as DomainEventJSON;
  }
}

/**
 * Fired when the workflow fails at any step.
 * `retryable` signals to the caller whether automatic retry is safe.
 */
export class CodegenFailedEvent extends BaseDomainEvent {
  constructor(
    public readonly jobId: string,
    public readonly error: string,
    public readonly step?: string,
    public readonly retryable?: boolean,
    aggregateId?: string,
  ) {
    super("codegen.failed", aggregateId ?? jobId, {
      jobId,
      step,
      error,
      retryable,
    });
  }

  override toJSON(): DomainEventJSON {
    return {
      ...super.toJSON(),
      jobId: this.jobId,
      error: this.error,
      step: this.step,
      retryable: this.retryable,
    } as DomainEventJSON;
  }
}
