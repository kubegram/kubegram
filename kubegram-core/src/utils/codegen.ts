/**
 * Code generation utilities.
 * Pure functions — no Dgraph or external service dependencies.
 */

import { createHash } from "crypto";
import type { Graph, GraphNode } from "../types/graph.js";
import { GraphNodeType, ConnectionType } from "../types/enums.js";

// ---------------------------------------------------------------------------
// Option interfaces
// ---------------------------------------------------------------------------

export interface GraphHashOptions {
  includeNodes?: boolean;
  includeEdges?: boolean;
  includeMetadata?: boolean;
  algorithm?: "sha256" | "md5";
}

export interface EdgeBuildingOptions {
  inferConnections?: boolean;
  createDefaultEdges?: boolean;
  connectionRules?: ConnectionRule[];
}

export interface ConnectionRule {
  sourceType: GraphNodeType;
  targetType: GraphNodeType;
  connectionType: ConnectionType;
  bidirectional?: boolean;
}

export interface NodeExtractionOptions {
  includeExternal?: boolean;
  filterByType?: GraphNodeType[];
  minConnections?: number;
}

// ---------------------------------------------------------------------------
// CodegenUtils class
// ---------------------------------------------------------------------------

/**
 * Pure utility functions for graph manipulation and code generation.
 * No external service dependencies — safe to call in any context.
 *
 * Key operations:
 *  - `computeGraphHash`: deterministic SHA-256 fingerprint of a graph for
 *    cache keying and change detection.
 *  - `buildGraphEdges`: applies `ConnectionRule[]` to infer edges between
 *    nodes by type pair (see DEFAULT_CONNECTION_RULES for the full rule set).
 *  - `getNeededInfrastructure`: diffs desired vs. existing graph to return
 *    only nodes that are new or have changed configuration.
 */
export class CodegenUtils {
  // Rules are applied by _inferConnections() via an O(sources × targets) scan.
  // Order does not matter — duplicate edges are deduplicated by existence check.
  // Add new rules here when new node-type relationships need automatic wiring.
  private static readonly DEFAULT_CONNECTION_RULES: ConnectionRule[] = [
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
    {
      sourceType: GraphNodeType.INGRESS,
      targetType: GraphNodeType.SERVICE,
      connectionType: ConnectionType.INGRESS_ROUTES_TO_SERVICE,
      bidirectional: false,
    },
    {
      sourceType: GraphNodeType.POD,
      targetType: GraphNodeType.NODE,
      connectionType: ConnectionType.POD_RUNS_ON_NODE,
      bidirectional: false,
    },
    {
      sourceType: GraphNodeType.DEPLOYMENT,
      targetType: GraphNodeType.REPLICASET,
      connectionType: ConnectionType.MANAGES,
      bidirectional: false,
    },
    {
      sourceType: GraphNodeType.REPLICASET,
      targetType: GraphNodeType.POD,
      connectionType: ConnectionType.MANAGES,
      bidirectional: false,
    },
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

  static computeGraphHash(
    graph: Graph,
    options: GraphHashOptions = {},
  ): string {
    const {
      includeNodes = true,
      includeEdges = true,
      includeMetadata = false,
      algorithm = "sha256",
    } = options;

    const parts: string[] = [];

    if (includeMetadata) {
      parts.push(graph.name, graph.graphType, graph.companyId, graph.userId);
    }

    if (includeNodes && graph.nodes) {
      // Sort by ID before hashing so that node order in the array doesn't affect
      // the fingerprint. This makes the hash stable across different serialization
      // orderings of the same graph.
      const sorted = [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id));
      for (const node of sorted) {
        parts.push(`${node.id}:${node.nodeType}:${node.name}`);
        if (node.spec) parts.push(JSON.stringify(node.spec));
      }
    }

    if (includeEdges && graph.nodes) {
      const edges: string[] = [];
      for (const node of graph.nodes) {
        for (const edge of node.edges ?? []) {
          edges.push(`${node.id}-${edge.node.id}-${edge.connectionType}`);
        }
      }
      edges.sort();
      parts.push(...edges);
    }

    return createHash(algorithm).update(parts.join("|")).digest("hex");
  }

  static buildGraphEdges(
    graph: Graph,
    options: EdgeBuildingOptions = {},
  ): Graph {
    const {
      inferConnections = true,
      createDefaultEdges = false,
      connectionRules = this.DEFAULT_CONNECTION_RULES,
    } = options;

    const updated = { ...graph };
    const nodes = updated.nodes ?? [];

    for (const node of nodes) {
      node.edges = (node.edges ?? []).filter((e) => e.node && e.connectionType);
    }

    if (inferConnections) this._inferConnections(nodes, connectionRules);
    if (createDefaultEdges) this._createDefaultEdges(nodes);

    return updated;
  }

  private static _inferConnections(
    nodes: GraphNode[],
    rules: ConnectionRule[],
  ): void {
    for (const rule of rules) {
      const sources = nodes.filter((n) => n.nodeType === rule.sourceType);
      const targets = nodes.filter((n) => n.nodeType === rule.targetType);

      for (const src of sources) {
        for (const tgt of targets) {
          if (src.id === tgt.id) continue;
          const exists = src.edges?.some(
            (e) =>
              e.node.id === tgt.id && e.connectionType === rule.connectionType,
          );
          if (!exists) {
            (src.edges ??= []).push({
              node: tgt,
              connectionType: rule.connectionType,
            });
            if (rule.bidirectional) {
              (tgt.edges ??= []).push({
                node: src,
                connectionType: rule.connectionType,
              });
            }
          }
        }
      }
    }
  }

