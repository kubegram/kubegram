import React from 'react';
import { Rect } from 'react-konva';

interface CanvasSelectionProps {
  isSelecting: boolean;
  selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

/**
 * CanvasSelection Component
 *
 * Renders the selection rectangle when the user is selecting multiple elements.
 * This component handles the visual feedback for group selection.
 */
const CanvasSelection: React.FC<CanvasSelectionProps> = ({ isSelecting, selectionRect }) => {
  if (!isSelecting || !selectionRect) {
    return null;
  }

  return (
    <Rect
      x={selectionRect.x}
      y={selectionRect.y}
      width={selectionRect.width}
      height={selectionRect.height}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="#3B82F6"
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  );
};

export default CanvasSelection;
