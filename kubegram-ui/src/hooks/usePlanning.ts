import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CanvasGraph } from '@/types/canvas';
import { initializePlan, pollPlanCompletion, type PlanResult, type PlanJobStatus } from '@/store/api/plan';

export interface UsePlanningReturn {
    isPlanning: boolean;
    planResult: PlanResult | null;
    error: string | null;
    generatePlan: (graph: CanvasGraph, userRequest?: string, provider?: string, model?: string) => Promise<void>;
    clearPlan: () => void;
}

/**
 * Hook for managing planning workflows
 * Similar to useCodeGeneration but for planning
 */
export const usePlanning = (): UsePlanningReturn => {
    const [isPlanning, setIsPlanning] = useState(false);
    const [planResult, setPlanResult] = useState<PlanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const generatePlan = useCallback(
        async (
            graph: CanvasGraph,
            userRequest?: string,
            provider?: string,
            model?: string
        ) => {
            setIsPlanning(true);
            setError(null);
            setPlanResult(null);

            try {
                console.log('🚀 Initiating plan generation...', {
                    graphId: graph.id,
                    nodeCount: graph.nodes?.length || 0,
                    userRequest: userRequest || '(none)',
                });

                // Initialize plan job
                const jobStatus: PlanJobStatus = await initializePlan(
                    graph,
                    userRequest,
                    provider,
                    model
                );

                console.log('✅ Plan job initiated:', jobStatus.jobId);

                // Poll for completion
                console.log('⏳ Polling for plan completion...');
                const response = await pollPlanCompletion(jobStatus.jobId);

                if (response.result) {
                    console.log('✅ Plan completed successfully');
                    setPlanResult(response.result);

                    // Navigate to compare view with plan results
                    navigate('/compare', {
                        state: {
                            planResult: response.result,
                            sourceGraph: graph,
                        },
                    });
                } else {
                    throw new Error('Plan completed but no result returned');
                }
            } catch (err: unknown) {
                console.error('❌ Plan generation error:', err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to generate plan';
                setError(errorMessage);
            } finally {
                setIsPlanning(false);
            }
        },
        [navigate]
    );

    const clearPlan = useCallback(() => {
        setPlanResult(null);
        setError(null);
    }, []);

    return {
        isPlanning,
        planResult,
        error,
        generatePlan,
        clearPlan,
    };
};
