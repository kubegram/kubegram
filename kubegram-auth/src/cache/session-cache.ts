export interface SessionCacheOptions {
  maxSize?: number;
  ttl?: number;
  storage?: SessionCacheStorage;
}

export interface SessionCacheStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

interface CacheEntry {
  value: string;
  expiry?: number;
}

export class SessionCache {
  private cache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = [];
  private storage?: SessionCacheStorage;
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(options: SessionCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.ttl = options.ttl ?? 300000;
    this.storage = options.storage;
  }

  private isExpired(entry: CacheEntry): boolean {
    return entry.expiry !== undefined && Date.now() >= entry.expiry;
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;
    const lruKey = this.accessOrder[0];
    if (lruKey) {
      this.cache.delete(lruKey);
    }
    this.accessOrder.shift();
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  async get(key: string): Promise<string | null> {
    const cached = this.cache.get(key);
    if (cached) {
      if (this.isExpired(cached)) {
        this.cache.delete(key);
        this.accessOrder = this.accessOrder.filter(k => k !== key);
        if (this.storage) {
          await this.storage.delete(key).catch(() => {});
        }
        return null;
      }
      this.updateAccessOrder(key);
      return cached.value;
    }

    if (this.storage) {
      try {
        const value = await this.storage.get(key);
        if (value) {
          const entry: CacheEntry = { value, expiry: Date.now() + this.ttl };
          if (this.cache.size >= this.maxSize) {
            this.evictLRU();
          }
          this.cache.set(key, entry);
          this.updateAccessOrder(key);
          return value;
        }
      } catch {
        // Ignore storage errors
      }
    }

    return null;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const entry: CacheEntry = {
      value,
      expiry: ttl ? Date.now() + ttl : Date.now() + this.ttl,
    };

    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.updateAccessOrder(key);

    if (this.storage) {
      try {
        await this.storage.set(key, value, ttl);
      } catch {
        // Ignore storage errors
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);

    if (this.storage) {
      try {
        await this.storage.delete(key);
      } catch {
        // Ignore storage errors
      }
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder = [];
  }
}

export function createSessionCache(options?: SessionCacheOptions): SessionCache {
  return new SessionCache(options);
}
