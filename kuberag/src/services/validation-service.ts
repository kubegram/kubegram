/**
 * Validation service
 *
 * Orchestrates the ValidationWorkflow from @kubegram/kubegram-core.
 * Follows the same pattern as codegen-service and plan-service.
 *
 * Responsibilities:
 *  - Submit validation jobs (returns a JobStatus immediately)
 *  - Run the ValidationWorkflow in the background via kubegram-core
 *  - Expose job status and results for GraphQL resolvers
 */

import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../state/redis';
import { RedisCheckpointer } from '../state/checkpointer';
import type { ValidationState } from '../workflows/types';
import { config } from '../config';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ValidationJobStatus {
    jobId: string;
    threadId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    step: string;
    error?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ValidationTestResult {
    correlationId: string;
    success: boolean;
    actualStatus: number;
    responseTimeMs: number;
    error?: string;
}

export interface ValidationJobResult {
    jobId: string;
    status: string;
    summary?: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        analysisText: string;
    };
    testResults: ValidationTestResult[];
    errors: Array<{ field: string; message: string; severity: string }>;
}

export interface ValidationJobSubmissionOptions {
    graphId: string;
    namespace: string;
    apiSchema: unknown;
    modelProvider?: string;
    modelName?: string;
    timeout?: number;
}

// ---------------------------------------------------------------------------
// ValidationService
// ---------------------------------------------------------------------------

export class ValidationService {
    private readonly checkpointer = new RedisCheckpointer<ValidationState>('validation');

    // In-memory job tracking (like plan-service / codegen-service)
    private readonly activeJobs = new Map<string, ValidationJobStatus>();
    private readonly jobResults = new Map<string, ValidationJobResult>();

    constructor() {
        this.startJobProcessor();
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    async submitJob(options: ValidationJobSubmissionOptions): Promise<ValidationJobStatus> {
        const jobId = uuidv4();
        const threadId = uuidv4();
        const now = new Date().toISOString();

        const status: ValidationJobStatus = {
            jobId,
            threadId,
            status: 'pending',
            step: 'queued',
            createdAt: now,
            updatedAt: now,
        };

        this.activeJobs.set(jobId, status);

        // Run in background — do not await
        this.runBackground(jobId, threadId, options).catch(err => {
            console.error(`Validation job ${jobId} failed:`, err);
            const current = this.activeJobs.get(jobId);
            if (current) {
                this.activeJobs.set(jobId, {
                    ...current,
                    status: 'failed',
                    step: 'failed',
                    error: err instanceof Error ? err.message : String(err),
                    updatedAt: new Date().toISOString(),
                });
            }
        });

        return status;
    }

    async getJobStatus(jobId: string): Promise<ValidationJobStatus | null> {
        return this.activeJobs.get(jobId) ?? null;
    }

    async getJobResults(jobId: string): Promise<ValidationJobResult | null> {
        return this.jobResults.get(jobId) ?? null;
    }

    async cancelJob(jobId: string): Promise<boolean> {
        const status = this.activeJobs.get(jobId);
        if (!status) return false;
        if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
            return false;
        }

        this.activeJobs.set(jobId, {
            ...status,
            status: 'cancelled',
            step: 'cancelled',
            updatedAt: new Date().toISOString(),
        });

        // Best-effort cancel via checkpointer
        await this.checkpointer.delete(status.threadId).catch(() => null);
        return true;
    }

    // -----------------------------------------------------------------------
    // Background execution
    // -----------------------------------------------------------------------

    private async runBackground(
        jobId: string,
        threadId: string,
        options: ValidationJobSubmissionOptions,
    ): Promise<void> {
        this.updateStatus(jobId, 'running', 'starting');

        try {
            // Lazy import kubegram-core so kuberag doesn't hard-depend on it at module load
            const { runValidationWorkflow } = await import('@kubegram/kubegram-core');
            const { EventBus } = await import('@kubegram/events');
            const eventBus = new EventBus();

            const redis = redisClient.getClient();
            const serverBaseUrl = config.KUBEGRAM_SERVER_URL ?? 'http://kubegram-server:8090';

            // Build a minimal Graph object so ValidationWorkflow has context
            const graph = {
                id: options.graphId,
                name: options.graphId,
                graphType: 'KUBERNETES' as any,
                companyId: 'system',
                userId: 'system',
            };

            const result = await runValidationWorkflow(
                graph as any,
                options.namespace,
                options.apiSchema,
                serverBaseUrl,
                threadId,
                { threadId, jobId, userId: 'system', companyId: 'system' },
                redis as any,
                eventBus as any,
                {
                    modelProvider: options.modelProvider as any,
                    modelName: options.modelName as any,
                },
            );

            const state = result.state;

            const jobResult: ValidationJobResult = {
                jobId,
                status: result.success ? 'completed' : 'failed',
                summary: state.validationSummary ?? undefined,
                testResults: state.testResults.map(r => ({
                    correlationId: r.correlationId,
                    success: r.success,
                    actualStatus: r.actualStatus,
                    responseTimeMs: r.responseTimeMs,
                    error: r.error,
                })),
                errors: state.validationErrors.map(e => ({
                    field: e.field,
                    message: e.message,
                    severity: e.severity,
                })),
            };

            this.jobResults.set(jobId, jobResult);
            this.updateStatus(jobId, result.success ? 'completed' : 'failed', state.currentStep, result.error);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.updateStatus(jobId, 'failed', 'failed', message);
            throw err;
        }
    }

    private updateStatus(
        jobId: string,
        status: ValidationJobStatus['status'],
        step: string,
        error?: string,
    ): void {
        const current = this.activeJobs.get(jobId);
        if (current) {
            this.activeJobs.set(jobId, {
                ...current,
                status,
                step,
                error,
                updatedAt: new Date().toISOString(),
            });
        }
    }

    private startJobProcessor(): void {
        // Jobs run inline via runBackground; this is a no-op placeholder
        // matching the pattern used by plan-service.
    }
}

// Singleton
export const validationService = new ValidationService();
