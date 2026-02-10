import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { GraphQLContext } from '../context.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A scalar type representing a timestamp in ISO 8601 format */
  DateTime: { input: string; output: string; }
  /** A scalar type representing JSON data */
  JSON: { input: any; output: any; }
  /** A scalar type representing YAML data */
  YAML: { input: any; output: any; }
};

/** Cache resource */
export type Cache = {
  __typename?: 'Cache';
  clusterMode?: Maybe<Scalars['Boolean']['output']>;
  configMaps?: Maybe<Array<Maybe<ConfigMap>>>;
  engine?: Maybe<Scalars['String']['output']>;
  environmentVariables?: Maybe<Array<Maybe<EnvironmentVariable>>>;
  evictionPolicy?: Maybe<Scalars['String']['output']>;
  graphId?: Maybe<Scalars['String']['output']>;
  host?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kind: Scalars['String']['output'];
  maxMemory?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  password?: Maybe<Scalars['String']['output']>;
  persistenceEnabled?: Maybe<Scalars['Boolean']['output']>;
  persistenceStrategy?: Maybe<Scalars['String']['output']>;
  port?: Maybe<Scalars['Int']['output']>;
  replicaCount?: Maybe<Scalars['Int']['output']>;
  secrets?: Maybe<Array<Maybe<Secret>>>;
  sentinelEnabled?: Maybe<Scalars['Boolean']['output']>;
  sentinelHosts?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  spec?: Maybe<Scalars['JSON']['output']>;
  tlsEnabled?: Maybe<Scalars['Boolean']['output']>;
  translatesTo?: Maybe<Graph>;
  url: Scalars['String']['output'];
  version?: Maybe<Scalars['String']['output']>;
};

/** Input for cache resource */
export type CacheInput = {
  clusterMode?: InputMaybe<Scalars['Boolean']['input']>;
  configMaps?: InputMaybe<Array<InputMaybe<ConfigMapInput>>>;
  engine?: InputMaybe<Scalars['String']['input']>;
  environmentVariables?: InputMaybe<Array<InputMaybe<EnvironmentVariableInput>>>;
  evictionPolicy?: InputMaybe<Scalars['String']['input']>;
  graphId?: InputMaybe<Scalars['String']['input']>;
  host?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  kind?: InputMaybe<Scalars['String']['input']>;
  maxMemory?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  namespace?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  persistenceEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  persistenceStrategy?: InputMaybe<Scalars['String']['input']>;
  port?: InputMaybe<Scalars['Int']['input']>;
  replicaCount?: InputMaybe<Scalars['Int']['input']>;
  secrets?: InputMaybe<Array<InputMaybe<SecretInput>>>;
  sentinelEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  sentinelHosts?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  spec?: InputMaybe<Scalars['JSON']['input']>;
  tlsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};

/** Config map information */
export type ConfigMap = {
  __typename?: 'ConfigMap';
  /** Config key */
  key?: Maybe<Scalars['String']['output']>;
  /** Config map name */
  name: Scalars['String']['output'];
  /** Config value */
  value?: Maybe<Scalars['String']['output']>;
};

/** Input for config map information */
export type ConfigMapInput = {
  /** Config key */
  key?: InputMaybe<Scalars['String']['input']>;
  /** Config map name */
  name: Scalars['String']['input'];
  /** Config value */
  value?: InputMaybe<Scalars['String']['input']>;
};

/** Connection types between resources */
export enum ConnectionType {
  AllowsTraffic = 'ALLOWS_TRAFFIC',
  Authenticates = 'AUTHENTICATES',
  Authorizes = 'AUTHORIZES',
  BacksUp = 'BACKS_UP',
  BacksUpTo = 'BACKS_UP_TO',
  BelongsTo = 'BELONGS_TO',
  Binds = 'BINDS',
  BlocksTraffic = 'BLOCKS_TRAFFIC',
  Bridges = 'BRIDGES',
  Caches = 'CACHES',
  Claims = 'CLAIMS',
  Compresses = 'COMPRESSES',
  Configures = 'CONFIGURES',
  ConnectsTo = 'CONNECTS_TO',
  Custom = 'CUSTOM',
  DependsOn = 'DEPENDS_ON',
  DependsOnGraph = 'DEPENDS_ON_GRAPH',
  DeploysTo = 'DEPLOYS_TO',
  Discovers = 'DISCOVERS',
  EgressFrom = 'EGRESS_FROM',
  Encrypts = 'ENCRYPTS',
  Extends = 'EXTENDS',
  FailsOverTo = 'FAILS_OVER_TO',
  From = 'FROM',
  Has = 'HAS',
  IngressRoutesToService = 'INGRESS_ROUTES_TO_SERVICE',
  IngressTo = 'INGRESS_TO',
  InheritsFrom = 'INHERITS_FROM',
  Isolates = 'ISOLATES',
  Limits = 'LIMITS',
  LoadBalances = 'LOAD_BALANCES',
  LogsTo = 'LOGS_TO',
  ManagedBy = 'MANAGED_BY',
  Manages = 'MANAGES',
  MeshAuthorizes = 'MESH_AUTHORIZES',
  MeshCircuitBreaker = 'MESH_CIRCUIT_BREAKER',
  MeshConnects = 'MESH_CONNECTS',
  MeshMirrors = 'MESH_MIRRORS',
  MeshRetries = 'MESH_RETRIES',
  MeshSplitsTraffic = 'MESH_SPLITS_TRAFFIC',
  MeshTimeouts = 'MESH_TIMEOUTS',
  MetricsTo = 'METRICS_TO',
  MicroserviceCalls = 'MICROSERVICE_CALLS',
  MicroserviceDependsOn = 'MICROSERVICE_DEPENDS_ON',
  MicroservicePublishesTo = 'MICROSERVICE_PUBLISHES_TO',
  MicroserviceSubscribesTo = 'MICROSERVICE_SUBSCRIBES_TO',
  Monitors = 'MONITORS',
  Mounts = 'MOUNTS',
  OptionalFor = 'OPTIONAL_FOR',
  PodRunsOnNode = 'POD_RUNS_ON_NODE',
  Quotas = 'QUOTAS',
  RateLimits = 'RATE_LIMITS',
  Registers = 'REGISTERS',
  Replicates = 'REPLICATES',
  Requests = 'REQUESTS',
  Requires = 'REQUIRES',
  Resolves = 'RESOLVES',
  RestoresFrom = 'RESTORES_FROM',
  RollsBack = 'ROLLS_BACK',
  RoutesTo = 'ROUTES_TO',
  Scales = 'SCALES',
  ServiceExposesPod = 'SERVICE_EXPOSES_POD',
  Signs = 'SIGNS',
  SimilarTo = 'SIMILAR_TO',
  Sync = 'SYNC',
  SynchronizesWith = 'SYNCHRONIZES_WITH',
  TracesTo = 'TRACES_TO',
  TranslatesTo = 'TRANSLATES_TO',
  Updates = 'UPDATES'
}

/** Connection validation result with suggestions */
export type ConnectionValidation = {
  __typename?: 'ConnectionValidation';
  /** Whether the connection is valid */
  isValid: Scalars['Boolean']['output'];
  /** Suggested graph connection if needed */
  suggestion: ConnectionType;
};

/** Input for creating a graph */
export type CreateGraphInput = {
  /** Bridges */
  bridges?: InputMaybe<Array<InputMaybe<GraphBridgeInput>>>;
  /** Cluster ID */
  clusterId?: InputMaybe<Scalars['String']['input']>;
  /** Company ID */
  companyId: Scalars['String']['input'];
  /** Graph description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Graph type */
  graphType: GraphType;
  /** Graph name */
  name: Scalars['String']['input'];
  /** Nodes */
  nodes?: InputMaybe<Array<InputMaybe<NodeInput>>>;
  parentGraphId?: InputMaybe<Scalars['String']['input']>;
  /** Subgraphs */
  subgraphs?: InputMaybe<Array<InputMaybe<GraphInput>>>;
  /** Owner user ID */
  userId: Scalars['String']['input'];
};

