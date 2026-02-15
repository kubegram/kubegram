import React, { useMemo } from 'react';
import { Rect, Group } from 'react-konva';
import type { SelectionRect, SelectionHandle, ResizeHandleType } from '@/types/jsoncanvas';
import ResizeHandle from './ResizeHandle';
import SelectionBadgeComponent from './SelectionBadge';

interface CanvasSelectionProps {
  isSelecting: boolean;
  selectionRect: SelectionRect | null;
  selectedCount?: number;
  showResizeHandles?: boolean;
  showSelectionBadge?: boolean;
  onResizeStart?: (handleType: ResizeHandleType) => void;
  onResizeMove?: (handleType: ResizeHandleType, x: number, y: number) => void;
  onResizeEnd?: (handleType: ResizeHandleType) => void;
}

/**
 * CanvasSelection Component
 *
 * Enhanced selection rectangle with resize handles and selection badge.
 * Handles visual feedback for group selection and provides interactive resize functionality.
 */
const CanvasSelection: React.FC<CanvasSelectionProps> = ({
  isSelecting,
  selectionRect,
  selectedCount = 0,
  showResizeHandles = true,
  showSelectionBadge = true,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
}) => {
  if (!isSelecting || !selectionRect) {
    return null;
  }

  // Generate resize handles for corners and edges
  const resizeHandles = useMemo((): SelectionHandle[] => {
    if (!selectionRect || !showResizeHandles) return [];

    const { x, y, width, height } = selectionRect;
    const handles: SelectionHandle[] = [
      // Corner handles
      { type: 'nw', position: { x, y }, cursor: 'nw-resize' },
      { type: 'ne', position: { x: width, y }, cursor: 'ne-resize' },
      { type: 'se', position: { x: width, y: height }, cursor: 'se-resize' },
      { type: 'sw', position: { x, y: height }, cursor: 'sw-resize' },
      // Edge handles
      { type: 'n', position: { x: width / 2, y }, cursor: 'n-resize' },
      { type: 'e', position: { x: width, y: height / 2 }, cursor: 'e-resize' },
      { type: 's', position: { x: width / 2, y: height }, cursor: 's-resize' },
      { type: 'w', position: { x, y: height / 2 }, cursor: 'w-resize' },
    ];

    return handles;
  }, [selectionRect, showResizeHandles]);

  // Selection badge position (top-right corner of selection rect)
  const selectionBadge = useMemo(() => ({
    count: selectedCount,
    position: { x: selectionRect.width + 5, y: -10 },
    visible: showSelectionBadge && selectedCount > 1,
    animated: true,
  }), [selectedCount, selectionRect, showSelectionBadge]);

  return (
    <Group>
      {/* Selection rectangle */}
      <Rect
        x={selectionRect.x}
        y={selectionRect.y}
        width={selectionRect.width}
        height={selectionRect.height}
        fill="rgba(59, 130, 246, 0.1)"
        stroke="#3B82F6"
        strokeWidth={2}
        dash={[5, 5]}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Resize handles */}
      {resizeHandles.map((handle) => (
        <ResizeHandle
          key={handle.type}
          handle={handle}
          size={6}
          fillColor="#FFFFFF"
          strokeColor="#3B82F6"
          strokeWidth={2}
          shadowBlur={3}
          shadowOpacity={0.4}
          onDragStart={() => onResizeStart?.(handle.type)}
          onDragMove={(_, x, y) => onResizeMove?.(handle.type, x, y)}
          onDragEnd={() => onResizeEnd?.(handle.type)}
        />
      ))}

      {/* Selection badge */}
      <SelectionBadgeComponent
        badge={selectionBadge}
        backgroundColor="#1E40AF"
        animated={true}
      />
    </Group>
  );
};

export default CanvasSelection;
