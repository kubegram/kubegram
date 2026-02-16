/**
 * Plan service for kubegram-core
 * Adapted from kuberag to use dependency injection and common-events
 */

import { v4 as uuidv4 } from 'uuid';
import { EventBus } from '@kubegram/common-events';
import { GraphInput } from '../types/graph.js';
import { ModelProvider, ModelName } from '../types/enums.js';
import { PlanWorkflowResult } from '../workflows/types.js';

export interface PlanJobStatus {
    jobId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    step: string;
    error?: string;
    createdAt: string;
    updatedAt: string;
    userRequest: string;
}

export interface PlanJobSubmissionOptions {
    modelProvider?: ModelProvider;
    modelName?: ModelName;
    timeout?: number;
    graph: GraphInput;
}

export interface BackgroundPlanJobContext {
    threadId: string;
    jobId: string;
    userRequest: string;
    options: PlanJobSubmissionOptions;
    startTime: number;
}

export interface PlanServiceConfig {
    redisClient?: unknown;
}

export class PlanService {
    private eventBus: EventBus;
    private config: PlanServiceConfig;
    private readonly activeJobs = new Map<string, BackgroundPlanJobContext>();
    private readonly jobResults = new Map<string, PlanWorkflowResult>();

    constructor(eventBus: EventBus, config: PlanServiceConfig = {}) {
        this.eventBus = eventBus;
        this.config = config;
    }

    async initializePlan(
        userRequest: string,
        options: PlanJobSubmissionOptions
    ): Promise<{ jobId: string }> {
        const jobId = uuidv4();
        
        await this.eventBus.publish({
            id: uuidv4(),
            type: 'plan.started',
            occurredOn: new Date(),
            aggregateId: jobId,
            metadata: {
                jobId,
                userRequest,
                options
            }
        } as any);

        return { jobId };
    }

    async submitJob(
        userRequest: string,
        options: PlanJobSubmissionOptions
    ): Promise<PlanJobStatus> {
        const jobId = uuidv4();
        
        await this.eventBus.publish({
            id: uuidv4(),
            type: 'plan.started',
            occurredOn: new Date(),
            aggregateId: jobId,
            metadata: {
                jobId,
                userRequest,
                options
            }
        } as any);

        return {
            jobId,
            status: 'pending',
            step: 'queued',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userRequest,
        };
    }

    async getJobStatus(jobId: string): Promise<PlanJobStatus | null> {
        const activeJob = this.activeJobs.get(jobId);
        if (activeJob) {
            return {
                jobId,
                status: 'running',
                step: 'processing',
                createdAt: new Date(activeJob.startTime).toISOString(),
                updatedAt: new Date().toISOString(),
                userRequest: activeJob.userRequest,
            };
        }

        const result = this.jobResults.get(jobId);
        if (result) {
            return {
                jobId,
                status: result.success ? 'completed' : 'failed',
                step: 'completed',
                error: result.error,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userRequest: '',
            };
        }

        return null;
    }

    async getJobResult(jobId: string): Promise<PlanWorkflowResult | null> {
        return this.jobResults.get(jobId) || null;
    }

    async cancelPlan(jobId: string): Promise<boolean> {
        return false;
    }

    private startJobProcessor(): void {
        // Background processor would be started here
    }

    private async submitBackgroundJob(context: BackgroundPlanJobContext): Promise<void> {
        // Background job processing
    }
}
