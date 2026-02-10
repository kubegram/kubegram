import type Konva from 'konva';
import React, { useRef, memo, useCallback, useState } from 'react';
import { Arrow as KonvaArrow, Group, Circle, Text } from 'react-konva';
import { type CanvasNode, type CanvasArrow } from '../types/canvas';
import { useCanvasCoordinates } from '../hooks/canvas/useCanvasCoordinates';
import { calculateCollisionAwareSquarePath, lineIntersectsNodes } from '../utils/collision-detection';
import InfoTooltip from './InfoTooltip';

/**
 * Result type for finding elements by coordinates
 */
export interface ElementsByCoordinatesResult {
  nodes: CanvasNode[];
  arrows: CanvasArrow[];
  closestNode: CanvasNode | null;
  closestArrow: CanvasArrow | null;
  closestElement: {
    type: 'node' | 'arrow';
    element: CanvasNode | CanvasArrow;
    distance: number;
  } | null;
}

/**
 * Arrow Component
 *
 * A draggable arrow that connects two nodes with attachable endpoints.
 * Both ends can be dragged to different positions on the connected nodes.
 */
interface ArrowProps {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isDragging?: boolean;
  isSelected?: boolean;
  isSnapped?: boolean;
  isSquareArrow?: boolean;
  isCurvedArrow?: boolean;
  startNodeId?: string;
  endNodeId?: string;
  nodes?: CanvasNode[];
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onStartPointMove?: (x: number, y: number) => void;
  onEndPointMove?: (x: number, y: number) => void;
  onStartPointAttach?: (nodeId: string) => void;
  onEndPointAttach?: (nodeId: string) => void;
  onSelect?: (isSelected: boolean) => void;
  onRightClick?: (arrowId: string, x: number, y: number) => void;
  onGetClickCoordinates?: (e: Konva.KonvaEventObject<MouseEvent>) => { x: number; y: number };
  onFindElementsByCoordinates?: (
    x: number,
    y: number,
    threshold?: number,
  ) => ElementsByCoordinatesResult;
  listening?: boolean;
}

