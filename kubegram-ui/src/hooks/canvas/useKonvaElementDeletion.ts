import { useCallback } from 'react';
import type { CanvasNode, CanvasArrow } from '@/types/canvas';

/**
 * Interface for selected items
 */
export interface SelectedItems {
  nodes: string[];
  arrows: string[];
}

/**
 * Hook for handling element deletion on Konva canvas
 *
 * This hook provides functionality to:
 * - Delete selected nodes and arrows
 * - Clean up connected arrows when nodes are deleted
 * - Handle bulk deletion operations
 * - Trigger callbacks when elements are deleted
 */
export const useKonvaElementDeletion = (
  onElementsDeleted: (deletedNodes: string[], deletedArrows: string[]) => void,
  onDeletionError?: (error: string) => void,
) => {
  /**
   * Delete selected nodes and their connected arrows
   */
  const deleteSelectedNodes = useCallback(
    (selectedNodeIds: string[], _allNodes: CanvasNode[], allArrows: CanvasArrow[]) => {
      try {
        if (selectedNodeIds.length === 0) return;

        // Find arrows connected to the nodes being deleted
        const connectedArrowIds = allArrows
          .filter(
            (arrow) =>
              selectedNodeIds.includes(arrow.startNodeId) ||
              selectedNodeIds.includes(arrow.endNodeId),
          )
          .map((arrow) => arrow.id);

        console.log('🗑️ Deleting nodes:', selectedNodeIds);
        console.log('🔗 Connected arrows to delete:', connectedArrowIds);

        onElementsDeleted(selectedNodeIds, connectedArrowIds);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown deletion error';
        console.error('❌ Node deletion error:', errorMessage);
        onDeletionError?.(errorMessage);
      }
    },
    [onElementsDeleted, onDeletionError],
  );

  /**
   * Delete selected arrows
   */
  const deleteSelectedArrows = useCallback(
    (selectedArrowIds: string[]) => {
      try {
        if (selectedArrowIds.length === 0) return;

        console.log('🗑️ Deleting arrows:', selectedArrowIds);

        onElementsDeleted([], selectedArrowIds);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown deletion error';
        console.error('❌ Arrow deletion error:', errorMessage);
        onDeletionError?.(errorMessage);
      }
    },
    [onElementsDeleted, onDeletionError],
  );

  /**
   * Delete all selected items (nodes and arrows)
   */
  const deleteSelectedItems = useCallback(
    (selectedItems: SelectedItems, _allNodes: CanvasNode[], allArrows: CanvasArrow[]) => {
      try {
        const { nodes: selectedNodeIds, arrows: selectedArrowIds } = selectedItems;

        if (selectedNodeIds.length === 0 && selectedArrowIds.length === 0) {
          console.log('ℹ️ No items selected for deletion');
          return;
        }

        // Find arrows connected to the nodes being deleted
        const connectedArrowIds = allArrows
          .filter(
            (arrow) =>
              selectedNodeIds.includes(arrow.startNodeId) ||
              selectedNodeIds.includes(arrow.endNodeId),
          )
          .map((arrow) => arrow.id);

        // Combine selected arrows with connected arrows (remove duplicates)
        const allArrowIdsToDelete = [...new Set([...selectedArrowIds, ...connectedArrowIds])];

        console.log('🗑️ Deleting selected items:', {
          nodes: selectedNodeIds,
          arrows: selectedArrowIds,
          connectedArrows: connectedArrowIds,
          totalArrowsToDelete: allArrowIdsToDelete,
        });

        onElementsDeleted(selectedNodeIds, allArrowIdsToDelete);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown deletion error';
        console.error('❌ Bulk deletion error:', errorMessage);
        onDeletionError?.(errorMessage);
      }
    },
    [onElementsDeleted, onDeletionError],
  );

  /**
   * Delete a single node by ID
   */
  const deleteNodeById = useCallback(
    (nodeId: string, allNodes: CanvasNode[], allArrows: CanvasArrow[]) => {
      deleteSelectedNodes([nodeId], allNodes, allArrows);
    },
    [deleteSelectedNodes],
  );

  /**
   * Delete a single arrow by ID
   */
  const deleteArrowById = useCallback(
    (arrowId: string) => {
      deleteSelectedArrows([arrowId]);
    },
    [deleteSelectedArrows],
  );

  /**
   * Clear all elements from the canvas
   */
  const clearAllElements = useCallback(
    (allNodes: CanvasNode[], allArrows: CanvasArrow[]) => {
      try {
        const allNodeIds = allNodes.map((node) => node.id);
        const allArrowIds = allArrows.map((arrow) => arrow.id);

        console.log('🧹 Clearing all elements:', {
          nodes: allNodeIds.length,
          arrows: allArrowIds.length,
        });

        onElementsDeleted(allNodeIds, allArrowIds);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown clear error';
        console.error('❌ Clear all error:', errorMessage);
        onDeletionError?.(errorMessage);
      }
    },
    [onElementsDeleted, onDeletionError],
  );

  return {
    deleteSelectedNodes,
    deleteSelectedArrows,
    deleteSelectedItems,
    deleteNodeById,
    deleteArrowById,
    clearAllElements,
  };
};
