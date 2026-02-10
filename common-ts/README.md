# @kubegram/common-ts

A TypeScript GraphQL SDK for Kubegram infrastructure management.

## Overview

This library provides a type-safe GraphQL client for interacting with Kubegram's infrastructure management API. It enables you to query and mutate Kubernetes resources, graphs, microservices, and other infrastructure components through a well-structured GraphQL interface.

## Features

- 🚀 **Type-Safe GraphQL Client**: Full TypeScript support with generated types
- 🔌 **Authentication Support**: Built-in authentication header management
- 🛡 **Error Handling**: Comprehensive error handling with detailed error types
- 📡 **GraphQL Subscriptions**: Real-time updates with WebSocket support
- 🔧 **Dependency Injection**: Support for custom axios instances and headers
- 📦 **Bundle Size Optimized**: Lightweight and focused implementation
- 🧪 **Comprehensive Testing**: Full test coverage including integration tests
- 📚 **Full Documentation**: Complete API reference with examples

## Installation

```bash
npm install @kubegram/common-ts
```

## Quick Start

```typescript
import { createGraphQLSdk } from '@kubegram/common-ts';

// Create a GraphQL SDK instance
const sdk = createGraphQLSdk({
  endpoint: 'http://localhost:8665/graphql',
  defaultHeaders: {
    'Authorization': 'Bearer your-token',
  },
});

// Query for graphs
const graphs = await sdk.GetGraphs({
  companyId: 'your-company-id',
});

console.log('Available graphs:', graphs.data.graphs);

// Create a new graph
const newGraph = await sdk.CreateGraph({
  input: {
    name: 'My Infrastructure Graph',
    description: 'Production infrastructure graph',
    graphType: 'INFRASTRUCTURE',
    companyId: 'your-company-id',
    userId: 'your-user-id',
  },
});

console.log('Created graph:', newGraph.data.createGraph);
```

## API Reference

### Core GraphQL Operations

#### Graph Operations
- `GetGraphs` - Query all graphs for a company
- `GetGraph` - Query a single graph by ID
- `CreateGraph` - Create a new infrastructure graph
- `UpdateGraph` - Update an existing graph
- `DeleteGraph` - Delete a graph

#### Microservice Operations
- `GetMicroservices` - Query all microservices
- `GetMicroservice` - Query a single microservice
- `CreateMicroservice` - Create a new microservice
- `UpdateMicroservice` - Update an existing microservice
- `DeleteMicroservice` - Delete a microservice

#### Node Operations
- `GetNodes` - Query all nodes in a graph
- `Node` - Query a single node by ID

#### Validation Operations
- `ValidateConnection` - Validate connections between nodes
- `ValidateGraph` - Validate graph structure
- `GetConnectionType` - Get suggested connection types
- `GetSuggestion` - Get connection suggestions

#### Code Generation
- `GenerateCode` - Generate code from graph (polling)
- `InitializeCodeGen` - Initialize code generation (job-based)
- `JobStatus` - Check status of code generation jobs

#### Kubernetes Operations
- `KubernetesClusters` - Query Kubernetes clusters
- `KubernetesCluster` - Query single cluster
- `CreateKubernetesCluster` - Create Kubernetes cluster
- `UpdateKubernetesCluster` - Update Kubernetes cluster
- `DeleteKubernetesCluster` - Delete Kubernetes cluster
- `KubernetesGraphs` - Query Kubernetes graphs
- `KubernetesGraph` - Query single Kubernetes graph
- `CreateKubernetesGraph` - Create Kubernetes graph
- `UpdateKubernetesGraph` - Update Kubernetes graph
- `DeleteKubernetesGraph` - Delete Kubernetes graph
- `KubernetesResourcesByNamespace` - Query resources by namespace
- `KubernetesResourcesByType` - Query resources by type

#### External Dependencies
- `GetExternalDependencies` - Query external dependencies for a graph
- `ExternalDependency` - Query single external dependency

### Advanced Operations

#### Infrastructure Deployment
- `DeployInfrastructure` - Deploy validated infrastructure
- `CreateKubernetesCluster` - Create cluster resources
- `CreateKubernetesGraph` - Create graph-based deployments

#### Resource Queries
- `GetMicroservices` - Query microservice components
- `GetNodes` - Query graph nodes with filtering
- `ExternalDependencies` - Query external service dependencies

## Configuration Options

```typescript
interface GraphQLSdkOptions {
  /** GraphQL endpoint URL */
  endpoint: string;
  
  /** Optional custom axios instance for making requests */
  axiosInstance?: AxiosInstance;
  
  /** Optional default headers to include in all requests */
  defaultHeaders?: Record<string, string>;
}
```

## Error Handling

