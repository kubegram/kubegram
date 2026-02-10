import type { CanvasGraph } from '@/types/canvas';
import { apiClient } from '@/lib/api/axiosClient';
import { JOB_STATUS, normalizeJobStatus, type JobStatusStatus } from '@kubegram/common-ts';

/**
 * Plan job status interface
 */
export interface PlanJobStatus {
    jobId: string;
    status: JobStatusStatus;
    step?: string;
    error?: string;
}

/**
 * Plan result interface
 */
export interface PlanResult {
    graph: CanvasGraph;
    context: string[]; // Plan details and assumptions
}

/**
 * Complete plan response
 */
export interface PlanResponse {
    job: PlanJobStatus;
    result?: PlanResult;
}

/**
 * Initialize a planning job
 * @param graph - The canvas graph to plan for
 * @param userRequest - Optional user request for modifications
 * @param provider - Optional LLM provider
 * @param model - Optional LLM model
 * @param token - Optional auth token
 * @returns Promise resolving to plan job status
 */
export async function initializePlan(
    graph: CanvasGraph,
    userRequest?: string,
    provider?: string,
    model?: string,
    token?: string
): Promise<PlanJobStatus> {
    try {
        const response = await apiClient.post<PlanJobStatus>(
            '/api/v1/graph/plan',
            {
                graph,
                userRequest,
                modelProvider: provider,
                modelName: model,
            },
            {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Failed to initialize plan:', error);
        throw new Error(error.response?.data?.error || 'Failed to initialize planning job');
    }
}

/**
 * Check the status of a planning job
 * @param jobId - The job ID to check
 * @param token - Optional auth token
 * @returns Promise resolving to job status
 */
export async function checkPlanStatus(
    jobId: string,
    token?: string
): Promise<PlanJobStatus> {
    try {
        const response = await apiClient.get<PlanJobStatus>(
            `/api/v1/graph/plan/${jobId}/status`,
            {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Failed to check plan status:', error);
        throw new Error(error.response?.data?.error || 'Failed to check planning job status');
    }
}

/**
 * Get the results of a completed planning job
 * @param jobId - The job ID to get results for
 * @param token - Optional auth token
 * @returns Promise resolving to plan result
 */
export async function getPlanResults(
    jobId: string,
    token?: string
): Promise<PlanResult> {
    try {
        const response = await apiClient.get<PlanResult>(
            `/api/v1/graph/plan/${jobId}/results`,
            {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Failed to get plan results:', error);
        throw new Error(error.response?.data?.error || 'Failed to get planning results');
    }
}

/**
 * Poll for plan completion with exponential backoff
 * @param jobId - The job ID to poll
 * @param maxAttempts - Maximum number of polling attempts (default: 60)
 * @param initialDelay - Initial delay in ms (default: 2000)
 * @param token - Optional auth token
 * @returns Promise resolving to plan response
 */
export async function pollPlanCompletion(
    jobId: string,
    maxAttempts: number = 60,
    initialDelay: number = 2000,
    token?: string
): Promise<PlanResponse> {
    let attempt = 0;
    let delay = initialDelay;

    while (attempt < maxAttempts) {
        attempt++;

        // Wait before polling (except first attempt)
        if (attempt > 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        try {
            const status = await checkPlanStatus(jobId, token);
            const normalizedStatus = normalizeJobStatus(status.status);

            console.log(`Plan poll attempt ${attempt}: ${status.status}`);

            if (normalizedStatus === JOB_STATUS.COMPLETED) {
                // Job completed, fetch results
                const result = await getPlanResults(jobId, token);
                return {
                    job: status,
                    result,
                };
            }

            if (normalizedStatus === JOB_STATUS.FAILED) {
                // Job failed
                throw new Error(status.error || 'Planning job failed');
            }

            // Job still running, increase delay for next attempt (exponential backoff)
            delay = Math.min(delay * 1.5, 10000); // Max 10 seconds between polls
        } catch (error: any) {
            // If it's a job failure, rethrow
            if (error.message?.includes('failed')) {
                throw error;
            }
            // Otherwise, log and continue polling
            console.warn(`Poll attempt ${attempt} failed:`, error.message);
        }
    }

    throw new Error(`Planning job timed out after ${maxAttempts} attempts`);
}
