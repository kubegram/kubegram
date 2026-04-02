/**
 * @stub StateManager — placeholder awaiting implementation.
 *
 * Intended to provide a higher-level key/value abstraction over Redis,
 * backed by @kubegram/events EventCache with TTL management and
 * cache invalidation. Currently all workflow state is managed directly by
 * RedisCheckpointer. This class will wrap that when implemented.
 *
 * Do not use this class — use RedisCheckpointer directly instead.
 */

export interface StateConfig {
  redisHost?: string;
  redisPort?: number;
  redisDb?: number;
}

export class StateManager {
  private config: StateConfig;

  constructor(config: StateConfig = {}) {
    this.config = config;
  }

  async get(key: string): Promise<any> {
    return null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {}
}

export const stateManager = new StateManager();
