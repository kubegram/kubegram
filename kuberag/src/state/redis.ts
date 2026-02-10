/**
 * Redis client singleton using ioredis
 * Port of app/state/redis_client.py
 */

import Redis from 'ioredis';
import { redisConfig } from '../config';

/**
 * Redis client singleton
 * Replaces Python redis.asyncio client with ioredis
 */
export class RedisClient {
  private static instance: RedisClient | null = null;
  private client: Redis | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * Get or create Redis client
   */
  getClient(): Redis {
    if (!this.client) {
      console.info(`Creating Redis client at ${redisConfig.host}:${redisConfig.port}/${redisConfig.db}`);
      
      this.client = new Redis(redisConfig.url, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        // Additional options for production
        enableOfflineQueue: false,
        connectTimeout: 30000,
        commandTimeout: 5000,
      });

      // Event handlers
      this.client.on('connect', () => {
        console.info('Redis client connected');
      });

      this.client.on('error', (error) => {
        console.error('Redis client error:', error);
      });

      this.client.on('close', () => {
        console.warn('Redis client connection closed');
      });

      this.client.on('reconnecting', () => {
        console.info('Redis client reconnecting');
      });
    }

    return this.client;
  }

  /**
   * Connect to Redis (required because lazyConnect is true)
   */
  async connect(): Promise<void> {
    const client = this.getClient();
    if (client.status === 'ready') return;
    await client.connect();
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  /**
   * Test Redis connection
   */
  async ping(): Promise<string> {
    const client = this.getClient();
    return await client.ping();
  }

  /**
   * Get Redis connection info
   */
  getConnectionInfo(): { host: string; port: number; db: number; connected: boolean } {
    return {
      host: redisConfig.host,
      port: redisConfig.port,
      db: redisConfig.db,
      connected: this.client?.status === 'ready' || false,
    };
  }
}

// Export singleton instance
export const redisClient = RedisClient.getInstance();
