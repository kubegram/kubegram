/**
 * Generic TTL cache wrapper using Redis
 * Port of app/state/cache.py
 */

import { redisClient } from './redis';

// Type for cache value - can be any JSON-serializable value
export type CacheValue = any;

/**
 * Generic state cache with TTL support
 * Replaces Python StateCache with TypeScript generic class
 */
export class StateCache<T = CacheValue> {
  private readonly redis = redisClient.getClient();
  private readonly defaultTtl: number;

  constructor(defaultTtl: number = 30) {
    this.defaultTtl = defaultTtl;
  }

  /**
   * Set a value in the cache with a TTL
   * 
   * @param key - The cache key
   * @param value - The value to cache (any JSON-serializable value)
   * @param ttl - Time to live in seconds (default: 30)
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const expirationTtl = ttl ?? this.defaultTtl;
      
      await this.redis.set(key, serializedValue, 'EX', expirationTtl);
    } catch (error) {
      console.error(`Failed to set cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value from the cache
   * 
   * @param key - The cache key
   * @returns - The deserialized value or null if not found
   */
  async get(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      
      if (data === null) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Failed to get cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get a value from the cache with type guard
   * 
   * @param key - The cache key
   * @param typeGuard - Function to validate the type
   * @returns - The validated value or null if not found/invalid
   */
  async getWithGuard<K extends T>(
    key: string, 
    typeGuard: (value: any) => value is K
  ): Promise<K | null> {
    const value = await this.get(key);
    
    if (value === null) {
      return null;
    }

    return typeGuard(value) ? value : null;
  }

  /**
   * Delete a value from the cache
   * 
   * @param key - The cache key
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Failed to delete cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in the cache
   * 
   * @param key - The cache key
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result > 0;
    } catch (error) {
      console.error(`Failed to check cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set TTL for an existing key
   * 
   * @param key - The cache key
   * @param ttl - Time to live in seconds
   */
  async setTtl(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result > 0;
    } catch (error) {
      console.error(`Failed to set TTL for cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   * 
   * @param key - The cache key
   */
  async getTtl(key: string): Promise<number> {
    try {
      const result = await this.redis.ttl(key);
      return result;
    } catch (error) {
      console.error(`Failed to get TTL for cache key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Clear all cache entries (dangerous!)
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Get multiple values from cache
   * 
   * @param keys - Array of cache keys
   */
  async mget(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      
      return values.map(value => {
        if (value === null) {
          return null;
        }
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Failed to mget cache keys:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values in cache
   * 
   * @param entries - Array of [key, value, ttl?] tuples
   */
  async mset(
    entries: Array<[string, T, number?]>
  ): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const [key, value, ttl] of entries) {
        const serializedValue = JSON.stringify(value);
        const expirationTtl = ttl ?? this.defaultTtl;
        
        pipeline.set(key, serializedValue, 'EX', expirationTtl);
      }
      
      await pipeline.exec();
    } catch (error) {
      console.error('Failed to mset cache entries:', error);
      throw error;
    }
  }
}

// Export typed cache instances for common use cases
export const graphCache = new StateCache(300); // 5 minutes
export const codegenCache = new StateCache(600); // 10 minutes
export const jobCache = new StateCache(3600); // 1 hour