import { type AxiosInstance } from 'axios';
import {
  AxiosGraphQLClient,
  createGraphQLClient,
  type RawGraphQLResponse,
} from './axios-client.js';

// Import query documents and types from generated client
import {
  GetMicroservicesDocument,
  GetMicroserviceDocument,
  GetExternalDependenciesDocument,
  GetGraphsDocument,
  GetNodesDocument,
  CreateMicroserviceDocument,
  UpdateMicroserviceDocument,
  DeleteMicroserviceDocument,
  CreateGraphDocument,
  UpdateGraphDocument,
  GraphDocument,
  GetConnectionTypeDocument,
  GenerateCodeDocument,
  ValidateConnectionDocument,
  ValidateGraphDocument,
  GetSuggestionDocument,
  type GetMicroservicesQuery,
  type GetMicroservicesQueryVariables,
  type GetMicroserviceQuery,
  type GetMicroserviceQueryVariables,
  type GetExternalDependenciesQuery,
  type GetExternalDependenciesQueryVariables,
  type GetGraphsQuery,
  type GetGraphsQueryVariables,
  type GetNodesQuery,
  type GetNodesQueryVariables,
  type CreateMicroserviceMutation,
  type CreateMicroserviceMutationVariables,
  type UpdateMicroserviceMutation,
  type UpdateMicroserviceMutationVariables,
  type DeleteMicroserviceMutation,
  type DeleteMicroserviceMutationVariables,
  type CreateGraphMutation,
  type CreateGraphMutationVariables,
  type UpdateGraphMutation,
  type UpdateGraphMutationVariables,
  type GetConnectionTypeQuery,
  type GetConnectionTypeQueryVariables,
  type GenerateCodeQuery,
  type GenerateCodeQueryVariables,
  type ValidateConnectionQuery,
  type ValidateConnectionQueryVariables,
  type ValidateGraphQuery,
  type ValidateGraphQueryVariables,
  type GetSuggestionQuery,
  type GetSuggestionQueryVariables,
  type GraphQuery,
  type GraphQueryVariables,
  InitializePlanDocument,
  type InitializePlanMutation,
  type InitializePlanMutationVariables,
  GetPlanDocument,
  type GetPlanQuery,
  type GetPlanQueryVariables,
} from './generated/client.js';

/**
 * GraphQL SDK configuration options
 */
export interface GraphQLSdkOptions {
  /** GraphQL endpoint URL */
  endpoint: string;
  /** Optional custom axios instance for making requests */
  axiosInstance?: AxiosInstance;
  /** Optional default headers to include in all requests */
  defaultHeaders?: Record<string, string>;
}

/**
 * GraphQL SDK for making type-safe queries and mutations
 */
export class GraphQLSdk {
  private client: AxiosGraphQLClient;

  constructor(options: GraphQLSdkOptions) {
    this.client = createGraphQLClient(
      options.endpoint,
      options.axiosInstance,
      options.defaultHeaders
    );
  }

  /**
   * Get the underlying axios-based GraphQL client
   */
  getClient(): AxiosGraphQLClient {
    return this.client;
  }