  private static _createDefaultEdges(nodes: GraphNode[]): void {
    // Group nodes by 'base name' (stripping common suffixes like -service,
    // -deployment) to find nodes that logically belong to the same application
    // unit. Services and Deployments in the same name group are then connected.
    const groups = new Map<string, GraphNode[]>();
    for (const node of nodes) {
      const base = this._getBaseName(node.name);
      (groups.get(base) ?? groups.set(base, []).get(base)!).push(node);
    }

    for (const groupNodes of groups.values()) {
      if (groupNodes.length < 2) continue;

      const deployments = groupNodes.filter(
        (n) => n.nodeType === GraphNodeType.DEPLOYMENT,
      );
      const services = groupNodes.filter(
        (n) => n.nodeType === GraphNodeType.SERVICE,
      );
      const pods = groupNodes.filter((n) => n.nodeType === GraphNodeType.POD);

      for (const svc of services) {
        for (const dep of deployments) {
          if (!svc.edges?.some((e) => e.node.id === dep.id)) {
            (svc.edges ??= []).push({
              node: dep,
              connectionType: ConnectionType.SERVICE_EXPOSES_POD,
            });
          }
        }
      }

      for (const dep of deployments) {
        for (const pod of pods) {
          if (!dep.edges?.some((e) => e.node.id === pod.id)) {
            (dep.edges ??= []).push({
              node: pod,
              connectionType: ConnectionType.MANAGES,
            });
          }
        }
      }
    }
  }

  private static _getBaseName(name: string): string {
    const suffixes = [
      "-service",
      "-svc",
      "-deployment",
      "-deploy",
      "-pod",
      "-pods",
      "-ingress",
      "-configmap",
      "-secret",
    ];
    let base = name.toLowerCase();
    for (const s of suffixes) {
      if (base.endsWith(s)) {
        base = base.slice(0, -s.length);
        break;
      }
    }
    return base;
  }

  static getNeededInfrastructure(
    desiredGraph: Graph,
    existingGraph: Graph | null,
    options: NodeExtractionOptions = {},
  ): GraphNode[] {
    if (!existingGraph) return this.extractNodes(desiredGraph, options);

    const existingMap = new Map<string, GraphNode>();
    for (const node of existingGraph.nodes ?? []) {
      existingMap.set(node.id, node);
    }

    return (desiredGraph.nodes ?? []).filter((desired) => {
      const existing = existingMap.get(desired.id);
      return (
        (!existing || this._nodeConfigurationChanged(desired, existing)) &&
        this._passesFilters(desired, options)
      );
    });
  }

  static extractNodes(
    graph: Graph,
    options: NodeExtractionOptions = {},
  ): GraphNode[] {
    const {
      includeExternal = true,
      filterByType,
      minConnections = 0,
    } = options;
    let nodes = [...(graph.nodes ?? [])];

    if (filterByType?.length)
      nodes = nodes.filter((n) => filterByType.includes(n.nodeType));
    if (!includeExternal)
      nodes = nodes.filter(
        (n) => n.nodeType !== GraphNodeType.EXTERNAL_DEPENDENCY,
      );
    if (minConnections > 0)
      nodes = nodes.filter((n) => (n.edges?.length ?? 0) >= minConnections);

    return nodes;
  }

  private static _nodeConfigurationChanged(
    desired: GraphNode,
    existing: GraphNode,
  ): boolean {
    if (
      desired.name !== existing.name ||
      desired.nodeType !== existing.nodeType
    )
      return true;
    return (
      JSON.stringify(desired.spec ?? {}) !== JSON.stringify(existing.spec ?? {})
    );
  }

  private static _passesFilters(
    node: GraphNode,
    options: NodeExtractionOptions,
  ): boolean {
    const { filterByType, minConnections = 0 } = options;
    if (filterByType?.length && !filterByType.includes(node.nodeType))
      return false;
    if (minConnections > 0 && (node.edges?.length ?? 0) < minConnections)
      return false;
    return true;
  }

  static validateGraph(graph: Graph): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!graph.name) errors.push("Graph must have a name");
    if (!graph.graphType) errors.push("Graph must have a graph type");
    if (!graph.companyId) errors.push("Graph must have a company ID");
    if (!graph.userId) errors.push("Graph must have a user ID");

    if (!graph.nodes || graph.nodes.length === 0) {
      warnings.push("Graph has no nodes");
    } else {
      const ids = graph.nodes.map((n) => n.id);
      const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dups.length) errors.push(`Duplicate node IDs: ${dups.join(", ")}`);

      const unnamed = graph.nodes.filter((n) => !n.name);
      if (unnamed.length)
        warnings.push(`${unnamed.length} nodes without names`);

      for (const node of graph.nodes) {
        for (const edge of node.edges ?? []) {
          if (!edge.node)
            errors.push(`Node ${node.id} has edge without target node`);
          else if (!edge.connectionType)
            errors.push(`Node ${node.id} has edge without connection type`);
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}

// ---------------------------------------------------------------------------
// Convenience function exports
// ---------------------------------------------------------------------------

export function computeGraphHash(
  graph: Graph,
  options?: GraphHashOptions,
): string {
  return CodegenUtils.computeGraphHash(graph, options);
}

export function buildGraphEdges(
  graph: Graph,
  options?: EdgeBuildingOptions,
): Graph {
  return CodegenUtils.buildGraphEdges(graph, options);
}

export function getNeededInfrastructure(
  desiredGraph: Graph,
  existingGraph: Graph | null,
  options?: NodeExtractionOptions,
): GraphNode[] {
  return CodegenUtils.getNeededInfrastructure(
    desiredGraph,
    existingGraph,
    options,
  );
}

export function extractNodes(
  graph: Graph,
  options?: NodeExtractionOptions,
): GraphNode[] {
  return CodegenUtils.extractNodes(graph, options);
}

export function validateGraph(graph: Graph) {
  return CodegenUtils.validateGraph(graph);
}
