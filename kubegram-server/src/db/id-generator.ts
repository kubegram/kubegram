import type { Redis } from 'ioredis';

/**
 * Sequential ID generator for serial-PK entities in cache mode.
 *
 * In single-node mode (no Redis): uses an in-memory counter per entity type.
 * In HA mode (Redis provided): uses Redis INCR for cross-instance consistency.
 */
export class IdGenerator {
  private static counters = new Map<string, number>();

  static nextId(entityType: string): number {
    const current = IdGenerator.counters.get(entityType) ?? 0;
    const next = current + 1;
    IdGenerator.counters.set(entityType, next);
    return next;
  }

  static async nextIdAsync(
    entityType: string,
    redis?: Redis | null,
  ): Promise<number> {
    if (redis) {
      return Number(await redis.incr(`kubegram:id:${entityType}`));
    }
    return IdGenerator.nextId(entityType);
  }
}
