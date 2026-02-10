import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { type ContextMenu } from '../store/slices/canvas/types';

interface CanvasContextMenuProps {
  contextMenu: ContextMenu;
  onDelete: () => void;
}

/**
 * CanvasContextMenu Component
 *
 * Renders the context menu that appears when right-clicking on elements.
 * Provides delete functionality for nodes and arrows.
 */
const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({ contextMenu, onDelete }) => {
  if (!contextMenu.type || !contextMenu.id) {
    return null;
  }

  return (
    <Group x={contextMenu.x} y={contextMenu.y}>
      {/* Background */}
      <Rect
        x={0}
        y={0}
        width={120}
        height={40}
        fill="#2A2A2A"
        stroke="#404040"
        strokeWidth={1}
        cornerRadius={4}
        shadowColor="black"
        shadowBlur={8}
        shadowOpacity={0.3}
      />
      {/* Delete button */}
      <Rect
        x={5}
        y={5}
        width={110}
        height={30}
        fill="#FF4444"
        cornerRadius={2}
        onClick={onDelete}
        onTap={onDelete}
      />
      {/* Delete text */}
      <Text x={15} y={20} text="Delete" fontSize={14} fill="#FFFFFF" fontFamily="Arial" />
    </Group>
  );
};

export default CanvasContextMenu;
