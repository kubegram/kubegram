/**
 * Plan service
 * 
 * @deprecated Import from @kubegram/kubegram-core instead
 * This module will be removed in kuberag v2.0.0
 * 
 * Handles job submission, caching, pub/sub orchestration, and background workflow execution for planning
 */

import { v4 as uuidv4 } from 'uuid';
import { planCheckpointer } from '../state/checkpointer';
import { planPubSub } from '../state/pubsub';
import {
    runPlanWorkflow,
} from '../workflows/plan-workflow';
import { PlanWorkflowResult } from '../workflows/types';
import { ModelProvider, ModelName } from '../types/enums';

// Job status interface
export interface PlanJobStatus {
    jobId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    step: string;
    error?: string;
    createdAt: string;
    updatedAt: string;
    userRequest: string;
}

// Job submission options interface
export interface PlanJobSubmissionOptions {
    modelProvider?: ModelProvider;
    modelName?: ModelName;
    timeout?: number;
    graph: any; // GraphInput - required
}

// Background job context interface
export interface BackgroundPlanJobContext {
    threadId: string;
    jobId: string;
    userRequest: string;
    options: PlanJobSubmissionOptions;
    startTime: number;
}

/**
 * Plan service class
 * Manages job submission and background processing for planning
 */
export class PlanService {
    private readonly checkpointer = planCheckpointer;
    private readonly pubsub = planPubSub;

    // Background job tracking
    private readonly activeJobs = new Map<string, BackgroundPlanJobContext>();
    private readonly jobResults = new Map<string, PlanWorkflowResult>();

    constructor() {
        // Start background job processor
        this.startJobProcessor();
    }

    /**
     * Submit a planning job to be processed in the background
     */
    async submitJob(
        userRequest: string,
        options: PlanJobSubmissionOptions
    ): Promise<PlanJobStatus> {
        const jobId = uuidv4();
        console.info(`Submitting plan job ${jobId}`);

        try {
            // Create background job context
            const jobContext: BackgroundPlanJobContext = {
                threadId: uuidv4(),
                jobId,
                userRequest,
                options: {
                    modelProvider: options.modelProvider || ModelProvider.claude,
                    modelName: options.modelName,
                    timeout: options.timeout || 60000,
                    graph: options.graph,
                },
                startTime: Date.now(),
            };

            // Track active job
            this.activeJobs.set(jobId, jobContext);

            // Submit to background processor
            await this.submitBackgroundJob(jobContext);

            // Publish job submission event
            await this.pubsub.publish(`plan:jobs:${jobId}`, {
                type: 'submitted',
                jobId,
                status: 'pending',
                timestamp: new Date().toISOString(),
            });

            console.info(`✓ Plan job ${jobId} submitted successfully`);

            return {
                jobId,
                status: 'pending',
                step: 'queued',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userRequest,
            };

        } catch (error) {
            console.error(`Failed to submit plan job ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Get plan job status
     */
    async getJobStatus(jobId: string): Promise<PlanJobStatus | null> {
        try {
            // Check if we have an active job
            const activeJob = this.activeJobs.get(jobId);
            if (activeJob) {
                // In a real implementation we would check the workflow status via checkpointer
                // For now, return what we know
                return {
                    jobId,
                    status: 'running',
                    step: 'processing',
                    createdAt: new Date(activeJob.startTime).toISOString(),
                    updatedAt: new Date().toISOString(),
                    userRequest: activeJob.userRequest,
                };
            }

            // Check for job result
            const result = this.jobResults.get(jobId);
            if (result) {
                return {
                    jobId,
                    status: result.success ? 'completed' : 'failed',
                    step: 'completed',
                    error: result.error,
                    createdAt: new Date().toISOString(), // Approximation
                    updatedAt: new Date().toISOString(),
                    userRequest: '', // We might lose this if not persisted
                };
            }

            return null;

        } catch (error) {
            console.error(`Failed to get plan job status for ${jobId}:`, error);
            return null;
        }
    }

    /**
     * Get generated plan for a job
     */
    async getJobResult(jobId: string): Promise<PlanWorkflowResult | null> {
        return this.jobResults.get(jobId) || null;
    }

    /**
     * Submit background job to processor
     */
    private async submitBackgroundJob(context: BackgroundPlanJobContext): Promise<void> {
        setImmediate(() => {
            this.processBackgroundJob(context).catch(error => {
                console.error(`Background plan job ${context.jobId} failed:`, error);
            });
        });
    }

    /**
     * Process background job
     */
    private async processBackgroundJob(context: BackgroundPlanJobContext): Promise<void> {
        const { jobId, userRequest, options, threadId } = context;

        try {
            console.info(`Processing plan job ${jobId}`);

            // Update job status to running via pubsub
            await this.pubsub.publish(`plan:jobs:${jobId}`, {
                type: 'started',
                jobId,
                status: 'running',
                timestamp: new Date().toISOString(),
            });

            // Run workflow
            const result = await runPlanWorkflow(userRequest, threadId, {} as any, {
                modelProvider: options.modelProvider,
                modelName: options.modelName,
                timeout: options.timeout,
                graph: options.graph,
            });

            // Store result
            this.jobResults.set(jobId, result);

            // Remove from active jobs
            this.activeJobs.delete(jobId);

            // Publish completion event
            await this.pubsub.publish(`plan:jobs:${jobId}`, {
                type: result.success ? 'completed' : 'failed',
                jobId,
                status: result.success ? 'completed' : 'failed',
                result,
                timestamp: new Date().toISOString(),
            });

            console.info(`✓ Plan job ${jobId} finished: ${result.success ? 'SUCCESS' : 'FAILED'}`);

        } catch (error) {
            console.error(`Plan job ${jobId} failed:`, error);
            // Remove from active jobs
            this.activeJobs.delete(jobId);
        }
    }

    private startJobProcessor(): void {
        console.info('Plan job processor started');
    }
}

// Export singleton instance
export const planService = new PlanService();
