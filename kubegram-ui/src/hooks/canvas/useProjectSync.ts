import { useRef, useEffect } from 'react';
import { useStore } from 'react-redux';
import { useAppDispatch } from '@/store/hooks';
import { updateGraph } from '@/store/slices/project/projectSlice';
import type { CanvasGraph, CanvasNode, CanvasArrow } from '@/types/canvas';
import type { RootState } from '@/store';

/**
 * Hook to sync canvas state to project persistence
 * 
 * This ensures that when the user navigates away, the current visual state
 * of the graph is saved to the project storage.
 * 
 * @param nodes Current nodes on the canvas
 * @param arrows Current arrows on the canvas
 * @param enabled Whether sync is enabled (default: true). Set to false during hydration.
 */
export const useProjectSync = (nodes: CanvasNode[], arrows: CanvasArrow[], enabled = true) => {
    const dispatch = useAppDispatch();
    const store = useStore();

    // Use a ref to keep track of the latest data without triggering effects
    const latestDataRef = useRef({ nodes, arrows });

    // Update ref when data changes
    useEffect(() => {
        latestDataRef.current = { nodes, arrows };
    }, [nodes, arrows]);

    // Sync on unmount (navigation)
    useEffect(() => {
        if (!enabled) return;

        return () => {
            const state = store.getState() as RootState;
            const project = state.project.project;

            if (project) {
                console.log('🔄 Syncing graph to storage...', {
                    nodeCount: latestDataRef.current.nodes.length,
                    arrowCount: latestDataRef.current.arrows.length
                });

                // Create the graph object
                const graph: CanvasGraph = {
                    ...project.graph,
                    nodes: latestDataRef.current.nodes,
                    arrows: latestDataRef.current.arrows,
                };

                // Dispatch update to sync to storage
                dispatch(updateGraph({ graph }));
                console.log('✅ Synced canvas state to project storage');
            } else {
                console.warn('⚠️ No active project found for sync');
            }
        };
    }, [dispatch, store, enabled]);

    // Auto-save periodically or on change (debounced)
    useEffect(() => {
        if (!enabled) return;

        const timer = setTimeout(() => {
            const state = store.getState() as RootState;
            const project = state.project.project;

            if (!project) return;

            // Check if data actually changed to avoid unnecessary updates?
            // For now, relies on selector stability in parent or simple debouncing.

            const graph: CanvasGraph = {
                ...project.graph,
                nodes,
                arrows,
            };

            dispatch(updateGraph({ graph }));
        }, 1000); // Debounce 1s

        return () => clearTimeout(timer);
    }, [nodes, arrows, dispatch, store, enabled]);
};
