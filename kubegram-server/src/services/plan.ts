import { v4 as uuidv4 } from 'uuid';
import {
    graphqlSdk,
    type InitializePlanInput,
    type PlanJobStatus,
    type PlanResult,
} from '@/clients/rag-client';
import { cleanGraphInput } from '@/utils/graph-input-cleaner';
import { mapToWorkflowGraph } from '@/utils/graph-mapper';
import { workflowService } from '@/services/workflow';
import {
    type WorkflowContext,
    type PlanWorkflowOptions,
    ModelProvider,
    ModelName,
} from '@kubegram/kubegram-core';
import logger from '@/utils/logger';
import { withRetry } from '@/utils/retry';

function isNetworkError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    const code = (err as NodeJS.ErrnoException).code ?? '';
    return (
        code === 'ECONNREFUSED' ||
        code === 'ENOTFOUND' ||
        code === 'ETIMEDOUT' ||
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('Network Error')
    );
}

export class PlanService {

    /**
     * Initialize a planning job.
     * Tries KubeRAG first; falls back to in-process kubegram-core workflow on network errors.
     */
    async initializePlan(
        userId: number,
        input: InitializePlanInput & { userRequest?: string; modelProvider?: string; modelName?: string }
    ): Promise<PlanJobStatus> {
        try {
            const cleanedInput = {
                ...input,
                graph: cleanGraphInput(input.graph)
            };

            const result = await withRetry(async () => {
                const res = await graphqlSdk.InitializePlan({ input: cleanedInput });

                if (res.errors?.length) {
                    throw new Error(`GraphQL errors: ${res.errors.map(e => e.message).join(', ')}`);
                }

                if (!res.data?.initializePlan) {
                    throw new Error('No data returned from initializePlan mutation');
                }

                return res.data.initializePlan;
            }, input as any);

            logger.info('Initialized plan job via KubeRAG', { jobId: result.jobId, userId });
            return result;
        } catch (err) {
            if (!isNetworkError(err)) throw err;

            logger.warn('KubeRAG unreachable, running plan in-process', {
                error: err instanceof Error ? err.message : String(err),
            });

            await workflowService.initialize();

            const jobId = uuidv4();
            const cleanedGraph = cleanGraphInput(input.graph);
            const coreGraph = mapToWorkflowGraph(cleanedGraph as any, jobId);

            const context: WorkflowContext = {
                threadId: jobId,
                jobId,
                userId: String(userId),
                companyId: coreGraph.companyId,
            };

            const options: PlanWorkflowOptions = {
                graph: coreGraph,
                modelProvider: (input.modelProvider as ModelProvider) ?? undefined,
                modelName: (input.modelName as ModelName) ?? undefined,
            };

            workflowService.startPlan(input.userRequest ?? '', coreGraph, jobId, context, options);

            logger.info('Initialized plan job in-process', { jobId, userId });
            return { jobId, status: 'pending', step: 'queued' };
        }
    }

    /**
     * Get plan job status.
     * Routes to in-process tracker if the job was started locally.
     */
    async getPlanStatus(jobId: string): Promise<PlanJobStatus> {
        await workflowService.initialize();

        if (workflowService.isLocalJob(jobId)) {
            return workflowService.getPlanStatus(jobId);
        }

        return await withRetry(async () => {
            const result = await graphqlSdk.JobStatus({ input: { jobId } });

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
                error: undefined,
            };
        }, { maxRetries: 3 });
    }

    /**
     * Get plan results.
     * Routes to in-process result store if the job was started locally.
     */
    async getPlanResults(jobId: string): Promise<PlanResult> {
        await workflowService.initialize();

        if (workflowService.isLocalJob(jobId)) {
            const result = await workflowService.getPlanResults(jobId);
            if (!result) {
                throw new Error('Plan results not available yet');
            }
            return {
                graph: result.state.graph,
                context: result.state.planContext,
            } as unknown as PlanResult;
        }

        return await withRetry(async () => {
            const result = await graphqlSdk.GetPlan({ jobId });

            if (result.errors?.length) {
                throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
            }

            if (!result.data?.getPlan) {
                throw new Error('No data returned from getPlan query');
            }

            return result.data.getPlan as any;
        });
    }
}
