import React from 'react';
import Arrow from './Arrow';
import { type CanvasNode } from '@/types/canvas';

interface CanvasArrowDrawingProps {
  isDrawingArrow: boolean;
  arrowStart: { nodeId: string; x: number; y: number } | null;
  tempArrowEnd: { x: number; y: number } | null;
  isSquareArrowMode: boolean;
  isCurvedArrowMode: boolean;
  nodes: CanvasNode[];
  isSnapped?: boolean;
  arrowSnapTarget?: string | null;
}

/**
 * CanvasArrowDrawing Component
 *
 * Renders the temporary arrow preview when the user is drawing an arrow.
 * This provides visual feedback during the arrow drawing process.
 */
const CanvasArrowDrawing: React.FC<CanvasArrowDrawingProps> = ({
  isDrawingArrow,
  arrowStart,
  tempArrowEnd,
  isSquareArrowMode,
  isCurvedArrowMode,
  nodes,
  isSnapped = false,
  arrowSnapTarget = null,
}) => {
  if (!isDrawingArrow || !arrowStart || !tempArrowEnd) {
    return null;
  }

  return (
    <Arrow
      id="temp-arrow"
      startX={arrowStart.x}
      startY={arrowStart.y}
      endX={tempArrowEnd.x}
      endY={tempArrowEnd.y}
      isSquareArrow={isSquareArrowMode}
      isCurvedArrow={isCurvedArrowMode}
      startNodeId={arrowStart.nodeId !== 'free' ? arrowStart.nodeId : undefined}
      endNodeId={arrowSnapTarget || undefined}
      nodes={nodes}
      isSnapped={isSnapped}
      listening={false}
    />
  );
};

export default CanvasArrowDrawing;
