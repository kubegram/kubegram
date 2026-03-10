/**
 * Checkpointer for workflow state persistence
 * Uses ioredis via constructor injection (no global redisClient dependency).
 */

import type { Redis } from 'ioredis';

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
 * Redis checkpointer for workflow state management.
 * Accepts an ioredis client via the constructor — callers are responsible for
 * creating and connecting the Redis instance.
 *
 * Key layout:
 *   {prefix}:state:{threadId}    — full state snapshot
 *   {prefix}:metadata:{threadId} — combined metadata
 *   {prefix}:status:{threadId}   — lightweight status-only record
 *   {prefix}:state:threads        — SMEMBERS set of active thread IDs
 */
export class RedisCheckpointer<T = unknown> {
    private readonly statePrefix: string;
    private readonly metadataPrefix: string;
    private readonly statusPrefix: string;
    private readonly threadsKey: string;

    constructor(
        private readonly redis: Redis,
        keyPrefix: string = 'checkpoint',
    ) {
        this.statePrefix = `${keyPrefix}:state:`;
        this.metadataPrefix = `${keyPrefix}:metadata:`;
        this.statusPrefix = `${keyPrefix}:status:`;
        this.threadsKey = `${keyPrefix}:state:threads`;
    }

    /**
     * Save workflow state with metadata.
     */
    async save(
        threadId: string,
        state: T,
        step: string,
        status: CheckpointStatus['status'] = 'running',
        metadata?: Partial<CheckpointMetadata>,
    ): Promise<void> {
        try {
            const timestamp = new Date().toISOString();

            const stateData = {
                state,
                step,
                status,
                updatedAt: timestamp,
                ...metadata,
            };

            const statusData: CheckpointStatus = {
                threadId,
                step,
                status,
                createdAt: timestamp,
                updatedAt: timestamp,
                totalSteps: metadata?.totalSteps,
                currentStep: metadata?.currentStep,
            };

            // Three keys are written atomically via pipeline (same 24-hour TTL):
            //  statePrefix:    full state blob — read by load() for workflow resumption.
            //  metadataPrefix: same blob plus metadata — read by loadWithMetadata() for
            //                  richer inspection without re-serialising the full state.
            //  statusPrefix:   lightweight status record — read by getStatus() for polling.
            const pipeline = this.redis.pipeline();
            pipeline.set(this.statePrefix + threadId, JSON.stringify(stateData), 'EX', 86400);
            pipeline.set(this.metadataPrefix + threadId, JSON.stringify(stateData), 'EX', 86400);
            pipeline.set(this.statusPrefix + threadId, JSON.stringify(statusData), 'EX', 86400);
            pipeline.sadd(this.threadsKey, threadId);

            await pipeline.exec();
        } catch (error) {
            console.error(`Failed to save checkpoint for thread ${threadId}:`, error);
            throw error;
        }
    }

    /**
     * Load workflow state by thread ID.
     */
    async load(threadId: string): Promise<T | null> {
        try {
            const data = await this.redis.get(this.statePrefix + threadId);
            if (!data) return null;
            return (JSON.parse(data) as { state: T }).state;
        } catch (error) {
            console.error(`Failed to load checkpoint for thread ${threadId}:`, error);
            return null;
        }
    }

    /**
     * Load full checkpoint data including metadata.
     */
    async loadWithMetadata(threadId: string): Promise<{
        state: T;
        step: string;
        status: CheckpointStatus['status'];
        updatedAt: string;
        error?: string;
        metadata?: unknown;
    } | null> {
        try {
            const data = await this.redis.get(this.metadataPrefix + threadId);
            if (!data) return null;
            return JSON.parse(data);
        } catch (error) {
            console.error(`Failed to load checkpoint metadata for thread ${threadId}:`, error);
            return null;
        }
    }

