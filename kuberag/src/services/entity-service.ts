/**
 * Entity service for Graph and Microservice CRUD operations
 * Port of app/services/entity_service.py (active methods only)
 */

import { dgraphClient } from '../db/client';
import { 
  Graph, 
  GraphNode, 
  Microservice, 
  Database,
  Cache,
  MessageQueue,
  Proxy as ProxyResource,
  LoadBalancer,
  Monitoring,
  Gateway,
  CreateGraphInput, 
  UpdateGraphInput, 
  CreateMicroserviceInput, 
  UpdateMicroserviceInput,
  GraphInput,
  NodeInput,
  DatabaseInput,
  CacheInput,
  MessageQueueInput,
  ProxyInput,
  LoadBalancerInput,
  MonitoringInput,
  GatewayInput,
  MicroserviceInput
} from '../types/graph';
import { GraphNodeType, GraphType } from '../types/enums';

/**
 * Entity service class for handling graph and microservice operations
 * Provides CRUD operations using the Dgraph client
 */
export class EntityService {
  private readonly dgraphClient = dgraphClient;

  /**
   * Create a new graph
   */
  async createGraph(input: CreateGraphInput): Promise<Graph | null> {
    console.info(`Creating graph: ${input.name} for company: ${input.companyId}`);

    try {
      // Process nodes
      const processedNodes = this.processNodesForCreation(input.nodes || [], input);

      // Create graph in Dgraph
      const graphId = await this.dgraphClient.createGraph({
        name: input.name,
        description: input.description,
        graphType: input.graphType,
        companyId: input.companyId,
        userId: input.userId,
        nodes: processedNodes,
      });

      // Return complete graph with assigned ID
      const graphData = this.setGraphTimestamps({
        id: graphId,
        name: input.name,
        description: input.description,
        graphType: input.graphType,
        companyId: input.companyId,
        userId: input.userId,
        nodes: processedNodes,
      });
      
      return graphData as Graph;

    } catch (error) {
      console.error('Failed to create graph:', error);
      return null;
    }
  }

  /**
   * Get a graph by ID
   */
  async getGraph(id: string, companyId?: string, userId?: string): Promise<Graph | null> {
    try {
      return await this.dgraphClient.getGraph(id, companyId, userId);
    } catch (error) {
      console.error(`Failed to get graph ${id}:`, error);
      return null;
    }
  }

  /**
   * Get graphs by company and optional user ID
   */
  async getGraphs(companyId: string, userId?: string, limit?: number): Promise<Graph[]> {
    try {
      return await this.dgraphClient.getGraphs(companyId, userId, limit);
    } catch (error) {
      console.error(`Failed to get graphs for company ${companyId}:`, error);
      return [];
    }
  }

  /**
   * Get a graph by name
   */
  async getGraphByName(name: string, companyId: string, userId?: string): Promise<Graph | null> {
    try {
      return await this.dgraphClient.getGraphByName(name, companyId, userId);
    } catch (error) {
      console.error(`Failed to get graph by name ${name}:`, error);
      return null;
    }
  }

