import { type Middleware } from '@reduxjs/toolkit';
import {
  addNodeToGraph,
  removeNodeFromGraph,
  updateNodeInGraph,
  addEdgeToGraph,
  removeEdgeFromGraph,
  updateEdgeInGraph,
  updateGraph
} from '../slices/project/projectSlice';
import {
  addNode,
  removeNode,
  updateNode,
  addArrow,
  removeArrow,
  updateArrow,
  setNodes,
  setArrows
} from '../slices/canvas';
import type { RootState } from '../types';
import type { CanvasNode, CanvasArrow, CanvasGraph } from '@/types/canvas';

/** Enable debug logging for sync operations */
const DEBUG_SYNC = false;

/**
 * Middleware to automatically sync canvas changes with project graph
 * 
 * This middleware listens for canvas actions and updates the project's graph
 * accordingly, keeping the visual canvas and data model in sync.
 */
export const graphSyncMiddleware: Middleware<{}, RootState> = (store) => (next) => (action: any) => {
  const result = next(action);
  const state = store.getState();

  // Only sync if project is initialized and has a graph
  if (!state.project?.isInitialized || !state.project?.project) {
    if (DEBUG_SYNC) console.log('⏸️ Project not initialized, skipping sync');
    return result;
  }

  // Helper to get canvas nodes and arrows from the correct path
  const getCanvasNodes = (): CanvasNode[] =>
    state.canvas?.data?.canvasElementsLookup?.nodes ?? [];
  const getCanvasArrows = (): CanvasArrow[] =>
    state.canvas?.data?.canvasElementsLookup?.arrows ?? [];

  if (DEBUG_SYNC) {
    console.log('🔄 Graph sync middleware triggered:', {
      actionType: action.type,
      projectInitialized: state.project.isInitialized,
      hasGraph: !!state.project.project?.graph,
      nodeCount: getCanvasNodes().length,
      arrowCount: getCanvasArrows().length,
    });
  }

  switch (action.type) {
    // ========================================================================
    // Node operations - sync canvas nodes to project graph
    // ========================================================================
    case addNode.type: {
      const node = action.payload as CanvasNode;
      if (DEBUG_SYNC) console.log('➕ Syncing addNode to project graph:', node.id);
      store.dispatch(addNodeToGraph({ nodeId: node.id, canvasNode: node }));
      break;
    }

    case removeNode.type: {
      const nodeId = action.payload as string;
      if (DEBUG_SYNC) console.log('➖ Syncing removeNode to project graph:', nodeId);
      store.dispatch(removeNodeFromGraph({ nodeId }));
      break;
    }

    case updateNode.type: {
      const { id, updates } = action.payload as { id: string; updates: Partial<CanvasNode> };
      // Get the updated node from canvas state (after the action was processed)
      const canvasNodes = getCanvasNodes();
      const canvasNode = canvasNodes.find((n: CanvasNode) => n.id === id);
      if (canvasNode) {
        const updatedNode = { ...canvasNode, ...updates };
        if (DEBUG_SYNC) console.log('✏️ Syncing updateNode to project graph:', id);
        store.dispatch(updateNodeInGraph({ nodeId: id, canvasNode: updatedNode }));
      }
      break;
    }

    // ========================================================================
    // Arrow/Edge operations - sync canvas arrows to project graph edges
    // ========================================================================
    case addArrow.type: {
      const arrow = action.payload as CanvasArrow;
      // Find the source node to attach the edge
      const canvasNodes = getCanvasNodes();
      const sourceNode = canvasNodes.find((n: CanvasNode) => n.id === arrow.startNodeId);

      if (sourceNode) {
        if (DEBUG_SYNC) console.log('➕ Syncing addArrow to project graph:', arrow.id);
        store.dispatch(addEdgeToGraph({
          startNode: sourceNode,
          canvasEdge: arrow
        }));
      }
      break;
    }

    case removeArrow.type: {
      const arrowId = action.payload as string;
      const canvasArrows = getCanvasArrows();
      const arrow = canvasArrows.find((a: CanvasArrow) => a.id === arrowId);

      if (arrow) {
        if (DEBUG_SYNC) console.log('➖ Syncing removeArrow to project graph:', arrowId);
        store.dispatch(removeEdgeFromGraph({
          nodeId: arrow.startNodeId,
          canvasEdge: arrow
        }));
      }
      break;
    }

    case updateArrow.type: {
      const { id, updates } = action.payload as { id: string; updates: Partial<CanvasArrow> };
      const canvasArrows = getCanvasArrows();
      const arrow = canvasArrows.find((a: CanvasArrow) => a.id === id);

      if (arrow) {
        const updatedArrow = { ...arrow, ...updates };
        if (DEBUG_SYNC) console.log('✏️ Syncing updateArrow to project graph:', id);
        store.dispatch(updateEdgeInGraph({
          nodeId: arrow.startNodeId,
          canvasEdge: updatedArrow
        }));
      }
      break;
    }

    // ========================================================================
    // Bulk operations - sync entire canvas to project graph
    // ========================================================================
    case setNodes.type: {
      const nodes = action.payload as CanvasNode[];
      if (DEBUG_SYNC) console.log('📦 Syncing setNodes to project graph:', nodes.length, 'nodes');

      // Update the entire graph nodes array
      const currentGraph = state.project.project?.graph;
      if (currentGraph) {
        const updatedGraph: CanvasGraph = {
          ...currentGraph,
          nodes: nodes
        };
        store.dispatch(updateGraph({ graph: updatedGraph }));
      }
      break;
    }

    case setArrows.type: {
      // Arrows are stored as edges on nodes, so we need to rebuild the edges
      const arrows = action.payload as CanvasArrow[];
      if (DEBUG_SYNC) console.log('📦 Syncing setArrows to project graph:', arrows.length, 'arrows');

      // Get current graph and nodes
      const currentGraph = state.project.project?.graph;
      if (currentGraph && currentGraph.nodes) {
        // Create a new nodes array with updated edges
        const updatedNodes = (currentGraph.nodes as CanvasNode[]).map(node => {
          if (!node) return node;
          // Find all arrows that start from this node
          const nodeEdges = arrows.filter(a => a.startNodeId === node.id);
          return {
            ...node,
            edges: nodeEdges
          };
        });

        const updatedGraph: CanvasGraph = {
          ...currentGraph,
          nodes: updatedNodes
        };
        store.dispatch(updateGraph({ graph: updatedGraph }));
      }
      break;
    }

    default:
      // No action needed for other canvas actions
      break;
  }

  return result;
};
