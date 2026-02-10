import type { GraphQLClient, RequestOptions } from 'graphql-request';
import { GraphQLError } from 'graphql'
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
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

export type GetMicroservicesQueryVariables = Exact<{
  companyId: Scalars['String']['input'];
}>;


export type GetMicroservicesQuery = { __typename?: 'Query', microservices: Array<{ __typename?: 'Microservice', id: string, name: string, namespace?: string | null, category?: string | null, language?: string | null, framework?: string | null, image?: string | null, baseImage?: string | null, ports?: Array<number | null> | null, repository?: string | null, version?: string | null, dependencies?: Array<string | null> | null, environmentVariables?: Array<{ __typename?: 'EnvironmentVariable', name: string, value: string }> | null, secrets?: Array<{ __typename?: 'Secret', name: string, value?: string | null }> | null, configMaps?: Array<{ __typename?: 'ConfigMap', name: string, key?: string | null, value?: string | null }> | null, scripts?: Array<{ __typename?: 'Script', name: string, command: string }> | null }> };

export type GetMicroserviceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetMicroserviceQuery = { __typename?: 'Query', microservice?: { __typename?: 'Microservice', id: string, name: string, namespace?: string | null, category?: string | null, language?: string | null, framework?: string | null, image?: string | null, baseImage?: string | null, ports?: Array<number | null> | null, repository?: string | null, version?: string | null, dependencies?: Array<string | null> | null, environmentVariables?: Array<{ __typename?: 'EnvironmentVariable', name: string, value: string }> | null, secrets?: Array<{ __typename?: 'Secret', name: string, value?: string | null }> | null, configMaps?: Array<{ __typename?: 'ConfigMap', name: string, key?: string | null, value?: string | null }> | null, scripts?: Array<{ __typename?: 'Script', name: string, command: string }> | null } | null };

export type GetExternalDependenciesQueryVariables = Exact<{
  graphId: Scalars['ID']['input'];
}>;


export type GetExternalDependenciesQuery = { __typename?: 'Query', externalDependencies: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null, companyId: string, userId: string }> };

export type GetGraphsQueryVariables = Exact<{
  companyId: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetGraphsQuery = { __typename?: 'Query', graphs: Array<{ __typename?: 'Graph', id: string, name: string, description?: string | null, graphType: GraphType, createdAt?: string | null, updatedAt?: string | null, userId: string, companyId: string, nodes?: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null, edges?: Array<{ __typename?: 'Edge', connectionType: ConnectionType, node: { __typename?: 'GraphNode', id: string, name: string } } | null> | null } | null> | null, bridges?: Array<{ __typename?: 'GraphBridge', connectionType: ConnectionType, graph: { __typename?: 'Graph', id: string, name: string } } | null> | null }> };

export type GetNodesQueryVariables = Exact<{
  graphId: Scalars['ID']['input'];
}>;


export type GetNodesQuery = { __typename?: 'Query', nodes: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null, companyId: string, userId: string, edges?: Array<{ __typename?: 'Edge', connectionType: ConnectionType, node: { __typename?: 'GraphNode', id: string, name: string } } | null> | null }> };

export type CreateMicroserviceMutationVariables = Exact<{
  input: CreateMicroserviceInput;
}>;


export type CreateMicroserviceMutation = { __typename?: 'Mutation', createMicroservice: { __typename?: 'Microservice', id: string, name: string, namespace?: string | null, category?: string | null, language?: string | null, framework?: string | null, image?: string | null, baseImage?: string | null, ports?: Array<number | null> | null, repository?: string | null, version?: string | null, dependencies?: Array<string | null> | null, environmentVariables?: Array<{ __typename?: 'EnvironmentVariable', name: string, value: string }> | null, secrets?: Array<{ __typename?: 'Secret', name: string, value?: string | null }> | null, configMaps?: Array<{ __typename?: 'ConfigMap', name: string, key?: string | null, value?: string | null }> | null, scripts?: Array<{ __typename?: 'Script', name: string, command: string }> | null } };

export type UpdateMicroserviceMutationVariables = Exact<{
  input: UpdateMicroserviceInput;
}>;


