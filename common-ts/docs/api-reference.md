# API Reference

This document provides a comprehensive reference for all public APIs in the library.

## Core Types

### Graph Interface

```typescript
interface Graph<T extends GraphNode = GraphNode> {
  nodes: Map<string, T>;
  edges: Edge[];
  metadata?: {
    name?: string;
    description?: string;
    version?: string;
    created?: string;
    updated?: string;
    tags?: string[];
  };
}
```

### GraphNode Interface

```typescript
interface GraphNode {
  resource: GraphResource;
  edges: Edge[];
  metadata?: {
    position?: { x: number; y: number };
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    status?: 'active' | 'inactive' | 'error' | 'pending';
  };
}
```

### GraphResource Interface

```typescript
interface GraphResource {
  name: string;
  type: string;
  namespace?: string;
}
```

### Edge Interface

```typescript
interface Edge {
  source: GraphResource;
  target: GraphResource;
  connectionType: ConnectionType;
  metadata?: {
    weight?: number;
    direction?: 'bidirectional' | 'unidirectional';
    priority?: number;
    conditions?: Record<string, any>;
    labels?: Record<string, string>;
  };
}
```

## Graph Operations

### GraphImpl Class

The main graph implementation class that provides all graph operations.

```typescript
class GraphImpl implements Graph, GraphOperations, GraphTraversal, GraphAnalysis, GraphVisualization
```

#### Constructor

```typescript
constructor(metadata?: Graph['metadata'])
```

#### Node Operations

```typescript
// Add a node to the graph
addNode(nodeId: string, node: GraphNode): void

// Remove a node from the graph
removeNode(nodeId: string): boolean

// Check if a node exists
hasNode(nodeId: string): boolean

// Get a node by ID
getNode(nodeId: string): GraphNode | undefined

// Get all node IDs
getNodeIds(): string[]

// Get all nodes
getNodes(): GraphNode[]
```

#### Edge Operations

```typescript
// Add an edge to the graph
addEdge(edge: Edge): void

// Remove an edge from the graph
removeEdge(edge: Edge): boolean

// Get all edges
getEdges(): Edge[]

// Get edges for a specific node
getEdgesForNode(nodeId: string): Edge[]
```

#### Graph Analysis

```typescript
// Find shortest path between two nodes
findPath(sourceId: string, targetId: string): string[] | null

// Get centrality measures for a node
getCentrality(nodeId: string): {
  degree: number;
  betweenness: number;
  closeness: number;
  eigenvector: number;
}

// Analyze graph structure
analyze(): {
  nodeCount: number;
  edgeCount: number;
  density: number;
  clustering: number;
  averagePathLength: number;
  diameter: number;
}
```

#### Graph Visualization

```typescript
// Get layout for visualization
getLayout(): Map<string, { x: number; y: number }>

// Set node position
setNodePosition(nodeId: string, position: { x: number; y: number }): void

// Get zoom level
getZoomLevel(): number

// Set zoom level
setZoomLevel(level: number): void
```

## GraphQL Integration

### Mapper Functions

```typescript
// Convert model graph to GraphQL format
function mapGraphToGraphQL(
  graph: Graph, 
  options?: { id?: string; name?: string }
): BaseGraph

// Convert individual resources
function mapResourceToGraphQL(resource: GraphResource): GraphResource

// Convert graph nodes
function mapNodeToGraphQL(node: GraphNode): BaseGraphNode

// Convert edges
function mapEdgeToGraphQL(edge: Edge): BaseEdge
```

### GraphQL Client

```typescript
// Get GraphQL SDK
function getSdk(client: GraphQLClient): Sdk
```

## Validation

### ConnectionValidator Class

Validates resource connections and relationships.

```typescript
class ConnectionValidator {
  // Check if two resource types can connect
  canConnect(sourceType: string, targetType: string): boolean

  // Get all possible connection types between two resource types
  getConnectionTypesBetween(sourceType: string, targetType: string): ConnectionInfo[]

  // Get the best connection type for two resource types
  getBestConnectionType(sourceType: string, targetType: string): ConnectionType | null

  // Validate a specific connection
  validateConnection(connection: Edge): ValidationResult
}
```

### ProxyGraphValidator Class

Validates proxy configurations.

```typescript
class ProxyGraphValidator {
  constructor(graph: Graph)

  // Validate nginx server configuration
  validateNginxServer(config: NginxServerConfig): ValidationResult

  // Validate proxy connections in the graph
  validateProxyConnections(): ValidationResult[]

  // Analyze proxy configuration
  analyzeProxyConfiguration(config: ProxyConfig): AnalysisResult
}
```

## Helper Functions

### Microservice Management

```typescript
// Create a complete microservice stack
function createMicroserviceStack(config: {
  name: string;
  language: string;
  framework?: string;
  ports?: number[];
  namespace?: string;
}): Microservice

// Create multi-service architecture
function createMultiServiceArchitecture(services: MicroserviceConfig[]): Graph

// Validate architecture
function validateArchitecture(graph: Graph): ValidationResult
```

### GraphBuilder Class

Fluent API for building graphs.

