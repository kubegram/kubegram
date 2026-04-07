/**
 * MCP Graph Management Tool Handlers
 *
 * All graph operations are delegated to an injected GraphService.
 * kubegram-core defines the interface; callers provide the implementation.
 */

import type { MCPToolResult } from '../types';
import type { MCPToolServiceContext } from '../tool-registry';
import type { Graph, GraphNode } from '../../types/graph';
import type { WorkflowContext } from '../../types/workflow';

// ── Interface ────────────────────────────────────────────────────────────────

export interface GraphService {
  queryGraphs(params: {
    namespace?: string;
    graphType?: string;
    nameContains?: string;
    limit?: number;
    offset?: number;
  }): Promise<Graph[]>;

  getGraph(
    graphId: string,
    options?: { includeNodes?: boolean; includeBridges?: boolean }
  ): Promise<Graph | null>;

  createGraph(input: {
    name: string;
    description?: string;
    namespace?: string;
    graphType?: string;
    nodes?: GraphNode[];
    userId: string;
    companyId: string;
  }): Promise<Graph>;

  updateGraph(
    graphId: string,
    input: { name?: string; description?: string; namespace?: string }
  ): Promise<Graph | null>;

  deleteGraph(graphId: string): Promise<boolean>;

  getRAGContext(
    graphId: string,
    limit?: number
  ): Promise<{ graphs: Graph[]; similarity: number[] }>;
}

// ── Shared error for missing service ─────────────────────────────────────────

const noService: MCPToolResult = {
  content: [{ type: 'text', text: 'GraphService is not available on this MCPService instance.' }],
  isError: true,
};

// ── Handlers ─────────────────────────────────────────────────────────────────

export async function queryGraphs(
  service: MCPToolServiceContext,
  params: {
    namespace?: string;
    graphType?: string;
    nameContains?: string;
    limit?: number;
    offset?: number;
  },
  _context: WorkflowContext
): Promise<MCPToolResult> {
  if (!service.graphService) return noService;
  try {
    const graphs = await service.graphService.queryGraphs(params);
    return {
      content: [{ type: 'text', text: JSON.stringify(graphs, null, 2) }],
      isError: false,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { content: [{ type: 'text', text: `Error querying graphs: ${msg}` }], isError: true };
  }
}

export async function getGraph(
  service: MCPToolServiceContext,
  params: { graphId: string; includeNodes?: boolean; includeBridges?: boolean },
  _context: WorkflowContext
): Promise<MCPToolResult> {
  if (!service.graphService) return noService;
  try {
    const graph = await service.graphService.getGraph(params.graphId, {
      includeNodes: params.includeNodes,
      includeBridges: params.includeBridges,
    });
    if (!graph) {
      return { content: [{ type: 'text', text: `Graph not found: ${params.graphId}` }], isError: false };
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(graph, null, 2) }],
      isError: false,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { content: [{ type: 'text', text: `Error getting graph: ${msg}` }], isError: true };
  }
}

export async function createGraph(
  service: MCPToolServiceContext,
  params: {
    name: string;
    description?: string;
    namespace?: string;
    graphType?: string;
    nodes?: GraphNode[];
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  if (!service.graphService) return noService;
  try {
    const graph = await service.graphService.createGraph({
      ...params,
      userId: context.userId,
      companyId: context.companyId,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(graph, null, 2) }],
      isError: false,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { content: [{ type: 'text', text: `Error creating graph: ${msg}` }], isError: true };
  }
}

export async function updateGraph(
  service: MCPToolServiceContext,
  params: { graphId: string; name?: string; description?: string; namespace?: string },
  _context: WorkflowContext
): Promise<MCPToolResult> {
  if (!service.graphService) return noService;
  try {
    const graph = await service.graphService.updateGraph(params.graphId, {
      name: params.name,
      description: params.description,
      namespace: params.namespace,
    });
    if (!graph) {
      return { content: [{ type: 'text', text: `Graph not found: ${params.graphId}` }], isError: false };
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(graph, null, 2) }],
      isError: false,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { content: [{ type: 'text', text: `Error updating graph: ${msg}` }], isError: true };
  }
}

export async function deleteGraph(
  service: MCPToolServiceContext,
  params: { graphId: string },
  _context: WorkflowContext
): Promise<MCPToolResult> {
  if (!service.graphService) return noService;
  try {
    const success = await service.graphService.deleteGraph(params.graphId);
    return {
      content: [{
        type: 'text',
        text: success
          ? `Successfully deleted graph: ${params.graphId}`
          : `Failed to delete graph ${params.graphId}. It may not exist.`,
      }],
      isError: !success,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { content: [{ type: 'text', text: `Error deleting graph: ${msg}` }], isError: true };
  }
}

export async function getRAGContext(
  service: MCPToolServiceContext,
  params: { graphId: string; limit?: number },
  _context: WorkflowContext
): Promise<MCPToolResult> {
  if (!service.graphService) return noService;
  try {
    const result = await service.graphService.getRAGContext(params.graphId, params.limit);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      isError: false,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { content: [{ type: 'text', text: `Error getting RAG context: ${msg}` }], isError: true };
  }
}
