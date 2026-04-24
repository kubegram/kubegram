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
                console.group('🚀 Plan request');
                console.log('userRequest:', userRequest || '(none)');
                console.log('provider:', provider ?? '(default)', '| model:', model ?? '(default)');
                console.log('graph — id:', graph.id, '| name:', graph.name, '| nodes:', graph.nodes?.length ?? 0);
                if (graph.nodes?.length) {
                    console.table(graph.nodes.map(n => ({ id: n?.id, name: n?.name, type: n?.nodeType })));
                }
                console.log('full payload:', { graph, userRequest, modelProvider: provider, modelName: model });
                console.groupEnd();

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
                    const { graph, context } = response.result;
                    console.group('✅ Plan completed');
                    console.log('Job status:', response.job);
                    console.log('Graph — id:', graph.id, '| name:', graph.name, '| nodes:', graph.nodes?.length ?? 0);
                    if (graph.nodes?.length) {
                        console.table(graph.nodes.map(n => ({ id: n?.id, name: n?.name, type: n?.nodeType })));
                    }
                    console.log('Context (%d items):', context.length);
                    context.forEach((item, i) => console.log(`  [${i + 1}]`, item));
                    console.groupEnd();
                    setPlanResult(response.result);

                    navigate('/plan-view', {
                        state: {
                            planResult: response.result,
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
