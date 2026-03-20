import React from 'react';
import { Circle } from 'react-konva';
import type { SelectionHandle } from '@/types/jsoncanvas';

interface ResizeHandleProps {
  handle: SelectionHandle;
  size?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOpacity?: number;
  onDragStart?: (handle: SelectionHandle) => void;
  onDragMove?: (handle: SelectionHandle, x: number, y: number) => void;
  onDragEnd?: (handle: SelectionHandle) => void;
  onMouseEnter?: (handle: SelectionHandle) => void;
  onMouseLeave?: (handle: SelectionHandle) => void;
}

/**
 * ResizeHandle Component
 * 
 * Interactive resize handle for selection boxes and elements.
 * Features hover effects, drag functionality, and configurable styling.
 */
const ResizeHandle: React.FC<ResizeHandleProps> = ({
  handle,
  size = 8,
  fillColor = '#FFFFFF',
  strokeColor = '#3B82F6',
  strokeWidth = 2,
  shadowColor = 'black',
  shadowBlur = 4,
  shadowOpacity = 0.3,
  onDragStart,
  onDragMove,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
}) => {
  const handleMouseEnter = (e: any) => {
    const stage = e.target.getStage();
    if (stage) {
      const container = stage.container();
      container.style.cursor = handle.cursor;
    }
    onMouseEnter?.(handle);
  };

  const handleMouseLeave = (e: any) => {
    const stage = e.target.getStage();
    if (stage) {
      const container = stage.container();
      container.style.cursor = 'default';
    }
    onMouseLeave?.(handle);
  };

  const handleDragStart = (e: any) => {
    e.cancelBubble = true;
    onDragStart?.(handle);
  };

  const handleDragMove = (e: any) => {
    e.cancelBubble = true;
    onDragMove?.(handle, e.target.x(), e.target.y());
  };

  const handleDragEnd = (e: any) => {
    e.cancelBubble = true;
    onDragEnd?.(handle);
  };

  return (
    <Circle
      x={handle.position.x}
      y={handle.position.y}
      radius={size}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      draggable
      shadowColor={shadowColor}
      shadowBlur={shadowBlur}
      shadowOpacity={shadowOpacity}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    />
  );
};

export default ResizeHandle;