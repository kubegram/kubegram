/**
 * Typed domain events for the infrastructure planning workflow.
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

/** Fired when a planning job is accepted and enters the queue. */
export class PlanStartedEvent extends BaseDomainEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly graphId: string,
    public readonly planningType: string,
    aggregateId?: string,
  ) {
    super("plan.started", aggregateId ?? jobId, {
      jobId,
      userId,
      graphId,
      planningType,
    });
  }

  override toJSON(): DomainEventJSON {
    return {
      ...super.toJSON(),
      jobId: this.jobId,
      userId: this.userId,
      graphId: this.graphId,
      planningType: this.planningType,
    } as DomainEventJSON;
  }
}

/** Fired by the workflow at each step boundary to report incremental progress. */
export class PlanProgressEvent extends BaseDomainEvent {
  constructor(
    public readonly jobId: string,
    public readonly step: string,
    public readonly progress: number,
    public readonly message: string,
    aggregateId?: string,
  ) {
    super("plan.progress", aggregateId ?? jobId, {
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

/** Fired when the infrastructure plan has been generated and validated successfully. */
export class PlanCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly jobId: string,
    public readonly plan: unknown,
    public readonly processingTime: number,
    aggregateId?: string,
  ) {
    super("plan.completed", aggregateId ?? jobId, { jobId, processingTime });
  }

  override toJSON(): DomainEventJSON {
    return {
      ...super.toJSON(),
      jobId: this.jobId,
      plan: this.plan,
      processingTime: this.processingTime,
    } as DomainEventJSON;
  }
}

/** Fired when the planning workflow fails at any step. */
export class PlanFailedEvent extends BaseDomainEvent {
  constructor(
    public readonly jobId: string,
    public readonly error: string,
    aggregateId?: string,
  ) {
    super("plan.failed", aggregateId ?? jobId, { jobId, error });
  }

  override toJSON(): DomainEventJSON {
    return {
      ...super.toJSON(),
      jobId: this.jobId,
      error: this.error,
    } as DomainEventJSON;
  }
}
