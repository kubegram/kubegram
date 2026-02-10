/**
 * Code generation utilities
 * Port of app/utils/codegen_utils.py
 * Helper functions for graph processing, edge building, node extraction
 */

import { createHash } from 'crypto';
import { Graph, GraphNode, Edge } from '../types/graph';
import { GraphNodeType, ConnectionType } from '../types/enums';

// Graph hash options interface
export interface GraphHashOptions {
  includeNodes?: boolean;
  includeEdges?: boolean;
  includeMetadata?: boolean;
  algorithm?: 'sha256' | 'md5';
}

// Edge building options interface
export interface EdgeBuildingOptions {
  inferConnections?: boolean;
  createDefaultEdges?: boolean;
  connectionRules?: ConnectionRule[];
}

// Connection rule interface
export interface ConnectionRule {
  sourceType: GraphNodeType;
  targetType: GraphNodeType;
  connectionType: ConnectionType;
  bidirectional?: boolean;
}

// Node extraction options interface
export interface NodeExtractionOptions {
  includeExternal?: boolean;
  filterByType?: GraphNodeType[];
  minConnections?: number;
}

/**
 * Code generation utilities class
 */
export class CodegenUtils {
  // Default connection rules for common Kubernetes patterns
  private static readonly DEFAULT_CONNECTION_RULES: ConnectionRule[] = [
    // Service connects to Deployment/Pod
    {
      sourceType: GraphNodeType.SERVICE,
      targetType: GraphNodeType.DEPLOYMENT,
      connectionType: ConnectionType.SERVICE_EXPOSES_POD,
      bidirectional: false,
    },
    {
      sourceType: GraphNodeType.SERVICE,
      targetType: GraphNodeType.POD,
      connectionType: ConnectionType.SERVICE_EXPOSES_POD,
      bidirectional: false,
    },
    // Ingress routes to Service
    {
      sourceType: GraphNodeType.INGRESS,
      targetType: GraphNodeType.SERVICE,
      connectionType: ConnectionType.INGRESS_ROUTES_TO_SERVICE,
      bidirectional: false,
    },
    // Pod runs on Node
    {
      sourceType: GraphNodeType.POD,
      targetType: GraphNodeType.NODE,
      connectionType: ConnectionType.POD_RUNS_ON_NODE,
      bidirectional: false,
    },
    // Deployment manages ReplicaSet
    {
      sourceType: GraphNodeType.DEPLOYMENT,
      targetType: GraphNodeType.REPLICASET,
      connectionType: ConnectionType.MANAGES,
      bidirectional: false,
    },
    // ReplicaSet manages Pod
    {
      sourceType: GraphNodeType.REPLICASET,
      targetType: GraphNodeType.POD,
      connectionType: ConnectionType.MANAGES,
      bidirectional: false,
    },
    // Microservice dependencies
    {
      sourceType: GraphNodeType.MICROSERVICE,
      targetType: GraphNodeType.DATABASE,
      connectionType: ConnectionType.MICROSERVICE_DEPENDS_ON,
      bidirectional: false,
    },
    {
      sourceType: GraphNodeType.MICROSERVICE,
      targetType: GraphNodeType.CACHE,
      connectionType: ConnectionType.MICROSERVICE_DEPENDS_ON,
      bidirectional: false,
    },
    {
      sourceType: GraphNodeType.MICROSERVICE,
      targetType: GraphNodeType.MESSAGE_QUEUE,
      connectionType: ConnectionType.MICROSERVICE_DEPENDS_ON,
      bidirectional: false,
    },
  ];

  /**
   * Compute deterministic hash for graph caching
   */
  static computeGraphHash(graph: Graph, options: GraphHashOptions = {}): string {
    const {
      includeNodes = true,
      includeEdges = true,
      includeMetadata = false,
      algorithm = 'sha256',
    } = options;

    const hashInput: string[] = [];

    // Include basic graph metadata
    if (includeMetadata) {
      hashInput.push(graph.name);
      hashInput.push(graph.graphType);
      hashInput.push(graph.companyId);
      hashInput.push(graph.userId);
    }

    // Include nodes
    if (includeNodes && graph.nodes) {
      const sortedNodes = [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id));
      for (const node of sortedNodes) {
        hashInput.push(`${node.id}:${node.nodeType}:${node.name}`);
        
        // Include node spec if available
        if (node.spec) {
          hashInput.push(JSON.stringify(node.spec));
        }
      }
    }

    // Include edges
    if (includeEdges && graph.nodes) {
      const edges: string[] = [];
      for (const node of graph.nodes) {
        if (node.edges) {
          for (const edge of node.edges) {
            edges.push(`${node.id}-${edge.node.id}-${edge.connectionType}`);
          }
        }
      }
      edges.sort();
      hashInput.push(...edges);
    }

