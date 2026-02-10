import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { type CanvasNode } from '@/types/canvas';

interface CanvasGroupMovementProps {
  isGroupMoving: boolean;
  groupMoveOffset: { x: number; y: number } | null;
  selectedNodes: string[];
  nodes: CanvasNode[];
}

/**
 * CanvasGroupMovement Component
 *
 * Renders the preview of nodes being moved during group movement.
 * This provides visual feedback showing where the nodes will be positioned.
 */
const CanvasGroupMovement: React.FC<CanvasGroupMovementProps> = ({
  isGroupMoving,
  groupMoveOffset,
  selectedNodes,
  nodes,
}) => {
  if (!isGroupMoving || !groupMoveOffset) {
    return null;
  }

  return (
    <>
      {selectedNodes.map((nodeId) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return null;

        return (
          <Group key={`group-move-${nodeId}`}>
            {/* Preview node position */}
            <Rect
              x={node.x + groupMoveOffset.x}
              y={node.y + groupMoveOffset.y}
              width={node.width}
              height={node.height}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3B82F6"
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
            />
            {/* Preview node icon */}
            <Text
              x={node.x + groupMoveOffset.x + node.width / 2 - 8}
              y={node.y + groupMoveOffset.y + node.height / 2 - 8}
              text="📦"
              fontSize={16}
              listening={false}
            />
          </Group>
        );
      })}
    </>
  );
};

export default CanvasGroupMovement;