export type UpdateMicroserviceMutation = { __typename?: 'Mutation', updateMicroservice?: { __typename?: 'Microservice', id: string, name: string, namespace?: string | null, category?: string | null, language?: string | null, framework?: string | null, image?: string | null, baseImage?: string | null, ports?: Array<number | null> | null, repository?: string | null, version?: string | null, dependencies?: Array<string | null> | null, environmentVariables?: Array<{ __typename?: 'EnvironmentVariable', name: string, value: string }> | null, secrets?: Array<{ __typename?: 'Secret', name: string, value?: string | null }> | null, configMaps?: Array<{ __typename?: 'ConfigMap', name: string, key?: string | null, value?: string | null }> | null, scripts?: Array<{ __typename?: 'Script', name: string, command: string }> | null } | null };

export type DeleteMicroserviceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  companyId: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
}>;


export type DeleteMicroserviceMutation = { __typename?: 'Mutation', deleteMicroservice: boolean };

export type CreateGraphMutationVariables = Exact<{
  input: CreateGraphInput;
}>;


export type CreateGraphMutation = { __typename?: 'Mutation', createGraph: { __typename?: 'Graph', id: string, name: string, description?: string | null, graphType: GraphType, createdAt?: string | null, updatedAt?: string | null, userId: string, companyId: string, nodes?: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null } | null> | null, bridges?: Array<{ __typename?: 'GraphBridge', connectionType: ConnectionType, graph: { __typename?: 'Graph', id: string, name: string } } | null> | null } };

export type GetConnectionTypeQueryVariables = Exact<{
  graphId: Scalars['ID']['input'];
  sourceType: Scalars['String']['input'];
  targetType: Scalars['String']['input'];
}>;


export type GetConnectionTypeQuery = { __typename?: 'Query', connectionType?: ConnectionType | null };

export type GenerateCodeQueryVariables = Exact<{
  jobId: Scalars['String']['input'];
}>;


export type GenerateCodeQuery = { __typename?: 'Query', generatedCode?: { __typename?: 'GeneratedCodeGraph', graphId: string, originalGraphId: string, namespace: string, totalFiles: number, nodes?: Array<{ __typename?: 'GeneratedCodeNode', id: string, name: string, nodeType: GraphNodeType, config?: any | null, generatedCodeMetadata: { __typename?: 'GeneratedCodeMetadata', fileName: string, path: string }, command?: { __typename?: 'Script', name: string, command: string } | null }> | null } | null };

export type ValidateConnectionQueryVariables = Exact<{
  input: ValidateConnectionInput;
}>;


export type ValidateConnectionQuery = { __typename?: 'Query', validateConnection: { __typename?: 'ConnectionValidation', isValid: boolean, suggestion: ConnectionType } };

export type ValidateGraphQueryVariables = Exact<{
  graphId: Scalars['String']['input'];
}>;


export type ValidateGraphQuery = { __typename?: 'Query', validateGraph: { __typename?: 'GraphValidation', isValid: boolean, suggestedGraph: { __typename?: 'Graph', id: string, name: string, description?: string | null, graphType: GraphType, createdAt?: string | null, updatedAt?: string | null, userId: string, companyId: string } } };

export type GetSuggestionQueryVariables = Exact<{
  sourceId: Scalars['String']['input'];
  sourceType: GraphNodeType;
}>;


export type GetSuggestionQuery = { __typename?: 'Query', getSuggestion: { __typename?: 'GraphConnectionSuggestion', sourceType: GraphNodeType, sourceId: string, suggestions: Array<{ __typename?: 'Suggestion', targetType: GraphNodeType, targetConnectionType: ConnectionType }> } };

export type CreateKubernetesClusterMutationVariables = Exact<{
  input: CreateKubernetesClusterInput;
}>;


export type CreateKubernetesClusterMutation = { __typename?: 'Mutation', createKubernetesCluster: { __typename?: 'KubernetesCluster', id: string, name: string, provider?: string | null, region?: string | null, type?: KubernetesClusterType | null, version?: string | null, metadata?: string | null, spec?: any | null } };

export type CreateKubernetesGraphMutationVariables = Exact<{
  input: CreateKubernetesGraphInput;
}>;


export type CreateKubernetesGraphMutation = { __typename?: 'Mutation', createKubernetesGraph: { __typename?: 'Graph', id: string, name: string, description?: string | null, graphType: GraphType, createdAt?: string | null, updatedAt?: string | null, userId: string, companyId: string, nodes?: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null } | null> | null, bridges?: Array<{ __typename?: 'GraphBridge', connectionType: ConnectionType, graph: { __typename?: 'Graph', id: string, name: string } } | null> | null } };

export type DeleteGraphMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  companyId: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
}>;


