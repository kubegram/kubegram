import { useCallback, useEffect, useRef } from 'react';
import Konva from 'konva';
import type { JsonCanvasEdge, JsonCanvasNode, NodeSide } from '@/types/jsoncanvas';
import { useCanvasCoordinates } from './useCanvasCoordinates';
import type { JsonCanvasStateReturn } from './useJsonCanvasState';
import type { RenderNode } from '@/utils/jsoncanvas';

/**
 * Event handlers for the JSON Canvas editor.
 * Local-state equivalent of useCanvasEvents + useArrowDrawing + useGroupSelection,
 * wired to useJsonCanvasState instead of Redux.
 */
export function useJsonCanvasEvents(
  stageRef: React.RefObject<Konva.Stage | null>,
  state: JsonCanvasStateReturn,
  isSidebarCollapsed: boolean,
  isHeaderCollapsed: boolean,
) {
  const {
    nodes, arrows,
    isArrowMode, setIsArrowMode,
    isSquareArrowMode, isCurvedArrowMode,
    isDrawingArrow, setIsDrawingArrow,
    arrowStart, setArrowStart,
    tempArrowEnd: _tempArrowEnd, setTempArrowEnd,
    arrowSnapTarget: _arrowSnapTarget, setArrowSnapTarget,
    selectedItems, setSelectedItems,
    isSelecting, setIsSelecting,
    selectionRect, setSelectionRect,
    isGroupMoving, setIsGroupMoving,
    groupMoveStart, setGroupMoveStart,
    groupMoveOffset, setGroupMoveOffset,
    contextMenu: _contextMenu, setContextMenu,
    dragItem: _dragItem, setDragItem,
    showBackToContent: _showBackToContent, setShowBackToContent,
    clearSelection,
    addEdge,
    addNode,
    updateRenderNode,
    jsonCanvas,
  } = state;

  const {
    findNearestNodeConnection,
    getNodeConnectionPoint,
    convertScreenToCanvasCoordinates,
    getArrowClickCoordinates,
    findElementsByCoordinates,
  } = useCanvasCoordinates();

  const pendingPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  // Tracks whether the current mousedown→mouseup gesture included actual pixel movement (>3px).
  // Prevents treating a plain click on empty canvas as a group-move or rect-select.
  const hasDraggedRef = useRef(false);
  // Set to true after a rect-select completes; read by click handlers to avoid overriding the selection.
  const justFinishedSelectionRef = useRef(false);

  // Compute which side of a node a point is closest to
  const computeSide = useCallback((node: RenderNode, px: number, py: number): NodeSide => {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const dx = px - cx;
    const dy = py - cy;
    const nx = Math.abs(dx) / (node.width / 2);
    const ny = Math.abs(dy) / (node.height / 2);
    if (nx > ny) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'bottom' : 'top';
  }, []);

  // Find nearest node within a proximity threshold (distance to nearest point on node rect).
  // JSON Canvas edges MUST reference real nodes, so we expand detection beyond strict area bounds.
  const findNearestNodeWithProximity = useCallback(
    (px: number, py: number, allNodes: RenderNode[], excludeNodeId?: string, threshold: number = 50): {
      nodeId: string;
      side: NodeSide;
    } | null => {
      let bestNodeId: string | null = null;
      let bestDist = Infinity;
      let bestSide: NodeSide = 'right';

      for (const node of allNodes) {
        if (excludeNodeId && node.id === excludeNodeId) continue;

        // Distance from point to nearest point on the node's rectangle
        const clampedX = Math.max(node.x, Math.min(px, node.x + node.width));
        const clampedY = Math.max(node.y, Math.min(py, node.y + node.height));
        const dist = Math.sqrt((px - clampedX) ** 2 + (py - clampedY) ** 2);

        if (dist < threshold && dist < bestDist) {
          bestDist = dist;
          bestNodeId = node.id;
          bestSide = computeSide(node, px, py);
        }
      }

      return bestNodeId ? { nodeId: bestNodeId, side: bestSide } : null;
    },
    [computeSide],
  );

  // --- Distance check for back-to-content ---
  const checkDistanceFromContent = useCallback(() => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const pos = stage.position();
    const scale = stage.scaleX();
    const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    setShowBackToContent(distance > 500 || scale < 0.5);
  }, [setShowBackToContent]);

  const handleBackToContent = useCallback(() => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const tween = new Konva.Tween({
      node: stage,
      duration: 0.5,
      x: 0, y: 0,
      scaleX: 1, scaleY: 1,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => setShowBackToContent(false),
    });
    tween.play();
  }, [setShowBackToContent]);

  // --- Screen to canvas coords ---
  const screenToCanvasCoords = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return { x: 0, y: 0 };
    const rect = stage.container().getBoundingClientRect();
    const scale = stage.scaleX();
    const stagePos = stage.position();
    return {
      x: (e.evt.clientX - rect.left - stagePos.x) / scale,
      y: (e.evt.clientY - rect.top - stagePos.y) / scale,
    };
  }, []);

  // --- Rect intersection ---
  const rectsIntersect = useCallback(
    (a: { x: number; y: number; width: number; height: number },
     b: { x: number; y: number; width: number; height: number }) => {
      const bLeft = Math.min(b.x, b.x + b.width);
      const bRight = Math.max(b.x, b.x + b.width);
      const bTop = Math.min(b.y, b.y + b.height);
      const bBottom = Math.max(b.y, b.y + b.height);
      return a.x < bRight && a.x + a.width > bLeft && a.y < bBottom && a.y + a.height > bTop;
    }, [],
  );

  // --- Arrow drawing: canvas click ---
  const handleArrowCanvasClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Clear selection on empty canvas click, but not if a rect-select just finished
      if (e.target === e.target.getStage()) {
        if (justFinishedSelectionRef.current) {
          justFinishedSelectionRef.current = false;
          return;
        }
        clearSelection();
      }

      // Only handle arrow clicks on stage
      if (e.target !== e.target.getStage()) return;
      if (!isArrowMode) return;

      const { x, y } = convertScreenToCanvasCoordinates(e);

      if (!isDrawingArrow) {
        // Starting an arrow from canvas click — find a nearby node with proximity
        const nearStart = findNearestNodeWithProximity(x, y, nodes);
        if (!nearStart) {
          // No node nearby — do not start drawing
          return;
        }
        setIsDrawingArrow(true);
        setArrowStart({ nodeId: nearStart.nodeId, x, y });
        setTempArrowEnd({ x, y });
      } else {
        // Completing an arrow from canvas click — find a nearby node for the endpoint
        const nearEnd = findNearestNodeWithProximity(x, y, nodes, arrowStart!.nodeId);

        if (!nearEnd) {
          // No node nearby — cancel the arrow
          setIsDrawingArrow(false);
          setArrowStart(null);
          setTempArrowEnd(null);
          setArrowSnapTarget(null);
          return;
        }

        const fromNode = nodes.find((n) => n.id === arrowStart!.nodeId);
        const toNode = nodes.find((n) => n.id === nearEnd.nodeId);

        const newEdge: JsonCanvasEdge = {
          id: `edge-${Date.now()}`,
          fromNode: arrowStart!.nodeId,
          toNode: nearEnd.nodeId,
          fromEnd: 'none',
          toEnd: 'arrow',
          pathMode: isSquareArrowMode ? 'square' : isCurvedArrowMode ? 'curved' : 'straight',
          ...(fromNode && { fromSide: computeSide(fromNode, arrowStart!.x, arrowStart!.y) }),
          ...(toNode && { toSide: nearEnd.side }),
        };

        addEdge(newEdge);
        setIsDrawingArrow(false);
        setArrowStart(null);
        setTempArrowEnd(null);
        setArrowSnapTarget(null);
        setIsArrowMode(false);
      }
    },
    [isArrowMode, isDrawingArrow, arrowStart, nodes, clearSelection,
      convertScreenToCanvasCoordinates, findNearestNodeWithProximity, computeSide,
      addEdge, setIsDrawingArrow, setArrowStart, setTempArrowEnd, setArrowSnapTarget, setIsArrowMode],
  );

  // --- Arrow drawing: node click ---
  const handleArrowNodeClick = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (!isArrowMode) return;

      if (!arrowStart) {
        const connectionPoint = getNodeConnectionPoint(nodeId, x, y, nodes as any);
        if (connectionPoint) {
          setArrowStart({ nodeId, x: connectionPoint.x, y: connectionPoint.y });
          setIsDrawingArrow(true);
        }
      } else if (arrowStart.nodeId !== nodeId) {
        // Defensive: verify arrowStart references a real node
        const fromNode = nodes.find((n) => n.id === arrowStart.nodeId);
        if (!fromNode) {
          setArrowStart(null);
          setIsDrawingArrow(false);
          setTempArrowEnd(null);
          setArrowSnapTarget(null);
          return;
        }

        const connectionPoint = getNodeConnectionPoint(nodeId, arrowStart.x, arrowStart.y, nodes as any);
        if (connectionPoint) {
          const toNode = nodes.find((n) => n.id === nodeId);

          const newEdge: JsonCanvasEdge = {
            id: `edge-${Date.now()}`,
            fromNode: arrowStart.nodeId,
            toNode: nodeId,
            fromEnd: 'none',
            toEnd: 'arrow',
            pathMode: isSquareArrowMode ? 'square' : isCurvedArrowMode ? 'curved' : 'straight',
            ...(fromNode && { fromSide: computeSide(fromNode, arrowStart.x, arrowStart.y) }),
            ...(toNode && { toSide: computeSide(toNode, connectionPoint.x, connectionPoint.y) }),
          };

          addEdge(newEdge);
          setArrowStart(null);
          setIsDrawingArrow(false);
          setTempArrowEnd(null);
          setArrowSnapTarget(null);
          setIsArrowMode(false);
        }
      }
    },
    [isArrowMode, arrowStart, nodes, getNodeConnectionPoint, computeSide,
      addEdge, setArrowStart, setIsDrawingArrow, setTempArrowEnd, setArrowSnapTarget, setIsArrowMode],
  );

  // --- Arrow drawing: mouse move (with snap) ---
  const handleArrowMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isArrowMode || !isDrawingArrow || !arrowStart) return;

      const { x, y } = convertScreenToCanvasCoordinates(e);
      pendingPosRef.current = { x, y };

      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        const pos = pendingPosRef.current;
        rafRef.current = null;
        if (!pos) return;

        const snapConnection = findNearestNodeConnection(pos.x, pos.y, nodes as any, arrowStart.nodeId);
        if (snapConnection) {
          setTempArrowEnd({ x: snapConnection.connectionPoint.x, y: snapConnection.connectionPoint.y });
          setArrowSnapTarget(snapConnection.nodeId);
        } else {
          setTempArrowEnd({ x: pos.x, y: pos.y });
          setArrowSnapTarget(null);
        }
      });
    },
    [isArrowMode, isDrawingArrow, arrowStart, nodes,
      convertScreenToCanvasCoordinates, findNearestNodeConnection, setTempArrowEnd, setArrowSnapTarget],
  );

  // --- Group selection: mouse down ---
  const handleGroupMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, arrowMode: boolean) => {
      hasDraggedRef.current = false;
      if (arrowMode) return;
      if (e.target !== e.target.getStage()) return;

      const { x, y } = screenToCanvasCoords(e);

      if (selectedItems.nodes.length > 0 || selectedItems.arrows.length > 0) {
        // Start group movement
        setIsGroupMoving(true);
        setGroupMoveStart({ x, y });
        setGroupMoveOffset({ x: 0, y: 0 });
      } else {
        // Start selection rectangle
        setIsSelecting(true);
        setSelectionRect({ x, y, width: 0, height: 0 });
      }
    },
    [selectedItems, screenToCanvasCoords,
      setIsGroupMoving, setGroupMoveStart, setGroupMoveOffset, setIsSelecting, setSelectionRect],
  );

  // --- Group selection: mouse move ---
  const handleGroupMouseMoveSelection = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isSelecting && selectionRect) {
        const { x, y } = screenToCanvasCoords(e);
        if (Math.abs(x - selectionRect.x) > 3 || Math.abs(y - selectionRect.y) > 3) {
          hasDraggedRef.current = true;
        }
        setSelectionRect({
          x: selectionRect.x,
          y: selectionRect.y,
          width: x - selectionRect.x,
          height: y - selectionRect.y,
        });
      } else if (isGroupMoving && groupMoveStart) {
        const { x, y } = screenToCanvasCoords(e);
        if (Math.abs(x - groupMoveStart.x) > 3 || Math.abs(y - groupMoveStart.y) > 3) {
          hasDraggedRef.current = true;
        }
        setGroupMoveOffset({
          x: x - groupMoveStart.x,
          y: y - groupMoveStart.y,
        });
      }
    },
    [isSelecting, selectionRect, isGroupMoving, groupMoveStart,
      screenToCanvasCoords, setSelectionRect, setGroupMoveOffset],
  );

  // --- Group selection: mouse up ---
  const handleGroupMouseUp = useCallback(() => {
    if (isSelecting && selectionRect) {
      if (!hasDraggedRef.current) {
        // Plain click on empty canvas with no selection active — just cancel
        setIsSelecting(false);
        setSelectionRect(null);
        return;
      }

      // Find elements in selection
      const selectedNodes: string[] = [];
      const selectedArrows: string[] = [];

      nodes.forEach((node) => {
        const nodeRect = { x: node.x, y: node.y, width: node.width, height: node.height };
        if (rectsIntersect(nodeRect, selectionRect)) {
          selectedNodes.push(node.id);
        }
      });

      arrows.forEach((arrow) => {
        const x1 = Math.min(arrow.startX, arrow.endX);
        const y1 = Math.min(arrow.startY, arrow.endY);
        const arrowBBox = {
          x: x1, y: y1,
          width: Math.max(arrow.startX, arrow.endX) - x1,
          height: Math.max(arrow.startY, arrow.endY) - y1,
        };
        if (rectsIntersect(arrowBBox, selectionRect)) {
          selectedArrows.push(arrow.id);
        }
      });

      setSelectedItems({ nodes: selectedNodes, arrows: selectedArrows });
      // Protect against the click event that fires after mouseup overriding this selection
      justFinishedSelectionRef.current = true;
      setIsSelecting(false);
      setSelectionRect(null);
    } else if (isGroupMoving && groupMoveOffset) {
      if (!hasDraggedRef.current) {
        // Plain click on canvas with items selected — clear selection
        setIsGroupMoving(false);
        setGroupMoveStart(null);
        setGroupMoveOffset(null);
        clearSelection();
        return;
      }

      // Apply group movement
      selectedItems.nodes.forEach((nodeId) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          updateRenderNode(nodeId, {
            x: node.x + groupMoveOffset.x,
            y: node.y + groupMoveOffset.y,
          });
        }
      });

      setIsGroupMoving(false);
      setGroupMoveStart(null);
      setGroupMoveOffset(null);
    }
  }, [isSelecting, selectionRect, isGroupMoving, groupMoveOffset,
    nodes, arrows, selectedItems, rectsIntersect, clearSelection,
    setSelectedItems, setIsSelecting, setSelectionRect,
    setIsGroupMoving, setGroupMoveStart, setGroupMoveOffset, updateRenderNode]);

  // --- Group move end (for drag-based group movement) ---
  const handleGroupMoveEnd = useCallback(() => {
    if (!isGroupMoving || !groupMoveOffset) return;

    selectedItems.nodes.forEach((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        updateRenderNode(nodeId, {
          x: node.x + groupMoveOffset.x,
          y: node.y + groupMoveOffset.y,
        });
      }
    });

    setIsGroupMoving(false);
    setGroupMoveStart(null);
    setGroupMoveOffset(null);
    setDragItem(null);
  }, [isGroupMoving, groupMoveOffset, selectedItems, nodes,
    updateRenderNode, setIsGroupMoving, setGroupMoveStart, setGroupMoveOffset, setDragItem]);

  // --- Panning (disabled via mouse, handled by Konva draggable stage) ---
  const handleCanvasPanStart = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {}, []);
  const handleCanvasPanMove = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {}, []);
  const handleCanvasPanEnd = useCallback(() => {}, []);

  // --- Right click ---
  const handleCanvasRightClick = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      setContextMenu({ x: 0, y: 0, type: null, id: null });
    },
    [setContextMenu],
  );

  // --- Copy / Paste ---
  const PASTE_OFFSET = 50;
  const clipboardRef = useRef<{ nodes: JsonCanvasNode[]; arrows: JsonCanvasEdge[] }>({ nodes: [], arrows: [] });

  const handleCopySelected = useCallback(() => {
    const selectedNodeIds = new Set(selectedItems.nodes);
    const selectedArrowIds = new Set(selectedItems.arrows);
    clipboardRef.current = {
      nodes: (jsonCanvas.nodes ?? []).filter((n) => selectedNodeIds.has(n.id)),
      arrows: (jsonCanvas.edges ?? []).filter((e) => selectedArrowIds.has(e.id)),
    };
  }, [selectedItems, jsonCanvas]);

  const handlePasteFromClipboard = useCallback(() => {
    const { nodes: copiedNodes, arrows: copiedArrows } = clipboardRef.current;
    if (copiedNodes.length === 0) return;

    const idMap = new Map<string, string>();
    const now = Date.now();

    copiedNodes.forEach((node, i) => {
      const newId = `${node.type}-${now}-${i}`;
      idMap.set(node.id, newId);
      addNode({ ...node, id: newId, x: node.x + PASTE_OFFSET, y: node.y + PASTE_OFFSET });
    });

    copiedArrows.forEach((arrow, i) => {
      const newFrom = idMap.get(arrow.fromNode);
      const newTo = idMap.get(arrow.toNode);
      if (newFrom && newTo) {
        addEdge({ ...arrow, id: `edge-${now}-${i}`, fromNode: newFrom, toNode: newTo });
      }
    });

    setSelectedItems({ nodes: [...idMap.values()], arrows: [] });
  }, [addNode, addEdge, setSelectedItems]);

  // --- Keyboard + wheel events ---
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Wheel zoom (Ctrl/Meta + wheel)
    const container = stage.container();
    const onWheel = (evt: WheelEvent) => {
      if (!(evt.ctrlKey || evt.metaKey)) return;
      evt.preventDefault();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const scaleBy = 1.02;
      const oldScale = stage.scaleX();
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const newScale = evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      stage.scale({ x: newScale, y: newScale });
      stage.position({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
      stage.batchDraw();
      setTimeout(() => checkDistanceFromContent(), 10);
    };

    container.addEventListener('wheel', onWheel, { passive: false });

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!stageRef.current) return;
      const isTyping = document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isTyping) return;
        e.preventDefault();
        // Deletion will be handled by the component
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsDrawingArrow(false);
        setArrowStart(null);
        setTempArrowEnd(null);
        clearSelection();
        setDragItem(null);
        setIsSelecting(false);
        setSelectionRect(null);
        setIsGroupMoving(false);
        setGroupMoveStart(null);
        setGroupMoveOffset(null);
        return;
      }

      if (isTyping) return;

      const currentPos = stage.position();
      const scrollSpeed = 100;

      if (e.key === 'ArrowLeft') { e.preventDefault(); stage.position({ x: currentPos.x + scrollSpeed, y: currentPos.y }); stage.batchDraw(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); stage.position({ x: currentPos.x - scrollSpeed, y: currentPos.y }); stage.batchDraw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); stage.position({ x: currentPos.x, y: currentPos.y + scrollSpeed }); stage.batchDraw(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); stage.position({ x: currentPos.x, y: currentPos.y - scrollSpeed }); stage.batchDraw(); }
      else if (e.key === 'Home') {
        e.preventDefault();
        new Konva.Tween({ node: stage, duration: 0.5, x: 0, y: 0, scaleX: 1, scaleY: 1, easing: Konva.Easings.EaseInOut, onFinish: () => setShowBackToContent(false) }).play();
      }
      else if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setSelectedItems({
          nodes: nodes.map((n) => n.id),
          arrows: arrows.map((a) => a.id),
        });
      }
      else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        clearSelection();
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopySelected();
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePasteFromClipboard();
      }

      setTimeout(() => checkDistanceFromContent(), 10);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [stageRef, nodes, arrows, checkDistanceFromContent, clearSelection,
    setIsDrawingArrow, setArrowStart, setTempArrowEnd, setDragItem,
    setIsSelecting, setSelectionRect, setIsGroupMoving, setGroupMoveStart,
    setGroupMoveOffset, setSelectedItems, setShowBackToContent,
    handleCopySelected, handlePasteFromClipboard]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // --- Dimensions ---
  useEffect(() => {
    // No-op: dimensions are handled by the component itself (window.innerWidth/Height)
  }, [isSidebarCollapsed, isHeaderCollapsed]);

  return {
    // Arrow drawing handlers
    handleArrowCanvasClick,
    handleArrowNodeClick,
    handleArrowMouseMove,

    // Group selection handlers
    handleGroupMouseDown,
    handleGroupMouseMoveSelection,
    handleGroupMouseUp,
    handleGroupMoveEnd,

    // Panning handlers
    handleCanvasPanStart,
    handleCanvasPanMove,
    handleCanvasPanEnd,

    // Navigation
    handleBackToContent,
    handleCanvasRightClick,
    checkDistanceFromContent,

    // Coordinate utils
    getArrowClickCoordinates,
    findElementsByCoordinates,

    // Selection refs (read by JsonCanvasEditor to avoid click-event interference)
    justFinishedSelectionRef,

    // Copy / paste
    handleCopySelected,
    handlePasteFromClipboard,
  };
}
