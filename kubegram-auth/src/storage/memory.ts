import type { StorageAdapter } from "../types";

const SEPERATOR = String.fromCharCode(0x1f);

interface CacheEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  expiry: number;
}

export interface MemoryStorageOptions {
  maxSize?: number;
}

export function createMemoryStorage(
  options?: MemoryStorageOptions,
): StorageAdapter {
  const cache = new Map<string, CacheEntry>();
  const maxSize = options?.maxSize ?? 1000;

  function joinKey(key: string[]): string {
    return key.join(SEPERATOR);
  }

  function splitKey(key: string): string[] {
    return key.split(SEPERATOR);
  }

  function encode(key: string[]): string[] {
    return key.map((k) => k.replaceAll(SEPERATOR, ""));
  }

  async function get(
    key: string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<Record<string, any> | undefined> {
    const item = cache.get(joinKey(encode(key)));
    if (!item) return undefined;
    if (item.expiry > 0 && Date.now() > item.expiry) {
      cache.delete(joinKey(encode(key)));
      return undefined;
    }
    return { [joinKey(encode(key))]: item.value };
  }

  async function set(
    key: string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    expiry?: Date,
  ): Promise<void> {
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(joinKey(encode(key)), {
      value,
      expiry: expiry ? expiry.getTime() : 0,
    });
  }

  async function remove(key: string[]): Promise<void> {
    cache.delete(joinKey(encode(key)));
  }

  async function* scan(
    prefix: string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): AsyncIterable<[string[], any]> {
    const prefixKey = joinKey(encode(prefix));
    const now = Date.now();

    for (const key of cache.keys()) {
      if (key.startsWith(prefixKey)) {
        const entry = cache.get(key);
        if (entry && (entry.expiry === 0 || entry.expiry > now)) {
          yield [splitKey(key), entry.value];
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

export const MemoryStorage = createMemoryStorage;