export type DeleteGraphMutation = { __typename?: 'Mutation', deleteGraph: boolean };

export type DeleteKubernetesClusterMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  companyId: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
}>;


export type DeleteKubernetesClusterMutation = { __typename?: 'Mutation', deleteKubernetesCluster: boolean };

export type DeleteKubernetesGraphMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  companyId: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
}>;


export type DeleteKubernetesGraphMutation = { __typename?: 'Mutation', deleteKubernetesGraph: boolean };

export type UpdateGraphMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateGraphInput;
}>;


export type UpdateGraphMutation = { __typename?: 'Mutation', updateGraph?: { __typename?: 'Graph', id: string, name: string, description?: string | null, graphType: GraphType, createdAt?: string | null, updatedAt?: string | null, userId: string, companyId: string, nodes?: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null } | null> | null, bridges?: Array<{ __typename?: 'GraphBridge', connectionType: ConnectionType, graph: { __typename?: 'Graph', id: string, name: string } } | null> | null } | null };

export type UpdateKubernetesClusterMutationVariables = Exact<{
  input: UpdateKubernetesClusterInput;
}>;


export type UpdateKubernetesClusterMutation = { __typename?: 'Mutation', updateKubernetesCluster?: { __typename?: 'KubernetesCluster', id: string, name: string, provider?: string | null, region?: string | null, type?: KubernetesClusterType | null, version?: string | null, metadata?: string | null, spec?: any | null } | null };

export type UpdateKubernetesGraphMutationVariables = Exact<{
  input: UpdateKubernetesGraphInput;
}>;


export type UpdateKubernetesGraphMutation = { __typename?: 'Mutation', updateKubernetesGraph?: { __typename?: 'Graph', id: string, name: string, description?: string | null, graphType: GraphType, createdAt?: string | null, updatedAt?: string | null, userId: string, companyId: string, nodes?: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null } | null> | null, bridges?: Array<{ __typename?: 'GraphBridge', connectionType: ConnectionType, graph: { __typename?: 'Graph', id: string, name: string } } | null> | null } | null };

export type DeployInfrastructureMutationVariables = Exact<{
  input: DeployInfrastructureInput;
}>;


export type DeployInfrastructureMutation = { __typename?: 'Mutation', deployInfrastructure: { __typename?: 'Graph', id: string, name: string, description?: string | null, graphType: GraphType, createdAt?: string | null, updatedAt?: string | null, userId: string, companyId: string, nodes?: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null } | null> | null, bridges?: Array<{ __typename?: 'GraphBridge', connectionType: ConnectionType, graph: { __typename?: 'Graph', id: string, name: string } } | null> | null } };

export type InitializeCodeGenMutationVariables = Exact<{
  input: GenerateCodeInput;
}>;


export type InitializeCodeGenMutation = { __typename?: 'Mutation', initializeCodeGen: { __typename?: 'JobStatus', jobId: string, step: string, status: JobStatusStatus } };

export type ExternalDependencyQueryVariables = Exact<{
  graphId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
}>;


export type ExternalDependencyQuery = { __typename?: 'Query', externalDependency: { __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null, companyId: string, userId: string } };

export type GraphQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  companyId: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
}>;


export type GraphQuery = { __typename?: 'Query', graph?: { __typename?: 'Graph', id: string, name: string, description?: string | null, graphType: GraphType, createdAt?: string | null, updatedAt?: string | null, userId: string, companyId: string, nodes?: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null } | null> | null, bridges?: Array<{ __typename?: 'GraphBridge', connectionType: ConnectionType, graph: { __typename?: 'Graph', id: string, name: string } } | null> | null } | null };

export type GraphByNameQueryVariables = Exact<{
  name: Scalars['String']['input'];
  companyId: Scalars['String']['input'];
}>;


export type GraphByNameQuery = { __typename?: 'Query', graphByName: Array<{ __typename?: 'Graph', id: string, name: string, description?: string | null, graphType: GraphType, createdAt?: string | null, updatedAt?: string | null, userId: string, companyId: string, nodes?: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null } | null> | null, bridges?: Array<{ __typename?: 'GraphBridge', connectionType: ConnectionType, graph: { __typename?: 'Graph', id: string, name: string } } | null> | null }> };

export type KubernetesClusterQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type KubernetesClusterQuery = { __typename?: 'Query', kubernetesCluster: { __typename?: 'KubernetesCluster', id: string, name: string, provider?: string | null, region?: string | null, type?: KubernetesClusterType | null, version?: string | null, metadata?: string | null, spec?: any | null } };

