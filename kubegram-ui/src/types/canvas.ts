import { GraphQL, type Edge, type Maybe } from "@/lib/graphql-client";
/**
 * Canvas node interface
 */
export interface CanvasNode extends GraphQL.GraphNode {
  id: string;
  type: string;
  label: string;
  iconSrc: string;
  x: number;
  y: number;
  width: number;
  height: number;
  edges?: Maybe<Array<Maybe<Edge>>>;
  color?: string;
}

/**
 * Canvas arrow interface
 */
export interface CanvasArrow extends GraphQL.Edge {
  id: string;
  startNodeId: string;
  endNodeId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  node: CanvasNode;
}

/**
 * Canvas graph interface
 * A marker interface for the canvas graph
 */
export interface CanvasGraph extends GraphQL.Graph {
  nodes: Maybe<Array<Maybe<CanvasNode>>>;
  arrows?: Maybe<Array<Maybe<CanvasArrow>>>;
}


/**
 * Recursively converts a CanvasNode to GraphQL.GraphNode
 * Short-circuits if the node has already been converted (lacks canvas-specific fields)
 * Base case: returns null for null/undefined nodes
 */
const convertNodeToGraphQLNode = (node: CanvasNode | GraphQL.GraphNode | null | undefined): GraphQL.GraphNode | null => {
  // Base case: null check
  if (!node) {
    return null;
  }

  // Short-circuit: if the node lacks canvas-specific fields, it's already converted
  const canvasNode = node as any;
  if (!('x' in canvasNode) && !('y' in canvasNode) && !('label' in canvasNode)) {
    return node as GraphQL.GraphNode;
  }

  // Convert edges recursively
  const edges: GraphQL.Maybe<Array<GraphQL.Maybe<GraphQL.Edge>>> = canvasNode.edges?.map((edge: any) =>
    edge ? {
      connectionType: edge.connectionType,
      node: convertNodeToGraphQLNode(edge.node),
    } : null
  ) ?? [];

  return {
    id: canvasNode.id,
    companyId: canvasNode.companyId,
    name: canvasNode.name,
    nodeType: canvasNode.nodeType,
    userId: canvasNode.userId,
    edges,
  };
};

export const convertCanvasGraphToGraph = (canvasGraph: CanvasGraph): GraphQL.Graph => {
  // Explicitly type the nodes array to avoid TypeScript 'never' type inference
  const nodes: GraphQL.Maybe<Array<GraphQL.Maybe<GraphQL.GraphNode>>> = [];

  for (const node of canvasGraph?.nodes || []) {
    const convertedNode = convertNodeToGraphQLNode(node);
    if (convertedNode) {
      nodes.push(convertedNode);
    }
  }

  return {
    ...canvasGraph,
    nodes,
  };
};

export interface Project {
  id: string;
  name: string;
  graph: CanvasGraph | GraphQL.Graph;
}

export interface Company {
  id: string;
  name: string;
  avatarUrl?: string;
  projects: Project[];
  organizations: Organization[];
}

export interface Organization {
  id: string;
  name: string;
  avatarUrl?: string;
  projects: Project[];
}

export interface Team {
  id: string;
  name: string;
  avatarUrl?: string;
  projects: Project[];
}