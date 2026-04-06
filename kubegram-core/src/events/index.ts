/**
 * Domain events for kubegram-core.
 *
 * Re-exports all event classes and the base DomainEvent interfaces
 * from both codegen and plan modules.
 */

// Base domain event interfaces (from codegen module - shared definition)
export type { DomainEvent, DomainEventJSON } from './codegen.js';

// Codegen events
export {
  CodegenStartedEvent,
  CodegenProgressEvent,
  CodegenCompletedEvent,
  CodegenFailedEvent,
} from './codegen.js';

// Plan events
export {
  PlanStartedEvent,
  PlanProgressEvent,
  PlanCompletedEvent,
  PlanFailedEvent,
} from './plan.js';
