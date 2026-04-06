/**
 * WorkflowPubSub — adapter that bridges BaseWorkflow's pub/sub interface
 * to the @kubegram/events EventBus.
 *
 * BaseWorkflow calls: pubsub.publish(channel, workflowEvent)
 * EventBus expects:  bus.publish(domainEvent)
 *
 * This adapter converts WorkflowEvent → DomainEvent on the fly.
 */

import { v4 as uuidv4 } from "uuid";
import { EventBus } from "@kubegram/events";
import type { WorkflowEvent } from "../types/workflow.js";

export class WorkflowPubSub {
  constructor(private readonly eventBus: EventBus) {}

  /**
   * Publish a WorkflowEvent through the EventBus.
   *
   * The DomainEvent type field is set to `{channel}.{event.type}` so that
   * subscribers can listen on fine-grained event types
   * (e.g. "codegen:abc123.completed") or wildcard by prefix.
   */
  async publish(channel: string, event: WorkflowEvent): Promise<void> {
    // Event type follows the convention "{channel}.{eventType}", e.g.:
    //   "codegen:abc-123.completed"
    // Subscribers can match on exact type or use prefix-based routing depending
    // on the EventBus implementation from @kubegram/events.
    await this.eventBus.publish({
      id: uuidv4(),
      type: `${channel}.${event.type}`,
      occurredOn: new Date(event.timestamp),
      version: 1,
      aggregateId: event.workflowId,
      metadata: {
        channel,
        step: event.step,
        error: event.error,
        ...event.metadata,
      },
      // Cast required because WorkflowEvent maps to a subset of DomainEvent fields.
      // The EventBus accepts any DomainEvent-compatible shape at runtime.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }
}