    // Create hash
    const hashContent = hashInput.join('|');
    return createHash(algorithm).update(hashContent).digest('hex');
  }

  /**
   * Build graph edges from node relationships
   */
  static buildGraphEdges(
    graph: Graph,
    options: EdgeBuildingOptions = {}
  ): Graph {
    const {
      inferConnections = true,
      createDefaultEdges = false,
      connectionRules = this.DEFAULT_CONNECTION_RULES,
    } = options;

    const updatedGraph = { ...graph };
    const nodes = updatedGraph.nodes || [];

    // Process existing edges
    for (const node of nodes) {
      if (node.edges) {
        // Validate and clean existing edges
        node.edges = node.edges.filter(edge => 
          edge.node && edge.connectionType
        );
      } else {
        node.edges = [];
      }
    }

    // Infer connections based on rules
    if (inferConnections) {
      this.inferConnections(nodes, connectionRules);
    }

    // Create default edges for common patterns
    if (createDefaultEdges) {
      this.createDefaultEdges(nodes);
    }

    return updatedGraph;
  }

  /**
   * Infer connections based on connection rules
   */
  private static inferConnections(
    nodes: GraphNode[],
    rules: ConnectionRule[]
  ): void {
    const nodeMap = new Map<string, GraphNode>();
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    for (const rule of rules) {
      const sourceNodes = nodes.filter(n => n.nodeType === rule.sourceType);
      const targetNodes = nodes.filter(n => n.nodeType === rule.targetType);

      for (const sourceNode of sourceNodes) {
        for (const targetNode of targetNodes) {
          // Skip self-connections unless explicitly allowed
          if (sourceNode.id === targetNode.id) {
            continue;
          }

          // Check if edge already exists
          const edgeExists = sourceNode.edges?.some(
            edge => edge.node.id === targetNode.id && edge.connectionType === rule.connectionType
          );

          if (!edgeExists) {
            if (!sourceNode.edges) {
              sourceNode.edges = [];
            }
            sourceNode.edges.push({
              node: targetNode,
              connectionType: rule.connectionType,
            });

            // Add bidirectional edge if required
            if (rule.bidirectional && targetNode.edges) {
              targetNode.edges.push({
                node: sourceNode,
                connectionType: rule.connectionType,
              });
            }
          }
        }
      }
    }
  }

  /**
   * Create default edges for common Kubernetes patterns
   */
  private static createDefaultEdges(nodes: GraphNode[]): void {
    // Group nodes by name to find related resources
    const nodeGroups = new Map<string, GraphNode[]>();
    
    for (const node of nodes) {
      const baseName = this.getBaseName(node.name);
      if (!nodeGroups.has(baseName)) {
        nodeGroups.set(baseName, []);
      }
      nodeGroups.get(baseName)!.push(node);
    }

    // Create edges within groups
    for (const [baseName, groupNodes] of nodeGroups) {
      if (groupNodes.length < 2) {
        continue;
      }

      const deployments = groupNodes.filter(n => n.nodeType === GraphNodeType.DEPLOYMENT);
      const services = groupNodes.filter(n => n.nodeType === GraphNodeType.SERVICE);
      const pods = groupNodes.filter(n => n.nodeType === GraphNodeType.POD);

      // Connect Service to Deployment
      for (const service of services) {
        for (const deployment of deployments) {
          if (!service.edges?.some(e => e.node.id === deployment.id)) {
            if (!service.edges) {
              service.edges = [];
            }
            service.edges.push({
              node: deployment,
              connectionType: ConnectionType.SERVICE_EXPOSES_POD,
            });
          }
        }
      }

      // Connect Deployment to Pods (if pods are explicitly managed)
      for (const deployment of deployments) {
        for (const pod of pods) {
          if (!deployment.edges?.some(e => e.node.id === pod.id)) {
            if (!deployment.edges) {
              deployment.edges = [];
            }
            deployment.edges.push({
              node: pod,
              connectionType: ConnectionType.MANAGES,
            });
          }
        }
      }
    }
  }

  /**
   * Get base name from node name (removes suffixes like -service, -deployment)
   */
  private static getBaseName(name: string): string {
    // Common suffixes to remove
    const suffixes = [
      '-service', '-svc', '-deployment', '-deploy', 
      '-pod', '-pods', '-ingress', '-configmap', '-secret'
    ];

    let baseName = name.toLowerCase();
    for (const suffix of suffixes) {
      if (baseName.endsWith(suffix)) {
        baseName = baseName.slice(0, -suffix.length);
        break;
      }
    }

    return baseName;
  }

  /**
   * Get needed infrastructure (delta between desired and existing)
   */
  static getNeededInfrastructure(
    desiredGraph: Graph,
    existingGraph: Graph | null,
    options: NodeExtractionOptions = {}
  ): GraphNode[] {
    const {
      includeExternal = true,
      filterByType,
      minConnections = 0,
    } = options;

    if (!existingGraph) {
      // All nodes are needed if no existing graph
      return this.extractNodes(desiredGraph, options);
    }

    const neededNodes: GraphNode[] = [];
    const existingNodeMap = new Map<string, GraphNode>();

    // Build map of existing nodes
    if (existingGraph.nodes) {
      for (const node of existingGraph.nodes) {
        existingNodeMap.set(node.id, node);
      }
    }

    // Find nodes that are in desired but not in existing
    if (desiredGraph.nodes) {
      for (const desiredNode of desiredGraph.nodes) {
        const existingNode = existingNodeMap.get(desiredNode.id);

        // Node is needed if:
        // 1. It doesn't exist in existing graph
        // 2. It has different configuration
        // 3. It passes the filter criteria
        if (!existingNode || this.nodeConfigurationChanged(desiredNode, existingNode)) {
          if (this.passesFilters(desiredNode, options)) {
            neededNodes.push(desiredNode);
          }
        }
      }
    }

    return neededNodes;
  }

  /**
   * Extract nodes from graph based on criteria
   */
  static extractNodes(graph: Graph, options: NodeExtractionOptions = {}): GraphNode[] {
    const {
      includeExternal = true,
      filterByType,
      minConnections = 0,
    } = options;

    if (!graph.nodes) {
      return [];
    }

    let nodes = [...graph.nodes];

    // Filter by type
    if (filterByType && filterByType.length > 0) {
      nodes = nodes.filter(node => filterByType.includes(node.nodeType));
    }

    // Filter external dependencies
    if (!includeExternal) {
      nodes = nodes.filter(node => node.nodeType !== GraphNodeType.EXTERNAL_DEPENDENCY);
    }

    // Filter by minimum connections
    if (minConnections > 0) {
      nodes = nodes.filter(node => 
        !node.edges || node.edges.length >= minConnections
      );
    }

    return nodes;
  }

  /**
   * Check if node configuration has changed
   */
  private static nodeConfigurationChanged(desired: GraphNode, existing: GraphNode): boolean {
    // Compare basic properties
    if (desired.name !== existing.name || desired.nodeType !== existing.nodeType) {
      return true;
    }

    // Compare specs
    const desiredSpec = JSON.stringify(desired.spec || {});
    const existingSpec = JSON.stringify(existing.spec || {});
    
    return desiredSpec !== existingSpec;
  }

  /**
   * Check if node passes filter criteria
   */
  private static passesFilters(node: GraphNode, options: NodeExtractionOptions): boolean {
    const { filterByType, minConnections } = options;

    // Filter by type
    if (filterByType && filterByType.length > 0) {
      if (!filterByType.includes(node.nodeType)) {
        return false;
      }
    }

    // Filter by minimum connections
    const minConnectionsValue = minConnections ?? 0;
    if (minConnectionsValue > 0) {
      const connectionCount = node.edges?.length || 0;
      if (connectionCount < minConnectionsValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get node ID from various sources
   */
  static getNodeId(node: GraphNode): string {
    return node.id || node.orginalNodeId || '';
  }

  /**
   * Get node name from various sources
   */
  static getNodeName(node: GraphNode): string {
    return node.name || node.orginalNodeName || '';
  }

  /**
   * Get node type from various sources
   */
  static getNodeType(node: GraphNode): GraphNodeType {
    return node.nodeType || (node.orginalNodeType as GraphNodeType) || GraphNodeType.POD;
  }

  /**
   * Validate graph structure
   */
  static validateGraph(graph: Graph): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check basic structure
    if (!graph.name) {
      errors.push('Graph must have a name');
    }

    if (!graph.graphType) {
      errors.push('Graph must have a graph type');
    }

    if (!graph.companyId) {
      errors.push('Graph must have a company ID');
    }

    if (!graph.userId) {
      errors.push('Graph must have a user ID');
    }

    // Check nodes
    if (!graph.nodes || graph.nodes.length === 0) {
      warnings.push('Graph has no nodes');
    } else {
      // Check for duplicate node IDs
      const nodeIds = graph.nodes.map(n => n.id);
      const duplicateIds = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        errors.push(`Duplicate node IDs found: ${duplicateIds.join(', ')}`);
      }

      // Check for nodes without names
      const nodesWithoutNames = graph.nodes.filter(n => !n.name);
      if (nodesWithoutNames.length > 0) {
        warnings.push(`${nodesWithoutNames.length} nodes without names`);
      }

      // Check for broken edges
      for (const node of graph.nodes) {
        if (node.edges) {
          for (const edge of node.edges) {
            if (!edge.node) {
              errors.push(`Node ${node.id} has edge without target node`);
            } else if (!edge.connectionType) {
              errors.push(`Node ${node.id} has edge without connection type`);
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Export convenience functions
export function computeGraphHash(graph: Graph, options?: GraphHashOptions): string {
  return CodegenUtils.computeGraphHash(graph, options);
}

export function buildGraphEdges(graph: Graph, options?: EdgeBuildingOptions): Graph {
  return CodegenUtils.buildGraphEdges(graph, options);
}

export function getNeededInfrastructure(
  desiredGraph: Graph,
  existingGraph: Graph | null,
  options?: NodeExtractionOptions
): GraphNode[] {
  return CodegenUtils.getNeededInfrastructure(desiredGraph, existingGraph, options);
}

export function extractNodes(graph: Graph, options?: NodeExtractionOptions): GraphNode[] {
  return CodegenUtils.extractNodes(graph, options);
}

export function validateGraph(graph: Graph) {
  return CodegenUtils.validateGraph(graph);
}