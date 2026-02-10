/**
 * RAG context retrieval service
 * Port of _get_rag_context() from app/workflows/codegen_workflow.py
 * Uses Dgraph HNSW vector search for similar graphs
 */

import { dgraphClient } from '../db/client';
import { Graph, GraphNode } from '../types/graph';

// Similar graph result interface
export interface SimilarGraphResult {
  graph: Graph;
  similarity: number;
  context: string;
}

// RAG context interface
export interface RAGContext {
  similarGraphs: Graph[];
  contextText: string;
  avgEmbedding?: number[];
  searchPerformed: boolean;
}

/**
 * RAG context service for retrieving similar graphs and building context
 */
export class RAGContextService {
  private readonly dgraphClient = dgraphClient;

  /**
   * Retrieve similar graphs and build context string
   * 
   * @param graph - Input graph to find similar graphs for
   * @param topK - Number of similar graphs to retrieve (default: 3)
   * @param companyId - Optional company filter
   * @returns - RAG context with similar graphs and context text
   */
  async getRAGContext(
    graph: Graph | null,
    topK: number = 3,
    companyId?: string
  ): Promise<RAGContext> {
    const context: RAGContext = {
      similarGraphs: [],
      contextText: '',
      searchPerformed: false,
    };

    if (!graph) {
      return context;
    }

    try {
      // Prefer graph-level contextEmbedding (precomputed in Dgraph)
      // Fall back to averaging individual node embeddings
      let searchEmbedding: number[] | undefined;

      if (graph.contextEmbedding && Array.isArray(graph.contextEmbedding) && graph.contextEmbedding.length > 0) {
        searchEmbedding = graph.contextEmbedding;
        console.debug('Using graph-level contextEmbedding for similarity search');
      } else {
        const nodeEmbeddings = this.extractNodeEmbeddings(graph);
        if (nodeEmbeddings.length > 0) {
          searchEmbedding = this.computeAverageEmbedding(nodeEmbeddings);
          console.debug(`Computed average embedding from ${nodeEmbeddings.length} node embeddings`);
        }
      }

      if (!searchEmbedding) {
        console.debug('No embeddings found in graph, skipping RAG context');
        return context;
      }

      context.avgEmbedding = searchEmbedding;

      // Search for similar graphs using Dgraph's HNSW vector search
      console.debug(`Searching for ${topK} similar graphs using average embedding`);
      const similarGraphs = await this.dgraphClient.searchSimilarGraphsByEmbedding(
        searchEmbedding,
        topK,
        companyId
      );

      context.similarGraphs = similarGraphs;
      context.searchPerformed = true;

      // Build context text from similar graphs
      if (similarGraphs.length > 0) {
        context.contextText = this.buildContextText(similarGraphs);
        console.debug(`Built RAG context from ${similarGraphs.length} similar graphs`);
      } else {
        console.debug('No similar graphs found');
      }

    } catch (error) {
      console.error('Failed to retrieve RAG context:', error);
      // Return empty context on error but don't fail the workflow
    }

    return context;
  }

  /**
   * Extract embeddings from graph nodes
   */
  private extractNodeEmbeddings(graph: Graph): number[][] {
    const embeddings: number[][] = [];

    if (!graph.nodes || graph.nodes.length === 0) {
      return embeddings;
    }

    for (const node of graph.nodes) {
      if (node.embedding && Array.isArray(node.embedding)) {
        embeddings.push(node.embedding);
      }
    }

    return embeddings;
  }

  /**
   * Compute average embedding from multiple embeddings
   */
  private computeAverageEmbedding(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      return [];
    }

    if (embeddings.length === 1) {
      return embeddings[0];
    }

    const dimensions = embeddings[0].length;
    const avgEmbedding: number[] = new Array(dimensions);

    // Initialize with zeros
    for (let i = 0; i < dimensions; i++) {
      avgEmbedding[i] = 0;
    }