const Arrow: React.FC<ArrowProps> = memo(
  ({
    id,
    startX,
    startY,
    endX,
    endY,
    isDragging = false,
    isSelected = false,
    isSnapped = false,
    isSquareArrow = false,
    isCurvedArrow = false,
    startNodeId,
    endNodeId,
    nodes = [],
    onDragStart,
    onDragEnd,
    onDragMove,
    onStartPointMove,
    onEndPointMove,
    onStartPointAttach,
    onEndPointAttach,
    onSelect,
    onRightClick,
    onGetClickCoordinates,
    onFindElementsByCoordinates,
    listening = true,
  }) => {
    const arrowRef = useRef<Konva.Group>(null);
    const [showInfo, setShowInfo] = useState(false);

    const { convertScreenToCanvasCoordinates } = useCanvasCoordinates();

    // Calculate square arrow path points with collision detection
    const getSquareArrowPoints = useCallback(() => {
      if (!isSquareArrow) {
        return [startX, startY, endX, endY];
      }

      // Use collision-aware path calculation
      const excludeNodeIds = [];
      if (startNodeId) excludeNodeIds.push(startNodeId);
      if (endNodeId) excludeNodeIds.push(endNodeId);

      return calculateCollisionAwareSquarePath(
        startX,
        startY,
        endX,
        endY,
        nodes,
        excludeNodeIds
      );
    }, [startX, startY, endX, endY, isSquareArrow, nodes, startNodeId, endNodeId]);

    // Calculate curved arrow path points
    const getCurvedArrowPoints = useCallback(() => {
      if (!isCurvedArrow) {
        return [startX, startY, endX, endY];
      }

      // Check for collisions and use square path if needed
      const excludeNodeIds = [];
      if (startNodeId) excludeNodeIds.push(startNodeId);
      if (endNodeId) excludeNodeIds.push(endNodeId);

      const hasCollision = lineIntersectsNodes(startX, startY, endX, endY, nodes, excludeNodeIds);

      if (hasCollision) {
        // If there are collisions, use square path instead of curve
        return calculateCollisionAwareSquarePath(
          startX,
          startY,
          endX,
          endY,
          nodes,
          excludeNodeIds,

        );
      }

      // Calculate control points for a smooth curve
      const dx = endX - startX;
      const dy = endY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Control point offset - adjust curve intensity based on distance
      const controlOffset = Math.min(distance * 0.3, 100);

      // Determine curve direction based on the angle
      const angle = Math.atan2(dy, dx);
      const controlAngle = angle + Math.PI / 2; // Perpendicular to the line

      // Calculate control points
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      const controlX1 = midX + Math.cos(controlAngle) * controlOffset;
      const controlY1 = midY + Math.sin(controlAngle) * controlOffset;

      // For a smooth curve, we'll use quadratic bezier curve
      // Konva Arrow doesn't support bezier curves directly, so we'll approximate with multiple points
      const steps = 20;
      const points = [];

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX1 + t * t * endX;
        const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY1 + t * t * endY;
        points.push(x, y);
      }

      return points;
    }, [startX, startY, endX, endY, isCurvedArrow, nodes, startNodeId, endNodeId]);

    // Get the appropriate arrow points based on mode with collision detection
    const getArrowPoints = useCallback(() => {
      // Always check for collisions first
      const excludeNodeIds = [];
      if (startNodeId) excludeNodeIds.push(startNodeId);
      if (endNodeId) excludeNodeIds.push(endNodeId);

      // Check if direct path has collisions
      const hasCollision = lineIntersectsNodes(startX, startY, endX, endY, nodes, excludeNodeIds);

      // Debug logging - only log when there are nodes and potential collisions
      if (nodes.length > 0) {
        console.log('🔍 Arrow collision check:', {
          arrowId: id,
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
          nodeCount: nodes.length,
          excludeNodeIds,
          isSquareArrow,
          isCurvedArrow,
          hasCollision,
          nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y, width: n.width, height: n.height }))
        });
      }

      // If curved arrow mode, handle collisions within getCurvedArrowPoints
      if (isCurvedArrow) {
        return getCurvedArrowPoints();
      }

      // If square arrow mode, use square path calculation
      if (isSquareArrow) {
        return getSquareArrowPoints();
      }

      // For straight arrows, only use collision-aware path if there's an actual collision
      if (hasCollision) {
        console.log('⚠️ Collision detected, using square path to avoid nodes');
        return calculateCollisionAwareSquarePath(startX, startY, endX, endY, nodes, excludeNodeIds);
      }

      // Default: straight line
      return [startX, startY, endX, endY];
    }, [
      isCurvedArrow,
      isSquareArrow,
      getCurvedArrowPoints,
      getSquareArrowPoints,
      startX,
      startY,
      endX,
      endY,
      nodes,
      startNodeId,
      endNodeId,
      id,
    ]);

    /**
     * ARROW CLICK HANDLER - Selection
     *
     * Handles clicks on the arrow for selection purposes.
     * Prevents event bubbling to avoid triggering canvas click handler.
     */
    const handleArrowClick = useCallback(
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        console.log('🎯 Arrow click event:', { id, isSelected });
        e.cancelBubble = true; // Prevent event bubbling to canvas

        // Get click coordinates using the coordinate function
        if (onGetClickCoordinates) {
          const coordinates = onGetClickCoordinates(e);
          console.log('📍 Arrow click coordinates:', coordinates);

          // Find elements at click coordinates
          if (onFindElementsByCoordinates) {
            const foundElements = onFindElementsByCoordinates(coordinates.x, coordinates.y, 30);
            console.log('🔍 Elements found at arrow click:', foundElements);
          }
        }

        if (onSelect) {
          console.log('📝 Toggling arrow selection:', !isSelected);
          onSelect(!isSelected);
        }
      },
      [
        onSelect,
        isSelected,
        id,
        onGetClickCoordinates,
        onFindElementsByCoordinates,
      ],
    );

    /**
     * ARROW RIGHT-CLICK HANDLER - Context Menu
     *
     * Handles right-clicks on the arrow for context menu (delete, etc.).
     * Converts screen coordinates to canvas coordinates for proper positioning.
     */
    const handleArrowRightClick = useCallback(
      (e: Konva.KonvaEventObject<PointerEvent>) => {
        console.log('🎯 Arrow right-click event:', { id });
        e.evt.preventDefault();
        e.cancelBubble = true; // Prevent event bubbling

        if (onRightClick) {
          // Convert screen coordinates to canvas coordinates
          const { x, y } = convertScreenToCanvasCoordinates(e);

          console.log('📋 Opening context menu at:', { x, y });
          onRightClick(id, x, y);
        }
      },
      [id, onRightClick, convertScreenToCanvasCoordinates],
    );

    // Start Point Drag Handlers
    const handleStartPointDragStart = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
      },
      []
    );

    const handleStartPointDragMove = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;

        // Update visual position
        const stage = e.target.getStage();
        if (!stage) return;

        const { x, y } = e.target.position();
        if (onStartPointMove) {
          onStartPointMove(x, y);
        }
      },
      [onStartPointMove]
    );

    const handleStartPointDragEnd = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        const { x, y } = e.target.position();

        // Check for node attachment
        if (onFindElementsByCoordinates && onStartPointAttach) {
          const { closestNode } = onFindElementsByCoordinates(x, y, 30);
          if (closestNode) {
            onStartPointAttach(closestNode.id);
          }
        }

        // Ensure final position update
        if (onStartPointMove) {
          onStartPointMove(x, y);
        }
      },
      [onFindElementsByCoordinates, onStartPointAttach, onStartPointMove]
    );

    // End Point Drag Handlers
    const handleEndPointDragStart = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
      },
      []
    );

    const handleEndPointDragMove = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;

        const { x, y } = e.target.position();
        if (onEndPointMove) {
          onEndPointMove(x, y);
        }
      },
      [onEndPointMove]
    );

    const handleEndPointDragEnd = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        const { x, y } = e.target.position();

        // Check for node attachment
        if (onFindElementsByCoordinates && onEndPointAttach) {
          const { closestNode } = onFindElementsByCoordinates(x, y, 30);
          if (closestNode) {
            onEndPointAttach(closestNode.id);
          }
        }

        if (onEndPointMove) {
          onEndPointMove(x, y);
        }
      },
      [onFindElementsByCoordinates, onEndPointAttach, onEndPointMove]
    );

    return (
      <Group
        ref={arrowRef}
        draggable={isDragging}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragMove={onDragMove}
        onClick={handleArrowClick}
        onContextMenu={handleArrowRightClick}
        listening={listening}
      >
        {/* Main arrow line */}
        <KonvaArrow
          points={getArrowPoints()}
          stroke={isSelected ? '#FF0000' : isSnapped ? '#00FF00' : '#a7a7a7'}
          strokeWidth={isSelected ? 4 : isSnapped ? 3 : 2}
          fill={isSelected ? '#FF0000' : isSnapped ? '#00FF00' : '#a7a7a7'}
          pointerLength={10}
          pointerWidth={9}
          shadowColor={isSnapped ? '#00FF00' : 'black'}
          shadowBlur={isSnapped ? 12 : 4}
          shadowOpacity={isSnapped ? 0.6 : 0.3}
        />

        {/* Arrow drag handles - Always visible, more prominent when selected */}
        <>
          {/* Start point handle (tail) */}
          <Circle
            x={startX}
            y={startY}
            radius={isSelected ? 6 : 4}
            fill={startNodeId ? '#00FF00' : '#FF9900'}
            stroke="#FFFFFF"
            strokeWidth={isSelected ? 2 : 1}
            draggable
            onDragStart={handleStartPointDragStart}
            onDragMove={handleStartPointDragMove}
            onDragEnd={handleStartPointDragEnd}
            shadowColor="black"
            shadowBlur={isSelected ? 4 : 2}
            shadowOpacity={isSelected ? 0.3 : 0.2}
            opacity={isSelected ? 1 : 0.7}
          />

          {/* End point handle (head) */}
          <Circle
            x={endX}
            y={endY}
            radius={isSelected ? 6 : 4}
            fill={endNodeId ? '#00FF00' : '#FF9900'}
            stroke="#FFFFFF"
            strokeWidth={isSelected ? 2 : 1}
            draggable
            onDragStart={handleEndPointDragStart}
            onDragMove={handleEndPointDragMove}
            onDragEnd={handleEndPointDragEnd}
            shadowColor="black"
            shadowBlur={isSelected ? 4 : 2}
            shadowOpacity={isSelected ? 0.3 : 0.2}
            opacity={isSelected ? 1 : 0.7}
          />
        </>

        {/* Info Icon - Shows at midpoint when selected */}
        {isSelected && (
          <Group
            x={(startX + endX) / 2}
            y={(startY + endY) / 2}
            onClick={(e) => {
              e.cancelBubble = true;
              setShowInfo(!showInfo);
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              setShowInfo(!showInfo);
            }}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                const container = stage.container();
                container.style.cursor = 'pointer';
              }
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                const container = stage.container();
                container.style.cursor = 'default';
              }
            }}
          >
            <Circle
              radius={10}
              fill="#2196F3"
              stroke="#FFFFFF"
              strokeWidth={2}
              shadowColor="black"
              shadowBlur={4}
              shadowOpacity={0.3}
            />
            <Text
              x={-4}
              y={-6}
              text="i"
              fontSize={14}
              fontStyle="bold"
              fill="white"
            />
          </Group>
        )}

        {/* Info Tooltip */}
        <InfoTooltip
          x={(startX + endX) / 2}
          y={(startY + endY) / 2}
          visible={showInfo && isSelected}
          data={{
            'ID': id,
            'Type': 'Arrow',
            'Start Node': startNodeId || 'None',
            'End Node': endNodeId || 'None',
            'Mode': isSquareArrow ? 'Square' : isCurvedArrow ? 'Curved' : 'Straight',
          }}
        />
      </Group>
    );
  },
);

Arrow.displayName = 'Arrow';

export default Arrow;