export type KubernetesClustersQueryVariables = Exact<{
  companyId: Scalars['String']['input'];
}>;


export type KubernetesClustersQuery = { __typename?: 'Query', kubernetesClusters: Array<{ __typename?: 'KubernetesCluster', id: string, name: string, provider?: string | null, region?: string | null, type?: KubernetesClusterType | null, version?: string | null, metadata?: string | null, spec?: any | null }> };

export type KubernetesGraphQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type KubernetesGraphQuery = { __typename?: 'Query', kubernetesGraph: { __typename?: 'Graph', id: string, name: string, description?: string | null, graphType: GraphType, createdAt?: string | null, updatedAt?: string | null, userId: string, companyId: string, nodes?: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null } | null> | null, bridges?: Array<{ __typename?: 'GraphBridge', connectionType: ConnectionType, graph: { __typename?: 'Graph', id: string, name: string } } | null> | null } };

export type KubernetesGraphsQueryVariables = Exact<{
  companyId: Scalars['String']['input'];
}>;


export type KubernetesGraphsQuery = { __typename?: 'Query', kubernetesGraphs: Array<{ __typename?: 'Graph', id: string, name: string, description?: string | null, graphType: GraphType, createdAt?: string | null, updatedAt?: string | null, userId: string, companyId: string, nodes?: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null } | null> | null, bridges?: Array<{ __typename?: 'GraphBridge', connectionType: ConnectionType, graph: { __typename?: 'Graph', id: string, name: string } } | null> | null }> };

export type KubernetesResourcesByNamespaceQueryVariables = Exact<{
  companyId: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
}>;


export type KubernetesResourcesByNamespaceQuery = { __typename?: 'Query', kubernetesResourcesByNamespace: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null, companyId: string, userId: string }> };

export type KubernetesResourcesByTypeQueryVariables = Exact<{
  companyId: Scalars['String']['input'];
  type: Scalars['String']['input'];
}>;


export type KubernetesResourcesByTypeQuery = { __typename?: 'Query', kubernetesResourcesByType: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null, companyId: string, userId: string }> };

export type NodeQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type NodeQuery = { __typename?: 'Query', node: { __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType, dependencyType?: DependencyType | null, namespace?: string | null, companyId: string, userId: string } };

export type JobStatusQueryVariables = Exact<{
  input: JobStatusInput;
}>;


export type JobStatusQuery = { __typename?: 'Query', jobStatus: { __typename?: 'JobStatus', jobId: string, step: string, status: JobStatusStatus } };

export type InitializePlanMutationVariables = Exact<{
  input: InitializePlanInput;
}>;


export type InitializePlanMutation = { __typename?: 'Mutation', initializePlan: { __typename?: 'PlanJobStatus', jobId: string, status: string, step: string, error?: string | null } };

export type GetPlanQueryVariables = Exact<{
  jobId: Scalars['String']['input'];
}>;


export type GetPlanQuery = { __typename?: 'Query', getPlan?: { __typename?: 'PlanResult', context?: Array<string | null> | null, graph?: { __typename?: 'Graph', id: string, name: string, nodes?: Array<{ __typename?: 'GraphNode', id: string, name: string, nodeType: GraphNodeType } | null> | null } | null } | null };


export const GetMicroservicesDocument = `
    query GetMicroservices($companyId: String!) {
  microservices(companyId: $companyId) {
    id
    name
    namespace
    category
    language
    framework
    image
    baseImage
    ports
    repository
    version
    environmentVariables {
      name
      value
    }
    secrets {
      name
      value
    }
    configMaps {
      name
      key
      value
    }
    scripts {
      name
      command
    }
    dependencies
  }
}
    `;
export const GetMicroserviceDocument = `
    query GetMicroservice($id: ID!) {
  microservice(id: $id) {
    id
    name
    namespace
    category
    language
    framework
    image
    baseImage
    ports
    repository
    version
    environmentVariables {
      name
      value
    }
    secrets {
      name
      value
    }
    configMaps {
      name
      key
      value
    }
    scripts {
      name
      command
    }
    dependencies
  }
}
    `;