The SDK provides comprehensive error handling:

```typescript
try {
  const result = await sdk.GetGraphs({ companyId: 'test' });
  console.log(result.data.graphs);
} catch (error) {
  if (error instanceof GraphQLRequestError) {
    console.error('GraphQL Error:', error.message);
    console.error('GraphQL Details:', error.details);
    
    // Check error type
    if (error.isNetworkError()) {
      console.error('Network connectivity issue');
    } else if (error.isGraphQLError()) {
      console.error('GraphQL operation failed');
    }
  }
}
```

## Type Safety

Full TypeScript support with generated types:

```typescript
import { 
  createGraphQLSdk, 
  type GetGraphsQuery,
  type GetGraphsQueryVariables,
  type CreateGraphInput,
  type Graph 
} from '@kubegram/common-ts';

// Type-safe query variables
const variables: GetGraphsQueryVariables = {
  companyId: 'company-123',
  limit: 10
};

// Type-safe input creation
const graphInput: CreateGraphInput = {
  name: 'New Graph',
  graphType: 'INFRASTRUCTURE',
  companyId: 'company-123',
  userId: 'user-456',
};
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Unit tests
npm test

# Integration tests (requires GraphQL server at localhost:8665)
npm run test:integration

# Type checking
npm run type-check

# Linting
npm run lint

# All checks
npm run check-all
```

### GraphQL Code Generation

```bash
# Generate GraphQL types and client
npm run codegen

# Watch for changes
npm run codegen:watch
```

## Supported Resources

The SDK supports managing various infrastructure resources:

### Graph Types
- `ABSTRACT` - High-level abstract graphs
- `INFRASTRUCTURE` - Infrastructure topology graphs
- `KUBERNETES` - Kubernetes resource graphs
- `MICROSERVICE` - Microservice architecture graphs
- `DEBUGGING` - Debug and analysis graphs

### Node Types
- `MICROSERVICE` - Application microservices
- `DATABASE` - Database resources
- `CACHE` - Caching layers
- `MESSAGE_QUEUE` - Message brokers
- `PROXY` - Proxy servers and load balancers
- `LOAD_BALANCER` - Traffic distribution
- `GATEWAY` - API gateways
- `MONITORING` - Observability stacks

### Connection Types
50+ predefined connection types including:
- Service dependencies (`DEPENDS_ON`, `CONNECTS_TO`)
- Traffic routing (`ROUTES_TO`, `LOAD_BALANCES`)
- Security (`AUTHENTICATES`, `AUTHORIZES`)
- Data flows (`CACHES`, `BACKS_UP_TO`)
- Service mesh (`MESH_CONNECTS`, `MESH_AUTHORIZES`)
- And many more...

## Environment Variables

For integration testing:

```bash
# GraphQL server endpoint
GRAPHQL_API_URL=http://localhost:8665/graphql

# Authentication
TEST_ACCESS_TOKEN=your-test-token

# Test data
TEST_COMPANY_ID=test-company
TEST_USER_ID=test-user
```

## Schema Compatibility

This SDK is generated from the latest GraphQL schema and includes:

- All query, mutation, and subscription operations
- Generated TypeScript types for all inputs and outputs
- Enum definitions for all graph types and connection types
- Scalar type definitions for JSON, YAML, DateTime, etc.

## Architecture

```
┌─────────────────────────────────────────┐
│           GraphQL SDK               │
│  ┌─────────────────────────────┐   │
│  │     Generated Client        │   │
│  │   + Query/Mutations      │   │
│  │   + Type Definitions     │   │
│  │   + Error Handling      │   │
│  │   + Validation         │   │
│  └─────────────────────────────┘   │
│                                    │
│  ┌─────────────────────────────┐   │
│  │     Axios Client           │   │
│  │   + HTTP Transport         │   │
│  │   + WebSocket Support     │   │
│  │   + Retry Logic         │   │
│  │   + Header Management    │   │
│  └─────────────────────────────┘   │
│                                    │
└─────────────────────────────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Run type checking: `npm run type-check`
7. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.3.15
- 🗑️ **REMOVED**: REST API client (moved to private package)
- ✅ **ENHANCED**: GraphQL SDK schema compatibility
- 🔧 **FIXED**: ID scalar type and Graph query parameter issues
- 📦 **OPTIMIZED**: Reduced bundle size and simplified exports

### v1.3.x
- GraphQL SDK with full type safety
- Generated client from GraphQL schema
- WebSocket subscription support
- Comprehensive error handling

## Support

For issues and questions:

- 📚 [Documentation](./docs/README.md)
- 🐛 [Issue Tracker](https://github.com/kubegram/common-ts/issues)
- 📖 [GraphQL Schema](./src/graphql/schema.graphql)