  /**
   * Update an existing graph
   */
  async updateGraph(id: string, input: UpdateGraphInput): Promise<Graph | null> {
    console.info(`Updating graph: ${id}`);

    try {
      // Process nodes if provided - skip processing for updates as we don't have context
      const processedNodes = input.nodes ? this.processNodesForCreation(input.nodes, { companyId: 'unknown', userId: 'unknown' }) : undefined;

      return await this.dgraphClient.updateGraph(id, {
        ...(input.name && { name: input.name }),
        ...(input.description && { description: input.description }),
        ...(input.graphType && { graphType: input.graphType }),
        ...(processedNodes && { nodes: processedNodes }),
      });

    } catch (error) {
      console.error(`Failed to update graph ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete a graph
   */
  async deleteGraph(id: string, companyId?: string, userId?: string): Promise<boolean> {
    console.info(`Deleting graph: ${id}`);

    try {
      // Note: In a real implementation, you might want to verify ownership
      // before deleting, but for now we'll proceed with the deletion
      return await this.dgraphClient.deleteGraph(id);
    } catch (error) {
      console.error(`Failed to delete graph ${id}:`, error);
      return false;
    }
  }

  /**
   * Create a new microservice
   */
  async createMicroservice(input: CreateMicroserviceInput): Promise<Microservice | null> {
    console.info(`Creating microservice: ${input.name}`);

    try {
      const microservicePayload: Omit<Microservice, 'id'> = {
        name: input.name,
        companyId: input.companyId,
        userId: input.userId,
        graphId: input.graphId,
        namespace: input.namespace,
        language: input.language,
        framework: input.framework,
        version: input.version,
        category: input.category,
        repository: input.repository,
        baseImage: input.baseImage,
        image: input.image,
        dependencies: input.dependencies,
        ports: input.ports,
      };

      const microserviceId = await this.dgraphClient.createMicroservice(microservicePayload);

      // Return complete microservice with assigned ID
      return {
        id: microserviceId,
        ...microservicePayload,
      };

    } catch (error) {
      console.error(`Failed to create microservice ${input.name}:`, error);
      return null;
    }
  }

  /**
   * Get a microservice by ID
   */
  async getMicroservice(id: string): Promise<Microservice | null> {
    try {
      return await this.dgraphClient.getMicroservice(id);
    } catch (error) {
      console.error(`Failed to get microservice ${id}:`, error);
      return null;
    }
  }

  /**
   * Get microservices by company ID
   */
  async getMicroservices(companyId: string, limit?: number): Promise<Microservice[]> {
    try {
      return await this.dgraphClient.getMicroservices(companyId, limit);
    } catch (error) {
      console.error(`Failed to get microservices for company ${companyId}:`, error);
      return [];
    }
  }

  /**
   * Update an existing microservice
   */
  async updateMicroservice(id: string, input: UpdateMicroserviceInput): Promise<Microservice | null> {
    console.info(`Updating microservice: ${id}`);

    try {
      const updates: Partial<Microservice> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.namespace !== undefined) updates.namespace = input.namespace;
      if (input.language !== undefined) updates.language = input.language;
      if (input.framework !== undefined) updates.framework = input.framework;
      if (input.version !== undefined) updates.version = input.version;
      if (input.category !== undefined) updates.category = input.category;
      if (input.repository !== undefined) updates.repository = input.repository;
      if (input.baseImage !== undefined) updates.baseImage = input.baseImage;
      if (input.image !== undefined) updates.image = input.image;
      if (input.dependencies !== undefined) updates.dependencies = input.dependencies;
      if (input.ports !== undefined) updates.ports = input.ports;
      if (input.graphId !== undefined) updates.graphId = input.graphId;

      return await this.dgraphClient.updateMicroservice(id, updates);

    } catch (error) {
      console.error(`Failed to update microservice ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete a microservice
   */
  async deleteMicroservice(id: string, companyId?: string, userId?: string): Promise<boolean> {
    console.info(`Deleting microservice: ${id}`);

    try {
      // Note: In a real implementation, you might want to verify ownership
      return await this.dgraphClient.deleteMicroservice(id);
    } catch (error) {
      console.error(`Failed to delete microservice ${id}:`, error);
      return false;
    }
  }

  /**
   * Upsert a graph (create if not exists, update if exists)
   */
  async upsertGraph(input: CreateGraphInput, identifier: { name?: string; id?: string }): Promise<string> {
    console.info(`Upserting graph: ${identifier.name || identifier.id}`);

    try {
      // First try to find existing graph
      let existingGraph: Graph | null = null;

      if (identifier.id) {
        existingGraph = await this.getGraph(identifier.id, input.companyId, input.userId);
      } else if (identifier.name) {
        existingGraph = await this.getGraphByName(identifier.name, input.companyId, input.userId);
      }

      if (existingGraph) {
        // Update existing graph
        const updateInput: UpdateGraphInput = {
          id: existingGraph.id,
          ...(input.name && { name: input.name }),
          ...(input.description && { description: input.description }),
          ...(input.graphType && { graphType: input.graphType }),
          ...(input.nodes && { nodes: input.nodes }),
        };

        const updated = await this.updateGraph(existingGraph.id, updateInput);
        return updated ? updated.id : existingGraph.id;
      } else {
        // Create new graph
        const created = await this.createGraph(input);
        if (!created) {
          throw new Error('Failed to create graph during upsert');
        }
        return created.id;
      }

    } catch (error) {
      console.error('Failed to upsert graph:', error);
      throw error;
    }
  }

  /**
   * Convert Input types to actual resource types
   */
  private convertMicroserviceInput(
    input: MicroserviceInput,
    context: { companyId: string; userId: string }
  ): Microservice {
    return {
      id: input.id || this.generateTempId(),
      name: input.name || '',
      companyId: context.companyId,
      userId: context.userId,
      namespace: input.namespace,
      language: input.language,
      framework: input.framework,
      version: input.version,
      category: input.category,
      repository: input.repository,
      baseImage: input.baseImage,
      image: input.image,
      dependencies: input.dependencies,
      ports: input.ports,
      graphId: input.graphId,
    };
  }

  private convertDatabaseInput(
    input: DatabaseInput,
    context: { companyId: string; userId: string }
  ): Database {
    return {
      id: input.id || this.generateTempId(),
      kind: input.kind || '',
      url: input.url || '',
      name: input.name || '',
      namespace: input.namespace,
      engine: input.engine,
      version: input.version,
      host: input.host,
      port: input.port,
      databaseName: input.databaseName,
      username: input.username,
      connectionString: input.connectionString,
      maxConnections: input.maxConnections,
      storageSize: input.storageSize,
      storageClass: input.storageClass,
      replicationEnabled: input.replicationEnabled,
      replicaCount: input.replicaCount,
      backupEnabled: input.backupEnabled,
      backupSchedule: input.backupSchedule,
      sslEnabled: input.sslEnabled,
      charset: input.charset,
      collation: input.collation,
      companyId: context.companyId,
      userId: context.userId,
    };
  }

  private convertCacheInput(
    input: CacheInput,
    context: { companyId: string; userId: string }
  ): Cache {
    return {
      id: input.id || this.generateTempId(),
      kind: input.kind || '',
      url: input.url || '',
      name: input.name || '',
      namespace: input.namespace,
      engine: input.engine,
      version: input.version,
      host: input.host,
      port: input.port,
      clusterMode: input.clusterMode,
      replicaCount: input.replicaCount,
      maxMemory: input.maxMemory,
      evictionPolicy: input.evictionPolicy,
      persistenceEnabled: input.persistenceEnabled,
      persistenceStrategy: input.persistenceStrategy,
      password: input.password,
      tlsEnabled: input.tlsEnabled,
      sentinelEnabled: input.sentinelEnabled,
      sentinelHosts: input.sentinelHosts,
      companyId: context.companyId,
      userId: context.userId,
    };
  }

  private convertMessageQueueInput(
    input: MessageQueueInput,
    context: { companyId: string; userId: string }
  ): MessageQueue {
    return {
      id: input.id || this.generateTempId(),
      kind: input.kind || '',
      url: input.url || '',
      name: input.name || '',
      namespace: input.namespace,
      engine: input.engine,
      version: input.version,
      host: input.host,
      port: input.port,
      protocol: input.protocol,
      topics: input.topics,
      queues: input.queues,
      exchanges: input.exchanges,
      clusterMode: input.clusterMode,
      replicaCount: input.replicaCount,
      partitions: input.partitions,
      replicationFactor: input.replicationFactor,
      retentionPeriod: input.retentionPeriod,
      maxMessageSize: input.maxMessageSize,
      dlqEnabled: input.dlqEnabled,
      dlqName: input.dlqName,
      tlsEnabled: input.tlsEnabled,
      authEnabled: input.authEnabled,
      companyId: context.companyId,
      userId: context.userId,
    };
  }

  private convertProxyInput(
    input: ProxyInput,
    context: { companyId: string; userId: string }
  ): ProxyResource {
    return {
      id: input.id || this.generateTempId(),
      kind: input.kind || '',
      url: input.url || '',
      name: input.name || '',
      namespace: input.namespace,
      proxyType: input.proxyType,
      version: input.version,
      host: input.host,
      port: input.port,
      protocol: input.protocol,
      upstreams: input.upstreams,
      tlsEnabled: input.tlsEnabled,
      tlsCertificate: input.tlsCertificate,
      tlsKey: input.tlsKey,
      rateLimitEnabled: input.rateLimitEnabled,
      rateLimitRequests: input.rateLimitRequests,
      rateLimitPeriod: input.rateLimitPeriod,
      timeoutConnect: input.timeoutConnect,
      timeoutRead: input.timeoutRead,
      timeoutWrite: input.timeoutWrite,
      retries: input.retries,
      healthCheckEnabled: input.healthCheckEnabled,
      healthCheckPath: input.healthCheckPath,
      healthCheckInterval: input.healthCheckInterval,
      compressionEnabled: input.compressionEnabled,
      cachingEnabled: input.cachingEnabled,
      companyId: context.companyId,
      userId: context.userId,
    };
  }

  private convertLoadBalancerInput(
    input: LoadBalancerInput,
    context: { companyId: string; userId: string }
  ): LoadBalancer {
    return {
      id: input.id || this.generateTempId(),
      kind: input.kind || '',
      url: input.url || '',
      name: input.name || '',
      namespace: input.namespace,
      loadBalancerType: input.loadBalancerType,
      version: input.version,
      host: input.host,
      port: input.port,
      protocol: input.protocol,
      backends: input.backends,
      algorithm: input.algorithm,
      healthCheckEnabled: input.healthCheckEnabled,
      healthCheckPath: input.healthCheckPath,
      healthCheckInterval: input.healthCheckInterval,
      healthCheckTimeout: input.healthCheckTimeout,
      healthCheckHealthyThreshold: input.healthCheckHealthyThreshold,
      healthCheckUnhealthyThreshold: input.healthCheckUnhealthyThreshold,
      stickySessionEnabled: input.stickySessionEnabled,
      stickySessionCookie: input.stickySessionCookie,
      stickySessionDuration: input.stickySessionDuration,
      tlsEnabled: input.tlsEnabled,
      tlsCertificate: input.tlsCertificate,
      tlsKey: input.tlsKey,
      crossZoneEnabled: input.crossZoneEnabled,
      idleTimeout: input.idleTimeout,
      connectionDrainingEnabled: input.connectionDrainingEnabled,
      connectionDrainingTimeout: input.connectionDrainingTimeout,
      companyId: context.companyId,
      userId: context.userId,
    };
  }

  private convertMonitoringInput(
    input: MonitoringInput,
    context: { companyId: string; userId: string }
  ): Monitoring {
    return {
      id: input.id || this.generateTempId(),
      kind: input.kind || '',
      url: input.url || '',
      name: input.name || '',
      namespace: input.namespace,
      monitoringType: input.monitoringType,
      version: input.version,
      host: input.host,
      port: input.port,
      scrapeInterval: input.scrapeInterval,
      scrapeTimeout: input.scrapeTimeout,
      retentionPeriod: input.retentionPeriod,
      storageSize: input.storageSize,
      metrics: input.metrics,
      dashboards: input.dashboards,
      alertRules: input.alertRules,
      alertmanagerEnabled: input.alertmanagerEnabled,
      alertmanagerUrl: input.alertmanagerUrl,
      exporters: input.exporters,
      serviceMonitors: input.serviceMonitors,
      remoteWriteEnabled: input.remoteWriteEnabled,
      remoteWriteUrl: input.remoteWriteUrl,
      tlsEnabled: input.tlsEnabled,
      authEnabled: input.authEnabled,
      companyId: context.companyId,
      userId: context.userId,
    };
  }

  private convertGatewayInput(
    input: GatewayInput,
    context: { companyId: string; userId: string }
  ): Gateway {
    return {
      id: input.id || this.generateTempId(),
      kind: input.kind || '',
      url: input.url || '',
      name: input.name || '',
      namespace: input.namespace,
      gatewayType: input.gatewayType,
      version: input.version,
      host: input.host,
      port: input.port,
      protocol: input.protocol,
      routes: input.routes,
      upstreams: input.upstreams,
      domains: input.domains,
      basePath: input.basePath,
      tlsEnabled: input.tlsEnabled,
      tlsCertificate: input.tlsCertificate,
      tlsKey: input.tlsKey,
      tlsMinVersion: input.tlsMinVersion,
      authEnabled: input.authEnabled,
      authType: input.authType,
      corsEnabled: input.corsEnabled,
      corsOrigins: input.corsOrigins,
      corsMethods: input.corsMethods,
      corsHeaders: input.corsHeaders,
      rateLimitEnabled: input.rateLimitEnabled,
      rateLimitRequests: input.rateLimitRequests,
      rateLimitPeriod: input.rateLimitPeriod,
      rateLimitBurstSize: input.rateLimitBurstSize,
      timeoutConnect: input.timeoutConnect,
      timeoutRead: input.timeoutRead,
      timeoutWrite: input.timeoutWrite,
      timeoutIdle: input.timeoutIdle,
      loadBalancingAlgorithm: input.loadBalancingAlgorithm,
      healthCheckEnabled: input.healthCheckEnabled,
      healthCheckPath: input.healthCheckPath,
      healthCheckInterval: input.healthCheckInterval,
      healthCheckTimeout: input.healthCheckTimeout,
      healthCheckHealthyThreshold: input.healthCheckHealthyThreshold,
      healthCheckUnhealthyThreshold: input.healthCheckUnhealthyThreshold,
      circuitBreakerEnabled: input.circuitBreakerEnabled,
      circuitBreakerThreshold: input.circuitBreakerThreshold,
      circuitBreakerTimeout: input.circuitBreakerTimeout,
      retries: input.retries,
      retryTimeout: input.retryTimeout,
      retryBackoff: input.retryBackoff,
      cachingEnabled: input.cachingEnabled,
      cacheSize: input.cacheSize,
      cacheTTL: input.cacheTTL,
      compressionEnabled: input.compressionEnabled,
      compressionLevel: input.compressionLevel,
      compressionTypes: input.compressionTypes,
      accessLogEnabled: input.accessLogEnabled,
      accessLogFormat: input.accessLogFormat,
      metricsEnabled: input.metricsEnabled,
      metricsPath: input.metricsPath,
      tracingEnabled: input.tracingEnabled,
      tracingProvider: input.tracingProvider,
      tracingSampleRate: input.tracingSampleRate,
      websocketEnabled: input.websocketEnabled,
      websocketTimeout: input.websocketTimeout,
      requestHeadersAdd: input.requestHeadersAdd,
      requestHeadersRemove: input.requestHeadersRemove,
      responseHeadersAdd: input.responseHeadersAdd,
      responseHeadersRemove: input.responseHeadersRemove,
      ipWhitelist: input.ipWhitelist,
      ipBlacklist: input.ipBlacklist,
      serviceMeshEnabled: input.serviceMeshEnabled,
      serviceMeshProvider: input.serviceMeshProvider,
      companyId: context.companyId,
      userId: context.userId,
    };
  }

  /**
   * Process nodes for graph creation
   * Converts NodeInput objects to GraphNode objects
   */
  private processNodesForCreation(
    nodes: NodeInput[], 
    context: { companyId: string; userId: string }
  ): GraphNode[] {
    const processedNodes: GraphNode[] = [];

    for (const node of nodes) {
      if (!node.nodeType) {
        console.warn(`Node ${node.name} has no type specified, skipping`);
        continue;
      }

      // Convert string to enum with fallback
      let nodeType: GraphNodeType;
      try {
        nodeType = this.parseNodeType(node.nodeType);
      } catch (error) {
        console.warn(`Invalid nodeType '${node.nodeType}' for node '${node.name}', defaulting to SERVICE`);
        nodeType = GraphNodeType.SERVICE;
      }

      // Create GraphNode object
      const nodeData = this.setNodeTimestamps({
        id: node.id || this.generateTempId(),
        name: node.name,
        companyId: node.companyId || context.companyId,
        userId: node.userId || context.userId,
        nodeType,
        namespace: node.namespace,
        spec: node.spec,
        edges: [],
      });
      
      const graphNode = nodeData as GraphNode;

      // Add resource-specific data
      if (node.microservice) {
        graphNode.microservice = this.convertMicroserviceInput(node.microservice, {
          companyId: graphNode.companyId,
          userId: graphNode.userId,
        });
      }
      if (node.database) {
        graphNode.database = this.convertDatabaseInput(node.database, {
          companyId: graphNode.companyId,
          userId: graphNode.userId,
        });
      }
      if (node.cache) {
        graphNode.cache = this.convertCacheInput(node.cache, {
          companyId: graphNode.companyId,
          userId: graphNode.userId,
        });
      }
      if (node.messageQueue) {
        graphNode.messageQueue = this.convertMessageQueueInput(node.messageQueue, {
          companyId: graphNode.companyId,
          userId: graphNode.userId,
        });
      }
      if (node.proxy) {
        graphNode.proxy = this.convertProxyInput(node.proxy, {
          companyId: graphNode.companyId,
          userId: graphNode.userId,
        });
      }
      if (node.loadBalancer) {
        graphNode.loadBalancer = this.convertLoadBalancerInput(node.loadBalancer, {
          companyId: graphNode.companyId,
          userId: graphNode.userId,
        });
      }
      if (node.monitoring) {
        graphNode.monitoring = this.convertMonitoringInput(node.monitoring, {
          companyId: graphNode.companyId,
          userId: graphNode.userId,
        });
      }
      if (node.gateway) {
        graphNode.gateway = this.convertGatewayInput(node.gateway, {
          companyId: graphNode.companyId,
          userId: graphNode.userId,
        });
      }

      processedNodes.push(graphNode);
    }

    return processedNodes;
  }

  /**
   * Parse node type string to enum
   */
  private parseNodeType(nodeType: string): GraphNodeType {
    const upperType = nodeType.toUpperCase();
    
    // Try to match with known enum values
    if (Object.values(GraphNodeType).includes(upperType as GraphNodeType)) {
      return upperType as GraphNodeType;
    }

    // Handle common variations
    switch (upperType) {
      case 'SERVICE':
      case 'SVC':
        return GraphNodeType.SERVICE;
      case 'DEPLOYMENT':
      case 'DEPLOY':
        return GraphNodeType.DEPLOYMENT;
      case 'POD':
        return GraphNodeType.POD;
      case 'MICROSERVICE':
      case 'MS':
        return GraphNodeType.MICROSERVICE;
      default:
        throw new Error(`Unknown node type: ${nodeType}`);
    }
  }

  /**
   * Generate temporary ID for nodes without ID
   */
  private generateTempId(): string {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current timestamp in ISO format
   */
  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Set timestamps on graph objects
   */
  private setGraphTimestamps(graph: Partial<Graph>, isUpdate: boolean = false): Partial<Graph> {
    const timestamp = this.getCurrentTimestamp();
    return {
      ...graph,
      ...(isUpdate ? { updatedAt: timestamp } : { createdAt: timestamp, updatedAt: timestamp }),
    };
  }

  /**
   * Set timestamps on node objects
   */
  private setNodeTimestamps(node: Partial<GraphNode>, isUpdate: boolean = false): Partial<GraphNode> {
    const timestamp = this.getCurrentTimestamp();
    return {
      ...node,
      ...(isUpdate ? { updatedAt: timestamp } : { createdAt: timestamp, updatedAt: timestamp }),
    };
  }

  /**
   * Validate graph structure
   */
  async validateGraph(graph: Graph): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!graph.name) {
      errors.push('Graph must have a name');
    }

    if (!graph.companyId) {
      errors.push('Graph must have a company ID');
    }

    if (!graph.userId) {
      errors.push('Graph must have a user ID');
    }

    if (!graph.graphType) {
      errors.push('Graph must have a graph type');
    }

    // Node validation
    if (graph.nodes) {
      const nodeIds = graph.nodes.map(n => n.id);
      const duplicateIds = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        errors.push(`Duplicate node IDs: ${duplicateIds.join(', ')}`);
      }

      const nodesWithoutNames = graph.nodes.filter(n => !n.name);
      if (nodesWithoutNames.length > 0) {
        warnings.push(`${nodesWithoutNames.length} nodes without names`);
      }

      // Validate node types
      for (const node of graph.nodes) {
        if (!Object.values(GraphNodeType).includes(node.nodeType)) {
          errors.push(`Invalid node type: ${node.nodeType} for node ${node.id}`);
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

// Export singleton instance
export const entityService = new EntityService();

// Export convenience functions
export async function createGraph(input: CreateGraphInput): Promise<Graph | null> {
  return await entityService.createGraph(input);
}

export async function getGraph(id: string, companyId?: string, userId?: string): Promise<Graph | null> {
  return await entityService.getGraph(id, companyId, userId);
}

export async function getGraphs(companyId: string, userId?: string, limit?: number): Promise<Graph[]> {
  return await entityService.getGraphs(companyId, userId, limit);
}

export async function createMicroservice(input: CreateMicroserviceInput): Promise<Microservice | null> {
  return await entityService.createMicroservice(input);
}

export async function getMicroservice(id: string): Promise<Microservice | null> {
  return await entityService.getMicroservice(id);
}

export async function getMicroservices(companyId: string, limit?: number): Promise<Microservice[]> {
  return await entityService.getMicroservices(companyId, limit);
}
