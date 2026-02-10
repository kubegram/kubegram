import { useCallback, useEffect } from 'react';
import Konva from 'konva';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setShowBackToContent,
  clearSelection,
  setPanning,
  setPanStart,
  setContextMenu,
  setDimensions,
  setSelectedItems,
} from '../../store/slices/canvas';

/**
 * Custom hook for canvas event handling
 *
 * Provides functions for:
 * - Keyboard shortcuts (arrow keys, delete, escape, etc.)
 * - Mouse wheel handling (zoom and pan)
 * - Canvas panning
 * - Distance checking for back-to-content button
 */
export const useCanvasEvents = (
  stageRef: React.RefObject<Konva.Stage>,
  isSidebarCollapsed: boolean,
  isHeaderCollapsed: boolean,
  onDeleteSelectedItems?: () => void,
  onAbortCurrentOperation?: () => void,
) => {
  const dispatch = useAppDispatch();
  const selectedItems = useAppSelector((state) => state.canvas.activity.selectedItems);
  const isDrawingArrow = useAppSelector((state) => state.canvas.activity.isDrawingArrow);
  const arrowStart = useAppSelector((state) => state.canvas.activity.arrowStart);
  const isArrowMode = useAppSelector((state) => state.canvas.activity.isArrowMode);
  const nodes = useAppSelector((state) => state.canvas.data.canvasElementsLookup.nodes);
  const arrows = useAppSelector((state) => state.canvas.data.canvasElementsLookup.arrows);
  const isPanning = useAppSelector((state) => state.canvas.activity.isPanning);
  const panStart = useAppSelector((state) => state.canvas.activity.panStart);

  // Check if user is far from content and show back to content button
  const checkDistanceFromContent = useCallback(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const pos = stage.position();
    const scale = stage.scaleX();

    // Calculate distance from center (0, 0) of the canvas
    const distanceFromCenter = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    const scaleThreshold = 0.3; // If zoomed out too much
    const distanceThreshold = 1500; // If panned too far (increased for larger canvas)

    // Show button if user is far from center or zoomed out too much
    const shouldShow = distanceFromCenter > distanceThreshold || scale < scaleThreshold;
    dispatch(setShowBackToContent(shouldShow));
  }, [dispatch]);

  // Back to content function
  const handleBackToContent = useCallback(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;

    // Animate back to center with normal scale
    const tween = new Konva.Tween({
      node: stage,
      duration: 0.5,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => {
        dispatch(setShowBackToContent(false));
      },
    });

    tween.play();
  }, [dispatch]);

  // Handle canvas panning
  const handleCanvasPanStart = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      // Disable mouse click-based panning
      return;
    },
    [dispatch],
  );

  const handleCanvasPanMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPanning) return;

      const stage = e.target.getStage();
      if (!stage) return;
      const newPos = {
        x: stage.x() + (e.evt.clientX - panStart.x),
        y: stage.y() + (e.evt.clientY - panStart.y),
      };

      stage.position(newPos);
      stage.batchDraw();

      dispatch(setPanStart({ x: e.evt.clientX, y: e.evt.clientY }));

      // Check distance from content after pan
      setTimeout(() => checkDistanceFromContent(), 10);
    },
    [isPanning, panStart, checkDistanceFromContent, dispatch],
  );

  const handleCanvasPanEnd = useCallback(() => {
    dispatch(setPanning(false));
  }, [dispatch]);

  // Handle mouse wheel for zoom only when Ctrl/Meta is pressed; otherwise allow native scrollbars
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Only intercept when doing a zoom gesture (Ctrl/Meta + wheel)
      if (e.evt.ctrlKey || e.evt.metaKey) {
        e.evt.preventDefault();

        const scaleBy = 1.02;
        const oldScale = stage.scaleX();

        const mousePointTo = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        stage.scale({ x: newScale, y: newScale });

        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };

        stage.position(newPos);
        stage.batchDraw();

        // Check distance from content after zoom
        setTimeout(() => checkDistanceFromContent(), 10);
      }
      // Without modifiers: let the event bubble for native scrolling
    },
    [checkDistanceFromContent],
  );

  // Attach DOM wheel listener to stage container to avoid React-induced rerenders
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const container = stage.container();

    const onWheel = (evt: WheelEvent) => {
      // Only intercept when doing a zoom gesture (Ctrl/Meta + wheel)
      if (!(evt.ctrlKey || evt.metaKey)) return; // let native scroll happen

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
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
      setTimeout(() => checkDistanceFromContent(), 10);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [stageRef, checkDistanceFromContent]);

  // Handle right-click on canvas
  const handleCanvasRightClick = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();

      // Close context menu if clicking on empty canvas
      dispatch(setContextMenu({ x: 0, y: 0, type: null, id: null }));
    },
    [dispatch],
  );

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!stageRef.current) return;

      // Check if user is typing in an input field or textarea
      const activeElement = document.activeElement;
      const isTyping = activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement;

      const stage = stageRef.current;
      const currentPos = stage.position();
      const currentScale = stage.scaleX();
      const scrollSpeed = 100; // Pixels per key press
      const zoomSpeed = 0.1; // Scale change per key press

      // DELETE KEY - Delete selected items (only if not typing)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isTyping) {
          // Allow default behavior in input fields
          return;
        }

        e.preventDefault();
        if (
          onDeleteSelectedItems &&
          (selectedItems.nodes.length > 0 || selectedItems.arrows.length > 0)
        ) {
          onDeleteSelectedItems();
        }
        return;
      }

      // ESCAPE KEY - Abort current operation (always allow, even when typing)
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onAbortCurrentOperation) {
          onAbortCurrentOperation();
        }
        return;
      }

      // For remaining shortcuts, skip if user is typing
      if (isTyping) {
        return;
      }

      // ARROW KEYS - Pan canvas
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const newPos = { x: currentPos.x + scrollSpeed, y: currentPos.y };
        stage.position(newPos);
        stage.batchDraw();
        console.log('⬅️ Pan left:', newPos);
        setTimeout(() => checkDistanceFromContent(), 10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const newPos = { x: currentPos.x - scrollSpeed, y: currentPos.y };
        stage.position(newPos);
        stage.batchDraw();
        console.log('➡️ Pan right:', newPos);
        setTimeout(() => checkDistanceFromContent(), 10);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newPos = { x: currentPos.x, y: currentPos.y + scrollSpeed };
        stage.position(newPos);
        stage.batchDraw();
        console.log('⬆️ Pan up:', newPos);
        setTimeout(() => checkDistanceFromContent(), 10);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newPos = { x: currentPos.x, y: currentPos.y - scrollSpeed };
        stage.position(newPos);
        stage.batchDraw();
        console.log('⬇️ Pan down:', newPos);
        setTimeout(() => checkDistanceFromContent(), 10);
      }
      // ZOOM SHORTCUTS
      else if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        const newScale = Math.min(currentScale + zoomSpeed, 5); // Max zoom 5x
        stage.scale({ x: newScale, y: newScale });
        stage.batchDraw();
        console.log('🔍 Zoom in:', newScale);
        setTimeout(() => checkDistanceFromContent(), 10);
      } else if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        const newScale = Math.max(currentScale - zoomSpeed, 0.1); // Min zoom 0.1x
        stage.scale({ x: newScale, y: newScale });
        stage.batchDraw();
        console.log('🔍 Zoom out:', newScale);
        setTimeout(() => checkDistanceFromContent(), 10);
      }
      // HOME KEY - Reset view
      else if (e.key === 'Home') {
        e.preventDefault();
        const tween = new Konva.Tween({
          node: stage,
          duration: 0.5,
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          easing: Konva.Easings.EaseInOut,
          onFinish: () => {
            dispatch(setShowBackToContent(false));
          },
        });
        tween.play();
        console.log('🏠 Reset view to center');
      }
      // SELECTION SHORTCUTS
      else if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        dispatch(
          setSelectedItems({
            nodes: nodes.map((n) => n.id),
            arrows: arrows.map((a) => a.id),
          }),
        );
      } else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        dispatch(clearSelection());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedItems,
    isDrawingArrow,
    arrowStart,
    isArrowMode,
    nodes,
    arrows,
    checkDistanceFromContent,
    dispatch,
  ]);

  // Update canvas dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      dispatch(
        setDimensions({
          width: window.innerWidth - (isSidebarCollapsed ? 64 : 256), // Account for sidebar
          height: window.innerHeight - (isHeaderCollapsed ? 32 : 64), // Account for header
        }),
      );
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isSidebarCollapsed, isHeaderCollapsed, dispatch]);

  return {
    checkDistanceFromContent,
    handleBackToContent,
    handleCanvasPanStart,
    handleCanvasPanMove,
    handleCanvasPanEnd,
    handleWheel,
    handleCanvasRightClick,
  };
};
