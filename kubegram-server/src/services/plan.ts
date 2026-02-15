import {
    graphqlSdk,
    type InitializePlanInput,
    type PlanJobStatus,
    type PlanResult,
} from '@/clients/rag-client';
import { db } from '@/db';
import { generationJobs, projects, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CodegenError } from '@/errors/codegen'; // Reusing CodegenError for now
import { cleanGraphInput } from '@/utils/graph-input-cleaner';
import logger from '@/utils/logger';
import { withRetry } from '@/utils/retry';
import type { Context } from 'hono';

export class PlanService {

    /**
     * Initialize a planning job
     */
    async initializePlan(
        userId: number,
        input: InitializePlanInput
    ): Promise<PlanJobStatus> {
        return await withRetry(async () => {
            try {
                // Clean the graph input to remove non-schema fields like 'arrows'
                const cleanedInput = {
                    ...input,
                    graph: cleanGraphInput(input.graph)
                };

                const result = await graphqlSdk.InitializePlan({
                    input: cleanedInput
                });

                if (result.errors?.length) {
                    throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
                }

                if (!result.data?.initializePlan) {
                    throw new Error('No data returned from initializePlan mutation');
                }

                const jobStatus = result.data.initializePlan;

                // Store job metadata locally? 
                // For planning, we might optionally store it if we want persistent history, 
                // but for now let's just proxy to RAG.
                // Actually, to poll status, we might need a record if we want to add extra checks,
                // but RAG is the source of truth for the job.

                // Let's log it at least
                logger.info('Initialized plan job', { jobId: jobStatus.jobId, userId });

                return jobStatus;
            } catch (error) {
                throw error;
            }
        }, input as any);
    }

    /**
     * Get plan job status
     */
    async getPlanStatus(jobId: string): Promise<PlanJobStatus> {
        // NOTE: We are reusing the generic JobStatus query from RAG which works for any job type
        // But we need to map it to PlanJobStatus expected by our route
        return await withRetry(async () => {
            const result = await graphqlSdk.JobStatus({
                input: { jobId }
            });

            if (result.errors?.length) {
                throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
            }

            if (!result.data?.jobStatus) {
                throw new Error('No data returned from jobStatus query');
            }

            const status = result.data.jobStatus;

            return {
                jobId: status.jobId,
                status: status.status,
                step: status.step,
                error: undefined // Generic status doesn't have error field yet, relying on RAG to provide it if failed
            };
        }, {
            maxRetries: 3
        });
    }

    /**
     * Get plan results
     */
    async getPlanResults(jobId: string): Promise<PlanResult> {
        return await withRetry(async () => {
            const result = await graphqlSdk.GetPlan({
                jobId
            });

            if (result.errors?.length) {
                throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
            }

            if (!result.data?.getPlan) {
                throw new Error('No data returned from getPlan query');
            }

            return result.data.getPlan as any; // Cast to avoid strict type issues with generated types
        });
    }
}
