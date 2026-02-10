import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import type { CanvasNode, CanvasArrow, CanvasGraph } from '@/types/canvas';
import { GraphQL } from '@/lib/graphql-client';

/**
 * Canvas graph container for UI display
 */
export interface CanvasGraphContainer {
    nodes: CanvasNode[];
    arrows: CanvasArrow[];
}

/**
 * Hook for converting between canvas state and graph representation
 * 
 * This hook reads from both the canvas data slice and the project slice
 * to provide a unified view of the graph data.
 */
export function useGraphConversion() {
    // Get canvas data
    const canvasNodes = useAppSelector(state => state.canvas?.data?.canvasElementsLookup?.nodes ?? []);
    const canvasArrows = useAppSelector(state => state.canvas?.data?.canvasElementsLookup?.arrows ?? []);

    // Get project data
    const projectState = useAppSelector(state => state.project);
    const projectGraph = projectState?.project?.graph;
    const isInitialized = projectState?.isInitialized ?? false;

    // Create a unified canvas graph container for UI
    const canvasGraph: CanvasGraphContainer = useMemo(() => ({
        nodes: canvasNodes,
        arrows: canvasArrows,
    }), [canvasNodes, canvasArrows]);

    // The graph data from the project (may have different structure)
    const graph: CanvasGraph | GraphQL.Graph | null = useMemo(() => {
        if (!projectGraph) return null;
        return projectGraph;
    }, [projectGraph]);

    return {
        // Canvas-level data for UI rendering
        canvasGraph,

        // Project-level graph data
        graph,

        // Initialization state
        isInitialized,

        // Direct access to nodes and arrows
        nodes: canvasNodes,
        arrows: canvasArrows,
    };
}

export default useGraphConversion;
