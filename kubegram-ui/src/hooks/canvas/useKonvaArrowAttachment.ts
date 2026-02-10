import { useCallback } from 'react';
import type { CanvasNode, CanvasArrow } from '@/types/canvas';
import { GraphQL } from '@/lib/graphql-client';

/**
 * Interface for arrow attachment events
 */
export interface ArrowAttachmentEvent {
  arrowId: string;
  nodeId: string;
  attachmentType: 'start' | 'end';
  position: { x: number; y: number };
}

/**
 * Hook for handling arrow attachments on Konva canvas
 *
 * This hook provides functionality to:
 * - Attach arrows to nodes at specific connection points
 * - Detach arrows from nodes
 * - Calculate proper connection points on node edges
 * - Handle arrow creation between nodes
 * - Trigger callbacks when arrows are attached/detached
 */
export const useKonvaArrowAttachment = (
  onArrowAttached: (event: ArrowAttachmentEvent) => void,
  onArrowDetached: (arrowId: string, nodeId: string, attachmentType: 'start' | 'end') => void,
  onArrowCreated: (arrow: CanvasArrow) => void,
  onAttachmentError?: (error: string) => void,
) => {
  /**
   * Calculate the connection point on a node's edge
   * This ensures arrows connect to the edge, not the center
   */
  const calculateNodeConnectionPoint = useCallback(
    (node: CanvasNode, fromX: number, fromY: number) => {
      const nodeCenterX = node.x + node.width / 2;
      const nodeCenterY = node.y + node.height / 2;

      // Calculate angle from node center to the connecting point
      const angle = Math.atan2(fromY - nodeCenterY, fromX - nodeCenterX);

      // Calculate the connection point on the node's edge
      const connectionPoint = {
        x: nodeCenterX + Math.cos(angle) * (node.width / 2),
        y: nodeCenterY + Math.sin(angle) * (node.height / 2),
      };

      console.log('🎯 Node connection point calculated:', {
        nodeId: node.id,
        nodeCenter: { x: nodeCenterX, y: nodeCenterY },
        fromPoint: { x: fromX, y: fromY },
        angle: (angle * 180) / Math.PI,
        connectionPoint,
      });

      return connectionPoint;
    },
    [],
  );

  /**
   * Find the nearest node within a threshold distance
   */
  const findNearestNode = useCallback(
    (x: number, y: number, nodes: CanvasNode[], threshold: number = 30, excludeNodeId?: string) => {
      let nearestNode: CanvasNode | null = null;
      let nearestDistance = Infinity;
      let connectionPoint = { x, y };

      console.log('🔍 Finding nearest node for point:', { x, y, threshold, excludeNodeId });

      for (const node of nodes) {
        // Skip excluded node (prevents self-connection)
        if (excludeNodeId && node.id === excludeNodeId) {
          continue;
        }

        // Calculate distance from point to node center
        const nodeCenterX = node.x + node.width / 2;
        const nodeCenterY = node.y + node.height / 2;
        const distance = Math.sqrt((x - nodeCenterX) ** 2 + (y - nodeCenterY) ** 2);

        // If this node is closer than previous candidates and within threshold
        if (distance < threshold && distance < nearestDistance) {
          nearestDistance = distance;
          nearestNode = node;
          connectionPoint = calculateNodeConnectionPoint(node, x, y);
        }
      }

      const result = nearestNode ? { node: nearestNode, connectionPoint } : null;
      console.log('🎯 Nearest node result:', result);
      return result;
    },
    [calculateNodeConnectionPoint],
  );

  /**
   * Attach an arrow's start point to a node
   */
  const attachArrowStart = useCallback(
    (arrowId: string, nodeId: string, nodes: CanvasNode[], fromX: number, fromY: number) => {
      try {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
          throw new Error(`Node with ID ${nodeId} not found`);
        }

        const connectionPoint = calculateNodeConnectionPoint(node, fromX, fromY);

        const attachmentEvent: ArrowAttachmentEvent = {
          arrowId,
          nodeId,
          attachmentType: 'start',
          position: connectionPoint,
        };

        console.log('🔗 Attaching arrow start point:', attachmentEvent);
        onArrowAttached(attachmentEvent);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown attachment error';
        console.error('❌ Arrow start attachment error:', errorMessage);
        onAttachmentError?.(errorMessage);
      }
    },
    [calculateNodeConnectionPoint, onArrowAttached, onAttachmentError],
  );

  /**
   * Attach an arrow's end point to a node
   */
  const attachArrowEnd = useCallback(
    (arrowId: string, nodeId: string, nodes: CanvasNode[], fromX: number, fromY: number) => {
      try {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
          throw new Error(`Node with ID ${nodeId} not found`);
        }

        const connectionPoint = calculateNodeConnectionPoint(node, fromX, fromY);

        const attachmentEvent: ArrowAttachmentEvent = {
          arrowId,
          nodeId,
          attachmentType: 'end',
          position: connectionPoint,
        };

        console.log('🔗 Attaching arrow end point:', attachmentEvent);
        onArrowAttached(attachmentEvent);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown attachment error';
        console.error('❌ Arrow end attachment error:', errorMessage);
        onAttachmentError?.(errorMessage);
      }
    },
    [calculateNodeConnectionPoint, onArrowAttached, onAttachmentError],
  );

  /**
   * Detach an arrow from a node
   */
  const detachArrow = useCallback(
    (arrowId: string, nodeId: string, attachmentType: 'start' | 'end') => {
      try {
        console.log('🔓 Detaching arrow:', { arrowId, nodeId, attachmentType });
        onArrowDetached(arrowId, nodeId, attachmentType);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown detachment error';
        console.error('❌ Arrow detachment error:', errorMessage);
        onAttachmentError?.(errorMessage);
      }
    },
    [onArrowDetached, onAttachmentError],
  );

  /**
   * Create a new arrow between two nodes
   */
  const createArrowBetweenNodes = useCallback(
    (startNodeId: string, endNodeId: string, nodes: CanvasNode[]) => {
      try {
        const startNode = nodes.find((n) => n.id === startNodeId);
        const endNode = nodes.find((n) => n.id === endNodeId);

        if (!startNode) {
          throw new Error(`Start node with ID ${startNodeId} not found`);
        }
        if (!endNode) {
          throw new Error(`End node with ID ${endNodeId} not found`);
        }

        // Calculate connection points
        const startConnectionPoint = calculateNodeConnectionPoint(
          startNode,
          endNode.x + endNode.width / 2,
          endNode.y + endNode.height / 2,
        );
        const endConnectionPoint = calculateNodeConnectionPoint(
          endNode,
          startNode.x + startNode.width / 2,
          startNode.y + startNode.height / 2,
        );

        // Required properties for CanvasArrow interface
        // Note: GraphQLEdge requires 'node', which refers to the target node
        const newArrow: CanvasArrow = {
          id: `arrow-${Date.now()}`,
          startNodeId,
          endNodeId,
          startX: startConnectionPoint.x,
          startY: startConnectionPoint.y,
          endX: endConnectionPoint.x,
          endY: endConnectionPoint.y,
          // GraphQL Edge properties using compatible format
          connectionType: GraphQL.ConnectionType.ConnectsTo,
          node: endNode, // Points to target node
        };

        console.log('✨ Creating arrow between nodes:', newArrow);
        onArrowCreated(newArrow);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown arrow creation error';
        console.error('❌ Arrow creation error:', errorMessage);
        onAttachmentError?.(errorMessage);
      }
    },
    [calculateNodeConnectionPoint, onArrowCreated, onAttachmentError],
  );

  /**
   * Create a new arrow from a point to a node
   */
  const createArrowToNode = useCallback(
    (startX: number, startY: number, endNodeId: string, nodes: CanvasNode[]) => {
      try {
        const endNode = nodes.find((n) => n.id === endNodeId);
        if (!endNode) {
          throw new Error(`End node with ID ${endNodeId} not found`);
        }

        const endConnectionPoint = calculateNodeConnectionPoint(endNode, startX, startY);

        const newArrow: CanvasArrow = {
          id: `arrow-${Date.now()}`,
          startNodeId: 'free', // Not connected to a node
          endNodeId,
          startX,
          startY,
          endX: endConnectionPoint.x,
          endY: endConnectionPoint.y,
          connectionType: GraphQL.ConnectionType.ConnectsTo,
          node: endNode,
        };

        console.log('✨ Creating arrow to node:', newArrow);
        onArrowCreated(newArrow);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown arrow creation error';
        console.error('❌ Arrow creation error:', errorMessage);
        onAttachmentError?.(errorMessage);
      }
    },
    [calculateNodeConnectionPoint, onArrowCreated, onAttachmentError],
  );

  /**
   * Create a new arrow from a node to a point
   */
  const createArrowFromNode = useCallback(
    (startNodeId: string, endX: number, endY: number, nodes: CanvasNode[]) => {
      try {
        const startNode = nodes.find((n) => n.id === startNodeId);
        if (!startNode) {
          throw new Error(`Start node with ID ${startNodeId} not found`);
        }

        const startConnectionPoint = calculateNodeConnectionPoint(startNode, endX, endY);

        // For incomplete arrows (dragging), we need a placeholder target node
        // or we need to relax the type requirement for transient arrows
        // Using a temporary placeholder that satisfies the type
        const placeholderTargetNode: CanvasNode = {
          id: 'temp-target',
          type: 'temp',
          label: 'Target',
          iconSrc: '',
          x: endX,
          y: endY,
          width: 0,
          height: 0,
          companyId: 'temp',
          name: 'temp',
          nodeType: GraphQL.GraphNodeType.Service,
          userId: 'temp',
        };

        const newArrow: CanvasArrow = {
          id: `arrow-${Date.now()}`,
          startNodeId,
          endNodeId: 'free', // Not connected to a node
          startX: startConnectionPoint.x,
          startY: startConnectionPoint.y,
          endX,
          endY,
          connectionType: GraphQL.ConnectionType.ConnectsTo,
          node: placeholderTargetNode,
        };

        console.log('✨ Creating arrow from node:', newArrow);
        onArrowCreated(newArrow);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown arrow creation error';
        console.error('❌ Arrow creation error:', errorMessage);
        onAttachmentError?.(errorMessage);
      }
    },
    [calculateNodeConnectionPoint, onArrowCreated, onAttachmentError],
  );

  return {
    calculateNodeConnectionPoint,
    findNearestNode,
    attachArrowStart,
    attachArrowEnd,
    detachArrow,
    createArrowBetweenNodes,
    createArrowToNode,
    createArrowFromNode,
  };
};
