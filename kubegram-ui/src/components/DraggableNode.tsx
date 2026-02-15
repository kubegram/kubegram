import React, { useRef, memo, useCallback, useState, useEffect } from 'react';
import { Rect, Image as KonvaImage, Group, Circle, Text } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { useCanvasCoordinates } from '@/hooks/canvas/useCanvasCoordinates';
import InfoTooltip from './InfoTooltip';
import SelectionBadgeComponent from './SelectionBadge';
import ConnectionDot from './ConnectionDot';
import type { NodeSide } from '@/types/jsoncanvas';
import type { CanvasNode } from '@/types/canvas';

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
  isMultiSelected?: boolean;
  selectedCount?: number;
  color?: string;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onResize?: (width: number, height: number) => void;
  onClick?: (nodeId: string, x: number, y: number) => void;
  onSelect?: (nodeId: string, isSelected: boolean, isCtrlKey: boolean, isShiftKey: boolean) => void;
  onRightClick?: (nodeId: string, x: number, y: number) => void;
  onDblClick?: (nodeId: string) => void;
  showSelectionHandles?: boolean;
}

const DraggableNode: React.FC<DraggableNodeProps> = memo(
  ({
    id,
    iconSrc,
    label,
    nodeType,
    x,
    y,
    width = 80,
    height = 60,
    isDragging,
    isArrowMode = false,
    isSelected = false,
    isSnapTarget = false,
    isMultiSelected = false,
    selectedCount = 0,
    onDragEnd,
    onDragStart,
    onDragMove,
    onResize,
    onClick,
    onSelect,
    onRightClick,
    onDblClick,
    showSelectionHandles = true,
  }) => {
    const [image] = useImage(iconSrc);
    const nodeRef = useRef<Konva.Group>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [currentWidth, setCurrentWidth] = useState(width);
    const [currentHeight, setCurrentHeight] = useState(height);
    const [showInfo, setShowInfo] = useState(false);
    
    // State for connection point interaction
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [hoveredConnection, setHoveredConnection] = useState<{ side: NodeSide; isHighlighted: boolean } | null>(null);

    const dragMovePendingRef = useRef<Konva.KonvaEventObject<DragEvent> | null>(null);
    const dragMoveRafRef = useRef<number | null>(null);

const { convertScreenToCanvasCoordinates } = useCanvasCoordinates();

    // Create a properly typed CanvasNode for ConnectionDot
    const canvasNode: CanvasNode = {
      id,
      type: nodeType as string, // Use the existing nodeType prop
      nodeType: nodeType as any, // GraphQL field
      label,
      iconSrc,
      x,
      y,
      width: currentWidth,
      height: currentHeight,
      companyId: '', // Required field, will be filled by parent
      name: label, // Required field
      userId: '', // Required field  
    };

    // Mouse tracking for connection points
    const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
      const { x, y } = convertScreenToCanvasCoordinates(e);
      setMousePos({ x, y });
    }, [convertScreenToCanvasCoordinates]);

    // Connection point click handler
    const handleConnectionClick = useCallback((side: NodeSide, x: number, y: number) => {
      console.log('🔗 Connection point clicked:', { id, side, x, y });
      if (onClick) {
        onClick(id, x, y);
      }
    }, [id, onClick]);

    // Connection point hover handler
    const handleConnectionHover = useCallback((side: NodeSide | null) => {
      setHoveredConnection(side ? { side, isHighlighted: true } : null);
    }, []);

    const handleResizeStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true; // Prevent event bubbling
      setIsResizing(true);
    }, []);

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

        // Allow selection with Shift+Click even in arrow mode
        const isShiftClick = e.evt.shiftKey;
        const isCtrlClick = e.evt.ctrlKey || e.evt.metaKey;

        if (isArrowMode && onClick && !isShiftClick) {
          // ARROW MODE (without Shift): Convert screen coordinates to canvas coordinates
          const { x, y } = convertScreenToCanvasCoordinates(e);

          console.log('🚀 Arrow mode - calling parent onClick with:', { id, x, y });
          onClick(id, x, y); // This calls handleNodeClick in KonvaCanvas
        } else if (onSelect) {
          // SELECTION MODE: Handle selection with modifier keys
          console.log('📝 Selection mode - toggling selection for node:', id, { isCtrlClick, isShiftClick, isArrowMode });
          onSelect(id, !isSelected, isCtrlClick, isShiftClick);
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
          stroke={isSnapTarget ? '#00FF00' : isArrowMode ? '#a7a7a7' : '#1A1A1A'}
          strokeWidth={isSnapTarget ? 4 : isArrowMode ? 3 : 2}
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
          onMouseMove={handleMouseMove}
          listening={true}
          cursor={isArrowMode ? 'crosshair' : 'default'}
        />

        {/* Connection Dots for Arrow Mode */}
        {isArrowMode && (
          <>
            <ConnectionDot
              nodeId={id}
              node={canvasNode}
              side="top"
              isArrowMode={isArrowMode}
              mouseX={mousePos.x}
              mouseY={mousePos.y}
              isHovered={hoveredConnection?.side === 'top'}
              isHighlighted={hoveredConnection?.side === 'top'}
              onClick={handleConnectionClick}
              onHover={handleConnectionHover}
            />
            <ConnectionDot
              nodeId={id}
              node={canvasNode}
              side="right"
              isArrowMode={isArrowMode}
              mouseX={mousePos.x}
              mouseY={mousePos.y}
              isHovered={hoveredConnection?.side === 'right'}
              isHighlighted={hoveredConnection?.side === 'right'}
              onClick={handleConnectionClick}
              onHover={handleConnectionHover}
            />
            <ConnectionDot
              nodeId={id}
              node={canvasNode}
              side="bottom"
              isArrowMode={isArrowMode}
              mouseX={mousePos.x}
              mouseY={mousePos.y}
              isHovered={hoveredConnection?.side === 'bottom'}
              isHighlighted={hoveredConnection?.side === 'bottom'}
              onClick={handleConnectionClick}
              onHover={handleConnectionHover}
            />
            <ConnectionDot
              nodeId={id}
              node={canvasNode}
              side="left"
              isArrowMode={isArrowMode}
              mouseX={mousePos.x}
              mouseY={mousePos.y}
              isHovered={hoveredConnection?.side === 'left'}
              isHighlighted={hoveredConnection?.side === 'left'}
              onClick={handleConnectionClick}
              onHover={handleConnectionHover}
            />
          </>
        )}

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
          fill="#1A1A1A"
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

        {/* Corner Selection Handles */}
        {showSelectionHandles && isSelected && (
          <>
            {/* Top-left handle */}
            <Circle
              x={0}
              y={0}
              radius={4}
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth={1}
              shadowColor="black"
              shadowBlur={3}
              shadowOpacity={0.3}
            />
            {/* Top-right handle */}
            <Circle
              x={currentWidth}
              y={0}
              radius={4}
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth={1}
              shadowColor="black"
              shadowBlur={3}
              shadowOpacity={0.3}
            />
            {/* Bottom-left handle */}
            <Circle
              x={0}
              y={currentHeight}
              radius={4}
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth={1}
              shadowColor="black"
              shadowBlur={3}
              shadowOpacity={0.3}
            />
            {/* Bottom-right handle */}
            <Circle
              x={currentWidth}
              y={currentHeight}
              radius={4}
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth={1}
              shadowColor="black"
              shadowBlur={3}
              shadowOpacity={0.3}
            />
          </>
        )}

        {/* Multi-Selection Badge */}
        <SelectionBadgeComponent
          badge={{
            count: selectedCount,
            position: { x: currentWidth - 5, y: -5 },
            visible: isMultiSelected && selectedCount > 1,
            animated: true,
          }}
          size={16}
          backgroundColor="#1E40AF"
        />
      </Group>
    );
  },
);

DraggableNode.displayName = 'DraggableNode';

export default DraggableNode;
