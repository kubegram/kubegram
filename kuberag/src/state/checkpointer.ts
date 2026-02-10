/**
 * Redis checkpointer for workflow state persistence
 * Replaces LangGraph RedisSaver with custom implementation
 */

import { redisClient } from './redis';
import { CodegenState, PlanState } from '../workflows/types';

// Checkpoint status interface
export interface CheckpointStatus {
  threadId: string;
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  totalSteps?: number;
  currentStep?: number;
  error?: string;
}

// Checkpoint metadata interface
export interface CheckpointMetadata extends CheckpointStatus { }

/**
 * Redis checkpointer for workflow state management
 * Provides save/load/getStatus functionality for workflow checkpoints
 */
export class RedisCheckpointer<T = any> {
  private readonly redis = redisClient.getClient();
  private readonly keyPrefix: string;
  private readonly metadataPrefix: string;
  private readonly statusPrefix: string;

  constructor(keyPrefix: string = 'checkpoint') {
    this.keyPrefix = `${keyPrefix}:state:`;
    this.metadataPrefix = `${keyPrefix}:metadata:`;
    this.statusPrefix = `${keyPrefix}:status:`;
  }

  /**
   * Save workflow state with metadata
   * 
   * @param threadId - Unique identifier for the workflow thread
   * @param state - The workflow state to save
   * @param step - Current step name
   * @param status - Current status
   * @param metadata - Additional metadata
   */
  async save(
    threadId: string,
    state: T,
    step: string,
    status: CheckpointStatus['status'] = 'running',
    metadata?: Partial<CheckpointMetadata>
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const stateKey = this.getStateKey(threadId);
      const metadataKey = this.getMetadataKey(threadId);
      const statusKey = this.getStatusKey(threadId);

      // Prepare state data
      const stateData = {
        state,
        step,
        status,
        updatedAt: timestamp,
        ...metadata,
      };

      // Prepare status data
      const statusData: CheckpointStatus = {
        threadId,
        step,
        status,
        createdAt: timestamp,
        updatedAt: timestamp,
        totalSteps: metadata?.totalSteps,
        currentStep: metadata?.currentStep,
      };

      // Use pipeline for atomic operations
      const pipeline = this.redis.pipeline();

      // Save state with TTL (24 hours default)
      pipeline.set(stateKey, JSON.stringify(stateData), 'EX', 86400);

      // Save metadata
      pipeline.set(metadataKey, JSON.stringify(stateData), 'EX', 86400);

      // Save status
      pipeline.set(statusKey, JSON.stringify(statusData), 'EX', 86400);

      // Add to thread index for listing
      pipeline.sadd(`${this.keyPrefix}threads`, threadId);

      await pipeline.exec();

      console.debug(`Saved checkpoint for thread ${threadId} at step ${step}`);
    } catch (error) {
      console.error(`Failed to save checkpoint for thread ${threadId}:`, error);
      throw error;
    }
  }

  /**
   * Load workflow state by thread ID
   * 
   * @param threadId - Unique identifier for the workflow thread
   * @returns - The saved state or null if not found
   */
  async load(threadId: string): Promise<T | null> {
    try {
      const stateKey = this.getStateKey(threadId);
      const data = await this.redis.get(stateKey);

      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);
      return parsed.state as T;
    } catch (error) {
      console.error(`Failed to load checkpoint for thread ${threadId}:`, error);
      return null;
    }
  }

  /**
   * Load full checkpoint data including metadata
   * 
   * @param threadId - Unique identifier for the workflow thread
   * @returns - Full checkpoint data or null if not found
   */
  async loadWithMetadata(threadId: string): Promise<{
    state: T;
    step: string;
    status: CheckpointStatus['status'];
    updatedAt: string;
    error?: string;
    metadata?: any;
  } | null> {
    try {
      const metadataKey = this.getMetadataKey(threadId);
      const data = await this.redis.get(metadataKey);

      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      console.error(`Failed to load checkpoint metadata for thread ${threadId}:`, error);
      return null;
    }
  }

  /**
   * Get checkpoint status by thread ID
   * 
   * @param threadId - Unique identifier for the workflow thread
   * @returns - Checkpoint status or null if not found
   */
  async getStatus(threadId: string): Promise<CheckpointStatus | null> {
    try {
      const statusKey = this.getStatusKey(threadId);
      const data = await this.redis.get(statusKey);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as CheckpointStatus;
    } catch (error) {
      console.error(`Failed to get checkpoint status for thread ${threadId}:`, error);
      return null;
    }
  }

  /**
   * Update checkpoint status
   * 
   * @param threadId - Unique identifier for the workflow thread
   * @param status - New status
   * @param step - Current step (optional)
   * @param error - Error message if status is 'failed'
   */
  async updateStatus(
    threadId: string,
    status: CheckpointStatus['status'],
    step?: string,
    error?: string
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const statusKey = this.getStatusKey(threadId);
      const metadataKey = this.getMetadataKey(threadId);

      // Get existing status
      const existingData = await this.redis.get(statusKey);
      let statusData: CheckpointStatus;

      if (existingData) {
        statusData = JSON.parse(existingData);
        statusData.status = status;
        statusData.updatedAt = timestamp;
        if (step) statusData.step = step;
        if (error) statusData.error = error;
      } else {
        statusData = {
          threadId,
          step: step || 'unknown',
          status,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        if (error) statusData.error = error;
      }

      // Update status
      await this.redis.set(statusKey, JSON.stringify(statusData), 'EX', 86400);

      // Update metadata if it exists
      const metadataExists = await this.redis.exists(metadataKey);
      if (metadataExists) {
        const metadata = await this.loadWithMetadata(threadId);
        if (metadata) {
          metadata.status = status;
          metadata.updatedAt = timestamp;
          if (step) metadata.step = step;
          if (error) metadata.error = error;

          await this.redis.set(metadataKey, JSON.stringify(metadata), 'EX', 86400);
        }
      }

      console.debug(`Updated checkpoint status for thread ${threadId} to ${status}`);
    } catch (error) {
      console.error(`Failed to update checkpoint status for thread ${threadId}:`, error);
      throw error;
    }
  }

  /**
   * List all active thread IDs
   * 
   * @returns - Array of thread IDs
   */
  async listThreads(): Promise<string[]> {
    try {
      const threads = await this.redis.smembers(`${this.keyPrefix}threads`);
      return threads as string[];
    } catch (error) {
      console.error('Failed to list checkpoint threads:', error);
      return [];
    }
  }

  /**
   * Delete checkpoint by thread ID
   * 
   * @param threadId - Unique identifier for the workflow thread
   */
  async delete(threadId: string): Promise<boolean> {
    try {
      const stateKey = this.getStateKey(threadId);
      const metadataKey = this.getMetadataKey(threadId);
      const statusKey = this.getStatusKey(threadId);

      const pipeline = this.redis.pipeline();
      pipeline.del(stateKey);
      pipeline.del(metadataKey);
      pipeline.del(statusKey);
      pipeline.srem(`${this.keyPrefix}threads`, threadId);

      const results = await pipeline.exec();
      const deletedCount = results?.filter(([err]) => !err).length || 0;

      console.debug(`Deleted checkpoint for thread ${threadId} (${deletedCount} keys)`);
      return deletedCount > 0;
    } catch (error) {
      console.error(`Failed to delete checkpoint for thread ${threadId}:`, error);
      return false;
    }
  }

  /**
   * Clean up expired checkpoints
   * 
   * @param maxAge - Maximum age in seconds (default: 7 days)
   */
  async cleanup(maxAge: number = 604800): Promise<number> {
    try {
      const threads = await this.listThreads();
      const cutoffTime = new Date(Date.now() - maxAge * 1000).toISOString();
      let deletedCount = 0;

      for (const threadId of threads) {
        const status = await this.getStatus(threadId);
        if (status && status.updatedAt < cutoffTime) {
          if (await this.delete(threadId)) {
            deletedCount++;
          }
        }
      }

      console.debug(`Cleaned up ${deletedCount} expired checkpoints`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup checkpoints:', error);
      return 0;
    }
  }

  /**
   * Get checkpoint statistics
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    oldest?: string;
    newest?: string;
  }> {
    try {
      const threads = await this.listThreads();
      const byStatus: Record<string, number> = {};
      let oldest: string | undefined;
      let newest: string | undefined;

      for (const threadId of threads) {
        const status = await this.getStatus(threadId);
        if (status) {
          byStatus[status.status] = (byStatus[status.status] || 0) + 1;

          if (!oldest || status.createdAt < oldest) {
            oldest = status.createdAt;
          }
          if (!newest || status.createdAt > newest) {
            newest = status.createdAt;
          }
        }
      }

      return {
        total: threads.length,
        byStatus,
        oldest,
        newest,
      };
    } catch (error) {
      console.error('Failed to get checkpoint stats:', error);
      return {
        total: 0,
        byStatus: {},
      };
    }
  }

  // Helper methods for key generation
  private getStateKey(threadId: string): string {
    return `${this.keyPrefix}${threadId}`;
  }

  private getMetadataKey(threadId: string): string {
    return `${this.metadataPrefix}${threadId}`;
  }

  private getStatusKey(threadId: string): string {
    return `${this.statusPrefix}${threadId}`;
  }
}

// Export singleton instances for different workflow types
export const codegenCheckpointer = new RedisCheckpointer<CodegenState>('codegen');
export const planCheckpointer = new RedisCheckpointer<PlanState>('plan');
export const defaultCheckpointer = new RedisCheckpointer('default');