import { useCallback, useEffect, useRef } from 'react';
import Konva from 'konva';
import { GraphQL } from '@/lib/graphql-client';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setDrawingArrow,
  setArrowStart,
  setTempArrowEnd,
  addArrow,
  clearSelection,
  setArrowMode,
  setArrowSnapTarget,
} from '../../store/slices/canvas';
import { type CanvasArrow } from '../../types/canvas';
import { useCanvasCoordinates } from './useCanvasCoordinates';

/**
 * Custom hook for arrow drawing functionality
 *
 * Provides functions for:
 * - Starting and completing arrow drawing
 * - Handling canvas and node clicks for arrow creation
 * - Managing temporary arrow preview
 */
export const useArrowDrawing = (_: React.RefObject<Konva.Stage>) => {
  const dispatch = useAppDispatch();
  const isArrowMode = useAppSelector((state) => state.canvas.activity.isArrowMode);
  const isDrawingArrow = useAppSelector((state) => state.canvas.activity.isDrawingArrow);
  const arrowStart = useAppSelector((state) => state.canvas.activity.arrowStart);
  const tempArrowEnd = useAppSelector((state) => state.canvas.activity.tempArrowEnd);
  const currentSnapTarget = useAppSelector((state) => state.canvas.activity.arrowSnapTarget);
  const nodes = useAppSelector((state) => state.canvas.data.canvasElementsLookup.nodes);

  const { findNearestNodeConnection, getNodeConnectionPoint, convertScreenToCanvasCoordinates } =
    useCanvasCoordinates();

  const pendingPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  // Handle canvas click for arrow drawing
  const handleCanvasClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      console.log('🎯 Canvas click event:', {
        target: e.target,
        stage: e.target.getStage(),
        isStage: e.target === e.target.getStage(),
        isArrowMode,
        isDrawingArrow,
        arrowStart,
      });

      // STEP 1: Handle selection clearing (only for empty canvas clicks)
      if (e.target === e.target.getStage()) {
        console.log('📝 Clearing selection (clicked on empty canvas)');
        dispatch(clearSelection());
      }

      // STEP 2: Skip if clicking on a node (let node's click handler deal with it)
      // Check if the target is anything other than the Stage itself
      if (e.target !== e.target.getStage()) {
        console.log('🚫 Clicking on a shape (not canvas), skipping canvas arrow handling');
        return;
      }

      // STEP 3: Only proceed if in arrow mode
      if (!isArrowMode) {
        console.log('❌ Not in arrow mode, returning');
        return;
      }

      // STEP 4: Convert screen coordinates to canvas coordinates
      const { x, y } = convertScreenToCanvasCoordinates(e);
      console.log('📍 Canvas coordinates:', { x, y });

      if (!isDrawingArrow) {
        // STEP 5A: START ARROW DRAWING
        console.log('🚀 Starting arrow drawing at:', { x, y });
        dispatch(setDrawingArrow(true));
        dispatch(setArrowStart({ nodeId: 'free', x, y })); // 'free' means not connected to a node yet
        dispatch(setTempArrowEnd({ x, y })); // For preview line
      } else {
        // STEP 5B: COMPLETE ARROW DRAWING
        console.log('🏁 Completing arrow at:', { x, y, arrowStart });

        // Use the arrowStart node ID directly (already set when drawing started)
        // Only search for the end connection
        const endConnection = findNearestNodeConnection(x, y, nodes);

        console.log('🔗 Connection attempts:', {
          startNodeId: arrowStart!.nodeId,
          endConnection,
          startPoint: { x: arrowStart!.x, y: arrowStart!.y },
          endPoint: { x, y },
        });

        // Create the final arrow with connection points
        const endNodeId = endConnection ? endConnection.nodeId : 'free';
        const endNode = endNodeId !== 'free' ? nodes.find(n => n.id === endNodeId) : undefined;

        const newArrow: CanvasArrow = {
          id: `arrow-${Date.now()}`,
          startNodeId: arrowStart!.nodeId, // Use the node ID from arrowStart directly
          endNodeId,
          startX: arrowStart!.x,
          startY: arrowStart!.y,
          endX: endConnection ? endConnection.connectionPoint.x : x,
          endY: endConnection ? endConnection.connectionPoint.y : y,
          node: endNode!,
          connectionType: GraphQL.ConnectionType.ConnectsTo,
        };

        console.log('✨ Creating new arrow:', newArrow);
        dispatch(addArrow(newArrow));

        // Reset drawing state
        dispatch(setDrawingArrow(false));
        dispatch(setArrowStart(null));
        dispatch(setTempArrowEnd(null));
        dispatch(setArrowSnapTarget(null));

        // Only exit arrow mode if both ends are attached to nodes
        const isBothEndsAttached = newArrow.startNodeId !== 'free' && newArrow.endNodeId !== 'free';
        if (isBothEndsAttached) {
          console.log('✅ Both ends attached to nodes, exiting arrow mode');
          dispatch(setArrowMode(false));
        } else {
          console.log('⚠️ One or both ends not attached, staying in arrow mode');
        }
      }
    },
    [isArrowMode, isDrawingArrow, arrowStart, findNearestNodeConnection, nodes, dispatch],
  );

  // Handle node click for arrow drawing
  const handleNodeClick = useCallback(
    (nodeId: string, x: number, y: number) => {
      console.log('🎯 Node click event:', { nodeId, x, y, isArrowMode, arrowStart });

      // Only handle in arrow mode
      if (!isArrowMode) {
        console.log('❌ Not in arrow mode, ignoring node click');
        return;
      }

      if (!arrowStart) {
        // STEP 1: START ARROW FROM THIS NODE
        console.log('🚀 Starting arrow from node:', nodeId);
        const connectionPoint = getNodeConnectionPoint(nodeId, x, y, nodes);

        if (connectionPoint) {
          console.log('✅ Starting arrow from node with connection point:', {
            nodeId,
            connectionPoint,
          });
          dispatch(
            setArrowStart({
              nodeId,
              x: connectionPoint.x,
              y: connectionPoint.y,
            }),
          );
          dispatch(setDrawingArrow(true));
        } else {
          console.log('❌ Failed to get connection point for node:', nodeId);
        }
      } else if (arrowStart.nodeId !== nodeId) {
        // STEP 2: COMPLETE ARROW TO THIS NODE (prevent self-connection)
        console.log('🏁 Completing arrow to node:', { nodeId, arrowStart });
        const connectionPoint = getNodeConnectionPoint(nodeId, arrowStart.x, arrowStart.y, nodes);

        if (connectionPoint) {
          const endNode = nodes.find(n => n.id === nodeId);

          const newArrow: CanvasArrow = {
            id: `arrow-${Date.now()}`,
            startNodeId: arrowStart.nodeId,
            endNodeId: nodeId,
            startX: arrowStart.x,
            startY: arrowStart.y,
            endX: connectionPoint.x,
            endY: connectionPoint.y,
            node: endNode!,
            connectionType: GraphQL.ConnectionType.ConnectsTo,
          };

          console.log('✨ Creating arrow between nodes:', newArrow);
          dispatch(addArrow(newArrow));

          // Reset drawing state
          dispatch(setArrowStart(null));
          dispatch(setDrawingArrow(false));
          dispatch(setTempArrowEnd(null));
          dispatch(setArrowSnapTarget(null));

          // Exit arrow mode - both ends are attached to nodes
          console.log('✅ Arrow connected between two nodes, exiting arrow mode');
          dispatch(setArrowMode(false));
        } else {
          console.log('❌ Failed to get connection point for end node:', nodeId);
        }
      } else {
        console.log('🚫 Ignoring self-connection attempt:', nodeId);
      }
    },
    [isArrowMode, arrowStart, getNodeConnectionPoint, nodes, dispatch],
  );

  // Handle canvas mouse move for temporary arrow preview with snapping
  const handleCanvasMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isArrowMode || !isDrawingArrow || !arrowStart) return;

      const { x, y } = convertScreenToCanvasCoordinates(e);
      pendingPosRef.current = { x, y };

      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        const pos = pendingPosRef.current;
        rafRef.current = null;
        if (!pos) return;

        const snapConnection = findNearestNodeConnection(pos.x, pos.y, nodes, arrowStart.nodeId);

        if (snapConnection) {
          const { x: sx, y: sy } = snapConnection.connectionPoint;
          const needsTempUpdate = !(tempArrowEnd && tempArrowEnd.x === sx && tempArrowEnd.y === sy);
          const needsSnapTargetUpdate = currentSnapTarget !== snapConnection.nodeId;
          if (needsTempUpdate) {
            dispatch(setTempArrowEnd({ x: sx, y: sy }));
          }
          if (needsSnapTargetUpdate) {
            dispatch(setArrowSnapTarget(snapConnection.nodeId));
          }
        } else {
          const needsTempUpdate = !(tempArrowEnd && tempArrowEnd.x === pos.x && tempArrowEnd.y === pos.y);
          const needsSnapTargetUpdate = currentSnapTarget !== null;
          if (needsTempUpdate) {
            dispatch(setTempArrowEnd({ x: pos.x, y: pos.y }));
          }
          if (needsSnapTargetUpdate) {
            dispatch(setArrowSnapTarget(null));
          }
        }
      });
    },
    [
      isArrowMode,
      isDrawingArrow,
      arrowStart,
      convertScreenToCanvasCoordinates,
      findNearestNodeConnection,
      nodes,
      tempArrowEnd,
      currentSnapTarget,
      dispatch,
    ],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return {
    handleCanvasClick,
    handleNodeClick,
    handleCanvasMouseMove,
  };
};
