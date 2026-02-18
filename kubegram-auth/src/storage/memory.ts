import type { AuthStorage } from '../types';

export interface MemoryStorageOptions {
  maxSize?: number;
}

export function createMemoryStorage(options?: MemoryStorageOptions): AuthStorage {
  const cache = new Map<string, { value: string; expiry: number }>();
  const maxSize = options?.maxSize ?? 1000;

  return {
    async get(key: string): Promise<string | null> {
      const item = cache.get(key);
      if (!item) return null;
      if (item.expiry > 0 && Date.now() > item.expiry) {
        cache.delete(key);
        return null;
      }
      return item.value;
    },

    async set(key: string, value: string, ttl?: number): Promise<void> {
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        if (firstKey) cache.delete(firstKey);
      }
      cache.set(key, {
        value,
        expiry: ttl ? Date.now() + ttl : 0,
      });
    },

    async delete(key: string): Promise<void> {
      cache.delete(key);
    },
  };
}

export const MemoryStorage = createMemoryStorage;