```typescript
class GraphBuilder {
  constructor(graph: Graph)

  // Add microservice to graph
  addMicroservice(config: MicroserviceConfig, options?: GraphBuilderOptions): GraphBuilder

  // Add Kubernetes service
  addKubernetesService(config: KubernetesServiceConfig): GraphBuilder

  // Add nginx load balancer
  addNginxLoadBalancer(config: NginxLoadBalancerConfig): GraphBuilder

  // Connect service to deployment
  connectServiceToDeployment(serviceId: string, deploymentId: string): GraphBuilder

  // Connect ingress to service
  connectIngressToService(ingressId: string, serviceId: string): GraphBuilder

  // Connect load balancer to microservices
  connectLoadBalancerToMicroservices(lbId: string, microserviceIds: string[]): GraphBuilder

  // Validate the graph
  validate(): ValidationResult
}
```

## Connection Types

The library defines a comprehensive set of connection types:

### Hierarchical Relationships
- `CONTAINS` - Source contains target
- `BELONGS_TO` - Target belongs to source
- `HAS` - Source has target
- `TRANSLATES_TO` - Source translates to target

### Network and Routing
- `ROUTES_TO` - Source routes traffic to target
- `LOAD_BALANCES` - Source load balances across targets
- `PROXIES` - Source proxies requests to target
- `INGRESS_TO` - Source provides ingress to target
- `EGRESS_FROM` - Source provides egress from target

### Service Mesh
- `MESH_CONNECTS` - Source connects to target through service mesh
- `MESH_AUTHORIZES` - Source authorizes access to target
- `MESH_SPLITS_TRAFFIC` - Source splits traffic to targets
- `MESH_MIRRORS` - Source mirrors traffic to target
- `MESH_RETRIES` - Source retries failed requests to target
- `MESH_TIMEOUTS` - Source sets timeouts for target
- `MESH_CIRCUIT_BREAKER` - Source implements circuit breaker for target

### Storage
- `MOUNTS` - Source mounts target storage
- `CLAIMS` - Source claims target storage
- `BACKS_UP` - Source backs up target data
- `REPLICATES` - Source replicates target data

### Security
- `AUTHENTICATES` - Source authenticates requests to target
- `AUTHORIZES` - Source authorizes access to target
- `ENCRYPTS` - Source encrypts data for target
- `SIGNS` - Source signs data for target

### Configuration
- `CONFIGURES` - Source configures target
- `DEPENDS_ON` - Source depends on target
- `REQUIRES` - Source requires target
- `OPTIONAL_FOR` - Source is optional for target

### Monitoring
- `MONITORS` - Source monitors target
- `LOGS_TO` - Source sends logs to target
- `METRICS_TO` - Source sends metrics to target
- `TRACES_TO` - Source sends traces to target

### Deployment
- `DEPLOYS_TO` - Source deploys to target
- `SCALES` - Source scales target
- `UPDATES` - Source updates target
- `ROLLS_BACK` - Source rolls back target

### Graph-to-Graph
- `CONNECTS_TO` - Source graph connects to target graph
- `BRIDGES` - Source graph bridges to target graph
- `SYNCHRONIZES_WITH` - Source graph synchronizes with target graph
- `DEPENDS_ON_GRAPH` - Source graph depends on target graph
- `EXTENDS` - Source graph extends target graph
- `INHERITS_FROM` - Source graph inherits from target graph

## Error Types

### ValidationError

```typescript
interface ValidationError {
  type: string;
  message: string;
  field?: string;
  value?: any;
  suggestion?: string;
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: string[];
}
```

## Type Definitions

### Microservice

```typescript
interface Microservice extends GraphResource {
  language: string;
  framework?: string;
  packageManager?: string;
  dependencies?: string[];
  scripts?: Record<string, string>;
  environmentVariables?: Record<string, string>;
  ports?: number[];
  volumes?: string[];
  networks?: string[];
  secrets?: Map<string, string>;
  config?: Map<string, string>;
  baseImage: string;
  image: string;
  version: string;
  imageTag?: string;
  internalDependencies?: Microservice[];
  externalDependencies?: ExternalDependency[];
}
```

### Kubernetes Resources

```typescript
// Service
interface Service extends TypeMeta, GraphResource {
  metadata?: ObjectMeta;
  spec?: ServiceSpec;
  status?: ServiceStatus;
}

// Deployment
interface Deployment extends TypeMeta, GraphResource {
  metadata?: ObjectMeta;
  spec?: DeploymentSpec;
  status?: DeploymentStatus;
}

// Ingress
interface Ingress extends TypeMeta, GraphResource {
  metadata?: ObjectMeta;
  spec?: IngressSpec;
  status?: IngressStatus;
}

// And many more...
```

## Utility Functions

### Test Utilities

```typescript
// Create mock Kubernetes resource
function createMockKubernetesResource(overrides?: any): any

// Create mock graph node
function createMockGraphNode(overrides?: any): any

// Wait for specified time
function wait(ms: number): Promise<void>

// Create mock async function
function createMockAsyncFunction<T>(returnValue: T, delay?: number): jest.Mock<Promise<T>>
```

### Logger

```typescript
class Logger {
  constructor(name: string)
  
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, data?: any): void
  debug(message: string, data?: any): void
  child(name: string): Logger
  logConnectionAnalysis(analysis: any): void
}
```