    /**
     * Get checkpoint status by thread ID.
     */
    async getStatus(threadId: string): Promise<CheckpointStatus | null> {
        try {
            const data = await this.redis.get(this.statusPrefix + threadId);
            if (!data) return null;
            return JSON.parse(data) as CheckpointStatus;
        } catch (error) {
            console.error(`Failed to get checkpoint status for thread ${threadId}:`, error);
            return null;
        }
    }

    /**
     * Update checkpoint status without reloading the full state.
     */
    async updateStatus(
        threadId: string,
        status: CheckpointStatus['status'],
        step?: string,
        error?: string,
    ): Promise<void> {
        try {
            const timestamp = new Date().toISOString();
            const raw = await this.redis.get(this.statusPrefix + threadId);
            let statusData: CheckpointStatus;

            if (raw) {
                statusData = JSON.parse(raw);
                statusData.status = status;
                statusData.updatedAt = timestamp;
                if (step) statusData.step = step;
                if (error) statusData.error = error;
            } else {
                statusData = {
                    threadId,
                    step: step ?? 'unknown',
                    status,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                };
                if (error) statusData.error = error;
            }

            await this.redis.set(this.statusPrefix + threadId, JSON.stringify(statusData), 'EX', 86400);

            // Keep metadata in sync if it exists
            const metaExists = await this.redis.exists(this.metadataPrefix + threadId);
            if (metaExists) {
                const meta = await this.loadWithMetadata(threadId);
                if (meta) {
                    (meta as any).status = status;
                    (meta as any).updatedAt = timestamp;
                    if (step) (meta as any).step = step;
                    if (error) (meta as any).error = error;
                    await this.redis.set(this.metadataPrefix + threadId, JSON.stringify(meta), 'EX', 86400);
                }
            }
        } catch (error) {
            console.error(`Failed to update checkpoint status for thread ${threadId}:`, error);
            throw error;
        }
    }

    /**
     * List all active thread IDs.
     */
    async listThreads(): Promise<string[]> {
        try {
            return (await this.redis.smembers(this.threadsKey)) as string[];
        } catch (error) {
            console.error('Failed to list checkpoint threads:', error);
            return [];
        }
    }

    /**
     * Delete checkpoint by thread ID.
     */
    async delete(threadId: string): Promise<boolean> {
        try {
            const pipeline = this.redis.pipeline();
            pipeline.del(this.statePrefix + threadId);
            pipeline.del(this.metadataPrefix + threadId);
            pipeline.del(this.statusPrefix + threadId);
            pipeline.srem(this.threadsKey, threadId);
            const results = await pipeline.exec();
            return (results?.filter(([err]) => !err).length ?? 0) > 0;
        } catch (error) {
            console.error(`Failed to delete checkpoint for thread ${threadId}:`, error);
            return false;
        }
    }

    /**
     * Remove expired checkpoints older than maxAge seconds (default: 7 days).
     *
     * Iterates all tracked thread IDs via SMEMBERS — O(n) on active thread count.
     * Suitable for periodic maintenance tasks; do not call on hot paths.
     */
    async cleanup(maxAge: number = 604800): Promise<number> {
        try {
            const threads = await this.listThreads();
            const cutoff = new Date(Date.now() - maxAge * 1000).toISOString();
            let deleted = 0;
            for (const threadId of threads) {
                const s = await this.getStatus(threadId);
                if (s && s.updatedAt < cutoff) {
                    if (await this.delete(threadId)) deleted++;
                }
            }
            return deleted;
        } catch (error) {
            console.error('Failed to cleanup checkpoints:', error);
            return 0;
        }
    }

    /**
     * Get checkpoint statistics.
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
                const s = await this.getStatus(threadId);
                if (s) {
                    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
                    if (!oldest || s.createdAt < oldest) oldest = s.createdAt;
                    if (!newest || s.createdAt > newest) newest = s.createdAt;
                }
            }

            return { total: threads.length, byStatus, oldest, newest };
        } catch (error) {
            console.error('Failed to get checkpoint stats:', error);
            return { total: 0, byStatus: {} };
        }
    }
}
