/**
 * MCP Graph Management Tool Handlers
 * Provides graph CRUD and query capabilities via MCP tools
 */

import type { MCPToolResult } from '../types';
import { dgraphClient } from '../../db/client';
import { GraphType } from '../../types/enums';
import type { Graph, GraphNode, Edge } from '../../types/graph';
import type { WorkflowContext } from '../../types/workflow';
import { v4 as uuidv4 } from 'uuid';

/**
 * Query existing graphs from the database
 */
export async function queryGraphs(
  params: {
    namespace?: string;
    graphType?: string;
    nameContains?: string;
    limit?: number;
    offset?: number;
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  try {
    console.info(`Querying graphs: namespace=${params.namespace}, type=${params.graphType}`);

    // Build query
    let query = `
      query QueryGraphs {
        queryGraph {
          id
          name
          description
          namespace
          graphType
          createdAt
          updatedAt
        }
      }
    `;

    // Execute query
    const result = await dgraphClient.getGraphs(
      context.companyId,
      context.userId,
      params.limit || 20
    );

    if (!result) {
      return {
        content: [{ 
          type: 'text', 
          text: 'No graphs found or query failed.' 
        }],
        isError: false,
      };
    }

    // Filter results if needed
    let graphs = result;
    if (params.namespace) {
      graphs = graphs.filter((g: Graph) => g.namespace === params.namespace);
    }
    if (params.graphType) {
      graphs = graphs.filter((g: Graph) => g.graphType === params.graphType);
    }
    if (params.nameContains) {
      const searchTerm = params.nameContains.toLowerCase();
      graphs = graphs.filter((g: Graph) => 
        g.name.toLowerCase().includes(searchTerm) ||
        g.description?.toLowerCase().includes(searchTerm)
      );
    }

    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({
          total: graphs.length,
          graphs: graphs.map((graph: Graph) => ({
            id: graph.id,
            name: graph.name,
            description: graph.description,
            namespace: graph.namespace,
            graphType: graph.graphType,
            createdAt: graph.createdAt,
            updatedAt: graph.updatedAt,
          })),
        }, null, 2)
      }],
      isError: false,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ 
        type: 'text', 
        text: `Error querying graphs: ${errorMessage}` 
      }],
      isError: true,
    };
  }
}

/**
 * Get a specific graph by ID
 */
export async function getGraph(
  params: {
    graphId: string;
    includeNodes?: boolean;
    includeBridges?: boolean;
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  try {
    console.info(`Getting graph: ${params.graphId}`);

    const result = await dgraphClient.getGraph(params.graphId);

    if (!result) {
      return {
        content: [{ 
          type: 'text', 
          text: `Graph not found: ${params.graphId}` 
        }],
        isError: false,
      };
    }

    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({
          graph: {
            id: result.id,
            name: result.name,
            description: result.description,
            namespace: result.namespace,
            graphType: result.graphType,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            nodes: params.includeNodes ? result.nodes?.map((node: GraphNode) => ({
              id: node.id,
              name: node.name,
              nodeType: node.nodeType,
              namespace: node.namespace,
            })) : `(${result.nodes?.length || 0} nodes - use includeNodes=true to see all)`,
            bridges: params.includeBridges ? result.bridges : `(${result.bridges?.length || 0} bridges - use includeBridges=true to see all)`,
          },
        }, null, 2)
      }],
      isError: false,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ 
        type: 'text', 
        text: `Error getting graph: ${errorMessage}` 
      }],
      isError: true,
    };
  }
}

/**
 * Create a new graph
 */