/** Input for creating a Kubernetes cluster */
export type CreateKubernetesClusterInput = {
  /** Company ID */
  companyId: Scalars['String']['input'];
  /** Cluster metadata */
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  /** Cluster name */
  name: Scalars['String']['input'];
  /** Cluster provider */
  provider?: InputMaybe<Scalars['String']['input']>;
  /** Cluster region */
  region?: InputMaybe<Scalars['String']['input']>;
  /** Cluster type */
  type?: InputMaybe<KubernetesClusterType>;
  /** Owner user ID */
  userId: Scalars['String']['input'];
  /** Cluster version */
  version?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating a Kubernetes graph */
export type CreateKubernetesGraphInput = {
  /** Kubernetes cluster information */
  clusterId: Scalars['String']['input'];
  /** Company ID */
  companyId: Scalars['String']['input'];
  /** Graph description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Graph name */
  name: Scalars['String']['input'];
  /** Graph tags */
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Owner user ID */
  userId: Scalars['String']['input'];
  /** Graph version */
  version?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating a microservice */
export type CreateMicroserviceInput = {
  baseImage: Scalars['String']['input'];
  companyId: Scalars['String']['input'];
  config?: InputMaybe<Array<ConfigMapInput>>;
  dependencies?: InputMaybe<Array<Scalars['String']['input']>>;
  environmentVariables?: InputMaybe<Array<EnvironmentVariableInput>>;
  externalDependencies?: InputMaybe<Array<Scalars['ID']['input']>>;
  framework?: InputMaybe<Scalars['String']['input']>;
  graphId: Scalars['ID']['input'];
  image: Scalars['String']['input'];
  imageTag?: InputMaybe<Scalars['String']['input']>;
  internalDependencies?: InputMaybe<Array<Scalars['ID']['input']>>;
  language: Scalars['String']['input'];
  name: Scalars['String']['input'];
  networks?: InputMaybe<Array<Scalars['String']['input']>>;
  packageManager?: InputMaybe<Scalars['String']['input']>;
  ports?: InputMaybe<Array<Scalars['Int']['input']>>;
  scripts?: InputMaybe<Array<ScriptInput>>;
  secrets?: InputMaybe<Array<SecretInput>>;
  userId: Scalars['String']['input'];
  version: Scalars['String']['input'];
  volumes?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Database resource */
export type Database = {
  __typename?: 'Database';
  backupEnabled?: Maybe<Scalars['Boolean']['output']>;
  backupSchedule?: Maybe<Scalars['String']['output']>;
  charset?: Maybe<Scalars['String']['output']>;
  collation?: Maybe<Scalars['String']['output']>;
  configMaps?: Maybe<Array<Maybe<ConfigMap>>>;
  connectionString?: Maybe<Scalars['String']['output']>;
  databaseName?: Maybe<Scalars['String']['output']>;
  engine?: Maybe<Scalars['String']['output']>;
  environmentVariables?: Maybe<Array<Maybe<EnvironmentVariable>>>;
  graphId?: Maybe<Scalars['String']['output']>;
  host?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kind: Scalars['String']['output'];
  maxConnections?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  port?: Maybe<Scalars['Int']['output']>;
  replicaCount?: Maybe<Scalars['Int']['output']>;
  replicationEnabled?: Maybe<Scalars['Boolean']['output']>;
  secrets?: Maybe<Array<Maybe<Secret>>>;
  spec?: Maybe<Scalars['JSON']['output']>;
  sslEnabled?: Maybe<Scalars['Boolean']['output']>;
  storageClass?: Maybe<Scalars['String']['output']>;
  storageSize?: Maybe<Scalars['String']['output']>;
  translatesTo?: Maybe<Graph>;
  url: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

/** Input for database resource */
export type DatabaseInput = {
  backupEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  backupSchedule?: InputMaybe<Scalars['String']['input']>;
  charset?: InputMaybe<Scalars['String']['input']>;
  collation?: InputMaybe<Scalars['String']['input']>;
  configMaps?: InputMaybe<Array<InputMaybe<ConfigMapInput>>>;
  connectionString?: InputMaybe<Scalars['String']['input']>;
  databaseName?: InputMaybe<Scalars['String']['input']>;
  engine?: InputMaybe<Scalars['String']['input']>;
  environmentVariables?: InputMaybe<Array<InputMaybe<EnvironmentVariableInput>>>;
  graphId?: InputMaybe<Scalars['String']['input']>;
  host?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  kind?: InputMaybe<Scalars['String']['input']>;
  maxConnections?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  namespace?: InputMaybe<Scalars['String']['input']>;
  port?: InputMaybe<Scalars['Int']['input']>;
  replicaCount?: InputMaybe<Scalars['Int']['input']>;
  replicationEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  secrets?: InputMaybe<Array<InputMaybe<SecretInput>>>;
  spec?: InputMaybe<Scalars['JSON']['input']>;
  sslEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  storageClass?: InputMaybe<Scalars['String']['input']>;
  storageSize?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};

export enum DependencyType {
  Cache = 'CACHE',
  Database = 'DATABASE',
  LoadBalancer = 'LOAD_BALANCER',
  MessageQueue = 'MESSAGE_QUEUE',
  Proxy = 'PROXY'
}

/** Input for deploying infrastructure */
export type DeployInfrastructureInput = {
  graph: GeneratedCodeGraphInput;
};

/** Deployment strategies */
export enum DeploymentStrategy {
  /** A/B testing */
  ABTesting = 'A_B_TESTING',
  /** Blue-green */
  BlueGreen = 'BLUE_GREEN',
  /** Canary */
  Canary = 'CANARY',
  /** Recreate */
  Recreate = 'RECREATE',
  /** Rolling update */
  RollingUpdate = 'ROLLING_UPDATE'
}

export type Edge = {
  __typename?: 'Edge';
  connectionType: ConnectionType;
  node: GraphNode;
};

/** Input for creating an edge */
export type EdgeInput = {
  /** Connection type */
  connectionType: ConnectionType;
  endNodeId?: InputMaybe<Scalars['String']['input']>;
  endX?: InputMaybe<Scalars['Float']['input']>;
  endY?: InputMaybe<Scalars['Float']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  /** Target node */
  node: NodeInput;
  startNodeId?: InputMaybe<Scalars['String']['input']>;
  startX?: InputMaybe<Scalars['Float']['input']>;
  startY?: InputMaybe<Scalars['Float']['input']>;
};

/** Environment variable type */
export type EnvironmentVariable = {
  __typename?: 'EnvironmentVariable';
  /** Variable name */
  name: Scalars['String']['output'];
  /** Variable value */
  value: Scalars['String']['output'];
};

/** Input for environment variable */
export type EnvironmentVariableInput = {
  /** Variable name */
  name: Scalars['String']['input'];
  /** Variable value */
  value: Scalars['String']['input'];
};

/** API Gateway resource */
export type Gateway = {
  __typename?: 'Gateway';
  accessLogEnabled?: Maybe<Scalars['Boolean']['output']>;
  accessLogFormat?: Maybe<Scalars['String']['output']>;
  authEnabled?: Maybe<Scalars['Boolean']['output']>;
  authType?: Maybe<Scalars['String']['output']>;
  basePath?: Maybe<Scalars['String']['output']>;
  cacheSize?: Maybe<Scalars['String']['output']>;
  cacheTTL?: Maybe<Scalars['String']['output']>;
  cachingEnabled?: Maybe<Scalars['Boolean']['output']>;
  circuitBreakerEnabled?: Maybe<Scalars['Boolean']['output']>;
  circuitBreakerThreshold?: Maybe<Scalars['Int']['output']>;
  circuitBreakerTimeout?: Maybe<Scalars['String']['output']>;
  compressionEnabled?: Maybe<Scalars['Boolean']['output']>;
  compressionLevel?: Maybe<Scalars['Int']['output']>;
  compressionTypes?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  configMaps?: Maybe<Array<Maybe<ConfigMap>>>;
  corsEnabled?: Maybe<Scalars['Boolean']['output']>;
  corsHeaders?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  corsMethods?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  corsOrigins?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  domains?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  environmentVariables?: Maybe<Array<Maybe<EnvironmentVariable>>>;
  gatewayType?: Maybe<Scalars['String']['output']>;
  graphId?: Maybe<Scalars['String']['output']>;
  healthCheckEnabled?: Maybe<Scalars['Boolean']['output']>;
  healthCheckHealthyThreshold?: Maybe<Scalars['Int']['output']>;
  healthCheckInterval?: Maybe<Scalars['String']['output']>;
  healthCheckPath?: Maybe<Scalars['String']['output']>;
  healthCheckTimeout?: Maybe<Scalars['String']['output']>;
  healthCheckUnhealthyThreshold?: Maybe<Scalars['Int']['output']>;
  host?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  ipBlacklist?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  ipWhitelist?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  kind: Scalars['String']['output'];
  loadBalancingAlgorithm?: Maybe<Scalars['String']['output']>;
  metricsEnabled?: Maybe<Scalars['Boolean']['output']>;
  metricsPath?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  port?: Maybe<Scalars['Int']['output']>;
  protocol?: Maybe<Scalars['String']['output']>;
  rateLimitBurstSize?: Maybe<Scalars['Int']['output']>;
  rateLimitEnabled?: Maybe<Scalars['Boolean']['output']>;
  rateLimitPeriod?: Maybe<Scalars['String']['output']>;
  rateLimitRequests?: Maybe<Scalars['Int']['output']>;
  requestHeadersAdd?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  requestHeadersRemove?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  responseHeadersAdd?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  responseHeadersRemove?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  retries?: Maybe<Scalars['Int']['output']>;
  retryBackoff?: Maybe<Scalars['String']['output']>;
  retryTimeout?: Maybe<Scalars['String']['output']>;
  routes?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  secrets?: Maybe<Array<Maybe<Secret>>>;
  serviceMeshEnabled?: Maybe<Scalars['Boolean']['output']>;
  serviceMeshProvider?: Maybe<Scalars['String']['output']>;
  spec?: Maybe<Scalars['JSON']['output']>;
  timeoutConnect?: Maybe<Scalars['String']['output']>;
  timeoutIdle?: Maybe<Scalars['String']['output']>;
  timeoutRead?: Maybe<Scalars['String']['output']>;
  timeoutWrite?: Maybe<Scalars['String']['output']>;
  tlsCertificate?: Maybe<Scalars['String']['output']>;
  tlsEnabled?: Maybe<Scalars['Boolean']['output']>;
  tlsKey?: Maybe<Scalars['String']['output']>;
  tlsMinVersion?: Maybe<Scalars['String']['output']>;
  tracingEnabled?: Maybe<Scalars['Boolean']['output']>;
  tracingProvider?: Maybe<Scalars['String']['output']>;
  tracingSampleRate?: Maybe<Scalars['Float']['output']>;
  translatesTo?: Maybe<Graph>;
  upstreams?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  url: Scalars['String']['output'];
  version?: Maybe<Scalars['String']['output']>;
  websocketEnabled?: Maybe<Scalars['Boolean']['output']>;
  websocketTimeout?: Maybe<Scalars['String']['output']>;
};

/** Input for API gateway resource */
export type GatewayInput = {
  accessLogEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  accessLogFormat?: InputMaybe<Scalars['String']['input']>;
  authEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  authType?: InputMaybe<Scalars['String']['input']>;
  basePath?: InputMaybe<Scalars['String']['input']>;
  cacheSize?: InputMaybe<Scalars['String']['input']>;
  cacheTTL?: InputMaybe<Scalars['String']['input']>;
  cachingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  circuitBreakerEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  circuitBreakerThreshold?: InputMaybe<Scalars['Int']['input']>;
  circuitBreakerTimeout?: InputMaybe<Scalars['String']['input']>;
  compressionEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  compressionLevel?: InputMaybe<Scalars['Int']['input']>;
  compressionTypes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  configMaps?: InputMaybe<Array<InputMaybe<ConfigMapInput>>>;
  corsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  corsHeaders?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  corsMethods?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  corsOrigins?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  domains?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  environmentVariables?: InputMaybe<Array<InputMaybe<EnvironmentVariableInput>>>;
  gatewayType?: InputMaybe<Scalars['String']['input']>;
  graphId?: InputMaybe<Scalars['String']['input']>;
  healthCheckEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  healthCheckHealthyThreshold?: InputMaybe<Scalars['Int']['input']>;
  healthCheckInterval?: InputMaybe<Scalars['String']['input']>;
  healthCheckPath?: InputMaybe<Scalars['String']['input']>;
  healthCheckTimeout?: InputMaybe<Scalars['String']['input']>;
  healthCheckUnhealthyThreshold?: InputMaybe<Scalars['Int']['input']>;
  host?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  ipBlacklist?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  ipWhitelist?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  kind?: InputMaybe<Scalars['String']['input']>;
  loadBalancingAlgorithm?: InputMaybe<Scalars['String']['input']>;
  metricsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  metricsPath?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  namespace?: InputMaybe<Scalars['String']['input']>;
  port?: InputMaybe<Scalars['Int']['input']>;
  protocol?: InputMaybe<Scalars['String']['input']>;
  rateLimitBurstSize?: InputMaybe<Scalars['Int']['input']>;
  rateLimitEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  rateLimitPeriod?: InputMaybe<Scalars['String']['input']>;
  rateLimitRequests?: InputMaybe<Scalars['Int']['input']>;
  requestHeadersAdd?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  requestHeadersRemove?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  responseHeadersAdd?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  responseHeadersRemove?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  retries?: InputMaybe<Scalars['Int']['input']>;
  retryBackoff?: InputMaybe<Scalars['String']['input']>;
  retryTimeout?: InputMaybe<Scalars['String']['input']>;
  routes?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  secrets?: InputMaybe<Array<InputMaybe<SecretInput>>>;
  serviceMeshEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  serviceMeshProvider?: InputMaybe<Scalars['String']['input']>;
  spec?: InputMaybe<Scalars['JSON']['input']>;
  timeoutConnect?: InputMaybe<Scalars['String']['input']>;
  timeoutIdle?: InputMaybe<Scalars['String']['input']>;
  timeoutRead?: InputMaybe<Scalars['String']['input']>;
  timeoutWrite?: InputMaybe<Scalars['String']['input']>;
  tlsCertificate?: InputMaybe<Scalars['String']['input']>;
  tlsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  tlsKey?: InputMaybe<Scalars['String']['input']>;
  tlsMinVersion?: InputMaybe<Scalars['String']['input']>;
  tracingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  tracingProvider?: InputMaybe<Scalars['String']['input']>;
  tracingSampleRate?: InputMaybe<Scalars['Float']['input']>;
  upstreams?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  url?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
  websocketEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  websocketTimeout?: InputMaybe<Scalars['String']['input']>;
};

/** Input for generating code from a graph */
export type GenerateCodeInput = {
  /** Graph to generate code from */
  graph: GraphInput;
  /** LLM configuration */
  llmConfig?: InputMaybe<LlmConfigInput>;
};

export type GeneratedCodeGraph = {
  __typename?: 'GeneratedCodeGraph';
  /** Graph ID */
  graphId: Scalars['String']['output'];
  /** Namespace for the generated graph */
  namespace: Scalars['String']['output'];
  /** Generated code nodes */
  nodes?: Maybe<Array<GeneratedCodeNode>>;
  /** Original graph ID */
  originalGraphId: Scalars['String']['output'];
  /** Total number of files generated */
  totalFiles: Scalars['Int']['output'];
};

/** Input for generated code graph */
export type GeneratedCodeGraphInput = {
  graphId: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
  nodes?: InputMaybe<Array<GeneratedCodeNodeInput>>;
  originalGraphId: Scalars['String']['input'];
  totalFiles: Scalars['Int']['input'];
};

/** Metadata for generated code */
export type GeneratedCodeMetadata = {
  __typename?: 'GeneratedCodeMetadata';
  /** File name */
  fileName: Scalars['String']['output'];
  /** File path */
  path: Scalars['String']['output'];
};

export type GeneratedCodeNode = {
  __typename?: 'GeneratedCodeNode';
  cache?: Maybe<Cache>;
  command?: Maybe<Script>;
  companyId: Scalars['String']['output'];
  config?: Maybe<Scalars['YAML']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  database?: Maybe<Database>;
  dependencyType?: Maybe<DependencyType>;
  edges?: Maybe<Array<Maybe<Edge>>>;
  gateway?: Maybe<Gateway>;
  generatedCodeMetadata: GeneratedCodeMetadata;
  id: Scalars['ID']['output'];
  loadBalancer?: Maybe<LoadBalancer>;
  messageQueue?: Maybe<MessageQueue>;
  microservice?: Maybe<Microservice>;
  monitoring?: Maybe<Monitoring>;
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  nodeType: GraphNodeType;
  orginalNodeId?: Maybe<Scalars['String']['output']>;
  orginalNodeName?: Maybe<Scalars['String']['output']>;
  orginalNodeType?: Maybe<Scalars['String']['output']>;
  proxy?: Maybe<Proxy>;
  spec?: Maybe<Scalars['JSON']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId: Scalars['String']['output'];
};

/** Input for generated code node */
export type GeneratedCodeNodeInput = {
  command?: InputMaybe<ScriptInput>;
  companyId?: InputMaybe<Scalars['String']['input']>;
  config?: InputMaybe<Scalars['YAML']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  namespace?: InputMaybe<Scalars['String']['input']>;
  nodeType: GraphNodeType;
  orginalNodeId?: InputMaybe<Scalars['String']['input']>;
  orginalNodeName?: InputMaybe<Scalars['String']['input']>;
  orginalNodeType?: InputMaybe<Scalars['String']['input']>;
  spec?: InputMaybe<Scalars['JSON']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type Graph = {
  __typename?: 'Graph';
  bridges?: Maybe<Array<Maybe<GraphBridge>>>;
  cluster?: Maybe<KubernetesCluster>;
  companyId: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  graphType: GraphType;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  nodes?: Maybe<Array<Maybe<GraphNode>>>;
  parent?: Maybe<Graph>;
  subgraphs?: Maybe<Array<Maybe<Graph>>>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId: Scalars['String']['output'];
};

/** Graph bridge for connecting graphs */
export type GraphBridge = {
  __typename?: 'GraphBridge';
  connectionType: ConnectionType;
  graph: Graph;
};

/** Input for graph bridge */
export type GraphBridgeInput = {
  connectionType: ConnectionType;
  graphId: Scalars['ID']['input'];
};

/** Graph connection suggestion information */
export type GraphConnectionSuggestion = {
  __typename?: 'GraphConnectionSuggestion';
  /** Source node ID */
  sourceId: Scalars['String']['output'];
  /** Source node type */
  sourceType: GraphNodeType;
  /** Connection suggestions */
  suggestions: Array<Suggestion>;
};

/** Input representing a graph structure */
export type GraphInput = {
  bridges?: InputMaybe<Array<InputMaybe<GraphBridgeInput>>>;
  clusterId?: InputMaybe<Scalars['String']['input']>;
  companyId: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  graphType?: InputMaybe<GraphType>;
  id?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  nodes?: InputMaybe<Array<InputMaybe<NodeInput>>>;
  parent?: InputMaybe<GraphInput>;
  subgraphs?: InputMaybe<Array<InputMaybe<GraphInput>>>;
  userId: Scalars['String']['input'];
};

/** Input for graph metadata */
export type GraphMetadataInput = {
  /** Metadata key-value pairs */
  data?: InputMaybe<Scalars['JSON']['input']>;
};

export type GraphNode = {
  __typename?: 'GraphNode';
  cache?: Maybe<Cache>;
  companyId: Scalars['String']['output'];
  config?: Maybe<Scalars['YAML']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  database?: Maybe<Database>;
  dependencyType?: Maybe<DependencyType>;
  edges?: Maybe<Array<Maybe<Edge>>>;
  gateway?: Maybe<Gateway>;
  id: Scalars['ID']['output'];
  loadBalancer?: Maybe<LoadBalancer>;
  messageQueue?: Maybe<MessageQueue>;
  microservice?: Maybe<Microservice>;
  monitoring?: Maybe<Monitoring>;
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  nodeType: GraphNodeType;
  orginalNodeId?: Maybe<Scalars['String']['output']>;
  orginalNodeName?: Maybe<Scalars['String']['output']>;
  orginalNodeType?: Maybe<Scalars['String']['output']>;
  proxy?: Maybe<Proxy>;
  spec?: Maybe<Scalars['JSON']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId: Scalars['String']['output'];
};

/** Graph Node type */
export enum GraphNodeType {
  Cache = 'CACHE',
  Clusterrole = 'CLUSTERROLE',
  Clusterrolebinding = 'CLUSTERROLEBINDING',
  Command = 'COMMAND',
  Config = 'CONFIG',
  Configmap = 'CONFIGMAP',
  Cronjob = 'CRONJOB',
  Customresourcedefinition = 'CUSTOMRESOURCEDEFINITION',
  Daemonset = 'DAEMONSET',
  Database = 'DATABASE',
  Debugging = 'DEBUGGING',
  Deployment = 'DEPLOYMENT',
  Endpoint = 'ENDPOINT',
  ExternalDependency = 'EXTERNAL_DEPENDENCY',
  Gateway = 'GATEWAY',
  Horizontalpodautoscaler = 'HORIZONTALPODAUTOSCALER',
  Ingress = 'INGRESS',
  Job = 'JOB',
  Limitrange = 'LIMITRANGE',
  LoadBalancer = 'LOAD_BALANCER',
  MessageQueue = 'MESSAGE_QUEUE',
  Microservice = 'MICROSERVICE',
  Monitoring = 'MONITORING',
  Namespace = 'NAMESPACE',
  Networkpolicy = 'NETWORKPOLICY',
  Node = 'NODE',
  Persistentvolume = 'PERSISTENTVOLUME',
  Persistentvolumeclaim = 'PERSISTENTVOLUMECLAIM',
  Pod = 'POD',
  Poddisruptionbudget = 'PODDISRUPTIONBUDGET',
  Podsecuritypolicy = 'PODSECURITYPOLICY',
  Priorityclass = 'PRIORITYCLASS',
  Proxy = 'PROXY',
  Replicaset = 'REPLICASET',
  Resourcequota = 'RESOURCEQUOTA',
  Role = 'ROLE',
  Rolebinding = 'ROLEBINDING',
  Secret = 'SECRET',
  Service = 'SERVICE',
  Serviceaccount = 'SERVICEACCOUNT',
  Statefulset = 'STATEFULSET',
  Storageclass = 'STORAGECLASS',
  Verticalpodautoscaler = 'VERTICALPODAUTOSCALER',
  Volume = 'VOLUME'
}

export enum GraphType {
  Abstract = 'ABSTRACT',
  Debugging = 'DEBUGGING',
  Infrastructure = 'INFRASTRUCTURE',
  Kubernetes = 'KUBERNETES',
  Microservice = 'MICROSERVICE'
}

/** Graph validation result with suggestions */
export type GraphValidation = {
  __typename?: 'GraphValidation';
  /** Whether the graph is valid */
  isValid: Scalars['Boolean']['output'];
  /** Suggested corrected graph if needed */
  suggestedGraph: Graph;
};

/** Input for initializing a plan */
export type InitializePlanInput = {
  /** The graph to plan for (required) */
  graph: GraphInput;
  /** Optional model name */
  modelName?: InputMaybe<Scalars['String']['input']>;
  /** Optional model provider */
  modelProvider?: InputMaybe<Scalars['String']['input']>;
  /** Optional user request for modifications */
  userRequest?: InputMaybe<Scalars['String']['input']>;
};

/** Capture the job Id for follow ups */
export type JobStatus = {
  __typename?: 'JobStatus';
  jobId: Scalars['String']['output'];
  status: JobStatusStatus;
  step: Scalars['String']['output'];
};

export type JobStatusInput = {
  jobId: Scalars['String']['input'];
};

/** Canonical job status values */
export enum JobStatusStatus {
  Cancelled = 'cancelled',
  Completed = 'completed',
  Failed = 'failed',
  Pending = 'pending',
  Running = 'running'
}

/** Top-level Kubernetes cluster information */
export type KubernetesCluster = {
  __typename?: 'KubernetesCluster';
  id: Scalars['ID']['output'];
  metadata?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  /** All nodes in this cluster */
  nodes?: Maybe<Array<Maybe<Graph>>>;
  provider?: Maybe<Scalars['String']['output']>;
  region?: Maybe<Scalars['String']['output']>;
  spec?: Maybe<Scalars['JSON']['output']>;
  type?: Maybe<KubernetesClusterType>;
  version?: Maybe<Scalars['String']['output']>;
};

/** Kubernetes cluster types */
export enum KubernetesClusterType {
  Hybrid = 'HYBRID',
  Managed = 'MANAGED',
  SelfHosted = 'SELF_HOSTED'
}

export type LlmConfigInput = {
  model?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<ModelProvider>;
};

/** Load balancer resource */
export type LoadBalancer = {
  __typename?: 'LoadBalancer';
  algorithm?: Maybe<Scalars['String']['output']>;
  backends?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  configMaps?: Maybe<Array<Maybe<ConfigMap>>>;
  connectionDrainingEnabled?: Maybe<Scalars['Boolean']['output']>;
  connectionDrainingTimeout?: Maybe<Scalars['String']['output']>;
  crossZoneEnabled?: Maybe<Scalars['Boolean']['output']>;
  environmentVariables?: Maybe<Array<Maybe<EnvironmentVariable>>>;
  graphId?: Maybe<Scalars['String']['output']>;
  healthCheckEnabled?: Maybe<Scalars['Boolean']['output']>;
  healthCheckHealthyThreshold?: Maybe<Scalars['Int']['output']>;
  healthCheckInterval?: Maybe<Scalars['String']['output']>;
  healthCheckPath?: Maybe<Scalars['String']['output']>;
  healthCheckTimeout?: Maybe<Scalars['String']['output']>;
  healthCheckUnhealthyThreshold?: Maybe<Scalars['Int']['output']>;
  host?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  idleTimeout?: Maybe<Scalars['String']['output']>;
  kind: Scalars['String']['output'];
  loadBalancerType?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  port?: Maybe<Scalars['Int']['output']>;
  protocol?: Maybe<Scalars['String']['output']>;
  secrets?: Maybe<Array<Maybe<Secret>>>;
  spec?: Maybe<Scalars['JSON']['output']>;
  stickySessionCookie?: Maybe<Scalars['String']['output']>;
  stickySessionDuration?: Maybe<Scalars['String']['output']>;
  stickySessionEnabled?: Maybe<Scalars['Boolean']['output']>;
  tlsCertificate?: Maybe<Scalars['String']['output']>;
  tlsEnabled?: Maybe<Scalars['Boolean']['output']>;
  tlsKey?: Maybe<Scalars['String']['output']>;
  translatesTo?: Maybe<Graph>;
  url: Scalars['String']['output'];
  version?: Maybe<Scalars['String']['output']>;
};

/** Input for load balancer resource */
export type LoadBalancerInput = {
  algorithm?: InputMaybe<Scalars['String']['input']>;
  backends?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  configMaps?: InputMaybe<Array<InputMaybe<ConfigMapInput>>>;
  connectionDrainingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  connectionDrainingTimeout?: InputMaybe<Scalars['String']['input']>;
  crossZoneEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  environmentVariables?: InputMaybe<Array<InputMaybe<EnvironmentVariableInput>>>;
  graphId?: InputMaybe<Scalars['String']['input']>;
  healthCheckEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  healthCheckHealthyThreshold?: InputMaybe<Scalars['Int']['input']>;
  healthCheckInterval?: InputMaybe<Scalars['String']['input']>;
  healthCheckPath?: InputMaybe<Scalars['String']['input']>;
  healthCheckTimeout?: InputMaybe<Scalars['String']['input']>;
  healthCheckUnhealthyThreshold?: InputMaybe<Scalars['Int']['input']>;
  host?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  idleTimeout?: InputMaybe<Scalars['String']['input']>;
  kind?: InputMaybe<Scalars['String']['input']>;
  loadBalancerType?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  namespace?: InputMaybe<Scalars['String']['input']>;
  port?: InputMaybe<Scalars['Int']['input']>;
  protocol?: InputMaybe<Scalars['String']['input']>;
  secrets?: InputMaybe<Array<InputMaybe<SecretInput>>>;
  spec?: InputMaybe<Scalars['JSON']['input']>;
  stickySessionCookie?: InputMaybe<Scalars['String']['input']>;
  stickySessionDuration?: InputMaybe<Scalars['String']['input']>;
  stickySessionEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  tlsCertificate?: InputMaybe<Scalars['String']['input']>;
  tlsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  tlsKey?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};

/** Message queue resource */
export type MessageQueue = {
  __typename?: 'MessageQueue';
  authEnabled?: Maybe<Scalars['Boolean']['output']>;
  clusterMode?: Maybe<Scalars['Boolean']['output']>;
  configMaps?: Maybe<Array<Maybe<ConfigMap>>>;
  dlqEnabled?: Maybe<Scalars['Boolean']['output']>;
  dlqName?: Maybe<Scalars['String']['output']>;
  engine?: Maybe<Scalars['String']['output']>;
  environmentVariables?: Maybe<Array<Maybe<EnvironmentVariable>>>;
  exchanges?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  graphId?: Maybe<Scalars['String']['output']>;
  host?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kind: Scalars['String']['output'];
  maxMessageSize?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  partitions?: Maybe<Scalars['Int']['output']>;
  port?: Maybe<Scalars['Int']['output']>;
  protocol?: Maybe<Scalars['String']['output']>;
  queues?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  replicaCount?: Maybe<Scalars['Int']['output']>;
  replicationFactor?: Maybe<Scalars['Int']['output']>;
  retentionPeriod?: Maybe<Scalars['String']['output']>;
  secrets?: Maybe<Array<Maybe<Secret>>>;
  spec?: Maybe<Scalars['JSON']['output']>;
  tlsEnabled?: Maybe<Scalars['Boolean']['output']>;
  topics?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  translatesTo?: Maybe<Graph>;
  url: Scalars['String']['output'];
  version?: Maybe<Scalars['String']['output']>;
};

/** Input for message queue resource */
export type MessageQueueInput = {
  authEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  clusterMode?: InputMaybe<Scalars['Boolean']['input']>;
  configMaps?: InputMaybe<Array<InputMaybe<ConfigMapInput>>>;
  dlqEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  dlqName?: InputMaybe<Scalars['String']['input']>;
  engine?: InputMaybe<Scalars['String']['input']>;
  environmentVariables?: InputMaybe<Array<InputMaybe<EnvironmentVariableInput>>>;
  exchanges?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  graphId?: InputMaybe<Scalars['String']['input']>;
  host?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  kind?: InputMaybe<Scalars['String']['input']>;
  maxMessageSize?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  namespace?: InputMaybe<Scalars['String']['input']>;
  partitions?: InputMaybe<Scalars['Int']['input']>;
  port?: InputMaybe<Scalars['Int']['input']>;
  protocol?: InputMaybe<Scalars['String']['input']>;
  queues?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  replicaCount?: InputMaybe<Scalars['Int']['input']>;
  replicationFactor?: InputMaybe<Scalars['Int']['input']>;
  retentionPeriod?: InputMaybe<Scalars['String']['input']>;
  secrets?: InputMaybe<Array<InputMaybe<SecretInput>>>;
  spec?: InputMaybe<Scalars['JSON']['input']>;
  tlsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  topics?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  url?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};

export type Microservice = {
  __typename?: 'Microservice';
  baseImage?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  configMaps?: Maybe<Array<ConfigMap>>;
  dependencies?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  environmentVariables?: Maybe<Array<EnvironmentVariable>>;
  framework?: Maybe<Scalars['String']['output']>;
  graphId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['String']['output']>;
  language?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  ports?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  repository?: Maybe<Scalars['String']['output']>;
  scripts?: Maybe<Array<Script>>;
  secrets?: Maybe<Array<Secret>>;
  spec?: Maybe<Scalars['JSON']['output']>;
  translatesTo?: Maybe<Graph>;
  version?: Maybe<Scalars['String']['output']>;
};

/** Input for microservice resource */
export type MicroserviceInput = {
  baseImage?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  configMaps?: InputMaybe<Array<InputMaybe<ConfigMapInput>>>;
  dependencies?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  environmentVariables?: InputMaybe<Array<InputMaybe<EnvironmentVariableInput>>>;
  framework?: InputMaybe<Scalars['String']['input']>;
  graphId?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  language?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  namespace?: InputMaybe<Scalars['String']['input']>;
  ports?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  repository?: InputMaybe<Scalars['String']['input']>;
  scripts?: InputMaybe<Array<InputMaybe<ScriptInput>>>;
  secrets?: InputMaybe<Array<InputMaybe<SecretInput>>>;
  spec?: InputMaybe<Scalars['JSON']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};

export enum ModelProvider {
  Claude = 'claude',
  Deepseek = 'deepseek',
  Gemma = 'gemma',
  Google = 'google',
  Openai = 'openai'
}

/** Monitoring resource */
export type Monitoring = {
  __typename?: 'Monitoring';
  alertRules?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  alertmanagerEnabled?: Maybe<Scalars['Boolean']['output']>;
  alertmanagerUrl?: Maybe<Scalars['String']['output']>;
  authEnabled?: Maybe<Scalars['Boolean']['output']>;
  configMaps?: Maybe<Array<Maybe<ConfigMap>>>;
  dashboards?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  environmentVariables?: Maybe<Array<Maybe<EnvironmentVariable>>>;
  exporters?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  graphId?: Maybe<Scalars['String']['output']>;
  host?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kind: Scalars['String']['output'];
  metrics?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  monitoringType?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  port?: Maybe<Scalars['Int']['output']>;
  remoteWriteEnabled?: Maybe<Scalars['Boolean']['output']>;
  remoteWriteUrl?: Maybe<Scalars['String']['output']>;
  retentionPeriod?: Maybe<Scalars['String']['output']>;
  scrapeInterval?: Maybe<Scalars['String']['output']>;
  scrapeTimeout?: Maybe<Scalars['String']['output']>;
  secrets?: Maybe<Array<Maybe<Secret>>>;
  serviceMonitors?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  spec?: Maybe<Scalars['JSON']['output']>;
  storageSize?: Maybe<Scalars['String']['output']>;
  tlsEnabled?: Maybe<Scalars['Boolean']['output']>;
  translatesTo?: Maybe<Graph>;
  url: Scalars['String']['output'];
  version?: Maybe<Scalars['String']['output']>;
};

/** Input for monitoring resource */
export type MonitoringInput = {
  alertRules?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  alertmanagerEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  alertmanagerUrl?: InputMaybe<Scalars['String']['input']>;
  authEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  configMaps?: InputMaybe<Array<InputMaybe<ConfigMapInput>>>;
  dashboards?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  environmentVariables?: InputMaybe<Array<InputMaybe<EnvironmentVariableInput>>>;
  exporters?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  graphId?: InputMaybe<Scalars['String']['input']>;
  host?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  kind?: InputMaybe<Scalars['String']['input']>;
  metrics?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  monitoringType?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  namespace?: InputMaybe<Scalars['String']['input']>;
  port?: InputMaybe<Scalars['Int']['input']>;
  remoteWriteEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  remoteWriteUrl?: InputMaybe<Scalars['String']['input']>;
  retentionPeriod?: InputMaybe<Scalars['String']['input']>;
  scrapeInterval?: InputMaybe<Scalars['String']['input']>;
  scrapeTimeout?: InputMaybe<Scalars['String']['input']>;
  secrets?: InputMaybe<Array<InputMaybe<SecretInput>>>;
  serviceMonitors?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  spec?: InputMaybe<Scalars['JSON']['input']>;
  storageSize?: InputMaybe<Scalars['String']['input']>;
  tlsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};

/** The root mutation type */
export type Mutation = {
  __typename?: 'Mutation';
  /** Create a graph */
  createGraph: Graph;
  /** Create a Kubernetes cluster */
  createKubernetesCluster: KubernetesCluster;
  /** Create a Kubernetes graph */
  createKubernetesGraph: Graph;
  /** Create a microservice */
  createMicroservice: Microservice;
  /** Delete a graph */
  deleteGraph: Scalars['Boolean']['output'];
  /** Delete a Kubernetes cluster */
  deleteKubernetesCluster: Scalars['Boolean']['output'];
  /** Delete a Kubernetes graph */
  deleteKubernetesGraph: Scalars['Boolean']['output'];
  /** Delete a microservice */
  deleteMicroservice: Scalars['Boolean']['output'];
  /** Deploy infrastructure */
  deployInfrastructure: Graph;
  /** Initialize code generation */
  initializeCodeGen: JobStatus;
  /** Initialize a planning job */
  initializePlan: PlanJobStatus;
  /** Update a graph */
  updateGraph?: Maybe<Graph>;
  /** Update a Kubernetes cluster */
  updateKubernetesCluster?: Maybe<KubernetesCluster>;
  /** Update a Kubernetes graph */
  updateKubernetesGraph?: Maybe<Graph>;
  /** Update a microservice */
  updateMicroservice?: Maybe<Microservice>;
};


/** The root mutation type */
export type MutationCreateGraphArgs = {
  input: CreateGraphInput;
};


/** The root mutation type */
export type MutationCreateKubernetesClusterArgs = {
  input: CreateKubernetesClusterInput;
};


/** The root mutation type */
export type MutationCreateKubernetesGraphArgs = {
  input: CreateKubernetesGraphInput;
};


/** The root mutation type */
export type MutationCreateMicroserviceArgs = {
  input: CreateMicroserviceInput;
};


/** The root mutation type */
export type MutationDeleteGraphArgs = {
  companyId: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
};


/** The root mutation type */
export type MutationDeleteKubernetesClusterArgs = {
  companyId: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
};


/** The root mutation type */
export type MutationDeleteKubernetesGraphArgs = {
  companyId: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
};


/** The root mutation type */
export type MutationDeleteMicroserviceArgs = {
  companyId: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
};


/** The root mutation type */
export type MutationDeployInfrastructureArgs = {
  input: DeployInfrastructureInput;
};


/** The root mutation type */
export type MutationInitializeCodeGenArgs = {
  input: GenerateCodeInput;
};


/** The root mutation type */
export type MutationInitializePlanArgs = {
  input: InitializePlanInput;
};


/** The root mutation type */
export type MutationUpdateGraphArgs = {
  id: Scalars['ID']['input'];
  input: UpdateGraphInput;
};


/** The root mutation type */
export type MutationUpdateKubernetesClusterArgs = {
  input: UpdateKubernetesClusterInput;
};


/** The root mutation type */
export type MutationUpdateKubernetesGraphArgs = {
  input: UpdateKubernetesGraphInput;
};


/** The root mutation type */
export type MutationUpdateMicroserviceArgs = {
  input: UpdateMicroserviceInput;
};

/** Input for creating a node */
export type NodeInput = {
  cache?: InputMaybe<CacheInput>;
  companyId: Scalars['String']['input'];
  createdAt?: InputMaybe<Scalars['DateTime']['input']>;
  database?: InputMaybe<DatabaseInput>;
  dependencyType?: InputMaybe<DependencyType>;
  edges?: InputMaybe<Array<InputMaybe<EdgeInput>>>;
  gateway?: InputMaybe<GatewayInput>;
  height?: InputMaybe<Scalars['Float']['input']>;
  iconSrc?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  loadBalancer?: InputMaybe<LoadBalancerInput>;
  messageQueue?: InputMaybe<MessageQueueInput>;
  microservice?: InputMaybe<MicroserviceInput>;
  monitoring?: InputMaybe<MonitoringInput>;
  name: Scalars['String']['input'];
  namespace?: InputMaybe<Scalars['String']['input']>;
  nodeType?: InputMaybe<Scalars['String']['input']>;
  proxy?: InputMaybe<ProxyInput>;
  spec?: InputMaybe<Scalars['JSON']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['DateTime']['input']>;
  userId: Scalars['String']['input'];
  width?: InputMaybe<Scalars['Float']['input']>;
  x?: InputMaybe<Scalars['Float']['input']>;
  y?: InputMaybe<Scalars['Float']['input']>;
};

/** Status of a planning job */
export type PlanJobStatus = {
  __typename?: 'PlanJobStatus';
  error?: Maybe<Scalars['String']['output']>;
  jobId: Scalars['String']['output'];
  status: Scalars['String']['output'];
  step: Scalars['String']['output'];
};

/** Result of a planning operation */
export type PlanResult = {
  __typename?: 'PlanResult';
  context?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  graph?: Maybe<Graph>;
};

/** Proxy resource */
export type Proxy = {
  __typename?: 'Proxy';
  cachingEnabled?: Maybe<Scalars['Boolean']['output']>;
  compressionEnabled?: Maybe<Scalars['Boolean']['output']>;
  configMaps?: Maybe<Array<Maybe<ConfigMap>>>;
  environmentVariables?: Maybe<Array<Maybe<EnvironmentVariable>>>;
  graphId?: Maybe<Scalars['String']['output']>;
  healthCheckEnabled?: Maybe<Scalars['Boolean']['output']>;
  healthCheckInterval?: Maybe<Scalars['String']['output']>;
  healthCheckPath?: Maybe<Scalars['String']['output']>;
  host?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  kind: Scalars['String']['output'];
  name: Scalars['String']['output'];
  namespace?: Maybe<Scalars['String']['output']>;
  port?: Maybe<Scalars['Int']['output']>;
  protocol?: Maybe<Scalars['String']['output']>;
  proxyType?: Maybe<Scalars['String']['output']>;
  rateLimitEnabled?: Maybe<Scalars['Boolean']['output']>;
  rateLimitPeriod?: Maybe<Scalars['String']['output']>;
  rateLimitRequests?: Maybe<Scalars['Int']['output']>;
  retries?: Maybe<Scalars['Int']['output']>;
  secrets?: Maybe<Array<Maybe<Secret>>>;
  spec?: Maybe<Scalars['JSON']['output']>;
  timeoutConnect?: Maybe<Scalars['String']['output']>;
  timeoutRead?: Maybe<Scalars['String']['output']>;
  timeoutWrite?: Maybe<Scalars['String']['output']>;
  tlsCertificate?: Maybe<Scalars['String']['output']>;
  tlsEnabled?: Maybe<Scalars['Boolean']['output']>;
  tlsKey?: Maybe<Scalars['String']['output']>;
  translatesTo?: Maybe<Graph>;
  upstreams?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  url: Scalars['String']['output'];
  version?: Maybe<Scalars['String']['output']>;
};

/** Input for proxy resource */
export type ProxyInput = {
  cachingEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  compressionEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  configMaps?: InputMaybe<Array<InputMaybe<ConfigMapInput>>>;
  environmentVariables?: InputMaybe<Array<InputMaybe<EnvironmentVariableInput>>>;
  graphId?: InputMaybe<Scalars['String']['input']>;
  healthCheckEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  healthCheckInterval?: InputMaybe<Scalars['String']['input']>;
  healthCheckPath?: InputMaybe<Scalars['String']['input']>;
  host?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  kind?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  namespace?: InputMaybe<Scalars['String']['input']>;
  port?: InputMaybe<Scalars['Int']['input']>;
  protocol?: InputMaybe<Scalars['String']['input']>;
  proxyType?: InputMaybe<Scalars['String']['input']>;
  rateLimitEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  rateLimitPeriod?: InputMaybe<Scalars['String']['input']>;
  rateLimitRequests?: InputMaybe<Scalars['Int']['input']>;
  retries?: InputMaybe<Scalars['Int']['input']>;
  secrets?: InputMaybe<Array<InputMaybe<SecretInput>>>;
  spec?: InputMaybe<Scalars['JSON']['input']>;
  timeoutConnect?: InputMaybe<Scalars['String']['input']>;
  timeoutRead?: InputMaybe<Scalars['String']['input']>;
  timeoutWrite?: InputMaybe<Scalars['String']['input']>;
  tlsCertificate?: InputMaybe<Scalars['String']['input']>;
  tlsEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  tlsKey?: InputMaybe<Scalars['String']['input']>;
  upstreams?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  url?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};

/** The root query type */
export type Query = {
  __typename?: 'Query';
  /** Get connection type between nodes */
  connectionType?: Maybe<ConnectionType>;
  /** Get external dependencies for a graph */
  externalDependencies: Array<GraphNode>;
  /** Get external dependency by ID */
  externalDependency: GraphNode;
  /** Get generated code for a job */
  generatedCode?: Maybe<GeneratedCodeGraph>;
  /** Get a plan result */
  getPlan?: Maybe<PlanResult>;
  /** Get suggestions for graph connections */
  getSuggestion: GraphConnectionSuggestion;
  /** Get a graph by ID */
  graph?: Maybe<Graph>;
  /** Get Graph by name */
  graphByName: Array<Graph>;
  /** Get all graphs */
  graphs: Array<Graph>;
  /** Get job status */
  jobStatus: JobStatus;
  /** Get Kubernetes cluster by ID */
  kubernetesCluster: KubernetesCluster;
  /** Get all Kubernetes clusters */
  kubernetesClusters: Array<KubernetesCluster>;
  /** Get Kubernetes graph by ID */
  kubernetesGraph: Graph;
  /** Get all Kubernetes graphs */
  kubernetesGraphs: Array<Graph>;
  /** Get Kubernetes resources by namespace */
  kubernetesResourcesByNamespace: Array<GraphNode>;
  /** Get Kubernetes resources by type */
  kubernetesResourcesByType: Array<GraphNode>;
  /** Get a microservice by ID */
  microservice?: Maybe<Microservice>;
  /** Get all microservices */
  microservices: Array<Microservice>;
  /** Get node by ID */
  node: GraphNode;
  /** Get nodes for a graph */
  nodes: Array<GraphNode>;
  /** Validate a connection between nodes */
  validateConnection: ConnectionValidation;
  /** Validate a graph structure */
  validateGraph: GraphValidation;
};


/** The root query type */
export type QueryConnectionTypeArgs = {
  graphId: Scalars['ID']['input'];
  sourceType: Scalars['String']['input'];
  targetType: Scalars['String']['input'];
};


/** The root query type */
export type QueryExternalDependenciesArgs = {
  graphId: Scalars['ID']['input'];
};


/** The root query type */
export type QueryExternalDependencyArgs = {
  graphId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
};


/** The root query type */
export type QueryGeneratedCodeArgs = {
  jobId: Scalars['String']['input'];
};


/** The root query type */
export type QueryGetPlanArgs = {
  jobId: Scalars['String']['input'];
};


/** The root query type */
export type QueryGetSuggestionArgs = {
  sourceId: Scalars['String']['input'];
  sourceType: GraphNodeType;
};


/** The root query type */
export type QueryGraphArgs = {
  companyId: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
};


/** The root query type */
export type QueryGraphByNameArgs = {
  companyId: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


/** The root query type */
export type QueryGraphsArgs = {
  companyId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};


/** The root query type */
export type QueryJobStatusArgs = {
  input: JobStatusInput;
};


/** The root query type */
export type QueryKubernetesClusterArgs = {
  id: Scalars['ID']['input'];
};


/** The root query type */
export type QueryKubernetesClustersArgs = {
  companyId: Scalars['String']['input'];
};


/** The root query type */
export type QueryKubernetesGraphArgs = {
  id: Scalars['ID']['input'];
};


/** The root query type */
export type QueryKubernetesGraphsArgs = {
  companyId: Scalars['String']['input'];
};


/** The root query type */
export type QueryKubernetesResourcesByNamespaceArgs = {
  companyId: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
};


/** The root query type */
export type QueryKubernetesResourcesByTypeArgs = {
  companyId: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


/** The root query type */
export type QueryMicroserviceArgs = {
  id: Scalars['ID']['input'];
};


/** The root query type */
export type QueryMicroservicesArgs = {
  companyId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};


/** The root query type */
export type QueryNodeArgs = {
  id: Scalars['ID']['input'];
};


/** The root query type */
export type QueryNodesArgs = {
  graphId: Scalars['ID']['input'];
};


/** The root query type */
export type QueryValidateConnectionArgs = {
  input: ValidateConnectionInput;
};


/** The root query type */
export type QueryValidateGraphArgs = {
  graphId: Scalars['String']['input'];
};

/** Script information */
export type Script = {
  __typename?: 'Script';
  calledBy?: Maybe<Array<Maybe<GraphNode>>>;
  /** Script command */
  command: Scalars['String']['output'];
  /** Script name */
  name: Scalars['String']['output'];
  results?: Maybe<Array<Maybe<ScriptResult>>>;
  retryCount?: Maybe<Scalars['Int']['output']>;
};

/** Input for script information */
export type ScriptInput = {
  /** Script command */
  command: Scalars['String']['input'];
  /** Script name */
  name: Scalars['String']['input'];
};

export type ScriptResult = {
  __typename?: 'ScriptResult';
  output?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

/** Secret information */
export type Secret = {
  __typename?: 'Secret';
  encryptionPublicKey: Scalars['String']['output'];
  /** Secret key */
  key?: Maybe<Scalars['String']['output']>;
  /** Secret name */
  name: Scalars['String']['output'];
  /** Secret value */
  value?: Maybe<Scalars['String']['output']>;
};

/** Input for secret information */
export type SecretInput = {
  encryptionPublicKey: Scalars['String']['input'];
  key?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  value?: InputMaybe<Scalars['String']['input']>;
};

/** The root subscription type */
export type Subscription = {
  __typename?: 'Subscription';
  /** Generate code in real-time */
  generateCode?: Maybe<JobStatus>;
};


/** The root subscription type */
export type SubscriptionGenerateCodeArgs = {
  input: GenerateCodeInput;
};

/** Connection suggestion */
export type Suggestion = {
  __typename?: 'Suggestion';
  /** Suggested connection type */
  targetConnectionType: ConnectionType;
  /** Target node type */
  targetType: GraphNodeType;
};

/** Input for updating a graph */
export type UpdateGraphInput = {
  /** Bridges */
  bridges?: InputMaybe<Array<InputMaybe<GraphBridgeInput>>>;
  /** Cluster ID */
  clusterId?: InputMaybe<Scalars['String']['input']>;
  /** Graph description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Graph type */
  graphType?: InputMaybe<GraphType>;
  id: Scalars['ID']['input'];
  /** Graph name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Nodes */
  nodes?: InputMaybe<Array<InputMaybe<NodeInput>>>;
  /** Subgraphs */
  subgraphs?: InputMaybe<Array<InputMaybe<GraphInput>>>;
};

/** Input for updating a Kubernetes cluster */
export type UpdateKubernetesClusterInput = {
  id: Scalars['ID']['input'];
  /** Cluster metadata */
  metadata?: InputMaybe<Scalars['JSON']['input']>;
  /** Cluster name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Cluster provider */
  provider?: InputMaybe<Scalars['String']['input']>;
  /** Cluster region */
  region?: InputMaybe<Scalars['String']['input']>;
  /** Cluster type */
  type?: InputMaybe<KubernetesClusterType>;
  /** Cluster version */
  version?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating a Kubernetes graph */
export type UpdateKubernetesGraphInput = {
  companyId?: InputMaybe<Scalars['String']['input']>;
  /** Graph description */
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  /** Kubernetes cluster information */
  kubernetesCluster?: InputMaybe<UpdateKubernetesClusterInput>;
  /** Graph metadata */
  metadata?: InputMaybe<GraphMetadataInput>;
  /** Graph name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Graph tags */
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  userId?: InputMaybe<Scalars['String']['input']>;
  /** Graph version */
  version?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating a microservice */
export type UpdateMicroserviceInput = {
  baseImage?: InputMaybe<Scalars['String']['input']>;
  companyId: Scalars['String']['input'];
  config?: InputMaybe<Array<ConfigMapInput>>;
  dependencies?: InputMaybe<Array<Scalars['String']['input']>>;
  environmentVariables?: InputMaybe<Array<EnvironmentVariableInput>>;
  externalDependencies?: InputMaybe<Array<Scalars['ID']['input']>>;
  framework?: InputMaybe<Scalars['String']['input']>;
  graphId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
  image?: InputMaybe<Scalars['String']['input']>;
  imageTag?: InputMaybe<Scalars['String']['input']>;
  internalDependencies?: InputMaybe<Array<Scalars['ID']['input']>>;
  language?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  networks?: InputMaybe<Array<Scalars['String']['input']>>;
  packageManager?: InputMaybe<Scalars['String']['input']>;
  ports?: InputMaybe<Array<Scalars['Int']['input']>>;
  scripts?: InputMaybe<Array<ScriptInput>>;
  secrets?: InputMaybe<Array<SecretInput>>;
  userId: Scalars['String']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
  volumes?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Input for validating connections between graph nodes */
export type ValidateConnectionInput = {
  /** Proposed connection type */
  connectionType?: InputMaybe<ConnectionType>;
  /** Source node ID */
  sourceId: Scalars['ID']['input'];
  /** Target node ID */
  targetId: Scalars['ID']['input'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Cache: ResolverTypeWrapper<Cache>;
  CacheInput: CacheInput;
  ConfigMap: ResolverTypeWrapper<ConfigMap>;
  ConfigMapInput: ConfigMapInput;
  ConnectionType: ConnectionType;
  ConnectionValidation: ResolverTypeWrapper<ConnectionValidation>;
  CreateGraphInput: CreateGraphInput;
  CreateKubernetesClusterInput: CreateKubernetesClusterInput;
  CreateKubernetesGraphInput: CreateKubernetesGraphInput;
  CreateMicroserviceInput: CreateMicroserviceInput;
  Database: ResolverTypeWrapper<Database>;
  DatabaseInput: DatabaseInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  DependencyType: DependencyType;
  DeployInfrastructureInput: DeployInfrastructureInput;
  DeploymentStrategy: DeploymentStrategy;
  Edge: ResolverTypeWrapper<Edge>;
  EdgeInput: EdgeInput;
  EnvironmentVariable: ResolverTypeWrapper<EnvironmentVariable>;
  EnvironmentVariableInput: EnvironmentVariableInput;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Gateway: ResolverTypeWrapper<Gateway>;
  GatewayInput: GatewayInput;
  GenerateCodeInput: GenerateCodeInput;
  GeneratedCodeGraph: ResolverTypeWrapper<GeneratedCodeGraph>;
  GeneratedCodeGraphInput: GeneratedCodeGraphInput;
  GeneratedCodeMetadata: ResolverTypeWrapper<GeneratedCodeMetadata>;
  GeneratedCodeNode: ResolverTypeWrapper<GeneratedCodeNode>;
  GeneratedCodeNodeInput: GeneratedCodeNodeInput;
  Graph: ResolverTypeWrapper<Graph>;
  GraphBridge: ResolverTypeWrapper<GraphBridge>;
  GraphBridgeInput: GraphBridgeInput;
  GraphConnectionSuggestion: ResolverTypeWrapper<GraphConnectionSuggestion>;
  GraphInput: GraphInput;
  GraphMetadataInput: GraphMetadataInput;
  GraphNode: ResolverTypeWrapper<GraphNode>;
  GraphNodeType: GraphNodeType;
  GraphType: GraphType;
  GraphValidation: ResolverTypeWrapper<GraphValidation>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  InitializePlanInput: InitializePlanInput;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  JobStatus: ResolverTypeWrapper<JobStatus>;
  JobStatusInput: JobStatusInput;
  JobStatusStatus: JobStatusStatus;
  KubernetesCluster: ResolverTypeWrapper<KubernetesCluster>;
  KubernetesClusterType: KubernetesClusterType;
  LLMConfigInput: LlmConfigInput;
  LoadBalancer: ResolverTypeWrapper<LoadBalancer>;
  LoadBalancerInput: LoadBalancerInput;
  MessageQueue: ResolverTypeWrapper<MessageQueue>;
  MessageQueueInput: MessageQueueInput;
  Microservice: ResolverTypeWrapper<Microservice>;
  MicroserviceInput: MicroserviceInput;
  ModelProvider: ModelProvider;
  Monitoring: ResolverTypeWrapper<Monitoring>;
  MonitoringInput: MonitoringInput;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  NodeInput: NodeInput;
  PlanJobStatus: ResolverTypeWrapper<PlanJobStatus>;
  PlanResult: ResolverTypeWrapper<PlanResult>;
  Proxy: ResolverTypeWrapper<Proxy>;
  ProxyInput: ProxyInput;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Script: ResolverTypeWrapper<Script>;
  ScriptInput: ScriptInput;
  ScriptResult: ResolverTypeWrapper<ScriptResult>;
  Secret: ResolverTypeWrapper<Secret>;
  SecretInput: SecretInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Suggestion: ResolverTypeWrapper<Suggestion>;
  UpdateGraphInput: UpdateGraphInput;
  UpdateKubernetesClusterInput: UpdateKubernetesClusterInput;
  UpdateKubernetesGraphInput: UpdateKubernetesGraphInput;
  UpdateMicroserviceInput: UpdateMicroserviceInput;
  ValidateConnectionInput: ValidateConnectionInput;
  YAML: ResolverTypeWrapper<Scalars['YAML']['output']>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  Cache: Cache;
  CacheInput: CacheInput;
  ConfigMap: ConfigMap;
  ConfigMapInput: ConfigMapInput;
  ConnectionValidation: ConnectionValidation;
  CreateGraphInput: CreateGraphInput;
  CreateKubernetesClusterInput: CreateKubernetesClusterInput;
  CreateKubernetesGraphInput: CreateKubernetesGraphInput;
  CreateMicroserviceInput: CreateMicroserviceInput;
  Database: Database;
  DatabaseInput: DatabaseInput;
  DateTime: Scalars['DateTime']['output'];
  DeployInfrastructureInput: DeployInfrastructureInput;
  Edge: Edge;
  EdgeInput: EdgeInput;
  EnvironmentVariable: EnvironmentVariable;
  EnvironmentVariableInput: EnvironmentVariableInput;
  Float: Scalars['Float']['output'];
  Gateway: Gateway;
  GatewayInput: GatewayInput;
  GenerateCodeInput: GenerateCodeInput;
  GeneratedCodeGraph: GeneratedCodeGraph;
  GeneratedCodeGraphInput: GeneratedCodeGraphInput;
  GeneratedCodeMetadata: GeneratedCodeMetadata;
  GeneratedCodeNode: GeneratedCodeNode;
  GeneratedCodeNodeInput: GeneratedCodeNodeInput;
  Graph: Graph;
  GraphBridge: GraphBridge;
  GraphBridgeInput: GraphBridgeInput;
  GraphConnectionSuggestion: GraphConnectionSuggestion;
  GraphInput: GraphInput;
  GraphMetadataInput: GraphMetadataInput;
  GraphNode: GraphNode;
  GraphValidation: GraphValidation;
  ID: Scalars['ID']['output'];
  InitializePlanInput: InitializePlanInput;
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  JobStatus: JobStatus;
  JobStatusInput: JobStatusInput;
  KubernetesCluster: KubernetesCluster;
  LLMConfigInput: LlmConfigInput;
  LoadBalancer: LoadBalancer;
  LoadBalancerInput: LoadBalancerInput;
  MessageQueue: MessageQueue;
  MessageQueueInput: MessageQueueInput;
  Microservice: Microservice;
  MicroserviceInput: MicroserviceInput;
  Monitoring: Monitoring;
  MonitoringInput: MonitoringInput;
  Mutation: Record<PropertyKey, never>;
  NodeInput: NodeInput;
  PlanJobStatus: PlanJobStatus;
  PlanResult: PlanResult;
  Proxy: Proxy;
  ProxyInput: ProxyInput;
  Query: Record<PropertyKey, never>;
  Script: Script;
  ScriptInput: ScriptInput;
  ScriptResult: ScriptResult;
  Secret: Secret;
  SecretInput: SecretInput;
  String: Scalars['String']['output'];
  Subscription: Record<PropertyKey, never>;
  Suggestion: Suggestion;
  UpdateGraphInput: UpdateGraphInput;
  UpdateKubernetesClusterInput: UpdateKubernetesClusterInput;
  UpdateKubernetesGraphInput: UpdateKubernetesGraphInput;
  UpdateMicroserviceInput: UpdateMicroserviceInput;
  ValidateConnectionInput: ValidateConnectionInput;
  YAML: Scalars['YAML']['output'];
}>;

export type CacheResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Cache'] = ResolversParentTypes['Cache']> = ResolversObject<{
  clusterMode?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  configMaps?: Resolver<Maybe<Array<Maybe<ResolversTypes['ConfigMap']>>>, ParentType, ContextType>;
  engine?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  environmentVariables?: Resolver<Maybe<Array<Maybe<ResolversTypes['EnvironmentVariable']>>>, ParentType, ContextType>;
  evictionPolicy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  graphId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  host?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  maxMemory?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  password?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  persistenceEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  persistenceStrategy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  port?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  replicaCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  secrets?: Resolver<Maybe<Array<Maybe<ResolversTypes['Secret']>>>, ParentType, ContextType>;
  sentinelEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  sentinelHosts?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  spec?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  tlsEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  translatesTo?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type ConfigMapResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ConfigMap'] = ResolversParentTypes['ConfigMap']> = ResolversObject<{
  key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type ConnectionValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ConnectionValidation'] = ResolversParentTypes['ConnectionValidation']> = ResolversObject<{
  isValid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  suggestion?: Resolver<ResolversTypes['ConnectionType'], ParentType, ContextType>;
}>;

export type DatabaseResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Database'] = ResolversParentTypes['Database']> = ResolversObject<{
  backupEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  backupSchedule?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  charset?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  collation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  configMaps?: Resolver<Maybe<Array<Maybe<ResolversTypes['ConfigMap']>>>, ParentType, ContextType>;
  connectionString?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  databaseName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  engine?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  environmentVariables?: Resolver<Maybe<Array<Maybe<ResolversTypes['EnvironmentVariable']>>>, ParentType, ContextType>;
  graphId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  host?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  maxConnections?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  port?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  replicaCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  replicationEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  secrets?: Resolver<Maybe<Array<Maybe<ResolversTypes['Secret']>>>, ParentType, ContextType>;
  spec?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sslEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  storageClass?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  storageSize?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  translatesTo?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  username?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type EdgeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Edge'] = ResolversParentTypes['Edge']> = ResolversObject<{
  connectionType?: Resolver<ResolversTypes['ConnectionType'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['GraphNode'], ParentType, ContextType>;
}>;

export type EnvironmentVariableResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['EnvironmentVariable'] = ResolversParentTypes['EnvironmentVariable']> = ResolversObject<{
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type GatewayResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Gateway'] = ResolversParentTypes['Gateway']> = ResolversObject<{
  accessLogEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  accessLogFormat?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  authEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  authType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  basePath?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  cacheSize?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  cacheTTL?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  cachingEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  circuitBreakerEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  circuitBreakerThreshold?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  circuitBreakerTimeout?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  compressionEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  compressionLevel?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  compressionTypes?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  configMaps?: Resolver<Maybe<Array<Maybe<ResolversTypes['ConfigMap']>>>, ParentType, ContextType>;
  corsEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  corsHeaders?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  corsMethods?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  corsOrigins?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  domains?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  environmentVariables?: Resolver<Maybe<Array<Maybe<ResolversTypes['EnvironmentVariable']>>>, ParentType, ContextType>;
  gatewayType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  graphId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  healthCheckEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  healthCheckHealthyThreshold?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  healthCheckInterval?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  healthCheckPath?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  healthCheckTimeout?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  healthCheckUnhealthyThreshold?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  host?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  ipBlacklist?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  ipWhitelist?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  loadBalancingAlgorithm?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  metricsEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  metricsPath?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  port?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  protocol?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rateLimitBurstSize?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  rateLimitEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  rateLimitPeriod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rateLimitRequests?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  requestHeadersAdd?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  requestHeadersRemove?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  responseHeadersAdd?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  responseHeadersRemove?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  retries?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  retryBackoff?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  retryTimeout?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  routes?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  secrets?: Resolver<Maybe<Array<Maybe<ResolversTypes['Secret']>>>, ParentType, ContextType>;
  serviceMeshEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  serviceMeshProvider?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  spec?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  timeoutConnect?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timeoutIdle?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timeoutRead?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timeoutWrite?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tlsCertificate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tlsEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  tlsKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tlsMinVersion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tracingEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  tracingProvider?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tracingSampleRate?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  translatesTo?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType>;
  upstreams?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  websocketEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  websocketTimeout?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type GeneratedCodeGraphResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GeneratedCodeGraph'] = ResolversParentTypes['GeneratedCodeGraph']> = ResolversObject<{
  graphId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nodes?: Resolver<Maybe<Array<ResolversTypes['GeneratedCodeNode']>>, ParentType, ContextType>;
  originalGraphId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalFiles?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export type GeneratedCodeMetadataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GeneratedCodeMetadata'] = ResolversParentTypes['GeneratedCodeMetadata']> = ResolversObject<{
  fileName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type GeneratedCodeNodeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GeneratedCodeNode'] = ResolversParentTypes['GeneratedCodeNode']> = ResolversObject<{
  cache?: Resolver<Maybe<ResolversTypes['Cache']>, ParentType, ContextType>;
  command?: Resolver<Maybe<ResolversTypes['Script']>, ParentType, ContextType>;
  companyId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  config?: Resolver<Maybe<ResolversTypes['YAML']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  database?: Resolver<Maybe<ResolversTypes['Database']>, ParentType, ContextType>;
  dependencyType?: Resolver<Maybe<ResolversTypes['DependencyType']>, ParentType, ContextType>;
  edges?: Resolver<Maybe<Array<Maybe<ResolversTypes['Edge']>>>, ParentType, ContextType>;
  gateway?: Resolver<Maybe<ResolversTypes['Gateway']>, ParentType, ContextType>;
  generatedCodeMetadata?: Resolver<ResolversTypes['GeneratedCodeMetadata'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  loadBalancer?: Resolver<Maybe<ResolversTypes['LoadBalancer']>, ParentType, ContextType>;
  messageQueue?: Resolver<Maybe<ResolversTypes['MessageQueue']>, ParentType, ContextType>;
  microservice?: Resolver<Maybe<ResolversTypes['Microservice']>, ParentType, ContextType>;
  monitoring?: Resolver<Maybe<ResolversTypes['Monitoring']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nodeType?: Resolver<ResolversTypes['GraphNodeType'], ParentType, ContextType>;
  orginalNodeId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  orginalNodeName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  orginalNodeType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  proxy?: Resolver<Maybe<ResolversTypes['Proxy']>, ParentType, ContextType>;
  spec?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type GraphResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Graph'] = ResolversParentTypes['Graph']> = ResolversObject<{
  bridges?: Resolver<Maybe<Array<Maybe<ResolversTypes['GraphBridge']>>>, ParentType, ContextType>;
  cluster?: Resolver<Maybe<ResolversTypes['KubernetesCluster']>, ParentType, ContextType>;
  companyId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  graphType?: Resolver<ResolversTypes['GraphType'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nodes?: Resolver<Maybe<Array<Maybe<ResolversTypes['GraphNode']>>>, ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType>;
  subgraphs?: Resolver<Maybe<Array<Maybe<ResolversTypes['Graph']>>>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type GraphBridgeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GraphBridge'] = ResolversParentTypes['GraphBridge']> = ResolversObject<{
  connectionType?: Resolver<ResolversTypes['ConnectionType'], ParentType, ContextType>;
  graph?: Resolver<ResolversTypes['Graph'], ParentType, ContextType>;
}>;

export type GraphConnectionSuggestionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GraphConnectionSuggestion'] = ResolversParentTypes['GraphConnectionSuggestion']> = ResolversObject<{
  sourceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sourceType?: Resolver<ResolversTypes['GraphNodeType'], ParentType, ContextType>;
  suggestions?: Resolver<Array<ResolversTypes['Suggestion']>, ParentType, ContextType>;
}>;

export type GraphNodeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GraphNode'] = ResolversParentTypes['GraphNode']> = ResolversObject<{
  cache?: Resolver<Maybe<ResolversTypes['Cache']>, ParentType, ContextType>;
  companyId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  config?: Resolver<Maybe<ResolversTypes['YAML']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  database?: Resolver<Maybe<ResolversTypes['Database']>, ParentType, ContextType>;
  dependencyType?: Resolver<Maybe<ResolversTypes['DependencyType']>, ParentType, ContextType>;
  edges?: Resolver<Maybe<Array<Maybe<ResolversTypes['Edge']>>>, ParentType, ContextType>;
  gateway?: Resolver<Maybe<ResolversTypes['Gateway']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  loadBalancer?: Resolver<Maybe<ResolversTypes['LoadBalancer']>, ParentType, ContextType>;
  messageQueue?: Resolver<Maybe<ResolversTypes['MessageQueue']>, ParentType, ContextType>;
  microservice?: Resolver<Maybe<ResolversTypes['Microservice']>, ParentType, ContextType>;
  monitoring?: Resolver<Maybe<ResolversTypes['Monitoring']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  nodeType?: Resolver<ResolversTypes['GraphNodeType'], ParentType, ContextType>;
  orginalNodeId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  orginalNodeName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  orginalNodeType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  proxy?: Resolver<Maybe<ResolversTypes['Proxy']>, ParentType, ContextType>;
  spec?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type GraphValidationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GraphValidation'] = ResolversParentTypes['GraphValidation']> = ResolversObject<{
  isValid?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  suggestedGraph?: Resolver<ResolversTypes['Graph'], ParentType, ContextType>;
}>;

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type JobStatusResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['JobStatus'] = ResolversParentTypes['JobStatus']> = ResolversObject<{
  jobId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['JobStatusStatus'], ParentType, ContextType>;
  step?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type KubernetesClusterResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['KubernetesCluster'] = ResolversParentTypes['KubernetesCluster']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  metadata?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nodes?: Resolver<Maybe<Array<Maybe<ResolversTypes['Graph']>>>, ParentType, ContextType>;
  provider?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  region?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  spec?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['KubernetesClusterType']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type LoadBalancerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LoadBalancer'] = ResolversParentTypes['LoadBalancer']> = ResolversObject<{
  algorithm?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  backends?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  configMaps?: Resolver<Maybe<Array<Maybe<ResolversTypes['ConfigMap']>>>, ParentType, ContextType>;
  connectionDrainingEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  connectionDrainingTimeout?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  crossZoneEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  environmentVariables?: Resolver<Maybe<Array<Maybe<ResolversTypes['EnvironmentVariable']>>>, ParentType, ContextType>;
  graphId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  healthCheckEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  healthCheckHealthyThreshold?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  healthCheckInterval?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  healthCheckPath?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  healthCheckTimeout?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  healthCheckUnhealthyThreshold?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  host?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  idleTimeout?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  loadBalancerType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  port?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  protocol?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  secrets?: Resolver<Maybe<Array<Maybe<ResolversTypes['Secret']>>>, ParentType, ContextType>;
  spec?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  stickySessionCookie?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  stickySessionDuration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  stickySessionEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  tlsCertificate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tlsEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  tlsKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  translatesTo?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type MessageQueueResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MessageQueue'] = ResolversParentTypes['MessageQueue']> = ResolversObject<{
  authEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  clusterMode?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  configMaps?: Resolver<Maybe<Array<Maybe<ResolversTypes['ConfigMap']>>>, ParentType, ContextType>;
  dlqEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  dlqName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  engine?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  environmentVariables?: Resolver<Maybe<Array<Maybe<ResolversTypes['EnvironmentVariable']>>>, ParentType, ContextType>;
  exchanges?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  graphId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  host?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  maxMessageSize?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  partitions?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  port?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  protocol?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  queues?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  replicaCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  replicationFactor?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  retentionPeriod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  secrets?: Resolver<Maybe<Array<Maybe<ResolversTypes['Secret']>>>, ParentType, ContextType>;
  spec?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  tlsEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  topics?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  translatesTo?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type MicroserviceResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Microservice'] = ResolversParentTypes['Microservice']> = ResolversObject<{
  baseImage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  category?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  configMaps?: Resolver<Maybe<Array<ResolversTypes['ConfigMap']>>, ParentType, ContextType>;
  dependencies?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  environmentVariables?: Resolver<Maybe<Array<ResolversTypes['EnvironmentVariable']>>, ParentType, ContextType>;
  framework?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  graphId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  language?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ports?: Resolver<Maybe<Array<Maybe<ResolversTypes['Int']>>>, ParentType, ContextType>;
  repository?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scripts?: Resolver<Maybe<Array<ResolversTypes['Script']>>, ParentType, ContextType>;
  secrets?: Resolver<Maybe<Array<ResolversTypes['Secret']>>, ParentType, ContextType>;
  spec?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  translatesTo?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type MonitoringResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Monitoring'] = ResolversParentTypes['Monitoring']> = ResolversObject<{
  alertRules?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  alertmanagerEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  alertmanagerUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  authEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  configMaps?: Resolver<Maybe<Array<Maybe<ResolversTypes['ConfigMap']>>>, ParentType, ContextType>;
  dashboards?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  environmentVariables?: Resolver<Maybe<Array<Maybe<ResolversTypes['EnvironmentVariable']>>>, ParentType, ContextType>;
  exporters?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  graphId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  host?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  metrics?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  monitoringType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  port?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  remoteWriteEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  remoteWriteUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  retentionPeriod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scrapeInterval?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scrapeTimeout?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  secrets?: Resolver<Maybe<Array<Maybe<ResolversTypes['Secret']>>>, ParentType, ContextType>;
  serviceMonitors?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  spec?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  storageSize?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tlsEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  translatesTo?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  createGraph?: Resolver<ResolversTypes['Graph'], ParentType, ContextType, RequireFields<MutationCreateGraphArgs, 'input'>>;
  createKubernetesCluster?: Resolver<ResolversTypes['KubernetesCluster'], ParentType, ContextType, RequireFields<MutationCreateKubernetesClusterArgs, 'input'>>;
  createKubernetesGraph?: Resolver<ResolversTypes['Graph'], ParentType, ContextType, RequireFields<MutationCreateKubernetesGraphArgs, 'input'>>;
  createMicroservice?: Resolver<ResolversTypes['Microservice'], ParentType, ContextType, RequireFields<MutationCreateMicroserviceArgs, 'input'>>;
  deleteGraph?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteGraphArgs, 'companyId' | 'id'>>;
  deleteKubernetesCluster?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteKubernetesClusterArgs, 'companyId' | 'id'>>;
  deleteKubernetesGraph?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteKubernetesGraphArgs, 'companyId' | 'id'>>;
  deleteMicroservice?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteMicroserviceArgs, 'companyId' | 'id'>>;
  deployInfrastructure?: Resolver<ResolversTypes['Graph'], ParentType, ContextType, RequireFields<MutationDeployInfrastructureArgs, 'input'>>;
  initializeCodeGen?: Resolver<ResolversTypes['JobStatus'], ParentType, ContextType, RequireFields<MutationInitializeCodeGenArgs, 'input'>>;
  initializePlan?: Resolver<ResolversTypes['PlanJobStatus'], ParentType, ContextType, RequireFields<MutationInitializePlanArgs, 'input'>>;
  updateGraph?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType, RequireFields<MutationUpdateGraphArgs, 'id' | 'input'>>;
  updateKubernetesCluster?: Resolver<Maybe<ResolversTypes['KubernetesCluster']>, ParentType, ContextType, RequireFields<MutationUpdateKubernetesClusterArgs, 'input'>>;
  updateKubernetesGraph?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType, RequireFields<MutationUpdateKubernetesGraphArgs, 'input'>>;
  updateMicroservice?: Resolver<Maybe<ResolversTypes['Microservice']>, ParentType, ContextType, RequireFields<MutationUpdateMicroserviceArgs, 'input'>>;
}>;

export type PlanJobStatusResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PlanJobStatus'] = ResolversParentTypes['PlanJobStatus']> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  jobId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  step?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type PlanResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PlanResult'] = ResolversParentTypes['PlanResult']> = ResolversObject<{
  context?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  graph?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType>;
}>;

export type ProxyResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Proxy'] = ResolversParentTypes['Proxy']> = ResolversObject<{
  cachingEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  compressionEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  configMaps?: Resolver<Maybe<Array<Maybe<ResolversTypes['ConfigMap']>>>, ParentType, ContextType>;
  environmentVariables?: Resolver<Maybe<Array<Maybe<ResolversTypes['EnvironmentVariable']>>>, ParentType, ContextType>;
  graphId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  healthCheckEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  healthCheckInterval?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  healthCheckPath?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  host?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  kind?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  namespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  port?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  protocol?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  proxyType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rateLimitEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  rateLimitPeriod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rateLimitRequests?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  retries?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  secrets?: Resolver<Maybe<Array<Maybe<ResolversTypes['Secret']>>>, ParentType, ContextType>;
  spec?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  timeoutConnect?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timeoutRead?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timeoutWrite?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tlsCertificate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tlsEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  tlsKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  translatesTo?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType>;
  upstreams?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  connectionType?: Resolver<Maybe<ResolversTypes['ConnectionType']>, ParentType, ContextType, RequireFields<QueryConnectionTypeArgs, 'graphId' | 'sourceType' | 'targetType'>>;
  externalDependencies?: Resolver<Array<ResolversTypes['GraphNode']>, ParentType, ContextType, RequireFields<QueryExternalDependenciesArgs, 'graphId'>>;
  externalDependency?: Resolver<ResolversTypes['GraphNode'], ParentType, ContextType, RequireFields<QueryExternalDependencyArgs, 'graphId' | 'id'>>;
  generatedCode?: Resolver<Maybe<ResolversTypes['GeneratedCodeGraph']>, ParentType, ContextType, RequireFields<QueryGeneratedCodeArgs, 'jobId'>>;
  getPlan?: Resolver<Maybe<ResolversTypes['PlanResult']>, ParentType, ContextType, RequireFields<QueryGetPlanArgs, 'jobId'>>;
  getSuggestion?: Resolver<ResolversTypes['GraphConnectionSuggestion'], ParentType, ContextType, RequireFields<QueryGetSuggestionArgs, 'sourceId' | 'sourceType'>>;
  graph?: Resolver<Maybe<ResolversTypes['Graph']>, ParentType, ContextType, RequireFields<QueryGraphArgs, 'companyId' | 'id'>>;
  graphByName?: Resolver<Array<ResolversTypes['Graph']>, ParentType, ContextType, RequireFields<QueryGraphByNameArgs, 'companyId' | 'name'>>;
  graphs?: Resolver<Array<ResolversTypes['Graph']>, ParentType, ContextType, RequireFields<QueryGraphsArgs, 'companyId'>>;
  jobStatus?: Resolver<ResolversTypes['JobStatus'], ParentType, ContextType, RequireFields<QueryJobStatusArgs, 'input'>>;
  kubernetesCluster?: Resolver<ResolversTypes['KubernetesCluster'], ParentType, ContextType, RequireFields<QueryKubernetesClusterArgs, 'id'>>;
  kubernetesClusters?: Resolver<Array<ResolversTypes['KubernetesCluster']>, ParentType, ContextType, RequireFields<QueryKubernetesClustersArgs, 'companyId'>>;
  kubernetesGraph?: Resolver<ResolversTypes['Graph'], ParentType, ContextType, RequireFields<QueryKubernetesGraphArgs, 'id'>>;
  kubernetesGraphs?: Resolver<Array<ResolversTypes['Graph']>, ParentType, ContextType, RequireFields<QueryKubernetesGraphsArgs, 'companyId'>>;
  kubernetesResourcesByNamespace?: Resolver<Array<ResolversTypes['GraphNode']>, ParentType, ContextType, RequireFields<QueryKubernetesResourcesByNamespaceArgs, 'companyId' | 'namespace'>>;
  kubernetesResourcesByType?: Resolver<Array<ResolversTypes['GraphNode']>, ParentType, ContextType, RequireFields<QueryKubernetesResourcesByTypeArgs, 'companyId' | 'type'>>;
  microservice?: Resolver<Maybe<ResolversTypes['Microservice']>, ParentType, ContextType, RequireFields<QueryMicroserviceArgs, 'id'>>;
  microservices?: Resolver<Array<ResolversTypes['Microservice']>, ParentType, ContextType, RequireFields<QueryMicroservicesArgs, 'companyId'>>;
  node?: Resolver<ResolversTypes['GraphNode'], ParentType, ContextType, RequireFields<QueryNodeArgs, 'id'>>;
  nodes?: Resolver<Array<ResolversTypes['GraphNode']>, ParentType, ContextType, RequireFields<QueryNodesArgs, 'graphId'>>;
  validateConnection?: Resolver<ResolversTypes['ConnectionValidation'], ParentType, ContextType, RequireFields<QueryValidateConnectionArgs, 'input'>>;
  validateGraph?: Resolver<ResolversTypes['GraphValidation'], ParentType, ContextType, RequireFields<QueryValidateGraphArgs, 'graphId'>>;
}>;

export type ScriptResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Script'] = ResolversParentTypes['Script']> = ResolversObject<{
  calledBy?: Resolver<Maybe<Array<Maybe<ResolversTypes['GraphNode']>>>, ParentType, ContextType>;
  command?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  results?: Resolver<Maybe<Array<Maybe<ResolversTypes['ScriptResult']>>>, ParentType, ContextType>;
  retryCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
}>;

export type ScriptResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ScriptResult'] = ResolversParentTypes['ScriptResult']> = ResolversObject<{
  output?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type SecretResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Secret'] = ResolversParentTypes['Secret']> = ResolversObject<{
  encryptionPublicKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
}>;

export type SubscriptionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  generateCode?: SubscriptionResolver<Maybe<ResolversTypes['JobStatus']>, "generateCode", ParentType, ContextType, RequireFields<SubscriptionGenerateCodeArgs, 'input'>>;
}>;

export type SuggestionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Suggestion'] = ResolversParentTypes['Suggestion']> = ResolversObject<{
  targetConnectionType?: Resolver<ResolversTypes['ConnectionType'], ParentType, ContextType>;
  targetType?: Resolver<ResolversTypes['GraphNodeType'], ParentType, ContextType>;
}>;

export interface YamlScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['YAML'], any> {
  name: 'YAML';
}

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  Cache?: CacheResolvers<ContextType>;
  ConfigMap?: ConfigMapResolvers<ContextType>;
  ConnectionValidation?: ConnectionValidationResolvers<ContextType>;
  Database?: DatabaseResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Edge?: EdgeResolvers<ContextType>;
  EnvironmentVariable?: EnvironmentVariableResolvers<ContextType>;
  Gateway?: GatewayResolvers<ContextType>;
  GeneratedCodeGraph?: GeneratedCodeGraphResolvers<ContextType>;
  GeneratedCodeMetadata?: GeneratedCodeMetadataResolvers<ContextType>;
  GeneratedCodeNode?: GeneratedCodeNodeResolvers<ContextType>;
  Graph?: GraphResolvers<ContextType>;
  GraphBridge?: GraphBridgeResolvers<ContextType>;
  GraphConnectionSuggestion?: GraphConnectionSuggestionResolvers<ContextType>;
  GraphNode?: GraphNodeResolvers<ContextType>;
  GraphValidation?: GraphValidationResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  JobStatus?: JobStatusResolvers<ContextType>;
  KubernetesCluster?: KubernetesClusterResolvers<ContextType>;
  LoadBalancer?: LoadBalancerResolvers<ContextType>;
  MessageQueue?: MessageQueueResolvers<ContextType>;
  Microservice?: MicroserviceResolvers<ContextType>;
  Monitoring?: MonitoringResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PlanJobStatus?: PlanJobStatusResolvers<ContextType>;
  PlanResult?: PlanResultResolvers<ContextType>;
  Proxy?: ProxyResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Script?: ScriptResolvers<ContextType>;
  ScriptResult?: ScriptResultResolvers<ContextType>;
  Secret?: SecretResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Suggestion?: SuggestionResolvers<ContextType>;
  YAML?: GraphQLScalarType;
}>;

