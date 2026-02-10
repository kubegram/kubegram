import { useCallback } from 'react';
import Konva from 'konva';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setSelecting,
  setSelectionRect,
  setSelectedItems,
  setGroupMoving,
  setGroupMoveStart,
  setGroupMoveOffset,
  updateNode,
} from '../../store/slices/canvas';

/**
 * Custom hook for group selection and movement functionality
 *
 * Provides functions for:
 * - Starting and managing group selection with rectangle
 * - Handling group movement
 * - Calculating which elements are within selection
 */
export const useGroupSelection = () => {
  const dispatch = useAppDispatch();
  const selectedItems = useAppSelector((state) => state.canvas.activity.selectedItems);
  const isSelecting = useAppSelector((state) => state.canvas.activity.isSelecting);
  const selectionRect = useAppSelector((state) => state.canvas.activity.selectionRect);
  const isGroupMoving = useAppSelector((state) => state.canvas.activity.isGroupMoving);
  const groupMoveStart = useAppSelector((state) => state.canvas.activity.groupMoveStart);
  const groupMoveOffset = useAppSelector((state) => state.canvas.activity.groupMoveOffset);
  const nodes = useAppSelector((state) => state.canvas.data.canvasElementsLookup.nodes);
  const arrows = useAppSelector((state) => state.canvas.data.canvasElementsLookup.arrows);

  // Helper function to convert screen coordinates to canvas coordinates
  const screenToCanvasCoords = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return { x: 0, y: 0 };

    const rect = stage.container().getBoundingClientRect();
    const scale = stage.scaleX();
    const stagePos = stage.position();

    // Convert screen coordinates to canvas coordinates
    const canvasX = (e.evt.clientX - rect.left - stagePos.x) / scale;
    const canvasY = (e.evt.clientY - rect.top - stagePos.y) / scale;

    return { x: canvasX, y: canvasY };
  }, []);

  // Helper function to convert screen coordinates to canvas coordinates for group movement
  const screenToCanvasCoordsForMovement = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return { x: 0, y: 0 };

    const rect = stage.container().getBoundingClientRect();
    const scale = stage.scaleX();
    const stagePos = stage.position();

    // Convert screen coordinates to canvas coordinates
    const canvasX = (e.evt.clientX - rect.left - stagePos.x) / scale;
    const canvasY = (e.evt.clientY - rect.top - stagePos.y) / scale;

    return { x: canvasX, y: canvasY };
  }, []);



  // Rect-rect intersection where selection rect may have negative width/height
  const rectsIntersect = useCallback(
    (
      a: { x: number; y: number; width: number; height: number },
      b: { x: number; y: number; width: number; height: number },
    ) => {
      const aLeft = a.x;
      const aRight = a.x + a.width;
      const aTop = a.y;
      const aBottom = a.y + a.height;

      const bLeft = Math.min(b.x, b.x + b.width);
      const bRight = Math.max(b.x, b.x + b.width);
      const bTop = Math.min(b.y, b.y + b.height);
      const bBottom = Math.max(b.y, b.y + b.height);

      return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
    },
    [],
  );

  // Get elements within selection rectangle
  const getElementsInSelection = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
      const selectedNodes: string[] = [];
      const selectedArrows: string[] = [];

      // Check nodes (use bbox overlap, not just center point)
      nodes.forEach((node) => {
        const nodeRect = { x: node.x, y: node.y, width: node.width, height: node.height };
        if (rectsIntersect(nodeRect, rect)) {
          selectedNodes.push(node.id);
        }
      });

      // Check arrows (use line bbox overlap for a pragmatic selection)
      arrows.forEach((arrow) => {
        const x1 = Math.min(arrow.startX, arrow.endX);
        const y1 = Math.min(arrow.startY, arrow.endY);
        const x2 = Math.max(arrow.startX, arrow.endX);
        const y2 = Math.max(arrow.startY, arrow.endY);
        const arrowBBox = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
        if (rectsIntersect(arrowBBox, rect)) {
          selectedArrows.push(arrow.id);
        }
      });

      return { nodes: selectedNodes, arrows: selectedArrows };
    },
    [nodes, arrows, rectsIntersect],
  );

  // Handle group movement start
  const handleGroupMoveStart = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, isArrowMode: boolean) => {
      // Only start group movement if we have selected items and not in arrow mode
      if (isArrowMode || (selectedItems.nodes.length === 0 && selectedItems.arrows.length === 0))
        return;

      const { x, y } = screenToCanvasCoordsForMovement(e);

      dispatch(setGroupMoving(true));
      dispatch(setGroupMoveStart({ x, y }));
      dispatch(setGroupMoveOffset({ x: 0, y: 0 }));
    },
    [selectedItems, screenToCanvasCoordsForMovement, dispatch],
  );

  // Handle group movement
  const handleGroupMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isGroupMoving || !groupMoveStart) return;

      const { x, y } = screenToCanvasCoordsForMovement(e);

      const offsetX = x - groupMoveStart.x;
      const offsetY = y - groupMoveStart.y;

      dispatch(setGroupMoveOffset({ x: offsetX, y: offsetY }));
    },
    [isGroupMoving, groupMoveStart, screenToCanvasCoordsForMovement, dispatch],
  );

  // Handle group movement end
  const handleGroupMoveEnd = useCallback(() => {
    if (!isGroupMoving || !groupMoveOffset) return;

    // Move all selected nodes to their new positions
    selectedItems.nodes.forEach((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        const newX = node.x + groupMoveOffset.x;
        const newY = node.y + groupMoveOffset.y;

        // Update node position in Redux store
        dispatch(
          updateNode({
            id: nodeId,
            updates: { x: newX, y: newY },
          }),
        );
      }
    });

    // Clear group movement state
    dispatch(setGroupMoving(false));
    dispatch(setGroupMoveStart(null));
    dispatch(setGroupMoveOffset(null));
  }, [isGroupMoving, groupMoveOffset, selectedItems, nodes, dispatch]);

  // Handle mouse down for group selection and group movement
  const handleCanvasMouseDown = useCallback(
    (
      e: Konva.KonvaEventObject<MouseEvent>,
      isArrowMode: boolean,
    ) => {
      // Skip if in arrow mode - let click handler deal with it
      if (isArrowMode) return;

      // Only start group selection if clicking on empty canvas
      if (e.target !== e.target.getStage()) return;

      // Convert screen coordinates to canvas coordinates
      const { x, y } = screenToCanvasCoords(e);

      // If we have selected items, start group movement
      if (
        selectedItems.nodes.length > 0 ||
        selectedItems.arrows.length > 0
      ) {
        handleGroupMoveStart(e, isArrowMode);
      } else {
        // Otherwise start group selection
        dispatch(setSelecting(true));
        dispatch(setSelectionRect({ x, y, width: 0, height: 0 }));
      }
    },
    [selectedItems, handleGroupMoveStart, screenToCanvasCoords, dispatch],
  );

  // Handle mouse move for group selection and group movement
  const handleCanvasMouseMoveSelection = useCallback(
    (
      e: Konva.KonvaEventObject<MouseEvent>,
    ) => {
      if (isSelecting && selectionRect) {
        // Convert screen coordinates to canvas coordinates
        const { x, y } = screenToCanvasCoords(e);

        const newWidth = x - selectionRect.x;
        const newHeight = y - selectionRect.y;

        dispatch(
          setSelectionRect({
            x: selectionRect.x,
            y: selectionRect.y,
            width: newWidth,
            height: newHeight,
          }),
        );
      } else if (isGroupMoving) {
        handleGroupMove(e);
      }
    },
    [isSelecting, selectionRect, isGroupMoving, handleGroupMove, screenToCanvasCoords, dispatch],
  );

  // Handle mouse up for group selection and group movement
  const handleCanvasMouseUp = useCallback(
    () => {
      if (isSelecting && selectionRect) {
        // Get elements within selection rectangle
        const elements = getElementsInSelection(selectionRect);

        // Update selection
        dispatch(setSelectedItems(elements));

        // Clear selection rectangle
        dispatch(setSelecting(false));
        dispatch(setSelectionRect(null));
      } else if (isGroupMoving) {
        handleGroupMoveEnd();
      }
    },
    [
      isSelecting,
      selectionRect,
      getElementsInSelection,
      isGroupMoving,
      handleGroupMoveEnd,
      dispatch,
    ],
  );

  return {
    isSelecting,
    selectionRect,
    isGroupMoving,
    groupMoveOffset,
    selectedItems,
    handleCanvasMouseDown,
    handleCanvasMouseMoveSelection,
    handleCanvasMouseUp,
    handleGroupMove,
    handleGroupMoveEnd,
  };
};
