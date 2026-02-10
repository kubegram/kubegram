/**
 * Graph Input Cleaner
 *
 * Transforms raw UI graph payloads into the shape expected by the RAG
 * GraphQL API (CreateGraphInput / UpdateGraphInput).
 *
 * Uses an **allowlist** approach — only fields that are recognised by the
 * GraphQL schema are forwarded.  Everything else (canvas coordinates,
 * icon paths, UI-generated arrow data, etc.) is silently dropped.
 *
 * Responsibilities:
 *  - Pick only schema-recognised fields from the graph and its nodes.
 *  - Omit bridges (the UI sends node-to-node canvas arrows, but the
 *    GraphQL schema's GraphBridgeInput expects cross-graph links).
 *  - Normalise enum casing (e.g. "Service" -> "SERVICE").
 */

import type { GraphInput, GraphNodeType } from '@/clients/rag-client';

/**
 * Allowed top-level graph fields (CreateGraphInput).
 *
 * Note: `bridges` is intentionally excluded — the client's bridge shape
 * is incompatible with GraphBridgeInput and the field is optional.
 */
const GRAPH_FIELDS = [
  'name',
  'description',
  'graphType',
  'companyId',
  'userId',
  'nodes',
  'clusterId',
  'parentGraphId',
  'subgraphs',
  'id',
] as const;

/**
 * Allowed node fields (NodeInput).
 *
 * `id` is included despite not being formally declared on NodeInput — the
 * RAG server uses it as the node's primary key and its response schema
 * requires GraphNode.id to be non-null.
 */
const NODE_FIELDS = [
  'id',
  'name',
  'companyId',
  'userId',
  'nodeType',
  'namespace',
  'dependencyType',
  'edges',
  'spec',
  'createdAt',
  'updatedAt',
  'cache',
  'database',
  'gateway',
  'loadBalancer',
  'messageQueue',
  'microservice',
  'monitoring',
  'proxy',
] as const;

/**
 * Pick only the allowed keys from a source object.
 */
function pickFields(
  source: Record<string, unknown>,
  allowedFields: readonly string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in source) {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Clean a single node: pick allowed fields and normalise `nodeType` casing.
 */
function cleanNode(node: Record<string, unknown>): Record<string, unknown> {
  const cleaned = pickFields(node, NODE_FIELDS);

  // Normalise enum casing (e.g. "Service" -> "SERVICE")
  if (typeof cleaned.nodeType === 'string') {
    cleaned.nodeType = cleaned.nodeType.toUpperCase() as GraphNodeType;
  }

  return cleaned;
}

/**
 * Transform a raw graph payload from the UI into a shape the RAG GraphQL
 * API will accept.
 *
 * - Only schema-recognised fields are forwarded (allowlist).
 * - Bridges are omitted entirely (optional, incompatible shape).
 * - Node enum values are uppercased.
 */
export function cleanGraphInput(graph: GraphInput): GraphInput {
  const cleaned = pickFields(
    graph as unknown as Record<string, unknown>,
    GRAPH_FIELDS,
  );

  // Process nodes through the node-level allowlist
  if (Array.isArray(cleaned.nodes)) {
    cleaned.nodes = cleaned.nodes.map((node: unknown) => {
      if (!node) return node;
      return cleanNode(node as Record<string, unknown>);
    });
  }

  return cleaned as unknown as GraphInput;
}
