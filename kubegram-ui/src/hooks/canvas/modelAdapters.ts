// Data model adapters for converting between JSON Canvas and Redux Canvas models

export interface JsonCanvas {
  nodes: JsonCanvasNode[];
  edges: JsonCanvasEdge[];
}

export interface JsonCanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  style?: Record<string, any>;
}

export interface JsonCanvasEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: Record<string, any>;
  style?: Record<string, any>;
}

export interface CanvasGraph {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  style?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: Record<string, any>;
  style?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Convert JSON Canvas to Redux Canvas model
export function jsonCanvasToRedux(json: JsonCanvas): CanvasGraph {
  return {
    nodes: json.nodes.map(node => ({
      ...node,
      metadata: {
        ...node.data,
        ...node.style
      }
    })),
    edges: json.edges.map(edge => ({
      ...edge,
      metadata: {
        ...edge.data,
        ...edge.style
      }
    }))
  };
}

// Convert Redux Canvas to JSON Canvas model
export function reduxToJsonCanvas(redux: CanvasGraph): JsonCanvas {
  return {
    nodes: redux.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.metadata || {},
      style: node.style || {}
    })),
    edges: redux.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      data: edge.metadata || {},
      style: edge.style || {}
    }))
  };
}

// Convert individual JSON Canvas node to Redux Canvas node
export function jsonNodeToRedux(node: JsonCanvasNode): CanvasNode {
  return {
    ...node,
    metadata: {
      ...node.data,
      ...node.style
    }
  };
}

// Convert individual Redux Canvas node to JSON Canvas node
export function reduxNodeToJson(node: CanvasNode): JsonCanvasNode {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.metadata || {},
    style: node.style || {}
  };
}

// Convert individual JSON Canvas edge to Redux Canvas edge
export function jsonEdgeToRedux(edge: JsonCanvasEdge): CanvasEdge {
  return {
    ...edge,
    metadata: {
      ...edge.data,
      ...edge.style
    }
  };
}

// Convert individual Redux Canvas edge to JSON Canvas edge
export function reduxEdgeToJson(edge: CanvasEdge): JsonCanvasEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    data: edge.metadata || {},
    style: edge.style || {}
  };
}

// Helper functions for ID generation and validation
export function generateCanvasId(): string {
  return `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function validateCanvasId(id: string): boolean {
  return typeof id === 'string' && id.length > 0;
}

// Type guards for runtime type checking
export function isJsonCanvas(obj: any): obj is JsonCanvas {
  return obj && 
         Array.isArray(obj.nodes) && 
         Array.isArray(obj.edges);
}

export function isCanvasGraph(obj: any): obj is CanvasGraph {
  return obj && 
         Array.isArray(obj.nodes) && 
         Array.isArray(obj.edges);
}