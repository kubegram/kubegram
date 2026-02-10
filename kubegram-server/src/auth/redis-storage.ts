/**
 * Write-through cache StorageAdapter for OpenAuth
 * L1: LRU in-memory cache (fast local reads)
 * L2: Redis (persistent, shared across instances in HA mode)
 */

import type Redis from 'ioredis';
import { LRUCache } from 'lru-cache';
import { joinKey, splitKey, type StorageAdapter } from '@openauthjs/openauth/storage/storage';

interface RedisLruStorageOptions {
  /** ioredis client instance */
  redis: Redis;
  /** Redis key prefix (default: 'openauth') */
  keyPrefix?: string;
  /** Max LRU cache entries (default: 5000) */
  lruMax?: number;
  /** LRU entry TTL in ms (default: 300_000 = 5 min) */
  lruTtlMs?: number;
}

interface CacheEntry {
  value: Record<string, any>;
  expiry?: number; // epoch ms
}

export function RedisLruStorage(opts: RedisLruStorageOptions): StorageAdapter {
  const {
    redis,
    keyPrefix = 'openauth',
    lruMax = 5000,
    lruTtlMs = 300_000,
  } = opts;

  const lru = new LRUCache<string, CacheEntry>({
    max: lruMax,
    ttl: lruTtlMs,
  });

  function redisKey(key: string[]): string {
    return `${keyPrefix}:${joinKey(key)}`;
  }

  function isExpired(entry: CacheEntry): boolean {
    return entry.expiry !== undefined && Date.now() >= entry.expiry;
  }

  return {
    async get(key: string[]): Promise<Record<string, any> | undefined> {
      const joined = joinKey(key);

      // L1: check LRU
      const cached = lru.get(joined);
      if (cached) {
        if (isExpired(cached)) {
          lru.delete(joined);
          // Also clean up Redis
          await redis.del(redisKey(key)).catch(() => {});
          return undefined;
        }
        return cached.value;
      }

      // L2: check Redis
      const raw = await redis.get(redisKey(key));
      if (!raw) return undefined;

      try {
        const entry: CacheEntry = JSON.parse(raw);
        if (isExpired(entry)) {
          await redis.del(redisKey(key)).catch(() => {});
          return undefined;
        }
        // Populate L1
        lru.set(joined, entry);
        return entry.value;
      } catch {
        return undefined;
      }
    },

    async set(key: string[], value: any, expiry?: Date): Promise<void> {
      const joined = joinKey(key);
      const entry: CacheEntry = {
        value,
        expiry: expiry ? expiry.getTime() : undefined,
      };

      // L1: write to LRU
      lru.set(joined, entry);

      // L2: write to Redis
      const serialized = JSON.stringify(entry);
      if (expiry) {
        await redis.set(redisKey(key), serialized, 'PXAT', expiry.getTime());
      } else {
        await redis.set(redisKey(key), serialized);
      }
    },

    async remove(key: string[]): Promise<void> {
      const joined = joinKey(key);

      // L1: delete from LRU
      lru.delete(joined);

      // L2: delete from Redis
      await redis.del(redisKey(key));
    },

    async *scan(prefix: string[]): AsyncIterable<[string[], any]> {
      const rPrefix = redisKey(prefix);
      const now = Date.now();

      // Use SCAN to iterate matching keys without blocking
      const stream = redis.scanStream({
        match: `${rPrefix}*`,
        count: 100,
      });

      for await (const keys of stream) {
        if (!keys.length) continue;

        const values = await redis.mget(...(keys as string[]));
        for (let i = 0; i < keys.length; i++) {
          const raw = values[i];
          if (!raw) continue;

          try {
            const entry: CacheEntry = JSON.parse(raw);
            if (entry.expiry && now >= entry.expiry) continue;

            // Strip the keyPrefix + ':' from the Redis key to get the joined OpenAuth key
            const stripped = (keys[i] as string).slice(keyPrefix.length + 1);
            yield [splitKey(stripped), entry.value];
          } catch {
            continue;
          }
        }
      }
    },
  };
}
