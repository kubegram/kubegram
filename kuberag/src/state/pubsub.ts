/**
 * Generic pub/sub wrapper using Redis
 * Port of app/state/pubsub.py
 */

import { redisClient } from './redis';

/**
 * Generic pub/sub class with publish/subscribe support
 * Replaces Python PubSub with TypeScript generic class
 */
export class PubSub<T = unknown> {
  private readonly redis = redisClient.getClient();
  private subscriber: any = null; // ioredis duplicate used for subscriptions

  /**
   * Publish a message to a channel
   *
   * @param channel - The channel to publish to
   * @param message - The message to publish (any JSON-serializable value)
   */
  async publish(channel: string, message: T): Promise<void> {
    try {
      const serializedMessage = JSON.stringify(message);
      await this.redis.publish(channel, serializedMessage);
    } catch (error) {
      console.error(`Failed to publish to channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a channel and return an async iterator
   *
   * @param channel - The channel to subscribe to
   * @param typeGuard - Optional type guard function for message validation
   * @returns - Async iterator yielding deserialized messages
   */
  async subscribe(
    channel: string,
    typeGuard?: (value: any) => value is T
  ): Promise<AsyncIterableIterator<T>> {
    if (!this.subscriber) {
      this.subscriber = this.redis.duplicate();
    }

    await this.subscriber.subscribe(channel);

    const messageQueue: T[] = [];
    let resolve: ((value: IteratorResult<T>) => void) | null = null;
    let done = false;

    // Message handler
    const messageHandler = (redisChannel: string, data: Buffer) => {
      if (redisChannel !== channel) return;

      try {
        const parsedMessage = JSON.parse(data.toString()) as T;

        // Apply type guard if provided
        if (typeGuard && !typeGuard(parsedMessage)) {
          console.warn(`Message failed type validation on channel ${channel}`);
          return;
        }

        if (resolve) {
          resolve({ value: parsedMessage, done: false });
          resolve = null;
        } else {
          messageQueue.push(parsedMessage);
        }
      } catch (error) {
        console.error(`Error deserializing message on channel ${channel}:`, error);
      }
    };

    // Set up message listener
    this.subscriber.on('message', messageHandler);

    // Capture cleanup so iterator methods don't lose `this` binding
    const cleanup = async () => {
      this.subscriber?.off('message', messageHandler);
      await this.unsubscribe(channel);
    };

    // Create async iterator
    const iterator: AsyncIterableIterator<T> = {
      async next(): Promise<IteratorResult<T>> {
        if (done) {
          return { value: undefined, done: true };
        }

        // Return queued message if available
        if (messageQueue.length > 0) {
          return { value: messageQueue.shift()!, done: false };
        }

        // Wait for next message
        return new Promise((res) => {
          resolve = res;
        });
      },

      async return(): Promise<IteratorResult<T>> {
        done = true;
        await cleanup();
        return { value: undefined, done: true };
      },

      async throw(error?: Error): Promise<IteratorResult<T>> {
        done = true;
        await cleanup();
        throw error;
      },

      [Symbol.asyncIterator]() {
        return this;
      },
    };

    return iterator;
  }

  /**
   * Subscribe to a pattern (wildcard channels)
   *
   * @param pattern - The pattern to subscribe to (e.g., "channel.*")
   * @param typeGuard - Optional type guard function for message validation
   * @returns - Async iterator yielding deserialized messages with channel info
   */
  async psubscribe(
    pattern: string,
    typeGuard?: (value: any) => value is T
  ): Promise<AsyncIterableIterator<{ channel: string; message: T }>> {
    if (!this.subscriber) {
      this.subscriber = this.redis.duplicate();
    }

    await this.subscriber.psubscribe(pattern);

    const messageQueue: Array<{ channel: string; message: T }> = [];
    let resolve: ((value: IteratorResult<{ channel: string; message: T }>) => void) | null = null;
    let done = false;

    // Pattern message handler — ioredis pmessage signature: (pattern, channel, message)
    const patternMessageHandler = (_subscribedPattern: string, redisChannel: string, data: Buffer) => {
      try {
        const parsedMessage = JSON.parse(data.toString()) as T;

        // Apply type guard if provided
        if (typeGuard && !typeGuard(parsedMessage)) {
          console.warn(`Message failed type validation on pattern ${pattern}`);
          return;
        }

        const result = { channel: redisChannel, message: parsedMessage };

        if (resolve) {
          resolve({ value: result, done: false });
          resolve = null;
        } else {
          messageQueue.push(result);
        }
      } catch (error) {
        console.error(`Error deserializing pattern message on ${redisChannel}:`, error);
      }
    };

    // Set up pattern message listener
    this.subscriber.on('pmessage', patternMessageHandler);

    // Capture cleanup so iterator methods don't lose `this` binding
    const cleanup = async () => {
      this.subscriber?.off('pmessage', patternMessageHandler);
      await this.punsubscribe(pattern);
    };

    // Create async iterator
    const iterator: AsyncIterableIterator<{ channel: string; message: T }> = {
      async next(): Promise<IteratorResult<{ channel: string; message: T }>> {
        if (done) {
          return { value: undefined, done: true };
        }

        // Return queued message if available
        if (messageQueue.length > 0) {
          return { value: messageQueue.shift()!, done: false };
        }

        // Wait for next message
        return new Promise((res) => {
          resolve = res;
        });
      },

      async return(): Promise<IteratorResult<{ channel: string; message: T }>> {
        done = true;
        await cleanup();
        return { value: undefined, done: true };
      },

      async throw(error?: Error): Promise<IteratorResult<{ channel: string; message: T }>> {
        done = true;
        await cleanup();
        throw error;
      },

      [Symbol.asyncIterator]() {
        return this;
      },
    };

    return iterator;
  }

  /**
   * Unsubscribe from a channel
   *
   * @param channel - The channel to unsubscribe from
   */
  async unsubscribe(channel: string): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.unsubscribe(channel);
    }
  }

  /**
   * Unsubscribe from a pattern
   *
   * @param pattern - The pattern to unsubscribe from
   */
  async punsubscribe(pattern: string): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.punsubscribe(pattern);
    }
  }

  /**
   * Get the number of subscribers to a channel
   *
   * @param channel - The channel to check
   */
  async getSubscriberCount(channel: string): Promise<number> {
    try {
      const result = await this.redis.call('PUBSUB', 'NUMSUB', channel) as (string | number)[];
      // Result format: [channel, count, channel2, count2, ...]
      const channelIndex = result.indexOf(channel);
      if (channelIndex !== -1 && channelIndex + 1 < result.length) {
        return Number(result[channelIndex + 1]);
      }
      return 0;
    } catch (error) {
      console.error(`Failed to get subscriber count for channel ${channel}:`, error);
      return 0;
    }
  }

  /**
   * Get all active channels matching an optional pattern
   */
  async getActiveChannels(pattern?: string): Promise<string[]> {
    try {
      const args = pattern ? ['CHANNELS', pattern] : ['CHANNELS'];
      const result = await this.redis.call('PUBSUB', ...args) as string[];
      return result;
    } catch (error) {
      console.error('Failed to get active channels:', error);
      return [];
    }
  }

  /**
   * Get the count of active pattern subscriptions
   * Note: Redis PUBSUB NUMPAT returns a count, not a list of patterns
   */
  async getActivePatternCount(): Promise<number> {
    try {
      const result = await this.redis.call('PUBSUB', 'NUMPAT') as number;
      return result;
    } catch (error) {
      console.error('Failed to get active pattern count:', error);
      return 0;
    }
  }

  /**
   * Close the pub/sub connection
   */
  async close(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.subscriber = null;
    }
  }
}

// Export typed pub/sub instances for common use cases
export const codegenPubSub = new PubSub<any>(); // For code generation job updates
export const planPubSub = new PubSub<any>(); // For planning workflow updates
export const graphPubSub = new PubSub<any>(); // For graph change notifications
export const systemPubSub = new PubSub<any>(); // For system-wide events
