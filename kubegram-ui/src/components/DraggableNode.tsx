import React, { useRef, memo, useCallback, useState, useEffect } from 'react';
import { Rect, Image as KonvaImage, Group, Circle, Text } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { useCanvasCoordinates } from '@/hooks/canvas/useCanvasCoordinates';
import InfoTooltip from './InfoTooltip';

/**
 * DraggableNode Component
 *
 * A draggable and resizable component that displays a rectangle with an icon.
 * This component is used to show the dragged item during drag operations.
 */
interface DraggableNodeProps {
  id: string;
  iconSrc: string;
  nodeType: string;
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  isDragging: boolean;
  isArrowMode?: boolean;
  isSelected?: boolean;
  isSnapTarget?: boolean;
  color?: string;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onResize?: (width: number, height: number) => void;
  onClick?: (nodeId: string, x: number, y: number) => void;
  onSelect?: (isSelected: boolean) => void;
  onRightClick?: (nodeId: string, x: number, y: number) => void;
  onDblClick?: (nodeId: string) => void;
}

const DraggableNode: React.FC<DraggableNodeProps> = memo(
  ({
    id,
    iconSrc,
    label,
    x,
    y,
    width = 80,
    height = 60,
    isDragging,
    isArrowMode = false,
    isSelected = false,
    isSnapTarget = false,
    onDragEnd,
    onDragStart,
    onDragMove,
    onResize,
    onClick,
    onSelect,
    onRightClick,
    onDblClick,
  }) => {
    const [image] = useImage(iconSrc);
    const nodeRef = useRef<Konva.Group>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [currentWidth, setCurrentWidth] = useState(width);
    const [currentHeight, setCurrentHeight] = useState(height);
    const [showInfo, setShowInfo] = useState(false);

    const dragMovePendingRef = useRef<Konva.KonvaEventObject<DragEvent> | null>(null);
    const dragMoveRafRef = useRef<number | null>(null);

    const { convertScreenToCanvasCoordinates } = useCanvasCoordinates();

    // Handle resize
    const handleResize = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true; // Prevent event bubbling
        const newWidth = Math.max(90, e.target.x());
        const newHeight = Math.max(60, e.target.y());
        setCurrentWidth(newWidth);
        setCurrentHeight(newHeight);
        if (onResize) {
          onResize(newWidth, newHeight);
        }
      },
      [onResize],
    );

    const handleResizeEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true; // Prevent event bubbling
      setIsResizing(false);
    }, []);

    const handleResizeStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true; // Prevent event bubbling
      setIsResizing(true);
    }, []);

    const handleDragMoveRaf = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        if (!onDragMove) return;
        dragMovePendingRef.current = e;
        if (dragMoveRafRef.current !== null) return;
        dragMoveRafRef.current = requestAnimationFrame(() => {
          const ev = dragMovePendingRef.current;
          dragMoveRafRef.current = null;
          if (!ev) return;
          onDragMove(ev);
        });
      },
      [onDragMove],
    );

    useEffect(() => {
      return () => {
        if (dragMoveRafRef.current !== null) {
          cancelAnimationFrame(dragMoveRafRef.current);
          dragMoveRafRef.current = null;
        }
      };
    }, []);

    /**
     * NODE CLICK HANDLER - Arrow Mode vs Selection Mode
     *
     * This handles clicks on the node rectangle. The behavior depends on the mode:
     *
     * ARROW MODE:
     * - Calls the parent's onClick handler with node ID and click coordinates
     * - This allows the parent to handle arrow drawing logic
     * - Prevents event bubbling to avoid canvas click handler
     *
     * SELECTION MODE:
     * - Toggles the node's selection state
     * - Used for multi-selection and group operations
     */
    const handleNodeClick = useCallback(
      (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        console.log('🎯 DraggableNode click event:', {
          id,
          isArrowMode,
          onClick: !!onClick,
          onSelect: !!onSelect,
          isSelected,
        });

        // Prevent event bubbling to canvas click handler
        e.cancelBubble = true;

        if (isArrowMode && onClick) {
          // ARROW MODE: Convert screen coordinates to canvas coordinates
          const { x, y } = convertScreenToCanvasCoordinates(e);

          console.log('🚀 Arrow mode - calling parent onClick with:', { id, x, y });
          onClick(id, x, y); // This calls handleNodeClick in KonvaCanvas
        } else if (onSelect) {
          // SELECTION MODE: Toggle selection state
          console.log('📝 Selection mode - toggling selection for node:', id);
          onSelect(!isSelected);
        } else {
          console.log('❌ No handler available for node click');
        }
      },
      [id, isArrowMode, onClick, onSelect, isSelected, convertScreenToCanvasCoordinates],
    );

    const handleNodeRightClick = useCallback(
      (e: Konva.KonvaEventObject<PointerEvent>) => {
        e.evt.preventDefault();
        e.cancelBubble = true;

        if (onRightClick) {
          const { x, y } = convertScreenToCanvasCoordinates(e);
          onRightClick(id, x, y);
        }
      },
      [id, onRightClick, convertScreenToCanvasCoordinates],
    );

    return (
      <Group
        ref={nodeRef}
        x={x}
        y={y}
        draggable={!isResizing && !isArrowMode}
        onDragStart={onDragStart}
        onDragMove={handleDragMoveRaf}
        onDragEnd={onDragEnd}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.6}
        shadowOffsetX={isDragging ? 10 : 5}
        shadowOffsetY={isDragging ? 10 : 5}
        scaleX={isDragging ? 1.1 : 1}
        scaleY={isDragging ? 1.1 : 1}
      >
        {/* Regular Node Background */}
        <Rect
          width={currentWidth}
          height={currentHeight}
          fill="rgba(200, 200, 200, 0.15)"
          stroke={isSelected ? '#FF0000' : isSnapTarget ? '#00FF00' : isArrowMode ? '#a7a7a7' : '#1A1A1A'}
          strokeWidth={isSelected ? 4 : isSnapTarget ? 4 : isArrowMode ? 3 : 2}
          shadowColor={isSnapTarget ? '#00FF00' : isArrowMode ? '#a7a7a7' : 'transparent'}
          shadowBlur={isSnapTarget ? 20 : isArrowMode ? 12 : 0}
          shadowOpacity={isSnapTarget ? 0.8 : isArrowMode ? 0.4 : 0}
          cornerRadius={8}
          onClick={handleNodeClick}
          onTap={handleNodeClick}
          onDblClick={(e) => {
            e.cancelBubble = true;
            if (onDblClick) {
              onDblClick(id);
            }
          }}
          onContextMenu={handleNodeRightClick}
          listening={true}
          cursor={isArrowMode ? 'crosshair' : 'default'}
        />

        {/* Regular Node Icon */}
        {image && (
          <KonvaImage
            image={image}
            x={currentWidth / 2 - currentWidth * 0.25}
            y={currentHeight / 2 - currentHeight * 0.25}
            width={currentWidth * 0.5}
            height={currentHeight * 0.5}
          />
        )}

        {/* Node Label */}
        <Text
          text={label}
          x={0}
          y={currentHeight - 20}
          width={currentWidth}
          align="center"
          fontSize={12}
          fontFamily="Inter, sans-serif"
          fill={isSelected ? '#FF0000' : '#1A1A1A'}
          fontStyle="bold"
          listening={false}
        />

        {/* Resize Handle */}
        {!isArrowMode && (
          <Circle
            x={currentWidth - 8}
            y={currentHeight - 8}
            radius={6}
            fill="#1A1A1A"
            stroke="#FFFFFF"
            strokeWidth={1}
            draggable
            onDragMove={handleResize}
            onDragStart={handleResizeStart}
            onDragEnd={handleResizeEnd}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                const container = stage.container();
                container.style.cursor = 'nw-resize';
              }
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) {
                const container = stage.container();
                container.style.cursor = 'default';
              }
            }}
            shadowColor="black"
            shadowBlur={4}
            shadowOpacity={0.3}
          />
        )}

        {/* Info Icon - Shows when selected */}
        {isSelected && (
          <Group
            x={currentWidth - 20}
            y={6}
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
              radius={8}
              fill="#2196F3"
              stroke="#FFFFFF"
              strokeWidth={1}
              shadowColor="black"
              shadowBlur={4}
              shadowOpacity={0.3}
            />
            <Text
              x={-3}
              y={-5}
              text="i"
              fontSize={12}
              fontStyle="bold"
              fill="white"
            />
          </Group>
        )}

        {/* Info Tooltip */}
        <InfoTooltip
          x={currentWidth}
          y={currentHeight / 2}
          visible={showInfo && isSelected}
          data={{
            'ID': id,
            'Type': 'Node',
            'X': Math.round(x),
            'Y': Math.round(y),
            'Width': currentWidth,
            'Height': currentHeight,
          }}
        />
      </Group>
    );
  },
);

DraggableNode.displayName = 'DraggableNode';

export default DraggableNode;
