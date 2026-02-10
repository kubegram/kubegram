import { useCallback } from 'react';
import { useKonvaElementDrop } from './useKonvaElementDrop';
import type { CanvasNode, CanvasArrow } from '@/types/canvas';
import {
  useKonvaElementDeletion,
  type SelectedItems,
} from './useKonvaElementDeletion';
import { useKonvaArrowAttachment, type ArrowAttachmentEvent } from './useKonvaArrowAttachment';

/**
 * Combined hook for handling all Konva canvas events
 *
 * This hook integrates:
 * - Element drop handling
 * - Element deletion handling
 * - Arrow attachment handling
 *
 * It provides a unified interface for managing canvas interactions
 * and triggers appropriate callbacks for each event type.
 */
export const useKonvaCanvasEvents = (
  // Element drop callbacks
  onElementDropped: (node: CanvasNode) => void,
  onDropError?: (error: string) => void,

  // Element deletion callbacks
  onElementsDeleted?: (deletedNodes: string[], deletedArrows: string[]) => void,
  onDeletionError?: (error: string) => void,

  // Arrow attachment callbacks
  onArrowAttached?: (event: ArrowAttachmentEvent) => void,
  onArrowDetached?: (arrowId: string, nodeId: string, attachmentType: 'start' | 'end') => void,
  onArrowCreated?: (arrow: CanvasArrow) => void,
  onAttachmentError?: (error: string) => void,
) => {
  // Initialize individual hooks
  const elementDrop = useKonvaElementDrop(onElementDropped, onDropError);

  const elementDeletion = useKonvaElementDeletion(onElementsDeleted || (() => { }), onDeletionError);

  const arrowAttachment = useKonvaArrowAttachment(
    onArrowAttached || (() => { }),
    onArrowDetached || (() => { }),
    onArrowCreated || (() => { }),
    onAttachmentError,
  );

  /**
   * Handle element drop with additional logging
   */
  const handleElementDrop = useCallback(
    (e: React.DragEvent) => {
      console.log('🎯 Canvas drop event triggered');
      elementDrop.handleDrop(e);
    },
    [elementDrop],
  );

  /**
   * Handle element deletion with additional logging
   */
  const handleElementDeletion = useCallback(
    (selectedItems: SelectedItems, allNodes: CanvasNode[], allArrows: CanvasArrow[]) => {
      console.log('🗑️ Canvas deletion event triggered');
      elementDeletion.deleteSelectedItems(selectedItems, allNodes, allArrows);
    },
    [elementDeletion],
  );

  /**
   * Handle arrow attachment with additional logging
   */
  const handleArrowAttachment = useCallback(
    (
      arrowId: string,
      nodeId: string,
      attachmentType: 'start' | 'end',
      nodes: CanvasNode[],
      fromX: number,
      fromY: number,
    ) => {
      console.log('🔗 Canvas arrow attachment event triggered');

      if (attachmentType === 'start') {
        arrowAttachment.attachArrowStart(arrowId, nodeId, nodes, fromX, fromY);
      } else {
        arrowAttachment.attachArrowEnd(arrowId, nodeId, nodes, fromX, fromY);
      }
    },
    [arrowAttachment],
  );

  /**
   * Handle arrow creation between two nodes
   */
  const handleArrowCreation = useCallback(
    (startNodeId: string, endNodeId: string, nodes: CanvasNode[]) => {
      console.log('✨ Canvas arrow creation event triggered');
      arrowAttachment.createArrowBetweenNodes(startNodeId, endNodeId, nodes);
    },
    [arrowAttachment],
  );

  /**
   * Handle arrow creation from point to node
   */
  const handleArrowCreationToNode = useCallback(
    (startX: number, startY: number, endNodeId: string, nodes: CanvasNode[]) => {
      console.log('✨ Canvas arrow creation to node event triggered');
      arrowAttachment.createArrowToNode(startX, startY, endNodeId, nodes);
    },
    [arrowAttachment],
  );

  /**
   * Handle arrow creation from node to point
   */
  const handleArrowCreationFromNode = useCallback(
    (startNodeId: string, endX: number, endY: number, nodes: CanvasNode[]) => {
      console.log('✨ Canvas arrow creation from node event triggered');
      arrowAttachment.createArrowFromNode(startNodeId, endX, endY, nodes);
    },
    [arrowAttachment],
  );

  /**
   * Handle arrow detachment
   */
  const handleArrowDetachment = useCallback(
    (arrowId: string, nodeId: string, attachmentType: 'start' | 'end') => {
      console.log('🔓 Canvas arrow detachment event triggered');
      arrowAttachment.detachArrow(arrowId, nodeId, attachmentType);
    },
    [arrowAttachment],
  );

  /**
   * Find nearest node for arrow attachment
   */
  const findNearestNodeForAttachment = useCallback(
    (x: number, y: number, nodes: CanvasNode[], threshold: number = 30, excludeNodeId?: string) => {
      return arrowAttachment.findNearestNode(x, y, nodes, threshold, excludeNodeId);
    },
    [arrowAttachment],
  );

  /**
   * Calculate node connection point
   */
  const calculateNodeConnectionPoint = useCallback(
    (node: CanvasNode, fromX: number, fromY: number) => {
      return arrowAttachment.calculateNodeConnectionPoint(node, fromX, fromY);
    },
    [arrowAttachment],
  );

  return {
    // Element drop methods
    handleDragOver: elementDrop.handleDragOver,
    handleDrop: handleElementDrop,
    convertToCanvasCoordinates: elementDrop.convertToCanvasCoordinates,

    // Element deletion methods
    deleteSelectedNodes: elementDeletion.deleteSelectedNodes,
    deleteSelectedArrows: elementDeletion.deleteSelectedArrows,
    deleteSelectedItems: handleElementDeletion,
    deleteNodeById: elementDeletion.deleteNodeById,
    deleteArrowById: elementDeletion.deleteArrowById,
    clearAllElements: elementDeletion.clearAllElements,

    // Arrow attachment methods
    attachArrowStart: arrowAttachment.attachArrowStart,
    attachArrowEnd: arrowAttachment.attachArrowEnd,
    detachArrow: handleArrowDetachment,
    handleArrowAttachment,
    createArrowBetweenNodes: handleArrowCreation,
    createArrowToNode: handleArrowCreationToNode,
    createArrowFromNode: handleArrowCreationFromNode,
    findNearestNode: findNearestNodeForAttachment,
    calculateNodeConnectionPoint,

    // Direct access to individual hooks for advanced usage
    elementDrop,
    elementDeletion,
    arrowAttachment,
  };
};

// Re-export types for convenience
export type { CanvasNode, CanvasArrow, SelectedItems, ArrowAttachmentEvent };
