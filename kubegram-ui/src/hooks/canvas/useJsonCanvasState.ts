import { useState, useCallback, useMemo } from 'react';
import type { JsonCanvas, JsonCanvasNode, JsonCanvasEdge, NodeSide } from '@/types/jsoncanvas';
import { jsonCanvasToRenderModel, type RenderNode, type RenderArrow } from '@/utils/jsoncanvas';

export interface SelectedItems {
  nodes: string[];
  arrows: string[];
}

export interface ContextMenu {
  x: number;
  y: number;
  type: 'node' | 'arrow' | null;
  id: string | null;
}

export interface ArrowStart {
  nodeId: string;
  x: number;
  y: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function computeSide(
  node: { x: number; y: number; width: number; height: number },
  pointX: number,
  pointY: number,
): NodeSide {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const dx = pointX - cx;
  const dy = pointY - cy;
  const nx = Math.abs(dx) / (node.width / 2);
  const ny = Math.abs(dy) / (node.height / 2);
  if (nx > ny) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'bottom' : 'top';
}

export function useJsonCanvasState(initialData?: JsonCanvas) {
  // --- Core JSON Canvas data ---
  const [jsonCanvas, setJsonCanvas] = useState<JsonCanvas>(initialData || { nodes: [], edges: [] });

  // Arrow coordinate overrides for interactive endpoint dragging.
  // JSON Canvas edges store fromNode/toNode + sides, not pixel coords.
  // Overrides let us store pixel coords during drags.
  const [arrowCoordOverrides, setArrowCoordOverrides] = useState<Record<string, Partial<RenderArrow>>>({});

  // Arrow path preservation state for body dragging.
  const [arrowPathOverrides] = useState<Record<string, { 
    preservedPath: number[]; 
    pathMode: 'straight' | 'square' | 'curved';
    isDragging: boolean;
  }>>({});

  // Derive render model from JSON Canvas (memoized)
  const baseRenderModel = useMemo(() => jsonCanvasToRenderModel(jsonCanvas), [jsonCanvas]);

  // Merge arrow coord and path overrides on top of derived model
  const renderModel = useMemo(() => {
    if (Object.keys(arrowCoordOverrides).length === 0 && Object.keys(arrowPathOverrides).length === 0) return baseRenderModel;
    return {
      nodes: baseRenderModel.nodes,
      arrows: baseRenderModel.arrows.map((arrow) => {
        const coordOverride = arrowCoordOverrides[arrow.id];
        const pathOverride = arrowPathOverrides[arrow.id];
        
        if (pathOverride?.isDragging && pathOverride.preservedPath.length > 0) {
          // Use preserved path during drag
          return {
            ...arrow,
            ...coordOverride,
            startX: pathOverride.preservedPath[0],
            startY: pathOverride.preservedPath[1],
            endX: pathOverride.preservedPath[pathOverride.preservedPath.length - 2],
            endY: pathOverride.preservedPath[pathOverride.preservedPath.length - 1],
            _preservedPath: pathOverride.preservedPath,
            _pathMode: pathOverride.pathMode
          };
        }
        
        return coordOverride ? { ...arrow, ...coordOverride } : arrow;
      }),
    };
  }, [baseRenderModel, arrowCoordOverrides, arrowPathOverrides]);

  // --- Arrow animation state ---
  const [isFlowAnimated, setIsFlowAnimated] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [animateNewArrows, setAnimateNewArrows] = useState(true);
  const [animatingArrowIds, setAnimatingArrowIds] = useState<Set<string>>(new Set());

  const clearAnimatingArrow = useCallback((id: string) => {
    setAnimatingArrowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // --- Arrow drawing state ---
  const [isArrowMode, setIsArrowMode] = useState(false);
  const [isSquareArrowMode, setIsSquareArrowMode] = useState(false);
  const [isCurvedArrowMode, setIsCurvedArrowMode] = useState(false);
  const [isDrawingArrow, setIsDrawingArrow] = useState(false);
  const [arrowStart, setArrowStart] = useState<ArrowStart | null>(null);
  const [tempArrowEnd, setTempArrowEnd] = useState<Point | null>(null);
  const [arrowSnapTarget, setArrowSnapTarget] = useState<string | null>(null);

  // --- Selection state ---
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({ nodes: [], arrows: [] });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);

  // --- Group movement state ---
  const [isGroupMoving, setIsGroupMoving] = useState(false);
  const [groupMoveStart, setGroupMoveStart] = useState<Point | null>(null);
  const [groupMoveOffset, setGroupMoveOffset] = useState<Point | null>(null);

  // --- Context menu state ---
  const [contextMenu, setContextMenu] = useState<ContextMenu>({ x: 0, y: 0, type: null, id: null });

  // --- Drag state ---
  const [dragItem, setDragItem] = useState<RenderNode | null>(null);

  // --- Renaming state ---
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);

  // --- Navigation state ---
  const [showBackToContent, setShowBackToContent] = useState(false);

  // --- Mutation handlers ---

  const clearSelection = useCallback(() => {
    setSelectedItems({ nodes: [], arrows: [] });
  }, []);

  const addNode = useCallback((node: JsonCanvasNode) => {
    setJsonCanvas((prev) => ({
      ...prev,
      nodes: [...(prev.nodes || []), node],
    }));
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<JsonCanvasNode>) => {
    setJsonCanvas((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).map((n) =>
        n.id === nodeId ? { ...n, ...updates } as JsonCanvasNode : n,
      ),
    }));
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setJsonCanvas((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).filter((n) => n.id !== nodeId),
      // Also remove edges connected to this node
      edges: (prev.edges || []).filter(
        (e) => e.fromNode !== nodeId && e.toNode !== nodeId,
      ),
    }));
  }, []);

  const addEdge = useCallback((edge: JsonCanvasEdge) => {
    setJsonCanvas((prev) => {
      const nodeIds = new Set((prev.nodes || []).map((n) => n.id));
      // Reject edges that reference non-existent nodes
      if (!nodeIds.has(edge.fromNode) || !nodeIds.has(edge.toNode)) {
        console.warn(
          `[addEdge] Rejected edge "${edge.id}": fromNode="${edge.fromNode}", toNode="${edge.toNode}" — one or both nodes not found`
        );
        return prev;
      }
      return {
        ...prev,
        edges: [...(prev.edges || []), edge],
      };
    });
    // Track for draw-in animation
    if (animateNewArrows) {
      setAnimatingArrowIds((prev) => new Set(prev).add(edge.id));
    }
  }, [animateNewArrows]);

  const removeEdge = useCallback((edgeId: string) => {
    setJsonCanvas((prev) => ({
      ...prev,
      edges: (prev.edges || []).filter((e) => e.id !== edgeId),
    }));
  }, []);

  const updateRenderNode = useCallback((nodeId: string, updates: Partial<RenderNode>) => {
    setJsonCanvas((prev) => {
      const jcNodes = prev.nodes || [];
      const idx = jcNodes.findIndex((n) => n.id === nodeId);
      if (idx === -1) return prev;

      const existing = jcNodes[idx];
      const updated = { ...existing } as any;

      // Map render model updates back to JSON Canvas node
      if (updates.x !== undefined) updated.x = updates.x;
      if (updates.y !== undefined) updated.y = updates.y;
      if (updates.width !== undefined) updated.width = updates.width;
      if (updates.height !== undefined) updated.height = updates.height;
      if (updates.color !== undefined) updated.color = updates.color;
      if (updates.label !== undefined && existing.type === 'text') {
        // Preserve frontmatter, update body
        const text = (existing as any).text as string;
        const fmMatch = text.match(/^(---\n[\s\S]*?\n---\n)/);
        updated.text = fmMatch ? fmMatch[1] + updates.label : updates.label;
      }

      const newNodes = [...jcNodes];
      newNodes[idx] = updated as JsonCanvasNode;
      return { ...prev, nodes: newNodes };
    });
  }, []);

  const updateRenderArrow = useCallback((arrowId: string, updates: Partial<RenderArrow>) => {
    // For arrow coordinate updates, we don't store coordinates in JSON Canvas edges.
    // The coordinates are derived from node positions + sides.
    // For now, we only handle fromNode/toNode updates.
    if (updates.startNodeId || updates.endNodeId) {
      setJsonCanvas((prev) => ({
        ...prev,
        edges: (prev.edges || []).map((e) => {
          if (e.id !== arrowId) return e;
          return {
            ...e,
            ...(updates.startNodeId && { fromNode: updates.startNodeId }),
            ...(updates.endNodeId && { toNode: updates.endNodeId }),
          };
        }),
      }));
    }
  }, []);

  const updateArrowCoords = useCallback((arrowId: string, coords: Partial<Pick<RenderArrow, 'startX' | 'startY' | 'endX' | 'endY'>>) => {
    setArrowCoordOverrides((prev) => ({
      ...prev,
      [arrowId]: { ...(prev[arrowId] || {}), ...coords },
    }));
  }, []);

  const updateArrowAttachment = useCallback((arrowId: string, end: 'start' | 'end', nodeId: string) => {
    // Update the edge's fromNode/toNode in JSON Canvas data
    setJsonCanvas((prev) => {
      const edges = prev.edges || [];
      const edgeIdx = edges.findIndex((e) => e.id === arrowId);
      if (edgeIdx === -1) return prev;

      const edge = edges[edgeIdx];
      const nodes = prev.nodes || [];
      const targetNode = nodes.find((n) => n.id === nodeId);

      const updatedEdge = { ...edge };
      if (end === 'start') {
        updatedEdge.fromNode = nodeId;
        // Recompute fromSide based on the target node and the other endpoint
        if (targetNode) {
          const otherNode = nodes.find((n) => n.id === edge.toNode);
          if (otherNode) {
            const otherCx = otherNode.x + otherNode.width / 2;
            const otherCy = otherNode.y + otherNode.height / 2;
            updatedEdge.fromSide = computeSide(targetNode, otherCx, otherCy);
          }
        }
      } else {
        updatedEdge.toNode = nodeId;
        if (targetNode) {
          const otherNode = nodes.find((n) => n.id === edge.fromNode);
          if (otherNode) {
            const otherCx = otherNode.x + otherNode.width / 2;
            const otherCy = otherNode.y + otherNode.height / 2;
            updatedEdge.toSide = computeSide(targetNode, otherCx, otherCy);
          }
        }
      }

      const newEdges = [...edges];
      newEdges[edgeIdx] = updatedEdge;
      return { ...prev, edges: newEdges };
    });

    // Clear overrides for this arrow so derived coords take over
    setArrowCoordOverrides((prev) => {
      const next = { ...prev };
      delete next[arrowId];
      return next;
    });
  }, []);

  const loadJsonCanvas = useCallback((data: JsonCanvas) => {
    setJsonCanvas(data);
    setArrowCoordOverrides({});
    setAnimatingArrowIds(new Set());
    clearSelection();
    setIsDrawingArrow(false);
    setArrowStart(null);
    setTempArrowEnd(null);
    setIsSelecting(false);
    setSelectionRect(null);
    setIsGroupMoving(false);
    setGroupMoveStart(null);
    setGroupMoveOffset(null);
    setContextMenu({ x: 0, y: 0, type: null, id: null });
    setDragItem(null);
    setRenamingNodeId(null);
  }, [clearSelection]);

  const clearAll = useCallback(() => {
    loadJsonCanvas({ nodes: [], edges: [] });
  }, [loadJsonCanvas]);

  return {
    // JSON Canvas data
    jsonCanvas,
    nodes: renderModel.nodes,
    arrows: renderModel.arrows,

    // Arrow animation
    isFlowAnimated, setIsFlowAnimated,
    isPulsing, setIsPulsing,
    animateNewArrows, setAnimateNewArrows,
    animatingArrowIds, clearAnimatingArrow,

    // Arrow drawing
    isArrowMode, setIsArrowMode,
    isSquareArrowMode, setIsSquareArrowMode,
    isCurvedArrowMode, setIsCurvedArrowMode,
    isDrawingArrow, setIsDrawingArrow,
    arrowStart, setArrowStart,
    tempArrowEnd, setTempArrowEnd,
    arrowSnapTarget, setArrowSnapTarget,

    // Selection
    selectedItems, setSelectedItems,
    isSelecting, setIsSelecting,
    selectionRect, setSelectionRect,

    // Group movement
    isGroupMoving, setIsGroupMoving,
    groupMoveStart, setGroupMoveStart,
    groupMoveOffset, setGroupMoveOffset,

    // Context menu
    contextMenu, setContextMenu,

    // Drag
    dragItem, setDragItem,

    // Renaming
    renamingNodeId, setRenamingNodeId,

    // Navigation
    showBackToContent, setShowBackToContent,

    // Mutations
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    updateRenderNode,
    updateRenderArrow,
    updateArrowCoords,
    updateArrowAttachment,
    clearSelection,
    loadJsonCanvas,
    clearAll,
  };
}

export type JsonCanvasStateReturn = ReturnType<typeof useJsonCanvasState>;
