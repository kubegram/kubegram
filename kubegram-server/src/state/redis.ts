/**
 * Redis client singleton using ioredis
 * Only used when ENABLE_HA=true for cross-instance session sharing
 */

import Redis from 'ioredis';
import config from '../config/env';
import logger from '../utils/logger';

export class RedisClient {
  private static instance: RedisClient | null = null;
  private client: Redis | null = null;

  private constructor() {}

  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  getClient(): Redis {
    if (!this.client) {
      const url = config.redisPassword
        ? `redis://:${config.redisPassword}@${config.redisHost}:${config.redisPort}/${config.redisDb}`
        : `redis://${config.redisHost}:${config.redisPort}/${config.redisDb}`;

      logger.info('Creating Redis client', { host: config.redisHost, port: config.redisPort, db: config.redisDb });

      this.client = new Redis(url, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableOfflineQueue: false,
        connectTimeout: 30000,
        commandTimeout: 5000,
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error', { error });
      });

      this.client.on('close', () => {
        logger.warn('Redis client connection closed');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
      });
    }

    return this.client;
  }

  async connect(): Promise<void> {
    const client = this.getClient();
    if (client.status === 'ready') return;
    await client.connect();
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

export const redisClient = RedisClient.getInstance();
