/**
 * Dgraph HTTP/GraphQL client implementation
 * Port of active GraphQL methods from app/db/client.py
 * Only HTTP/GraphQL API is used - no gRPC/DQL needed
 */

import { dgraphConfig } from '../config';
import { Graph, GraphNode, Microservice, GraphInput, MicroserviceInput } from '../types/graph';
import { GraphNodeType, GraphType } from '../types/enums';

// GraphQL response types
interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
  extensions?: any;
}

interface GraphQlPayload {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

// Error class for Dgraph operations
export class DgraphError extends Error {
  constructor(
    message: string,
    public readonly errors?: Array<{ message: string; path?: string[] }>,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'DgraphError';
  }
}

/**
 * Dgraph client using HTTP/GraphQL API only
 * Replaces pydgraph gRPC client with fetch-based HTTP client
 */
export class DgraphClient {
  private readonly graphqlUrl: string;
  private readonly adminUrl: string;
  private readonly headers: Record<string, string>;

  constructor() {
    this.graphqlUrl = dgraphConfig.graphqlEndpoint;
    this.adminUrl = dgraphConfig.adminEndpoint;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Execute GraphQL query with retry logic
   */
  private async graphqlQuery<T = any>(
    payload: GraphQlPayload,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(this.graphqlUrl, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: GraphQLResponse<T> = await response.json();

        if (result.errors && result.errors.length > 0) {
          throw new DgraphError(
            `GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`,
            result.errors
          );
        }

        if (!result.data) {
          throw new DgraphError('No data returned from GraphQL query');
        }

        return result.data;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.warn(
            `Dgraph connection failed (attempt ${attempt + 1}/${maxRetries}), ` +
            `retrying in ${waitTime}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    console.error(`All ${maxRetries} Dgraph connection attempts failed`);
    throw lastError || new DgraphError('Failed to connect to Dgraph');
  }

  /**
   * Execute GraphQL mutation
   */
  private async graphqlMutate<T = any>(
    mutation: string,
    variables?: Record<string, any>
  ): Promise<T> {
    return this.graphqlQuery<T>({ query: mutation, variables });
  }

  /**
   * Apply GraphQL schema to Dgraph
   */
  async applySchema(schemaContent?: string): Promise<boolean> {
    const url = `${this.adminUrl}/schema`;
    const headers = { ...this.headers, 'Content-Type': 'application/graphql' };

    let schema: string;
    if (schemaContent) {
      schema = schemaContent;
    } else {
      // Load schema from file
      try {
        const schemaFile = await import('../db/schema.graphql?raw');
        schema = schemaFile.default;
      } catch (error) {
        throw new DgraphError('Failed to load schema.graphql file');
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: schema,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new DgraphError(`Failed to apply schema: HTTP ${response.status}`);
    }

    const result = await response.json();
    return Boolean(result.data?.updateGQLSchema);
  }

  /**
   * Check if a value looks like a Dgraph UID (e.g., 0x1, 0x2a)
   */
  private isDgraphUid(value: string): boolean {
    if (!value || !value.trim()) {
      return false;
    }
    return /^0x[0-9a-fA-F]+$/.test(value.trim());
  }

  /**
   * Create a new graph
   */
  async createGraph(graph: Omit<Graph, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const mutation = `
      mutation CreateGraph($input: AddGraphInput!) {
        addGraph(input: [$input]) {
          graph { 
            id 
            name 
            description 
            graphType 
            companyId 
            userId 
          }
        }
      }
    `;

    const input = {
      name: graph.name,
      companyId: graph.companyId,
      userId: graph.userId,
      ...(graph.description && { description: graph.description }),
      ...(graph.graphType && { graphType: graph.graphType }),
    };

    const result = await this.graphqlMutate(mutation, { input });
    return result.addGraph.graph[0].id;
  }

  /**
   * Get a graph by ID with optional filters
   */
  async getGraph(
    id: string,
    companyId?: string,
    userId?: string
  ): Promise<Graph | null> {
    if (!id || !id.trim()) {
      return null;
    }

    // Only query Dgraph if the ID looks like a Dgraph UID
    if (!this.isDgraphUid(id)) {
      console.debug(`Skipping Dgraph call for non-UID id: ${id}`);
      return null;
    }

    const query = `
      query GetGraph($id: ID!) {
        getGraph(id: $id) {
          id 
          name 
          description 
          createdAt 
          updatedAt 
          graphType 
          companyId 
          userId 
          nodes { 
            id 
            name 
            nodeType 
            namespace 
            createdAt 
            updatedAt 
          }
        }
      }
    `;

    try {
      const result = await this.graphqlQuery<{ getGraph: Graph }>({ query, variables: { id } });
      const data = result.getGraph;

      if (!data) {
        return null;
      }

      // Apply filters if provided
      if (companyId && data.companyId !== companyId) {
        return null;
      }
      if (userId && data.userId !== userId) {
        return null;
      }

      return data;
    } catch (error) {
      if (error instanceof DgraphError) {
        console.error('Failed to get graph:', error.message);
      }
      return null;
    }
  }

  /**
   * Get graphs by company and optional user ID
   */
  async getGraphs(
    companyId: string,
    userId?: string,
    limit?: number
  ): Promise<Graph[]> {
    const query = `
      query GetGraphs($companyId: String!${userId ? ', $userId: String!' : ''}${limit ? ', $first: Int' : ''}) {
        queryGraph(
          filter: { companyId: { eq: $companyId }${userId ? ', userId: { eq: $userId }' : ''} }
          ${limit ? 'first: $first' : ''}
        ) {
          id
          name
          description
          createdAt
          updatedAt
          graphType
          companyId
          userId
          nodes {
            id
            name
            nodeType
            namespace
          }
        }
      }
    `;

    const variables: Record<string, any> = { companyId };
    if (userId) variables.userId = userId;
    if (limit) variables.first = limit;

    try {
      const result = await this.graphqlQuery<{ queryGraph: Graph[] }>({ query, variables });
      return result.queryGraph || [];
    } catch (error) {
      if (error instanceof DgraphError) {
        console.error('Failed to get graphs:', error.message);
      }
      return [];
    }
  }

  /**
   * Get a graph by name with filters
   */
  async getGraphByName(
    name: string,
    companyId: string,
    userId?: string
  ): Promise<Graph | null> {
    const query = `
      query GetGraphByName($name: String!, $companyId: String!${userId ? ', $userId: String!' : ''}) {
        queryGraph(filter: { name: { eq: $name }, companyId: { eq: $companyId }${userId ? ', userId: { eq: $userId }' : ''} }) {
          id
          name
          description
          createdAt
          updatedAt
          graphType
          companyId
          userId
          nodes {
            id
            name
            nodeType
            namespace
          }
        }
      }
    `;

    const variables: Record<string, any> = { name, companyId };
    if (userId) variables.userId = userId;

    try {
      const result = await this.graphqlQuery<{ queryGraph: Graph[] }>({ query, variables });
      const graphs = result.queryGraph || [];
      return graphs.length > 0 ? graphs[0] : null;
    } catch (error) {
      if (error instanceof DgraphError) {
        console.error('Failed to get graph by name:', error.message);
      }
      return null;
    }
  }

  /**
   * Update an existing graph
   */
  async updateGraph(
    id: string,
    updates: Partial<Omit<Graph, 'id' | 'companyId' | 'userId'>>
  ): Promise<Graph | null> {
    const mutation = `
      mutation UpdateGraph($id: ID!, $input: GraphInput!) {
        updateGraph(input: { filter: { id: $id }, set: $input }) {
          graph {
            id 
            name 
            description 
            graphType 
            companyId 
            userId 
          }
        }
      }
    `;

    const input: Record<string, any> = {};
    if (updates.name !== undefined) input.name = updates.name;
    if (updates.description !== undefined) input.description = updates.description;
    if (updates.graphType !== undefined) input.graphType = updates.graphType;

    try {
      const result = await this.graphqlMutate(mutation, { id, input });
      return result.updateGraph.graph[0] || null;
    } catch (error) {
      if (error instanceof DgraphError) {
        console.error('Failed to update graph:', error.message);
      }
      return null;
    }
  }

  /**
   * Delete a graph
   */
  async deleteGraph(id: string): Promise<boolean> {
    const mutation = `
      mutation DeleteGraph($id: ID!) {
        deleteGraph(filter: { id: $id }) {
          graph {
            id
          }
        }
      }
    `;

    try {
      await this.graphqlMutate(mutation, { id });
      return true;
    } catch (error) {
      if (error instanceof DgraphError) {
        console.error('Failed to delete graph:', error.message);
      }
      return false;
    }
  }

  /**
   * Create a new microservice
   */
  async createMicroservice(
    microservice: Omit<Microservice, 'id'>
  ): Promise<string> {
    const mutation = `
      mutation CreateMicroservice($input: AddMicroserviceInput!) {
        addMicroservice(input: [$input]) {
          microservice { 
            id 
            name 
            namespace 
            language 
            framework 
            version 
            category
            repository
            baseImage
            image
            dependencies
            ports
            companyId
            userId
            graphId
          }
        }
      }
    `;

    const input: Record<string, any> = {
      name: microservice.name,
      companyId: microservice.companyId,
      userId: microservice.userId,
    };
    if (microservice.graphId !== undefined) input.graphId = microservice.graphId;
    if (microservice.namespace !== undefined) input.namespace = microservice.namespace;
    if (microservice.language !== undefined) input.language = microservice.language;
    if (microservice.framework !== undefined) input.framework = microservice.framework;
    if (microservice.version !== undefined) input.version = microservice.version;
    if (microservice.category !== undefined) input.category = microservice.category;
    if (microservice.repository !== undefined) input.repository = microservice.repository;
    if (microservice.baseImage !== undefined) input.baseImage = microservice.baseImage;
    if (microservice.image !== undefined) input.image = microservice.image;
    if (microservice.dependencies !== undefined) input.dependencies = microservice.dependencies;
    if (microservice.ports !== undefined) input.ports = microservice.ports;

    const result = await this.graphqlMutate(mutation, { input });
    return result.addMicroservice.microservice[0].id;
  }

  /**
   * Get a microservice by ID
   */
  async getMicroservice(id: string): Promise<Microservice | null> {
    const query = `
      query GetMicroservice($id: ID!) {
        getMicroservice(id: $id) {
          id 
          name 
          companyId
          userId
          graphId
          namespace 
          language 
          framework 
          version 
          category 
          repository 
          baseImage 
          image 
          dependencies 
          ports 
        }
      }
    `;

    try {
      const result = await this.graphqlQuery<{ getMicroservice: Microservice }>({ query, variables: { id } });
      return result.getMicroservice || null;
    } catch (error) {
      if (error instanceof DgraphError) {
        console.error('Failed to get microservice:', error.message);
      }
      return null;
    }
  }

  /**
   * Get microservices by company ID
   */
  async getMicroservices(companyId: string, limit?: number): Promise<Microservice[]> {
    const limitClause = limit ? `first: ${limit}` : '';

    const query = `
      query GetMicroservices($companyId: String!) {
        queryMicroservice(filter: { companyId: { eq: $companyId } } ${limitClause}) {
          id 
          name 
          companyId
          userId
          graphId
          namespace 
          language 
          framework 
          version 
          category 
          repository 
          baseImage 
          image 
          dependencies 
          ports
        }
      }
    `;

    try {
      const result = await this.graphqlQuery<{ queryMicroservice: Microservice[] }>({ query, variables: { companyId } });
      return result.queryMicroservice || [];
    } catch (error) {
      if (error instanceof DgraphError) {
        console.error('Failed to get microservices:', error.message);
      }
      return [];
    }
  }

  /**
   * Update an existing microservice
   */
  async updateMicroservice(
    id: string,
    updates: Partial<Microservice>
  ): Promise<Microservice | null> {
    const mutation = `
      mutation UpdateMicroservice($id: ID!, $input: MicroserviceInput!) {
        updateMicroservice(input: { filter: { id: $id }, set: $input }) {
          microservice {
            id 
            name 
            companyId
            userId
            graphId
            namespace 
            language 
            framework 
            version 
            category
            repository
            baseImage
            image
            dependencies
            ports
          }
        }
      }
    `;

    const input: Record<string, any> = {};
    if (updates.name !== undefined) input.name = updates.name;
    if (updates.graphId !== undefined) input.graphId = updates.graphId;
    if (updates.namespace !== undefined) input.namespace = updates.namespace;
    if (updates.language !== undefined) input.language = updates.language;
    if (updates.framework !== undefined) input.framework = updates.framework;
    if (updates.version !== undefined) input.version = updates.version;
    if (updates.category !== undefined) input.category = updates.category;
    if (updates.repository !== undefined) input.repository = updates.repository;
    if (updates.baseImage !== undefined) input.baseImage = updates.baseImage;
    if (updates.image !== undefined) input.image = updates.image;
    if (updates.dependencies !== undefined) input.dependencies = updates.dependencies;
    if (updates.ports !== undefined) input.ports = updates.ports;
    if (updates.companyId !== undefined) input.companyId = updates.companyId;
    if (updates.userId !== undefined) input.userId = updates.userId;

    try {
      const result = await this.graphqlMutate(mutation, { id, input });
      return result.updateMicroservice.microservice[0] || null;
    } catch (error) {
      if (error instanceof DgraphError) {
        console.error('Failed to update microservice:', error.message);
      }
      return null;
    }
  }

  /**
   * Delete a microservice
   */
  async deleteMicroservice(id: string): Promise<boolean> {
    const mutation = `
      mutation DeleteMicroservice($id: ID!) {
        deleteMicroservice(filter: { id: $id }) {
          microservice {
            id
          }
        }
      }
    `;

    try {
      await this.graphqlMutate(mutation, { id });
      return true;
    } catch (error) {
      if (error instanceof DgraphError) {
        console.error('Failed to delete microservice:', error.message);
      }
      return false;
    }
  }

  /**
   * Search for similar graphs using Dgraph HNSW vector search
   * Uses the similar_to filter with contextEmbedding
   */
  async searchSimilarGraphsByEmbedding(
    embedding: number[],
    topK: number = 5,
    companyId?: string
  ): Promise<Graph[]> {
    // Convert embedding array to string format for Dgraph
    const embeddingStr = embedding.map(n => n.toFixed(6)).join(', ');

    // Build filter conditions
    const filterConditions: string[] = [];
    if (companyId) {
      filterConditions.push(`companyId: { eq: "${companyId}" }`);
    }

    const filterClause = filterConditions.length > 0 
      ? `filter: { ${filterConditions.join(', ')} }` 
      : '';

    const query = `
      query SearchSimilarGraphs($embedding: [Float!]!) {
        queryGraph(${filterClause} first: ${topK * 2}, order: { desc: contextEmbedding(similar_to: $embedding) }) {
          id 
          name 
          description 
          graphType 
          companyId 
          userId 
          contextEmbedding
          nodes { 
            id 
            name 
            nodeType 
            namespace 
          }
        }
      }
    `;

    try {
      const result = await this.graphqlQuery<{ queryGraph: Graph[] }>({ query, variables: {
        embedding
      } });
      
      let graphs = result.queryGraph || [];
      
      // Filter to only graphs with embeddings and limit to topK
      graphs = graphs
        .filter(graph => graph.contextEmbedding && graph.contextEmbedding.length > 0)
        .slice(0, topK);

      return graphs;
    } catch (error) {
      if (error instanceof DgraphError) {
        console.error('Failed to search similar graphs:', error.message);
      }
      return [];
    }
  }

  /**
   * Upsert a graph (create if not exists, update if exists)
   */
  async upsertGraph(
    graph: Omit<Graph, 'id' | 'createdAt' | 'updatedAt'>,
    identifier: { name?: string; id?: string }
  ): Promise<string> {
    // First try to find existing graph
    let existingGraph: Graph | null = null;

    if (identifier.id) {
      existingGraph = await this.getGraph(identifier.id, graph.companyId, graph.userId);
    } else if (identifier.name) {
      existingGraph = await this.getGraphByName(identifier.name, graph.companyId, graph.userId);
    }

    if (existingGraph) {
      // Update existing graph
      const updated = await this.updateGraph(existingGraph.id, graph);
      return updated ? updated.id : existingGraph.id;
    } else {
      // Create new graph
      return await this.createGraph(graph);
    }
  }
}

// Export singleton instance
export const dgraphClient = new DgraphClient();
