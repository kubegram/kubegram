/**
 * Options for creating a SessionCache instance.
 * 
 * @property maxSize - Maximum number of entries in L1 memory cache (default: 1000)
 * @property ttl - Default TTL for cache entries in milliseconds (default: 300000 = 5 min)
 * @property storage - Optional L2 persistent storage adapter
 */
export interface SessionCacheOptions {
  maxSize?: number;
  ttl?: number;
  storage?: SessionCacheStorage;
}

/**
 * Interface for L2 persistent storage.
 * Implement this to use custom storage backends (Redis, database, etc.)
 * 
 * @property get - Retrieve a value by key
 * @property set - Store a value with optional TTL (in seconds)
 * @property delete - Remove a value by key
 */
export interface SessionCacheStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Internal cache entry structure.
 * @internal
 */
interface CacheEntry {
  value: string;
  expiry?: number;
}

/**
 * Two-layer session cache with L1 (memory) and optional L2 (storage).
 * 
 * Implements LRU eviction policy for memory cache and provides
 * optional write-through to persistent storage.
 * 
 * @example
 * ```typescript
 * const cache = createSessionCache({
 *   maxSize: 500,
 *   ttl: 60000,
 *   storage: {
 *     get: async (key) => redis.get(key),
 *     set: async (key, value, ttl) => redis.set(key, value, 'EX', ttl),
 *     delete: async (key) => redis.del(key)
 *   }
 * });
 * 
 * await cache.set('session:abc', '{"user":"123"}', 3600);
 * const data = await cache.get('session:abc');
 * await cache.delete('session:abc');
 * ```
 */
export class SessionCache {
  /** L1: In-memory cache map */
  private cache: Map<string, CacheEntry> = new Map();
  
  /** L1: Access order for LRU eviction (oldest first) */
  private accessOrder: string[] = [];
  
  /** L2: Optional persistent storage */
  private storage?: SessionCacheStorage;
  
  /** L1: Maximum entries before eviction */
  private readonly maxSize: number;
  
  /** L1: Default TTL in milliseconds */
  private readonly ttl: number;

  /**
   * Creates a new SessionCache instance.
   * 
   * @param options - Configuration options
   */
  constructor(options: SessionCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.ttl = options.ttl ?? 300000;
    this.storage = options.storage;
  }

  /**
   * Check if a cache entry has expired.
   * @internal
   */
  private isExpired(entry: CacheEntry): boolean {
    return entry.expiry !== undefined && Date.now() >= entry.expiry;
  }

  /**
   * Evict the least recently used entry from L1 cache.
   * @internal
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;
    const lruKey = this.accessOrder[0];
    if (lruKey) {
      this.cache.delete(lruKey);
    }
    this.accessOrder.shift();
  }

  /**
   * Update access order for LRU tracking.
   * Moves key to end of list (most recently used).
   * @internal
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Retrieve a value from cache.
   * 
   * Checks L1 memory first, then falls back to L2 storage.
   * Updates access order on cache hit.
   * 
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  async get(key: string): Promise<string | null> {
    // L1: Check memory cache
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

    // L2: Check persistent storage
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

  /**
   * Store a value in cache.
   * 
   * Writes to L1 immediately. If L2 storage is configured,
   * also writes through to persistent storage.
   * 
   * @param key - Cache key
   * @param value - Value to store (JSON string)
   * @param ttl - Optional TTL in milliseconds (uses default if not provided)
   */
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

    // Write-through to L2 if configured
    if (this.storage) {
      try {
        await this.storage.set(key, value, ttl);
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Delete a value from cache.
   * 
   * Removes from both L1 and L2 (if configured).
   * 
   * @param key - Cache key to delete
   */
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

  /**
   * Clear all entries from L1 cache.
   * Does not clear L2 storage.
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder = [];
  }
}

/**
 * Factory function to create a SessionCache instance.
 * 
 * @param options - Configuration options
 * @returns Configured SessionCache
 * 
 * @example
 * ```typescript
 * const cache = createSessionCache({ maxSize: 500, ttl: 60000 });
 * ```
 */
export function createSessionCache(options?: SessionCacheOptions): SessionCache {
  return new SessionCache(options);
}
