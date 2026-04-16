import { DomainEvent } from '@kubegram/events';

/**
 * Concrete DomainEvent subclass that wraps any database entity record.
 *
 * Event ID convention:
 *   company:<uuid>         organizations:<n>      team:<n>
 *   user:<n>               project:<n>            job:<uuid>
 *   artifact:<n>           certificate:<n>        llmtoken:<n>
 *   operatortoken:<n>      operator:<n>
 *
 * aggregateId is set to the parent entity's event ID for FK-scoped tables,
 * enabling getEvents({ aggregateId }) lookups.
 */
export class EntityRecord<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends DomainEvent<T> {
  constructor(
    entityType: string,
    eventId: string,
    data: T,
    aggregateId?: string,
  ) {
    super(`kubegram.entity.${entityType}`, eventId, data, aggregateId);
  }
}
