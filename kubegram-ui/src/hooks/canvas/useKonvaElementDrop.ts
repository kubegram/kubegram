import { useCallback } from 'react';
import type { CanvasNode } from '@/types/canvas';
import { GraphQL } from '@/lib/graphql-client';

/**
 * Hook for handling element drops on Konva canvas
 *
 * This hook provides functionality to:
 * - Handle drag and drop events for adding new nodes
 * - Convert screen coordinates to canvas coordinates
 * - Create new nodes with proper positioning
 * - Trigger callbacks when elements are dropped
 */
export const useKonvaElementDrop = (
  onElementDropped: (node: CanvasNode) => void,
  onDropError?: (error: string) => void,
) => {
  /**
   * Handle drag over events - prevents default behavior and sets drop effect
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  /**
   * Handle drop events - creates new nodes from dropped data
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      try {
        const nodeType = e.dataTransfer.getData('node-type');
        const nodeLabel = e.dataTransfer.getData('node-label');
        const nodeIcon = e.dataTransfer.getData('node-icon');

        if (!nodeType || !nodeLabel || !nodeIcon) {
          throw new Error('Missing required node data');
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newNode: CanvasNode = {
          id: `${nodeType}-${Date.now()}`,
          type: nodeType,
          label: nodeLabel,
          iconSrc: nodeIcon,
          x: x - 40, // Center the node
          y: y - 30,
          width: 80,
          height: 60,
          // GraphQL GraphNode properties
          companyId: 'temp', // Placeholder until saved
          name: nodeLabel,
          nodeType: GraphQL.GraphNodeType.Service, // Default to service
          userId: 'temp', // Placeholder until saved
          edges: [],
        };

        console.log('🎯 Element dropped on canvas:', newNode);
        onElementDropped(newNode);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown drop error';
        console.error('❌ Drop error:', errorMessage);
        onDropError?.(errorMessage);
      }
    },
    [onElementDropped, onDropError],
  );

  /**
   * Convert screen coordinates to canvas coordinates
   * Takes into account canvas zoom and pan state
   */
  const convertToCanvasCoordinates = useCallback(
    (
      screenX: number,
      screenY: number,
      canvasRect: DOMRect,
      stagePosition: { x: number; y: number },
      scale: number,
    ) => {
      const canvasX = (screenX - canvasRect.left - stagePosition.x) / scale;
      const canvasY = (screenY - canvasRect.top - stagePosition.y) / scale;

      return { x: canvasX, y: canvasY };
    },
    [],
  );

  return {
    handleDragOver,
    handleDrop,
    convertToCanvasCoordinates,
  };
};