    // Sum all embeddings
    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        avgEmbedding[i] += embedding[i];
      }
    }

    // Compute average
    for (let i = 0; i < dimensions; i++) {
      avgEmbedding[i] /= embeddings.length;
    }

    return avgEmbedding;
  }

  /**
   * Build context text from similar graphs
   */
  private buildContextText(similarGraphs: Graph[]): string {
    let contextText = '\n\n## Similar Infrastructure Examples\n';
    contextText += 'Based on your graph structure, here are similar infrastructures for reference:\n\n';

    for (let idx = 0; idx < similarGraphs.length; idx++) {
      const similarGraph = similarGraphs[idx];
      contextText += `### Example ${idx + 1}: ${similarGraph.name}\n`;

      if (similarGraph.description) {
        contextText += `Description: ${similarGraph.description}\n`;
      }

      if (similarGraph.nodes && similarGraph.nodes.length > 0) {
        contextText += `Resources: ${similarGraph.nodes.length} nodes\n`;

        // Count and list node types
        const nodeTypes: Record<string, number> = {};
        for (const node of similarGraph.nodes) {
          const nodeType = node.nodeType || 'Unknown';
          nodeTypes[nodeType] = (nodeTypes[nodeType] || 0) + 1;
        }

        const nodeTypeList = Object.entries(nodeTypes)
          .map(([type, count]) => `${type}: ${count}`)
          .join(', ');
        contextText += `Node types: ${nodeTypeList}\n`;
      }

      // Add graph type if available
      if (similarGraph.graphType) {
        contextText += `Graph type: ${similarGraph.graphType}\n`;
      }

      // Add company/user info if available (for context)
      if (similarGraph.companyId) {
        contextText += `Company: ${similarGraph.companyId}\n`;
      }

      contextText += '\n';
    }

    return contextText;
  }

  /**
   * Get detailed context for a specific node type
   */
  async getNodeContext(
    nodeType: string,
    limit: number = 5,
    companyId?: string
  ): Promise<{
    nodes: GraphNode[];
    contextText: string;
  }> {
    try {
      // Query for nodes of specific type
      // This would require a custom GraphQL query or DQL query
      // For now, return empty context
      console.debug(`Node context for type ${nodeType} not yet implemented`);
      
      return {
        nodes: [],
        contextText: '',
      };
    } catch (error) {
      console.error(`Failed to get node context for ${nodeType}:`, error);
      return {
        nodes: [],
        contextText: '',
      };
    }
  }

  /**
   * Get context for connection patterns
   */
  async getConnectionContext(
    sourceType: string,
    targetType: string,
    limit: number = 3
  ): Promise<{
    connections: any[];
    contextText: string;
  }> {
    try {
      // Query for specific connection patterns
      // This would require custom GraphQL queries
      console.debug(`Connection context for ${sourceType} -> ${targetType} not yet implemented`);
      
      return {
        connections: [],
        contextText: '',
      };
    } catch (error) {
      console.error(`Failed to get connection context:`, error);
      return {
        connections: [],
        contextText: '',
      };
    }
  }

  /**
   * Search graphs by text content (hybrid search)
   */
  async searchGraphsByText(
    query: string,
    limit: number = 5,
    companyId?: string
  ): Promise<Graph[]> {
    try {
      // This would require implementing text search capabilities
      // For now, return empty results
      console.debug(`Text search for graphs not yet implemented`);
      return [];
    } catch (error) {
      console.error(`Failed to search graphs by text:`, error);
      return [];
    }
  }

  /**
   * Get statistics about RAG context usage
   */
  async getRAGStats(): Promise<{
    totalGraphsWithEmbeddings: number;
    averageEmbeddingDimensions: number;
    mostCommonNodeTypes: Record<string, number>;
  }> {
    try {
      // This would require analytics queries
      // For now, return placeholder stats
      return {
        totalGraphsWithEmbeddings: 0,
        averageEmbeddingDimensions: 0,
        mostCommonNodeTypes: {},
      };
    } catch (error) {
      console.error('Failed to get RAG stats:', error);
      return {
        totalGraphsWithEmbeddings: 0,
        averageEmbeddingDimensions: 0,
        mostCommonNodeTypes: {},
      };
    }
  }
}

// Export singleton instance
export const ragContextService = new RAGContextService();

// Export convenience functions
export async function getRAGContext(
  graph: Graph | null,
  topK: number = 3,
  companyId?: string
): Promise<RAGContext> {
  return await ragContextService.getRAGContext(graph, topK, companyId);
}

export async function buildSimilarGraphsContext(
  graphs: Graph[]
): Promise<string> {
  if (!graphs || graphs.length === 0) {
    return '';
  }

  let contextText = '\n\n## Similar Infrastructure Examples\n';
  contextText += 'Here are similar infrastructures for reference:\n\n';

  for (let idx = 0; idx < graphs.length; idx++) {
    const graph = graphs[idx];
    contextText += `### Example ${idx + 1}: ${graph.name}\n`;

    if (graph.description) {
      contextText += `Description: ${graph.description}\n`;
    }

    if (graph.nodes && graph.nodes.length > 0) {
      contextText += `Resources: ${graph.nodes.length} nodes\n`;

      const nodeTypes: Record<string, number> = {};
      for (const node of graph.nodes) {
        const nodeType = node.nodeType || 'Unknown';
        nodeTypes[nodeType] = (nodeTypes[nodeType] || 0) + 1;
      }

      const nodeTypeList = Object.entries(nodeTypes)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
      contextText += `Node types: ${nodeTypeList}\n`;
    }

    contextText += '\n';
  }

  return contextText;
}