export const GetExternalDependenciesDocument = `
    query GetExternalDependencies($graphId: ID!) {
  externalDependencies(graphId: $graphId) {
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
export const GetGraphsDocument = `
    query GetGraphs($companyId: String!, $userId: String) {
  graphs(companyId: $companyId, userId: $userId) {
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
      edges {
        connectionType
        node {
          id
          name
        }
      }
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
export const GetNodesDocument = `
    query GetNodes($graphId: ID!) {
  nodes(graphId: $graphId) {
    id
    name
    nodeType
    dependencyType
    namespace
    companyId
    userId
    edges {
      connectionType
      node {
        id
        name
      }
    }
  }
}
    `;
export const CreateMicroserviceDocument = `
    mutation CreateMicroservice($input: CreateMicroserviceInput!) {
  createMicroservice(input: $input) {
    id
    name
    namespace
    category
    language
    framework
    image
    baseImage
    ports
    repository
    version
    environmentVariables {
      name
      value
    }
    secrets {
      name
      value
    }
    configMaps {
      name
      key
      value
    }
    scripts {
      name
      command
    }
    dependencies
  }
}
    `;
export const UpdateMicroserviceDocument = `
    mutation UpdateMicroservice($input: UpdateMicroserviceInput!) {
  updateMicroservice(input: $input) {
    id
    name
    namespace
    category
    language
    framework
    image
    baseImage
    ports
    repository
    version
    environmentVariables {
      name
      value
    }
    secrets {
      name
      value
    }
    configMaps {
      name
      key
      value
    }
    scripts {
      name
      command
    }
    dependencies
  }
}
    `;
export const DeleteMicroserviceDocument = `
    mutation DeleteMicroservice($id: ID!, $companyId: String!, $userId: String) {
  deleteMicroservice(id: $id, companyId: $companyId, userId: $userId)
}
    `;
export const CreateGraphDocument = `
    mutation CreateGraph($input: CreateGraphInput!) {
  createGraph(input: $input) {
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
export const GetConnectionTypeDocument = `
    query GetConnectionType($graphId: ID!, $sourceType: String!, $targetType: String!) {
  connectionType(
    graphId: $graphId
    sourceType: $sourceType
    targetType: $targetType
  )
}
    `;
export const GenerateCodeDocument = `
    query GenerateCode($jobId: String!) {
  generatedCode(jobId: $jobId) {
    graphId
    originalGraphId
    namespace
    totalFiles
    nodes {
      id
      name
      nodeType
      config
      generatedCodeMetadata {
        fileName
        path
      }
      command {
        name
        command
      }
    }
  }
}
    `;
export const ValidateConnectionDocument = `
    query ValidateConnection($input: ValidateConnectionInput!) {
  validateConnection(input: $input) {
    isValid
    suggestion
  }
}
    `;
export const ValidateGraphDocument = `
    query ValidateGraph($graphId: String!) {
  validateGraph(graphId: $graphId) {
    isValid
    suggestedGraph {
      id
      name
      description
      graphType
      createdAt
      updatedAt
      userId
      companyId
    }
  }
}
    `;
export const GetSuggestionDocument = `
    query GetSuggestion($sourceId: String!, $sourceType: GraphNodeType!) {
  getSuggestion(sourceId: $sourceId, sourceType: $sourceType) {
    sourceType
    sourceId
    suggestions {
      targetType
      targetConnectionType
    }
  }
}
    `;
export const CreateKubernetesClusterDocument = `
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
export const CreateKubernetesGraphDocument = `
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
export const DeleteGraphDocument = `
    mutation DeleteGraph($id: ID!, $companyId: String!, $userId: String) {
  deleteGraph(id: $id, companyId: $companyId, userId: $userId)
}
    `;
export const DeleteKubernetesClusterDocument = `
    mutation DeleteKubernetesCluster($id: ID!, $companyId: String!, $userId: String) {
  deleteKubernetesCluster(id: $id, companyId: $companyId, userId: $userId)
}
    `;
export const DeleteKubernetesGraphDocument = `
    mutation DeleteKubernetesGraph($id: ID!, $companyId: String!, $userId: String) {
  deleteKubernetesGraph(id: $id, companyId: $companyId, userId: $userId)
}
    `;
export const UpdateGraphDocument = `
    mutation UpdateGraph($id: ID!, $input: UpdateGraphInput!) {
  updateGraph(id: $id, input: $input) {
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
export const UpdateKubernetesClusterDocument = `
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
export const UpdateKubernetesGraphDocument = `
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
export const DeployInfrastructureDocument = `
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
export const InitializeCodeGenDocument = `
    mutation InitializeCodeGen($input: GenerateCodeInput!) {
  initializeCodeGen(input: $input) {
    jobId
    step
    status
  }
}
    `;
export const ExternalDependencyDocument = `
    query ExternalDependency($graphId: ID!, $id: ID!) {
  externalDependency(graphId: $graphId, id: $id) {
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
export const GraphDocument = `
    query Graph($id: ID!, $companyId: String!, $userId: String) {
  graph(id: $id, companyId: $companyId, userId: $userId) {
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
export const GraphByNameDocument = `
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
export const KubernetesClusterDocument = `
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
export const KubernetesClustersDocument = `
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
export const KubernetesGraphDocument = `
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
export const KubernetesGraphsDocument = `
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
export const KubernetesResourcesByNamespaceDocument = `
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
export const KubernetesResourcesByTypeDocument = `
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
export const NodeDocument = `
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
export const JobStatusDocument = `
    query JobStatus($input: JobStatusInput!) {
  jobStatus(input: $input) {
    jobId
    step
    status
  }
}
    `;
export const InitializePlanDocument = `
    mutation InitializePlan($input: InitializePlanInput!) {
  initializePlan(input: $input) {
    jobId
    status
    step
    error
  }
}
    `;
export const GetPlanDocument = `
    query GetPlan($jobId: String!) {
  getPlan(jobId: $jobId) {
    graph {
      id
      name
      nodes {
        id
        name
        nodeType
      }
    }
    context
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    GetMicroservices(variables: GetMicroservicesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetMicroservicesQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetMicroservicesQuery>(GetMicroservicesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetMicroservices', 'query', variables);
    },
    GetMicroservice(variables: GetMicroserviceQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetMicroserviceQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetMicroserviceQuery>(GetMicroserviceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetMicroservice', 'query', variables);
    },
    GetExternalDependencies(variables: GetExternalDependenciesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetExternalDependenciesQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetExternalDependenciesQuery>(GetExternalDependenciesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetExternalDependencies', 'query', variables);
    },
    GetGraphs(variables: GetGraphsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetGraphsQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetGraphsQuery>(GetGraphsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetGraphs', 'query', variables);
    },
    GetNodes(variables: GetNodesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetNodesQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetNodesQuery>(GetNodesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetNodes', 'query', variables);
    },
    CreateMicroservice(variables: CreateMicroserviceMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: CreateMicroserviceMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<CreateMicroserviceMutation>(CreateMicroserviceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateMicroservice', 'mutation', variables);
    },
    UpdateMicroservice(variables: UpdateMicroserviceMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: UpdateMicroserviceMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<UpdateMicroserviceMutation>(UpdateMicroserviceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateMicroservice', 'mutation', variables);
    },
    DeleteMicroservice(variables: DeleteMicroserviceMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: DeleteMicroserviceMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<DeleteMicroserviceMutation>(DeleteMicroserviceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteMicroservice', 'mutation', variables);
    },
    CreateGraph(variables: CreateGraphMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: CreateGraphMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<CreateGraphMutation>(CreateGraphDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateGraph', 'mutation', variables);
    },
    GetConnectionType(variables: GetConnectionTypeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetConnectionTypeQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetConnectionTypeQuery>(GetConnectionTypeDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetConnectionType', 'query', variables);
    },
    GenerateCode(variables: GenerateCodeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GenerateCodeQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GenerateCodeQuery>(GenerateCodeDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GenerateCode', 'query', variables);
    },
    ValidateConnection(variables: ValidateConnectionQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: ValidateConnectionQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<ValidateConnectionQuery>(ValidateConnectionDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ValidateConnection', 'query', variables);
    },
    ValidateGraph(variables: ValidateGraphQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: ValidateGraphQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<ValidateGraphQuery>(ValidateGraphDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ValidateGraph', 'query', variables);
    },
    GetSuggestion(variables: GetSuggestionQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetSuggestionQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetSuggestionQuery>(GetSuggestionDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetSuggestion', 'query', variables);
    },
    CreateKubernetesCluster(variables: CreateKubernetesClusterMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: CreateKubernetesClusterMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<CreateKubernetesClusterMutation>(CreateKubernetesClusterDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateKubernetesCluster', 'mutation', variables);
    },
    CreateKubernetesGraph(variables: CreateKubernetesGraphMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: CreateKubernetesGraphMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<CreateKubernetesGraphMutation>(CreateKubernetesGraphDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'CreateKubernetesGraph', 'mutation', variables);
    },
    DeleteGraph(variables: DeleteGraphMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: DeleteGraphMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<DeleteGraphMutation>(DeleteGraphDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteGraph', 'mutation', variables);
    },
    DeleteKubernetesCluster(variables: DeleteKubernetesClusterMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: DeleteKubernetesClusterMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<DeleteKubernetesClusterMutation>(DeleteKubernetesClusterDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteKubernetesCluster', 'mutation', variables);
    },
    DeleteKubernetesGraph(variables: DeleteKubernetesGraphMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: DeleteKubernetesGraphMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<DeleteKubernetesGraphMutation>(DeleteKubernetesGraphDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeleteKubernetesGraph', 'mutation', variables);
    },
    UpdateGraph(variables: UpdateGraphMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: UpdateGraphMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<UpdateGraphMutation>(UpdateGraphDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateGraph', 'mutation', variables);
    },
    UpdateKubernetesCluster(variables: UpdateKubernetesClusterMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: UpdateKubernetesClusterMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<UpdateKubernetesClusterMutation>(UpdateKubernetesClusterDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateKubernetesCluster', 'mutation', variables);
    },
    UpdateKubernetesGraph(variables: UpdateKubernetesGraphMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: UpdateKubernetesGraphMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<UpdateKubernetesGraphMutation>(UpdateKubernetesGraphDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'UpdateKubernetesGraph', 'mutation', variables);
    },
    DeployInfrastructure(variables: DeployInfrastructureMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: DeployInfrastructureMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<DeployInfrastructureMutation>(DeployInfrastructureDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'DeployInfrastructure', 'mutation', variables);
    },
    InitializeCodeGen(variables: InitializeCodeGenMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: InitializeCodeGenMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<InitializeCodeGenMutation>(InitializeCodeGenDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'InitializeCodeGen', 'mutation', variables);
    },
    ExternalDependency(variables: ExternalDependencyQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: ExternalDependencyQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<ExternalDependencyQuery>(ExternalDependencyDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'ExternalDependency', 'query', variables);
    },
    Graph(variables: GraphQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GraphQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GraphQuery>(GraphDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'Graph', 'query', variables);
    },
    GraphByName(variables: GraphByNameQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GraphByNameQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GraphByNameQuery>(GraphByNameDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GraphByName', 'query', variables);
    },
    KubernetesCluster(variables: KubernetesClusterQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: KubernetesClusterQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<KubernetesClusterQuery>(KubernetesClusterDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'KubernetesCluster', 'query', variables);
    },
    KubernetesClusters(variables: KubernetesClustersQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: KubernetesClustersQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<KubernetesClustersQuery>(KubernetesClustersDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'KubernetesClusters', 'query', variables);
    },
    KubernetesGraph(variables: KubernetesGraphQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: KubernetesGraphQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<KubernetesGraphQuery>(KubernetesGraphDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'KubernetesGraph', 'query', variables);
    },
    KubernetesGraphs(variables: KubernetesGraphsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: KubernetesGraphsQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<KubernetesGraphsQuery>(KubernetesGraphsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'KubernetesGraphs', 'query', variables);
    },
    KubernetesResourcesByNamespace(variables: KubernetesResourcesByNamespaceQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: KubernetesResourcesByNamespaceQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<KubernetesResourcesByNamespaceQuery>(KubernetesResourcesByNamespaceDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'KubernetesResourcesByNamespace', 'query', variables);
    },
    KubernetesResourcesByType(variables: KubernetesResourcesByTypeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: KubernetesResourcesByTypeQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<KubernetesResourcesByTypeQuery>(KubernetesResourcesByTypeDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'KubernetesResourcesByType', 'query', variables);
    },
    Node(variables: NodeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: NodeQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<NodeQuery>(NodeDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'Node', 'query', variables);
    },
    JobStatus(variables: JobStatusQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: JobStatusQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<JobStatusQuery>(JobStatusDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'JobStatus', 'query', variables);
    },
    InitializePlan(variables: InitializePlanMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: InitializePlanMutation; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<InitializePlanMutation>(InitializePlanDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'InitializePlan', 'mutation', variables);
    },
    GetPlan(variables: GetPlanQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetPlanQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetPlanQuery>(GetPlanDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetPlan', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;