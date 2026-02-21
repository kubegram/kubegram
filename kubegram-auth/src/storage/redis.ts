import type { AuthStorage } from '../types';

export interface RedisStorageOptions {
  prefix?: string;
  defaultTtl?: number;
}

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<void>;
  del(key: string): Promise<number>;
}

export function createRedisStorage(
  redis: RedisClient,
  options?: RedisStorageOptions
): AuthStorage {
  const prefix = options?.prefix ?? 'openauth:';
  const defaultTtl = options?.defaultTtl ?? 86400;

  return {
    async get(key: string): Promise<string | null> {
      return redis.get(`${prefix}${key}`);
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      await redis.set(
        `${prefix}${key}`,
        value,
        'EX',
        ttl ?? defaultTtl
      );
    },

    async delete(key: string): Promise<void> {
      await redis.del(`${prefix}${key}`);
    },
  };
}

export const RedisStorage = createRedisStorage;
