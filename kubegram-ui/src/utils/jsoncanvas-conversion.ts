import type { JsonCanvas } from '@/types/jsoncanvas';
import type { CanvasNode, CanvasArrow } from '@/types/canvas';

/**
 * Convert Canvas Graph format to JSON Canvas format
 * This is used to migrate between KonvaCanvas and JsonCanvasEditor
 */
export const convertCanvasGraphToJsonCanvas = (canvasData: {
  nodes: CanvasNode[];
  arrows: CanvasArrow[];
}): JsonCanvas => {
  const { nodes, arrows } = canvasData;

  const jsonCanvasNodes = nodes.map((node) => {
    const textNode = {
      id: node.id,
      type: 'text' as const,
      text: node.label || node.name,
      x: node.x,
      y: node.y,
      width: node.width || 100,
      height: node.height || 50,
      color: node.color ? `#${node.color}` as const : undefined,
    };

    return textNode;
  });

  const jsonCanvasEdges = arrows.map((arrow) => ({
    id: arrow.id,
    fromNode: arrow.startNodeId,
    toNode: arrow.endNodeId,
    fromSide: 'right' as const,
    toSide: 'left' as const,
    color: '#000000' as const,
    fromEnd: 'none' as const,
    toEnd: 'arrow' as const
  }));

  return {
    nodes: jsonCanvasNodes,
    edges: jsonCanvasEdges
  };
};

/**
 * Convert JSON Canvas format to Canvas Graph format
 * This is used to migrate from JsonCanvasEditor to KonvaCanvas
 */
export const convertJsonCanvasToCanvasGraph = (jsonCanvas: JsonCanvas): {
  nodes: CanvasNode[];
  arrows: CanvasArrow[];
} => {
  const { nodes, edges } = jsonCanvas;

  const canvasNodes = (nodes || []).map((node): CanvasNode => {
    const baseNode = {
      id: node.id,
      type: 'Pod',
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      color: node.color ? node.color.replace('#', '') : undefined,
      iconSrc: '/kubernetes/resources/unlabeled/pod.svg',
      nodeType: 'POD' as any,
      companyId: '1',
      userId: '1',
    };

    if (node.type === 'text') {
      return {
        ...baseNode,
        label: (node as any).text,
        name: (node as any).text,
      };
    }

    return {
      ...baseNode,
      label: node.id,
      name: node.id,
    };
  });

  const canvasArrows = (edges || []).map((arrow): CanvasArrow => ({
    id: arrow.id,
    startNodeId: arrow.fromNode,
    endNodeId: arrow.toNode,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    node: canvasNodes[0], // Placeholder
    connectionType: 'curved' as any,
  }));

  return {
    nodes: canvasNodes,
    arrows: canvasArrows
  };
};