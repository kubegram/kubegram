import React, { useCallback } from 'react';
import { Group, Circle, Text } from 'react-konva';
import { type CanvasNode, type CanvasArrow } from '@/types/canvas';

interface CanvasDeleteButtonsProps {
  selectedNodes: string[];
  selectedArrows: string[];
  nodes: CanvasNode[];
  arrows: CanvasArrow[];
  onDeleteNode: (nodeId: string) => void;
  onDeleteArrow: (arrowId: string) => void;
}

/**
 * CanvasDeleteButtons Component
 *
 * Renders delete buttons for selected elements (nodes, arrows).
 * Each button appears near the selected element and provides a quick way to delete it.
 */
const CanvasDeleteButtons: React.FC<CanvasDeleteButtonsProps> = ({
  selectedNodes,
  selectedArrows,
  nodes,
  arrows,
  onDeleteNode,
  onDeleteArrow,
}) => {
  // Delete button component for selected elements - memoized
  const DeleteButton = useCallback(
    ({ x, y, onDelete }: { x: number; y: number; onDelete: () => void }) => {
      return (
        <Group x={x} y={y}>
          {/* Background circle */}
          <Circle
            x={0}
            y={0}
            radius={12}
            fill="#FF4444"
            stroke="#FFFFFF"
            strokeWidth={2}
            shadowColor="black"
            shadowBlur={4}
            shadowOpacity={0.3}
          />
          {/* X icon */}
          <Text
            x={-4}
            y={-6}
            text="×"
            fontSize={16}
            fill="#FFFFFF"
            fontFamily="Arial"
            fontStyle="bold"
          />
          {/* Invisible clickable area */}
          <Circle x={0} y={0} radius={16} fill="transparent" onClick={onDelete} onTap={onDelete} />
        </Group>
      );
    },
    [],
  );

  return (
    <>
      {/* Delete buttons for selected nodes */}
      {selectedNodes.map((nodeId) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return null;

        return (
          <DeleteButton
            key={`delete-node-${nodeId}`}
            x={node.x + node.width + 10}
            y={node.y - 10}
            onDelete={() => onDeleteNode(nodeId)}
          />
        );
      })}

      {/* Delete buttons for selected arrows */}
      {selectedArrows.map((arrowId) => {
        const arrow = arrows.find((a) => a.id === arrowId);
        if (!arrow) return null;

        // Position delete button at the center of the arrow
        const centerX = (arrow.startX + arrow.endX) / 2;
        const centerY = (arrow.startY + arrow.endY) / 2;

        return (
          <DeleteButton
            key={`delete-arrow-${arrowId}`}
            x={centerX}
            y={centerY - 20}
            onDelete={() => onDeleteArrow(arrowId)}
          />
        );
      })}
    </>
  );
};

export default CanvasDeleteButtons;
