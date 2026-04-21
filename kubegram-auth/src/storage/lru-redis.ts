import type { StorageAdapter } from "../types";

const SEPERATOR = String.fromCharCode(0x1f);

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<void>;
  del(key: string): Promise<number>;
  scanStream(options: {
    match: string;
    count: number;
  }): AsyncIterable<string[]>;
  mget(...keys: string[]): Promise<(string | null)[]>;
}

interface LruRedisStorageOptions {
  redis: RedisClient;
  keyPrefix?: string;
  lruMax?: number;
}

interface CacheEntry {
  value: any;
  expiry?: number;
}

export function createLruRedisStorage(
  opts: LruRedisStorageOptions,
): StorageAdapter {
  const { redis, keyPrefix = "openauth", lruMax = 5000 } = opts;

  const lru = new Map<string, CacheEntry>();

  function redisKey(key: string[]): string {
    return `${keyPrefix}:${key.join(SEPERATOR)}`;
  }

  function encode(key: string[]): string[] {
    return key.map((k) => k.replaceAll(SEPERATOR, ""));
  }

  function isExpired(entry: CacheEntry): boolean {
    return entry.expiry !== undefined && Date.now() >= entry.expiry;
  }

  async function get(key: string[]): Promise<Record<string, any> | undefined> {
    const encoded = encode(key);
    const joinedKey = encoded.join(SEPERATOR);
    const cached = lru.get(joinedKey);
    if (cached) {
      if (isExpired(cached)) {
        lru.delete(joinedKey);
        await redis.del(redisKey(encoded)).catch(() => {});
        return undefined;
      }
      return { [joinedKey]: cached.value };
    }

    const raw = await redis.get(redisKey(encoded));
    if (!raw) return undefined;

    try {
      const entry: CacheEntry = JSON.parse(raw);
      if (isExpired(entry)) {
        await redis.del(redisKey(encoded)).catch(() => {});
        return undefined;
      }
      lru.set(joinedKey, entry);
      return { [joinedKey]: entry.value };
    } catch {
      return undefined;
    }
  }

  async function set(key: string[], value: any, expiry?: Date): Promise<void> {
    const encoded = encode(key);
    const joinedKey = encoded.join(SEPERATOR);
    const entry: CacheEntry = {
      value,
      expiry: expiry ? expiry.getTime() : undefined,
    };

    if (lru.size >= lruMax && lru.size > 0) {
      const firstKey = lru.keys().next().value;
      if (firstKey) lru.delete(firstKey);
    }
    lru.set(joinedKey, entry);

    const serialized = JSON.stringify(entry);
    if (expiry) {
      const ttl = Math.ceil((expiry.getTime() - Date.now()) / 1000);
      await redis.set(redisKey(encoded), serialized, "EX", ttl);
    } else {
      await redis.set(redisKey(encoded), serialized);
    }
  }

  async function remove(key: string[]): Promise<void> {
    const encoded = encode(key);
    const joinedKey = encoded.join(SEPERATOR);
    lru.delete(joinedKey);
    await redis.del(redisKey(encoded));
  }

  async function* scan(
    prefix: string[],
  ): AsyncIterable<[string[], any]> {
    const encodedPrefix = encode(prefix);
    const matchPattern = `${keyPrefix}:${encodedPrefix.join(SEPERATOR)}*`;

    for await (const keys of redis.scanStream({ match: matchPattern, count: 100 })) {
      const values = await redis.mget(...keys);
      for (let i = 0; i < keys.length; i++) {
        const raw = values[i];
        if (!raw) continue;

        try {
          const entry: CacheEntry = JSON.parse(raw);
          if (!isExpired(entry)) {
            const splitKey = keys[i].slice(keyPrefix.length + 1).split(SEPERATOR);
            yield [splitKey, entry.value];
          }
        } catch {
          continue;
        }
      }
    }
  }

  return {
    get,
    set,
    remove,
    scan,
  };
}