export async function createGraph(
  params: {
    name: string;
    description?: string;
    namespace?: string;
    graphType?: string;
    nodes?: any[];
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  try {
    console.info(`Creating graph: ${params.name}`);

    const graph: Graph = {
      id: uuidv4(),
      name: params.name,
      description: params.description,
      namespace: params.namespace || 'default',
      graphType: (params.graphType as GraphType) || GraphType.KUBERNETES,
      nodes: params.nodes || [],
      bridges: [],
      userId: context.userId,
      companyId: context.companyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to database - returns graph ID
    const graphId = await dgraphClient.createGraph(graph);

    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({
          success: true,
          message: 'Graph created successfully',
          graph: {
            id: graphId,
            name: graph.name,
            description: graph.description,
            namespace: graph.namespace,
            graphType: graph.graphType,
            createdAt: graph.createdAt,
          },
        }, null, 2)
      }],
      isError: false,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ 
        type: 'text', 
        text: `Error creating graph: ${errorMessage}` 
      }],
      isError: true,
    };
  }
}

/**
 * Update an existing graph
 */
export async function updateGraph(
  params: {
    graphId: string;
    name?: string;
    description?: string;
    namespace?: string;
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  try {
    console.info(`Updating graph: ${params.graphId}`);

    // First get the existing graph
    const existing = await dgraphClient.getGraph(params.graphId);

    if (!existing) {
      return {
        content: [{ 
          type: 'text', 
          text: `Graph not found: ${params.graphId}` 
        }],
        isError: true,
      };
    }

    // Build update
    const update: Partial<Graph> = {
      id: params.graphId,
      updatedAt: new Date().toISOString(),
    };

    if (params.name) update.name = params.name;
    if (params.description) update.description = params.description;
    if (params.namespace) update.namespace = params.namespace;

    // Update in database - requires id as first parameter
    const result = await dgraphClient.updateGraph(params.graphId, update);

    if (!result) {
      return {
        content: [{ 
          type: 'text', 
          text: `Failed to update graph: ${params.graphId}` 
        }],
        isError: true,
      };
    }

    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({
          success: true,
          message: 'Graph updated successfully',
          graph: {
            id: result.id,
            name: result.name,
            description: result.description,
            namespace: existing.namespace,
            graphType: existing.graphType,
          },
        }, null, 2)
      }],
      isError: false,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ 
        type: 'text', 
        text: `Error updating graph: ${errorMessage}` 
      }],
      isError: true,
    };
  }
}

/**
 * Delete a graph
 */
export async function deleteGraph(
  params: {
    graphId: string;
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  try {
    console.info(`Deleting graph: ${params.graphId}`);

    await dgraphClient.deleteGraph(params.graphId);

    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({
          success: true,
          message: `Graph ${params.graphId} deleted successfully`,
        }, null, 2)
      }],
      isError: false,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ 
        type: 'text', 
        text: `Error deleting graph: ${errorMessage}` 
      }],
      isError: true,
    };
  }
}

/**
 * Get RAG context for a specific graph or requirement
 */
export async function getRAGContext(
  params: {
    graphId: string;
    limit?: number;
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  try {
    console.info(`Getting RAG context for graph: ${params.graphId}`);

    const { ragContextService } = await import('../../rag/context');
    
    // First get the graph
    const graph = await dgraphClient.getGraph(params.graphId, context.companyId, context.userId);
    
    if (!graph) {
      return {
        content: [{ 
          type: 'text', 
          text: `Graph not found: ${params.graphId}` 
        }],
        isError: false,
      };
    }
    
    // Get RAG context using the graph
    const ragContext = await ragContextService.getRAGContext(graph, params.limit || 5, context.companyId);

    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({
          graphId: params.graphId,
          contextText: ragContext.contextText,
          searchPerformed: ragContext.searchPerformed,
          similarGraphs: ragContext.similarGraphs?.map((graph: Graph) => ({
            id: graph.id,
            name: graph.name,
            description: graph.description,
            namespace: graph.namespace,
            nodeCount: graph.nodes?.length || 0,
          })),
        }, null, 2)
      }],
      isError: false,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ 
        type: 'text', 
        text: `Error getting RAG context: ${errorMessage}` 
      }],
      isError: true,
    };
  }
}