  /**
   * Query: Get all microservices
   */
  async GetMicroservices(
    variables?: GetMicroservicesQueryVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<GetMicroservicesQuery>> {
    return this.client.rawRequest<GetMicroservicesQuery>(
      { query: GetMicroservicesDocument, variables },
      requestHeaders
    );
  }

  /**
   * Query: Get a single microservice by ID
   */
  async GetMicroservice(
    variables: GetMicroserviceQueryVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<GetMicroserviceQuery>> {
    return this.client.rawRequest<GetMicroserviceQuery>(
      { query: GetMicroserviceDocument, variables },
      requestHeaders
    );
  }

  /**
   * Query: Get all external dependencies
   */
  async GetExternalDependencies(
    variables?: GetExternalDependenciesQueryVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<GetExternalDependenciesQuery>> {
    return this.client.rawRequest<GetExternalDependenciesQuery>(
      { query: GetExternalDependenciesDocument, variables },
      requestHeaders
    );
  }

  /**
   * Query: Get all graphs
   */
  async GetGraphs(
    variables?: GetGraphsQueryVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<GetGraphsQuery>> {
    return this.client.rawRequest<GetGraphsQuery>(
      { query: GetGraphsDocument, variables },
      requestHeaders
    );
  }

  /**
   * Query: Get all nodes
   */
  async GetNodes(
    variables?: GetNodesQueryVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<GetNodesQuery>> {
    return this.client.rawRequest<GetNodesQuery>(
      { query: GetNodesDocument, variables },
      requestHeaders
    );
  }

  /**
   * Mutation: Create a new microservice
   */
  async CreateMicroservice(
    variables: CreateMicroserviceMutationVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<CreateMicroserviceMutation>> {
    return this.client.rawRequest<CreateMicroserviceMutation>(
      { query: CreateMicroserviceDocument, variables },
      requestHeaders
    );
  }

  /**
   * Mutation: Update an existing microservice
   */
  async UpdateMicroservice(
    variables: UpdateMicroserviceMutationVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<UpdateMicroserviceMutation>> {
    return this.client.rawRequest<UpdateMicroserviceMutation>(
      { query: UpdateMicroserviceDocument, variables },
      requestHeaders
    );
  }

  /**
   * Mutation: Delete a microservice
   */
  async DeleteMicroservice(
    variables: DeleteMicroserviceMutationVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<DeleteMicroserviceMutation>> {
    return this.client.rawRequest<DeleteMicroserviceMutation>(
      { query: DeleteMicroserviceDocument, variables },
      requestHeaders
    );
  }

  /**
   * Mutation: Create a new graph
   */
  async CreateGraph(
    variables: CreateGraphMutationVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<CreateGraphMutation>> {
    return this.client.rawRequest<CreateGraphMutation>(
      { query: CreateGraphDocument, variables },
      requestHeaders
    );
  }

  /**
   * Query: Get connection type between source and target
   */
  async GetConnectionType(
    variables: GetConnectionTypeQueryVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<GetConnectionTypeQuery>> {
    return this.client.rawRequest<GetConnectionTypeQuery>(
      { query: GetConnectionTypeDocument, variables },
      requestHeaders
    );
  }

  /**
   * Query: Generate code (formerly a subscription, now a polling query)
   */
  async GenerateCode(
    variables: GenerateCodeQueryVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<GenerateCodeQuery>> {
    return this.client.rawRequest<GenerateCodeQuery>(
      { query: GenerateCodeDocument, variables },
      requestHeaders
    );
  }

  /**
   * Query: Validate a connection
   */
  async ValidateConnection(
    variables: ValidateConnectionQueryVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<ValidateConnectionQuery>> {
    return this.client.rawRequest<ValidateConnectionQuery>(
      { query: ValidateConnectionDocument, variables },
      requestHeaders
    );
  }

  /**
   * Query: Validate a graph
   */
  async ValidateGraph(
    variables: ValidateGraphQueryVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<ValidateGraphQuery>> {
    return this.client.rawRequest<ValidateGraphQuery>(
      { query: ValidateGraphDocument, variables },
      requestHeaders
    );
  }

  /**
   * Query: Get a suggestion for graph connections
   */
  async GetSuggestion(
    variables: GetSuggestionQueryVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<GetSuggestionQuery>> {
    return this.client.rawRequest<GetSuggestionQuery>(
      { query: GetSuggestionDocument, variables },
      requestHeaders
    );
  }

  /**
   * Query: Get a single external dependency by ID
   */
  async ExternalDependency(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    query ExternalDependency($graphId: ID!, $id: ID!) {
      externalDependency(graphId: $graphId, id: $id) {
        id
        name
        nodeType
        dependencyType
        namespace
        companyId
        userId
        microservice {
          id
          name
          language
          framework
          version
        }
        database {
          id
          name
          engine
          version
        }
        cache {
          id
          name
          engine
          version
        }
        messageQueue {
          id
          name
          engine
          version
        }
        proxy {
          id
          name
          proxyType
          version
        }
        loadBalancer {
          id
          name
          loadBalancerType
          version
        }
        monitoring {
          id
          name
          monitoringType
          version
        }
        gateway {
          id
          name
          gatewayType
          version
        }
        createdAt
        updatedAt
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Query: Get a single graph by ID
   * Schema: graph(id: ID!, companyId: String!, userId: String): Graph
   */
  async Graph(
    variables: GraphQueryVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<GraphQuery>> {
    return this.client.rawRequest<GraphQuery>({ query: GraphDocument, variables }, requestHeaders);
  }

  /**
   * Query: Get a graph by name and company ID
   */
  async GraphByName(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    query GraphByName($name: String!, $companyId: String!) {
      graphByName(name: $name, companyId: $companyId) {
        id
        name
        description
        graphType
        createdAt
        updatedAt
        userId
        companyId
        nodes {
          id
          name
          nodeType
          dependencyType
          namespace
        }
        bridges {
          graph {
            id
            name
          }
          connectionType
        }
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Query: Get a single Kubernetes cluster by ID
   */
  async KubernetesCluster(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    query KubernetesCluster($id: ID!) {
      kubernetesCluster(id: $id) {
        id
        name
        provider
        region
        type
        version
        metadata
        spec
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Query: Get all Kubernetes clusters for a company
   */
  async KubernetesClusters(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    query KubernetesClusters($companyId: String!) {
      kubernetesClusters(companyId: $companyId) {
        id
        name
        provider
        region
        type
        version
        metadata
        spec
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Query: Get a single Kubernetes graph by ID
   */
  async KubernetesGraph(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    query KubernetesGraph($id: ID!) {
      kubernetesGraph(id: $id) {
        id
        name
        description
        graphType
        createdAt
        updatedAt
        userId
        companyId
        nodes {
          id
          name
          nodeType
          dependencyType
          namespace
        }
        bridges {
          graph {
            id
            name
          }
          connectionType
        }
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Query: Get all Kubernetes graphs for a company
   */
  async KubernetesGraphs(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    query KubernetesGraphs($companyId: String!) {
      kubernetesGraphs(companyId: $companyId) {
        id
        name
        description
        graphType
        createdAt
        updatedAt
        userId
        companyId
        nodes {
          id
          name
          nodeType
          dependencyType
          namespace
        }
        bridges {
          graph {
            id
            name
          }
          connectionType
        }
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Query: Get Kubernetes resources by namespace
   */
  async KubernetesResourcesByNamespace(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    query KubernetesResourcesByNamespace($companyId: String!, $namespace: String!) {
      kubernetesResourcesByNamespace(companyId: $companyId, namespace: $namespace) {
        id
        name
        nodeType
        dependencyType
        namespace
        companyId
        userId
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Query: Get Kubernetes resources by type
   */
  async KubernetesResourcesByType(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    query KubernetesResourcesByType($companyId: String!, $type: String!) {
      kubernetesResourcesByType(companyId: $companyId, type: $type) {
        id
        name
        nodeType
        dependencyType
        namespace
        companyId
        userId
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Query: Get a single node by ID
   */
  async Node(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    query Node($id: ID!) {
      node(id: $id) {
        id
        name
        nodeType
        dependencyType
        namespace
        companyId
        userId
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Query: Get job status by job ID
   */
  async JobStatus(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    query JobStatus($input: JobStatusInput!) {
      jobStatus(input: $input) {
        jobId
        step
        status
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Mutation: Create a new Kubernetes cluster
   */
  async CreateKubernetesCluster(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    mutation CreateKubernetesCluster($input: CreateKubernetesClusterInput!) {
      createKubernetesCluster(input: $input) {
        id
        name
        provider
        region
        type
        version
        metadata
        spec
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Mutation: Create a new Kubernetes graph
   */
  async CreateKubernetesGraph(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    mutation CreateKubernetesGraph($input: CreateKubernetesGraphInput!) {
      createKubernetesGraph(input: $input) {
        id
        name
        description
        graphType
        createdAt
        updatedAt
        userId
        companyId
        nodes {
          id
          name
          nodeType
          dependencyType
          namespace
        }
        bridges {
          graph {
            id
            name
          }
          connectionType
        }
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Mutation: Delete a graph
   */
  async DeleteGraph(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    mutation DeleteGraph($id: ID!, $companyId: String!, $userId: String) {
      deleteGraph(id: $id, companyId: $companyId, userId: $userId)
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Mutation: Delete a Kubernetes cluster
   */
  async DeleteKubernetesCluster(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    mutation DeleteKubernetesCluster($id: ID!, $companyId: String!, $userId: String) {
      deleteKubernetesCluster(id: $id, companyId: $companyId, userId: $userId)
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Mutation: Delete a Kubernetes graph
   */
  async DeleteKubernetesGraph(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    mutation DeleteKubernetesGraph($id: ID!, $companyId: String!, $userId: String) {
      deleteKubernetesGraph(id: $id, companyId: $companyId, userId: $userId)
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Mutation: Update a graph
   * Schema: updateGraph(id: ID!, input: UpdateGraphInput!): Graph
   */
  async UpdateGraph(
    variables: UpdateGraphMutationVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<UpdateGraphMutation>> {
    return this.client.rawRequest<UpdateGraphMutation>(
      { query: UpdateGraphDocument, variables },
      requestHeaders
    );
  }

  /**
   * Mutation: Update a Kubernetes cluster
   */
  async UpdateKubernetesCluster(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    mutation UpdateKubernetesCluster($input: UpdateKubernetesClusterInput!) {
      updateKubernetesCluster(input: $input) {
        id
        name
        provider
        region
        type
        version
        metadata
        spec
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Mutation: Update a Kubernetes graph
   */
  async UpdateKubernetesGraph(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    mutation UpdateKubernetesGraph($input: UpdateKubernetesGraphInput!) {
      updateKubernetesGraph(input: $input) {
        id
        name
        description
        graphType
        createdAt
        updatedAt
        userId
        companyId
        nodes {
          id
          name
          nodeType
          dependencyType
          namespace
        }
        bridges {
          graph {
            id
            name
          }
          connectionType
        }
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Mutation: Deploy infrastructure
   */
  async DeployInfrastructure(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    mutation DeployInfrastructure($input: DeployInfrastructureInput!) {
      deployInfrastructure(input: $input) {
        id
        name
        description
        graphType
        createdAt
        updatedAt
        userId
        companyId
        nodes {
          id
          name
          nodeType
          dependencyType
          namespace
        }
        bridges {
          graph {
            id
            name
          }
          connectionType
        }
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Mutation: Initialize code generation
   */
  async InitializeCodeGen(
    variables: any,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<any>> {
    const query = `
    mutation InitializeCodeGen($input: GenerateCodeInput!) {
      initializeCodeGen(input: $input) {
        jobId
        step
        status
      }
    }
  `;
    return this.client.rawRequest<any>({ query, variables }, requestHeaders);
  }

  /**
   * Mutation: Initialize a planning job
   */
  async InitializePlan(
    variables: InitializePlanMutationVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<InitializePlanMutation>> {
    return this.client.rawRequest<InitializePlanMutation>(
      { query: InitializePlanDocument, variables },
      requestHeaders
    );
  }

  /**
   * Query: Get a plan result
   */
  async GetPlan(
    variables: GetPlanQueryVariables,
    requestHeaders?: Record<string, string>
  ): Promise<RawGraphQLResponse<GetPlanQuery>> {
    return this.client.rawRequest<GetPlanQuery>(
      { query: GetPlanDocument, variables },
      requestHeaders
    );
  }
}

/**
 * Create a new GraphQL SDK instance
 * @param options - SDK configuration options
 * @returns New GraphQL SDK instance
 */
export function createGraphQLSdk(options: GraphQLSdkOptions): GraphQLSdk {
  return new GraphQLSdk(options);
}

// Re-export types and utilities
export type { RawGraphQLResponse, GraphQLRequestConfig } from './axios-client.js';
export { GraphQLRequestError } from './axios-client.js';
