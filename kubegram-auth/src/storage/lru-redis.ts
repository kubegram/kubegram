import type { AuthStorage } from '../types';

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<void>;
  del(key: string): Promise<number>;
  scanStream(options: { match: string; count: number }): AsyncIterable<string[]>;
  mget(...keys: string[]): Promise<(string | null)[]>;
}

interface LruRedisStorageOptions {
  redis: RedisClient;
  keyPrefix?: string;
  lruMax?: number;
}

interface CacheEntry {
  value: string;
  expiry?: number;
}

export function createLruRedisStorage(opts: LruRedisStorageOptions): AuthStorage {
  const {
    redis,
    keyPrefix = 'openauth',
    lruMax = 5000,
  } = opts;

  const lru = new Map<string, CacheEntry>();

  function redisKey(key: string): string {
    return `${keyPrefix}:${key}`;
  }

  function isExpired(entry: CacheEntry): boolean {
    return entry.expiry !== undefined && Date.now() >= entry.expiry;
  }

  return {
    async get(key: string): Promise<string | null> {
      const cached = lru.get(key);
      if (cached) {
        if (isExpired(cached)) {
          lru.delete(key);
          await redis.del(redisKey(key)).catch(() => {});
          return null;
        }
        return cached.value;
      }

      const raw = await redis.get(redisKey(key));
      if (!raw) return null;

      try {
        const entry: CacheEntry = JSON.parse(raw);
        if (isExpired(entry)) {
          await redis.del(redisKey(key)).catch(() => {});
          return null;
        }
        lru.set(key, entry);
        return entry.value;
      } catch {
        return null;
      }
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      const entry: CacheEntry = {
        value,
        expiry: ttl ? Date.now() + ttl : undefined,
      };

      if (lru.size >= lruMax && lru.size > 0) {
        const firstKey = lru.keys().next().value;
        if (firstKey) lru.delete(firstKey);
      }
      lru.set(key, entry);

      const serialized = JSON.stringify(entry);
      if (ttl) {
        await redis.set(redisKey(key), serialized, 'EX', ttl);
      } else {
        await redis.set(redisKey(key), serialized);
      }
    },

    async delete(key: string): Promise<void> {
      lru.delete(key);
      await redis.del(redisKey(key));
    },
  };
}
