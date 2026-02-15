import type Konva from 'konva';
import React, { useRef, memo, useCallback, useState, useEffect } from 'react';
import { Arrow as KonvaArrow, Group, Circle, Text, Line } from 'react-konva';
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
  // Animation props (opt-in, used by JSON Canvas editor)
  isFlowAnimated?: boolean;
  isPulsing?: boolean;
  animateIn?: boolean;
  onAnimateInComplete?: () => void;
  // Arrow body dragging props
  onArrowDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onArrowDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onArrowDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
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
    isFlowAnimated = false,
    isPulsing = false,
    animateIn = false,
    onAnimateInComplete,
    onArrowDragStart,
    onArrowDragMove,
    onArrowDragEnd,
  }) => {
    const arrowRef = useRef<Konva.Group>(null);
    const flowLineRef = useRef<Konva.Line>(null);

    // Arrow body dragging state
    const [isDraggingArrow, setIsDraggingArrow] = useState(false);
    const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
    const [preservedPath, setPreservedPath] = useState<number[]>([]);
    const [preservedDelta, setPreservedDelta] = useState({ x: 0, y: 0 });
    const glowLineRef = useRef<Konva.Line>(null);
    const flowRafRef = useRef<number | null>(null);
    const pulseRafRef = useRef<number | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    // Draw-in animation state
    const [animEndX, setAnimEndX] = useState(animateIn ? startX : endX);
    const [animEndY, setAnimEndY] = useState(animateIn ? startY : endY);

    const { convertScreenToCanvasCoordinates } = useCanvasCoordinates();

    // --- Flow animation (animated dashes) ---
    useEffect(() => {
      if (!isFlowAnimated) {
        if (flowRafRef.current !== null) {
          cancelAnimationFrame(flowRafRef.current);
          flowRafRef.current = null;
        }
        return;
      }
      let offset = 0;
      const animate = () => {
        offset += 2;
        const node = flowLineRef.current;
        if (node) {
          node.dashOffset(-offset);
          node.getLayer()?.batchDraw();
        }
        flowRafRef.current = requestAnimationFrame(animate);
      };
      flowRafRef.current = requestAnimationFrame(animate);
      return () => {
        if (flowRafRef.current !== null) {
          cancelAnimationFrame(flowRafRef.current);
          flowRafRef.current = null;
        }
      };
    }, [isFlowAnimated]);

    // --- Pulse / glow animation ---
    useEffect(() => {
      if (!isPulsing) {
        if (pulseRafRef.current !== null) {
          cancelAnimationFrame(pulseRafRef.current);
          pulseRafRef.current = null;
        }
        return;
      }
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = (now - startTime) / 1000; // seconds
        const opacity = 0.1 + 0.3 * (0.5 + 0.5 * Math.sin(elapsed * Math.PI)); // ~2s period
        const node = glowLineRef.current;
        if (node) {
          node.opacity(opacity);
          node.getLayer()?.batchDraw();
        }
        pulseRafRef.current = requestAnimationFrame(animate);
      };
      pulseRafRef.current = requestAnimationFrame(animate);
      return () => {
        if (pulseRafRef.current !== null) {
          cancelAnimationFrame(pulseRafRef.current);
          pulseRafRef.current = null;
        }
      };
    }, [isPulsing]);

    // --- Draw-in animation ---
    useEffect(() => {
      if (!animateIn) {
        // Sync to actual endpoints when not animating
        setAnimEndX(endX);
        setAnimEndY(endY);
        return;
      }
      const duration = 400; // ms
      const start = performance.now();
      const fromX = startX;
      const fromY = startY;
      let rafId: number;
      const animate = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - t, 3);
        setAnimEndX(fromX + (endX - fromX) * ease);
        setAnimEndY(fromY + (endY - fromY) * ease);
        if (t < 1) {
          rafId = requestAnimationFrame(animate);
        } else {
          onAnimateInComplete?.();
        }
      };
      rafId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafId);
    }, [animateIn]); // Only run when animateIn changes

    // Keep animated endpoints in sync when not animating in
    useEffect(() => {
      if (!animateIn) {
        setAnimEndX(endX);
        setAnimEndY(endY);
      }
    }, [endX, endY, animateIn]);

    // Effective end coordinates (use animated values when draw-in is active)
    const effectiveEndX = animateIn ? animEndX : endX;
    const effectiveEndY = animateIn ? animEndY : endY;

    // Calculate square arrow path points with collision detection
    const getSquareArrowPoints = useCallback(() => {
      if (!isSquareArrow) {
        return [startX, startY, effectiveEndX, effectiveEndY];
      }

      // Use collision-aware path calculation
      const excludeNodeIds = [];
      if (startNodeId) excludeNodeIds.push(startNodeId);
      if (endNodeId) excludeNodeIds.push(endNodeId);

      return calculateCollisionAwareSquarePath(
        startX,
        startY,
        effectiveEndX,
        effectiveEndY,
        nodes,
        excludeNodeIds
      );
    }, [startX, startY, effectiveEndX, effectiveEndY, isSquareArrow, nodes, startNodeId, endNodeId]);

    // Calculate curved arrow path points
    const getCurvedArrowPoints = useCallback(() => {
      if (!isCurvedArrow) {
        return [startX, startY, effectiveEndX, effectiveEndY];
      }

      // Check for collisions and use square path if needed
      const excludeNodeIds = [];
      if (startNodeId) excludeNodeIds.push(startNodeId);
      if (endNodeId) excludeNodeIds.push(endNodeId);

      const hasCollision = lineIntersectsNodes(startX, startY, effectiveEndX, effectiveEndY, nodes, excludeNodeIds);

      if (hasCollision) {
        // If there are collisions, use square path instead of curve
        return calculateCollisionAwareSquarePath(
          startX,
          startY,
          effectiveEndX,
          effectiveEndY,
          nodes,
          excludeNodeIds,

        );
      }

      // Calculate control points for a smooth curve
      const dx = effectiveEndX - startX;
      const dy = effectiveEndY - startY;
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
        const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX1 + t * t * effectiveEndX;
        const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY1 + t * t * effectiveEndY;
        points.push(x, y);
      }

      return points;
    }, [startX, startY, effectiveEndX, effectiveEndY, isCurvedArrow, nodes, startNodeId, endNodeId]);

    // Get the appropriate arrow points based on mode with collision detection
    const getArrowPoints = useCallback(() => {
      // Use preserved path if we're dragging the arrow body
      if (isDraggingArrow && preservedPath.length > 0) {
        // Transform the preserved path by the current delta
        const transformedPath = [];
        for (let i = 0; i < preservedPath.length; i += 2) {
          transformedPath.push(preservedPath[i] + preservedDelta.x);
          transformedPath.push(preservedPath[i + 1] + preservedDelta.y);
        }
        return transformedPath;
      }

      // Always check for collisions first
      const excludeNodeIds = [];
      if (startNodeId) excludeNodeIds.push(startNodeId);
      if (endNodeId) excludeNodeIds.push(endNodeId);

      // Check if direct path has collisions
      const hasCollision = lineIntersectsNodes(startX, startY, effectiveEndX, effectiveEndY, nodes, excludeNodeIds);

      // Debug logging - only log when there are nodes and potential collisions
      if (nodes.length > 0) {
        console.log('🔍 Arrow collision check:', {
          arrowId: id,
          start: { x: startX, y: startY },
          end: { x: effectiveEndX, y: effectiveEndY },
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
        return calculateCollisionAwareSquarePath(startX, startY, effectiveEndX, effectiveEndY, nodes, excludeNodeIds);
      }

      // Default: straight line
      return [startX, startY, effectiveEndX, effectiveEndY];
    }, [
      isCurvedArrow,
      isSquareArrow,
      getCurvedArrowPoints,
      getSquareArrowPoints,
      startX,
      startY,
      effectiveEndX,
      effectiveEndY,
      nodes,
      startNodeId,
      endNodeId,
      id,
      isDraggingArrow,
      preservedPath,
      preservedDelta,
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

    /**
     * ARROW BODY DRAG HANDLERS - Path Preservation
     *
     * Handles dragging of the entire arrow while preserving its path shape.
     * Captures the calculated path before drag and transforms it during movement.
     */
    const handleArrowDragStart = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        setIsDraggingArrow(true);
        
        // Capture the current calculated path
        const currentPath = getArrowPoints();
        setPreservedPath(currentPath);
        
        // Store initial drag position
        const pos = e.target.position();
        setDragStartPosition({ x: pos.x, y: pos.y });
        
        onArrowDragStart?.(e);
      },
      [getArrowPoints, onArrowDragStart],
    );

    const handleArrowDragMove = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        
        if (!isDraggingArrow) return;
        
        const stage = e.target.getStage();
        if (!stage) return;
        
        const currentPos = e.target.position();
        const deltaX = currentPos.x - dragStartPosition.x;
        const deltaY = currentPos.y - dragStartPosition.y;
        
        setPreservedDelta({ x: deltaX, y: deltaY });
        
        onArrowDragMove?.(e);
      },
      [isDraggingArrow, dragStartPosition, onArrowDragMove],
    );

    const handleArrowDragEnd = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        setIsDraggingArrow(false);
        setPreservedPath([]);
        setPreservedDelta({ x: 0, y: 0 });
        
        onArrowDragEnd?.(e);
      },
      [onArrowDragEnd],
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
        {/* Pulse/glow layer (behind everything) */}
        {isPulsing && (
          <Line
            ref={glowLineRef}
            points={getArrowPoints()}
            stroke={isSnapped ? '#00FF00' : '#a7a7a7'}
            strokeWidth={(isSnapped ? 3 : 2) + 6}
            opacity={0.1}
            lineCap="round"
            lineJoin="round"
            listening={false}
          />
        )}

        {/* Flow animation layer (animated dashes) */}
        {isFlowAnimated && (
          <Line
            ref={flowLineRef}
            points={getArrowPoints()}
            stroke="#4FC3F7"
            strokeWidth={(isSnapped ? 3 : 2) + 1}
            opacity={0.4}
            dash={[12, 8]}
            lineCap="round"
            lineJoin="round"
            listening={false}
          />
        )}

        {/* Main arrow line */}
        <KonvaArrow
          points={getArrowPoints()}
          stroke={isSnapped ? '#00FF00' : '#a7a7a7'}
          strokeWidth={isSnapped ? 3 : 2}
          fill={isSnapped ? '#00FF00' : '#a7a7a7'}
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
            x={effectiveEndX}
            y={effectiveEndY}
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
            x={(startX + effectiveEndX) / 2}
            y={(startY + effectiveEndY) / 2}
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
          x={(startX + effectiveEndX) / 2}
          y={(startY + effectiveEndY) / 2}
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
