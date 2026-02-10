import { useCallback } from 'react';
import Konva from 'konva';
import { type CanvasNode, type CanvasArrow } from '../../types/canvas';

export interface ElementsByCoordinatesResult {
  nodes: CanvasNode[];
  arrows: CanvasArrow[];
  closestNode: CanvasNode | null;
  closestArrow: CanvasArrow | null;
  closestElement: {
    type: 'node' | 'arrow';
    element: CanvasNode | CanvasArrow;
    distance: number;
  } | null;
}

/**
 * Custom hook for canvas coordinate utilities
 *
 * Provides functions for:
 * - Converting screen coordinates to canvas coordinates
 * - Finding elements at specific coordinates
 * - Calculating distances to lines and points
 */
export const useCanvasCoordinates = () => {
  /**
   * Convert screen coordinates to canvas coordinates for arrow interactions
   */
  const getArrowClickCoordinates = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, stageRef: React.RefObject<Konva.Stage>) => {
      if (!stageRef.current) return { x: 0, y: 0 };

      const stage = stageRef.current;
      const rect = stage.container().getBoundingClientRect();
      const scale = stage.scaleX();
      const stagePos = stage.position();

      // Convert screen coordinates to canvas coordinates
      const canvasX = (e.evt.clientX - rect.left - stagePos.x) / scale;
      const canvasY = (e.evt.clientY - rect.top - stagePos.y) / scale;

      console.log('🎯 Arrow click coordinates:', {
        screen: { x: e.evt.clientX, y: e.evt.clientY },
        canvas: { x: canvasX, y: canvasY },
        stagePos,
        scale,
      });

      return { x: canvasX, y: canvasY };
    },
    [],
  );

  /**
   * Calculate the perpendicular distance from a point to a line segment
   */
  const getDistanceToLine = useCallback(
    (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
      const A = px - x1;
      const B = py - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;

      if (lenSq === 0) {
        // Line is actually a point
        return Math.sqrt(A * A + B * B);
      }

      let param = dot / lenSq;

      // Clamp param to [0,1] to stay on line segment
      param = Math.max(0, Math.min(1, param));

      const xx = x1 + param * C;
      const yy = y1 + param * D;

      const dx = px - xx;
      const dy = py - yy;

      return Math.sqrt(dx * dx + dy * dy);
    },
    [],
  );

  /**
   * Find elements at the given coordinates
   */
  const findElementsByCoordinates = useCallback(
    (
      x: number,
      y: number,
      nodes: CanvasNode[],
      arrows: CanvasArrow[],
      threshold: number = 20,
    ): ElementsByCoordinatesResult => {
      const foundNodes: Array<{ node: CanvasNode; distance: number }> = [];
      const foundArrows: Array<{ arrow: CanvasArrow; distance: number }> = [];

      console.log('🔍 Finding elements at coordinates:', { x, y, threshold });

      // Find nearby nodes using area-based detection
      nodes.forEach((node) => {
        // Check if point is within the node's rectangular area
        const isWithinNode =
          x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height;

        if (isWithinNode) {
          // Calculate distance to center for sorting purposes
          const nodeCenterX = node.x + node.width / 2;
          const nodeCenterY = node.y + node.height / 2;
          const distance = Math.sqrt((x - nodeCenterX) ** 2 + (y - nodeCenterY) ** 2);

          foundNodes.push({ node, distance });
          console.log('📍 Found node by area:', {
            nodeId: node.id,
            distance,
            nodeBounds: { x: node.x, y: node.y, width: node.width, height: node.height },
          });
        }
      });

      // Find nearby arrows
      arrows.forEach((arrow) => {
        // Calculate distance to arrow line
        const distanceToLine = getDistanceToLine(
          x,
          y,
          arrow.startX,
          arrow.startY,
          arrow.endX,
          arrow.endY,
        );

        if (distanceToLine <= threshold) {
          foundArrows.push({ arrow, distance: distanceToLine });
          console.log('📍 Found nearby arrow:', {
            arrowId: arrow.id,
            distance: distanceToLine,
            start: { x: arrow.startX, y: arrow.startY },
            end: { x: arrow.endX, y: arrow.endY },
          });
        }
      });

      // Sort by distance (closest first)
      foundNodes.sort((a, b) => a.distance - b.distance);
      foundArrows.sort((a, b) => a.distance - b.distance);

      // Find the overall closest element
      const allElements = [
        ...foundNodes.map((item) => ({ ...item, type: 'node' as const })),
        ...foundArrows.map((item) => ({ ...item, type: 'arrow' as const })),
      ].sort((a, b) => a.distance - b.distance);

      const closestElement = allElements[0] || null;

      const result = {
        nodes: foundNodes.map((item) => item.node),
        arrows: foundArrows.map((item) => item.arrow),
        closestNode: foundNodes[0]?.node || null,
        closestArrow: foundArrows[0]?.arrow || null,
        closestElement: closestElement
          ? {
            type: closestElement.type,
            element: closestElement.type === 'node' ? closestElement.node : closestElement.arrow,
            distance: closestElement.distance,
          }
          : null,
      };

      console.log('🎯 Elements found:', result);
      return result;
    },
    [getDistanceToLine],
  );

  /**
   * Calculate connection point on node edge for new position
   */
  const getConnectionPointForNewPosition = useCallback(
    (
      nodeX: number,
      nodeY: number,
      nodeWidth: number,
      nodeHeight: number,
      fromX: number,
      fromY: number,
    ) => {
      const nodeCenterX = nodeX + nodeWidth / 2;
      const nodeCenterY = nodeY + nodeHeight / 2;

      // Calculate angle from node center to the connecting point
      const angle = Math.atan2(fromY - nodeCenterY, fromX - nodeCenterX);

      // Calculate the connection point on the node's edge
      const connectionPoint = {
        x: nodeCenterX + Math.cos(angle) * (nodeWidth / 2),
        y: nodeCenterY + Math.sin(angle) * (nodeHeight / 2),
      };

      return connectionPoint;
    },
    [],
  );

  /**
   * Find nearest node connection for arrow drawing
   */
  const findNearestNodeConnection = useCallback(
    (x: number, y: number, nodes: CanvasNode[], excludeNodeId?: string) => {
      let nearestNode: CanvasNode | null = null;
      let connectionPoint = { x, y }; // Default to original click point

      console.log('🔍 Finding nearest node connection for point:', {
        x,
        y,
        excludeNodeId,
        totalNodes: nodes.length,
      });

      // Loop through all nodes to find the closest one using area-based detection
      for (const node of nodes) {
        // Skip excluded node (prevents connecting to self)
        if (excludeNodeId && node.id === excludeNodeId) {
          console.log('⏭️ Skipping excluded node:', node.id);
          continue;
        }

        // Check if point is within the node's rectangular area
        const isWithinNode =
          x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height;

        console.log(`📏 Node ${node.id} area check:`, {
          nodeBounds: { x: node.x, y: node.y, width: node.width, height: node.height },
          clickPoint: { x, y },
          isWithinNode,
        });

        // If click is within node area, this is the target
        if (isWithinNode) {
          nearestNode = node;

          // Calculate distance to center for connection point calculation
          const nodeCenterX = node.x + node.width / 2;
          const nodeCenterY = node.y + node.height / 2;
          const distance = Math.sqrt((x - nodeCenterX) ** 2 + (y - nodeCenterY) ** 2);

          // Calculate the exact connection point on the node's edge
          const angle = Math.atan2(y - nodeCenterY, x - nodeCenterX);
          connectionPoint = {
            x: nodeCenterX + Math.cos(angle) * (node.width / 2),
            y: nodeCenterY + Math.sin(angle) * (node.height / 2),
          };

          console.log('✅ Found node by area:', {
            nodeId: node.id,
            distance,
            connectionPoint,
            angle: (angle * 180) / Math.PI,
          });
          break; // Found the target node, no need to continue
        }
      }

      const result = nearestNode ? { nodeId: nearestNode.id, connectionPoint } : null;
      console.log('🎯 Final connection result:', result);
      return result;
    },
    [],
  );

  /**
   * Get node connection point for arrow attachment
   */
  const getNodeConnectionPoint = useCallback(
    (nodeId: string, fromX: number, fromY: number, nodes: CanvasNode[]) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) {
        console.log('❌ Node not found for connection:', nodeId);
        return { x: fromX, y: fromY };
      }

      // Calculate node center
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
        nodeId,
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
   * Convert screen coordinates to canvas coordinates
   * This is the centralized function that should be used throughout the app
   */
  const convertScreenToCanvasCoordinates = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return { x: 0, y: 0 };

    const rect = stage.container().getBoundingClientRect();
    const scale = stage.scaleX();
    const stagePos = stage.position();

    // Extract clientX and clientY from either MouseEvent or TouchEvent
    let clientX: number;
    let clientY: number;

    if ('touches' in e.evt && e.evt.touches.length > 0) {
      // TouchEvent: get coordinates from first touch
      clientX = e.evt.touches[0].clientX;
      clientY = e.evt.touches[0].clientY;
    } else if ('clientX' in e.evt) {
      // MouseEvent: get coordinates directly
      clientX = e.evt.clientX;
      clientY = e.evt.clientY;
    } else {
      // Fallback
      return { x: 0, y: 0 };
    }

    // Convert screen coordinates to canvas coordinates
    const canvasX = (clientX - rect.left - stagePos.x) / scale;
    const canvasY = (clientY - rect.top - stagePos.y) / scale;

    return { x: canvasX, y: canvasY };
  }, []);

  return {
    getArrowClickCoordinates,
    getDistanceToLine,
    findElementsByCoordinates,
    getConnectionPointForNewPosition,
    findNearestNodeConnection,
    getNodeConnectionPoint,
    convertScreenToCanvasCoordinates,
  };
};
