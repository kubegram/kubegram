/**
 * Unified type interfaces for all graph-related entities
 * Copied from kuberag - these interfaces are used throughout the application
 */

import { GraphNodeType, DependencyType, GraphType, ConnectionType, KubernetesClusterType } from './enums.js';

// ============================================================================
// Base Types and Scalars
// ============================================================================

export type ID = string;
export type JSON = Record<string, any>;
export type YAML = string;
export type DateTime = string;

// ============================================================================
// Helper Types
// ============================================================================

export interface EnvironmentVariable {
  name: string;
  value: string;
}

export interface EnvironmentVariableInput {
  name: string;
  value: string;
}

export interface Secret {
  name: string;
  key?: string;
  value?: string;
  encryptionPublicKey: string;
}

export interface SecretInput {
  name: string;
  key?: string;
  value?: string;
  encryptionPublicKey: string;
}

export interface ConfigMap {
  name: string;
  key?: string;
  value?: string;
}

export interface ConfigMapInput {
  name: string;
  key?: string;
  value?: string;
}

export interface ScriptResult {
  status: string;
  output?: string;
}

export interface Script {
  name: string;
  command: string;
  calledBy?: GraphNode[];
  results?: ScriptResult[];
  retryCount?: number;
}

export interface ScriptInput {
  name: string;
  command: string;
}

export interface Edge {
  node: GraphNode;
  connectionType: ConnectionType;
}

export interface EdgeInput {
  connectionType: ConnectionType;
  node: NodeInput;
  id?: ID;
  startNodeId?: string;
  endNodeId?: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
}

export interface GraphBridge {
  connectionType: ConnectionType;
  graph: Graph;
}

export interface GraphBridgeInput {
  connectionType: ConnectionType;
  graphId: ID;
}

// ============================================================================
// Main Resource Types
// ============================================================================

export interface Microservice {
  id: ID;
  graphId?: string;
  name: string;
  namespace?: string;
  language?: string;
  framework?: string;
  version?: string;
  category?: string;
  repository?: string;
  baseImage?: string;
  image?: string;
  dependencies?: string[];
  companyId: string;
  userId: string;
  environmentVariables?: EnvironmentVariable[];
  configMaps?: ConfigMap[];
  secrets?: Secret[];
  ports?: number[];
  scripts?: Script[];
  translatesTo?: Graph;
  spec?: JSON;
}

export interface Database {
  id: ID;
  graphId?: string;
  kind: string;
  url: string;
  name: string;
  namespace?: string;
  engine?: string;
  version?: string;
  host?: string;
  port?: number;
  databaseName?: string;
  username?: string;
  connectionString?: string;
  maxConnections?: number;
  storageSize?: string;
  storageClass?: string;
  replicationEnabled?: boolean;
  replicaCount?: number;
  backupEnabled?: boolean;
  backupSchedule?: string;
  sslEnabled?: boolean;
  charset?: string;
  collation?: string;
  companyId: string;
  userId: string;
  environmentVariables?: EnvironmentVariable[];
  configMaps?: ConfigMap[];
  secrets?: Secret[];
  translatesTo?: Graph;
  spec?: JSON;
}

export interface Cache {
  id: ID;
  graphId?: string;
  name: string;
  kind: string;
  url: string;
  namespace?: string;
  engine?: string;
  version?: string;
  host?: string;
  port?: number;
  clusterMode?: boolean;
  replicaCount?: number;
  maxMemory?: string;
  evictionPolicy?: string;
  persistenceEnabled?: boolean;
  persistenceStrategy?: string;
  password?: string;
  tlsEnabled?: boolean;
  sentinelEnabled?: boolean;
  sentinelHosts?: string[];
  companyId: string;
  userId: string;
  environmentVariables?: EnvironmentVariable[];
  configMaps?: ConfigMap[];
  secrets?: Secret[];
  translatesTo?: Graph;
  spec?: JSON;
}

export interface MessageQueue {
  id: ID;
  graphId?: string;
  name: string;
  kind: string;
  url: string;
  namespace?: string;
  engine?: string;
  version?: string;
  host?: string;
  port?: number;
  protocol?: string;
  topics?: string[];
  queues?: string[];
  exchanges?: string[];
  clusterMode?: boolean;
  replicaCount?: number;
  partitions?: number;
  replicationFactor?: number;
  retentionPeriod?: string;
  maxMessageSize?: string;
  dlqEnabled?: boolean;
  dlqName?: string;
  tlsEnabled?: boolean;
  authEnabled?: boolean;
  companyId: string;
  userId: string;
  environmentVariables?: EnvironmentVariable[];
  configMaps?: ConfigMap[];
  secrets?: Secret[];
  translatesTo?: Graph;
  spec?: JSON;
}

export interface Proxy {
  id: ID;
  graphId?: string;
  name: string;
  kind: string;
  url: string;
  namespace?: string;
  proxyType?: string;
  version?: string;
  host?: string;
  port?: number;
  protocol?: string;
  upstreams?: string[];
  tlsEnabled?: boolean;
  tlsCertificate?: string;
  tlsKey?: string;
  rateLimitEnabled?: boolean;
  rateLimitRequests?: number;
  rateLimitPeriod?: string;
  timeoutConnect?: string;
  timeoutRead?: string;
  timeoutWrite?: string;
  retries?: number;
  healthCheckEnabled?: boolean;
  healthCheckPath?: string;
  healthCheckInterval?: string;
  compressionEnabled?: boolean;
  cachingEnabled?: boolean;
  companyId: string;
  userId: string;
  environmentVariables?: EnvironmentVariable[];
  configMaps?: ConfigMap[];
  secrets?: Secret[];
  translatesTo?: Graph;
  spec?: JSON;
}

export interface LoadBalancer {
  id: ID;
  graphId?: string;
  name: string;
  kind: string;
  url: string;
  namespace?: string;
  loadBalancerType?: string;
  version?: string;
  host?: string;
  port?: number;
  protocol?: string;
  backends?: string[];
  algorithm?: string;
  healthCheckEnabled?: boolean;
  healthCheckPath?: string;
  healthCheckInterval?: string;
  healthCheckTimeout?: string;
  healthCheckHealthyThreshold?: number;
  healthCheckUnhealthyThreshold?: number;
  stickySessionEnabled?: boolean;
  stickySessionCookie?: string;
  stickySessionDuration?: string;
  tlsEnabled?: boolean;
  tlsCertificate?: string;
  tlsKey?: string;
  crossZoneEnabled?: boolean;
  idleTimeout?: string;
  connectionDrainingEnabled?: boolean;
  connectionDrainingTimeout?: string;
  companyId: string;
  userId: string;
  environmentVariables?: EnvironmentVariable[];
  configMaps?: ConfigMap[];
  secrets?: Secret[];
  translatesTo?: Graph;
  spec?: JSON;
}

export interface Monitoring {
  id: ID;
  graphId?: string;
  name: string;
  kind: string;
  url: string;
  namespace?: string;
  monitoringType?: string;
  version?: string;
  host?: string;
  port?: number;
  scrapeInterval?: string;
  scrapeTimeout?: string;
  retentionPeriod?: string;
  storageSize?: string;
  metrics?: string[];
  dashboards?: string[];
  alertRules?: string[];
  alertmanagerEnabled?: boolean;
  alertmanagerUrl?: string;
  exporters?: string[];
  serviceMonitors?: string[];
  remoteWriteEnabled?: boolean;
  remoteWriteUrl?: string;
  tlsEnabled?: boolean;
  authEnabled?: boolean;
  companyId: string;
  userId: string;
  environmentVariables?: EnvironmentVariable[];
  configMaps?: ConfigMap[];
  secrets?: Secret[];
  translatesTo?: Graph;
  spec?: JSON;
}

export interface Gateway {
  id: ID;
  graphId?: string;
  name: string;
  kind: string;
  url: string;
  namespace?: string;
  gatewayType?: string;
  version?: string;
  host?: string;
  port?: number;
  protocol?: string;
  routes?: string[];
  upstreams?: string[];
  domains?: string[];
  basePath?: string;
  tlsEnabled?: boolean;
  tlsCertificate?: string;
  tlsKey?: string;
  tlsMinVersion?: string;
  authEnabled?: boolean;
  authType?: string;
  corsEnabled?: boolean;
  corsOrigins?: string[];
  corsMethods?: string[];
  corsHeaders?: string[];
  rateLimitEnabled?: boolean;
  rateLimitRequests?: number;
  rateLimitPeriod?: string;
  rateLimitBurstSize?: number;
  timeoutConnect?: string;
  timeoutRead?: string;
  timeoutWrite?: string;
  timeoutIdle?: string;
  loadBalancingAlgorithm?: string;
  healthCheckEnabled?: boolean;
  healthCheckPath?: string;
  healthCheckInterval?: string;
  healthCheckTimeout?: string;
  healthCheckHealthyThreshold?: number;
  healthCheckUnhealthyThreshold?: number;
  circuitBreakerEnabled?: boolean;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: string;
  retries?: number;
  retryTimeout?: string;
  retryBackoff?: string;
  cachingEnabled?: boolean;
  cacheSize?: string;
  cacheTTL?: string;
  compressionEnabled?: boolean;
  compressionLevel?: number;
  compressionTypes?: string[];
  accessLogEnabled?: boolean;
  accessLogFormat?: string;
  metricsEnabled?: boolean;
  metricsPath?: string;
  tracingEnabled?: boolean;
  tracingProvider?: string;
  tracingSampleRate?: number;
  websocketEnabled?: boolean;
  websocketTimeout?: string;
  requestHeadersAdd?: string[];
  requestHeadersRemove?: string[];
  responseHeadersAdd?: string[];
  responseHeadersRemove?: string[];
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  serviceMeshEnabled?: boolean;
  serviceMeshProvider?: string;
  companyId: string;
  userId: string;
  environmentVariables?: EnvironmentVariable[];
  configMaps?: ConfigMap[];
  secrets?: Secret[];
  translatesTo?: Graph;
  spec?: JSON;
}

export interface KubernetesCluster {
  id: ID;
  name: string;
  provider?: string;
  region?: string;
  type?: KubernetesClusterType;
  version?: string;
  metadata?: string;
  companyId: string;
  userId: string;
  nodes?: Graph[];
  spec?: JSON;
}

// ============================================================================
// Core Graph Types
// ============================================================================

export interface GraphNode {
  id: ID;
  name: string;
  companyId: string;
  userId: string;
  nodeType: GraphNodeType;
  dependencyType?: DependencyType;
  microservice?: Microservice;
  database?: Database;
  cache?: Cache;
  messageQueue?: MessageQueue;
  proxy?: Proxy;
  loadBalancer?: LoadBalancer;
  monitoring?: Monitoring;
  gateway?: Gateway;
  namespace?: string;
  createdAt?: DateTime;
  updatedAt?: DateTime;
  orginalNodeName?: string;
  orginalNodeId?: string;
  orginalNodeType?: string;
  edges?: Edge[];
  spec?: JSON;
  config?: YAML;
  embedding?: number[];
}

export interface Graph {
  id: ID;
  name: string;
  description?: string;
  createdAt?: DateTime;
  updatedAt?: DateTime;
  graphType: GraphType;
  namespace?: string;
  contextEmbedding?: number[];
  nodes?: GraphNode[];
  bridges?: GraphBridge[];
  cluster?: KubernetesCluster;
  subgraphs?: Graph[];
  parent?: Graph;
  userId: string;
  companyId: string;
}

// ============================================================================
// Input Types for Mutations
// ============================================================================

export interface NodeInput {
  name: string;
  companyId: string;
  userId: string;
  nodeType?: string;
  dependencyType?: DependencyType;
  microservice?: MicroserviceInput;
  database?: DatabaseInput;
  cache?: CacheInput;
  messageQueue?: MessageQueueInput;
  proxy?: ProxyInput;
  loadBalancer?: LoadBalancerInput;
  monitoring?: MonitoringInput;
  gateway?: GatewayInput;
  namespace?: string;
  createdAt?: DateTime;
  updatedAt?: DateTime;
  edges?: EdgeInput[];
  spec?: JSON;
  id?: ID;
  label?: string;
  iconSrc?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  type?: string;
}

export interface GraphInput {
  name: string;
  userId: string;
  companyId: string;
  id?: string;
  description?: string;
  graphType?: GraphType;
  nodes?: NodeInput[];
  bridges?: GraphBridgeInput[];
  clusterId?: string;
  subgraphs?: GraphInput[];
  parent?: GraphInput;
}

export interface MicroserviceInput {
  id?: ID;
  graphId?: string;
  name?: string;
  namespace?: string;
  language?: string;
  framework?: string;
  version?: string;
  category?: string;
  repository?: string;
  baseImage?: string;
  image?: string;
  dependencies?: string[];
  environmentVariables?: EnvironmentVariableInput[];
  configMaps?: ConfigMapInput[];
  secrets?: SecretInput[];
  ports?: number[];
  scripts?: ScriptInput[];
  spec?: JSON;
}

export interface DatabaseInput {
  id?: ID;
  graphId?: string;
  kind?: string;
  url?: string;
  name?: string;
  namespace?: string;
  engine?: string;
  version?: string;
  host?: string;
  port?: number;
  databaseName?: string;
  username?: string;
  connectionString?: string;
  maxConnections?: number;
  storageSize?: string;
  storageClass?: string;
  replicationEnabled?: boolean;
  replicaCount?: number;
  backupEnabled?: boolean;
  backupSchedule?: string;
  sslEnabled?: boolean;
  charset?: string;
  collation?: string;
  environmentVariables?: EnvironmentVariableInput[];
  configMaps?: ConfigMapInput[];
  secrets?: SecretInput[];
  spec?: JSON;
}

export interface CacheInput {
  id?: ID;
  graphId?: string;
  kind?: string;
  url?: string;
  name?: string;
  namespace?: string;
  engine?: string;
  version?: string;
  host?: string;
  port?: number;
  clusterMode?: boolean;
  replicaCount?: number;
  maxMemory?: string;
  evictionPolicy?: string;
  persistenceEnabled?: boolean;
  persistenceStrategy?: string;
  password?: string;
  tlsEnabled?: boolean;
  sentinelEnabled?: boolean;
  sentinelHosts?: string[];
  environmentVariables?: EnvironmentVariableInput[];
  configMaps?: ConfigMapInput[];
  secrets?: SecretInput[];
  spec?: JSON;
}

export interface MessageQueueInput {
  id?: ID;
  graphId?: string;
  kind?: string;
  url?: string;
  name?: string;
  namespace?: string;
  engine?: string;
  version?: string;
  host?: string;
  port?: number;
  protocol?: string;
  topics?: string[];
  queues?: string[];
  exchanges?: string[];
  clusterMode?: boolean;
  replicaCount?: number;
  partitions?: number;
  replicationFactor?: number;
  retentionPeriod?: string;
  maxMessageSize?: string;
  dlqEnabled?: boolean;
  dlqName?: string;
  tlsEnabled?: boolean;
  authEnabled?: boolean;
  environmentVariables?: EnvironmentVariableInput[];
  configMaps?: ConfigMapInput[];
  secrets?: SecretInput[];
  spec?: JSON;
}

export interface ProxyInput {
  id?: ID;
  graphId?: string;
  kind?: string;
  url?: string;
  name?: string;
  namespace?: string;
  proxyType?: string;
  version?: string;
  host?: string;
  port?: number;
  protocol?: string;
  upstreams?: string[];
  tlsEnabled?: boolean;
  tlsCertificate?: string;
  tlsKey?: string;
  rateLimitEnabled?: boolean;
  rateLimitRequests?: number;
  rateLimitPeriod?: string;
  timeoutConnect?: string;
  timeoutRead?: string;
  timeoutWrite?: string;
  retries?: number;
  healthCheckEnabled?: boolean;
  healthCheckPath?: string;
  healthCheckInterval?: string;
  compressionEnabled?: boolean;
  cachingEnabled?: boolean;
  environmentVariables?: EnvironmentVariableInput[];
  configMaps?: ConfigMapInput[];
  secrets?: SecretInput[];
  spec?: JSON;
}

export interface LoadBalancerInput {
  id?: ID;
  graphId?: string;
  kind?: string;
  url?: string;
  name?: string;
  namespace?: string;
  loadBalancerType?: string;
  version?: string;
  host?: string;
  port?: number;
  protocol?: string;
  backends?: string[];
  algorithm?: string;
  healthCheckEnabled?: boolean;
  healthCheckPath?: string;
  healthCheckInterval?: string;
  healthCheckTimeout?: string;
  healthCheckHealthyThreshold?: number;
  healthCheckUnhealthyThreshold?: number;
  stickySessionEnabled?: boolean;
  stickySessionCookie?: string;
  stickySessionDuration?: string;
  tlsEnabled?: boolean;
  tlsCertificate?: string;
  tlsKey?: string;
  crossZoneEnabled?: boolean;
  idleTimeout?: string;
  connectionDrainingEnabled?: boolean;
  connectionDrainingTimeout?: string;
  environmentVariables?: EnvironmentVariableInput[];
  configMaps?: ConfigMapInput[];
  secrets?: SecretInput[];
  spec?: JSON;
}

export interface MonitoringInput {
  id?: ID;
  graphId?: string;
  kind?: string;
  url?: string;
  name?: string;
  namespace?: string;
  monitoringType?: string;
  version?: string;
  host?: string;
  port?: number;
  scrapeInterval?: string;
  scrapeTimeout?: string;
  retentionPeriod?: string;
  storageSize?: string;
  metrics?: string[];
  dashboards?: string[];
  alertRules?: string[];
  alertmanagerEnabled?: boolean;
  alertmanagerUrl?: string;
  exporters?: string[];
  serviceMonitors?: string[];
  remoteWriteEnabled?: boolean;
  remoteWriteUrl?: string;
  tlsEnabled?: boolean;
  authEnabled?: boolean;
  environmentVariables?: EnvironmentVariableInput[];
  configMaps?: ConfigMapInput[];
  secrets?: SecretInput[];
  spec?: JSON;
}

export interface GatewayInput {
  id?: ID;
  graphId?: string;
  name?: string;
  kind?: string;
  url?: string;
  namespace?: string;
  gatewayType?: string;
  version?: string;
  host?: string;
  port?: number;
  protocol?: string;
  routes?: string[];
  upstreams?: string[];
  domains?: string[];
  basePath?: string;
  tlsEnabled?: boolean;
  tlsCertificate?: string;
  tlsKey?: string;
  tlsMinVersion?: string;
  authEnabled?: boolean;
  authType?: string;
  corsEnabled?: boolean;
  corsOrigins?: string[];
  corsMethods?: string[];
  corsHeaders?: string[];
  rateLimitEnabled?: boolean;
  rateLimitRequests?: number;
  rateLimitPeriod?: string;
  rateLimitBurstSize?: number;
  timeoutConnect?: string;
  timeoutRead?: string;
  timeoutWrite?: string;
  timeoutIdle?: string;
  loadBalancingAlgorithm?: string;
  healthCheckEnabled?: boolean;
  healthCheckPath?: string;
  healthCheckInterval?: string;
  healthCheckTimeout?: string;
  healthCheckHealthyThreshold?: number;
  healthCheckUnhealthyThreshold?: number;
  circuitBreakerEnabled?: boolean;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: string;
  retries?: number;
  retryTimeout?: string;
  retryBackoff?: string;
  cachingEnabled?: boolean;
  cacheSize?: string;
  cacheTTL?: string;
  compressionEnabled?: boolean;
  compressionLevel?: number;
  compressionTypes?: string[];
  accessLogEnabled?: boolean;
  accessLogFormat?: string;
  metricsEnabled?: boolean;
  metricsPath?: string;
  tracingEnabled?: boolean;
  tracingProvider?: string;
  tracingSampleRate?: number;
  websocketEnabled?: boolean;
  websocketTimeout?: string;
  requestHeadersAdd?: string[];
  requestHeadersRemove?: string[];
  responseHeadersAdd?: string[];
  responseHeadersRemove?: string[];
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  serviceMeshEnabled?: boolean;
  serviceMeshProvider?: string;
  environmentVariables?: EnvironmentVariableInput[];
  configMaps?: ConfigMapInput[];
  secrets?: SecretInput[];
  spec?: JSON;
}

export interface CreateGraphInput {
  name: string;
  companyId: string;
  userId: string;
  description?: string;
  graphType: GraphType;
  namespace?: string;
  nodes?: NodeInput[];
  bridges?: GraphBridgeInput[];
  clusterId?: string;
}

export interface UpdateGraphInput {
  id: string;
  name?: string;
  description?: string;
  graphType?: GraphType;
  namespace?: string;
  nodes?: NodeInput[];
  bridges?: GraphBridgeInput[];
}

export interface CreateMicroserviceInput {
  name: string;
  companyId: string;
  userId: string;
  graphId?: string;
  namespace?: string;
  language?: string;
  framework?: string;
  version?: string;
  category?: string;
  repository?: string;
  baseImage?: string;
  image?: string;
  dependencies?: string[];
  environmentVariables?: EnvironmentVariableInput[];
  configMaps?: ConfigMapInput[];
  secrets?: SecretInput[];
  ports?: number[];
  scripts?: ScriptInput[];
  spec?: JSON;
}

export interface UpdateMicroserviceInput {
  id: string;
  companyId: string;
  userId: string;
  name?: string;
  graphId?: string;
  namespace?: string;
  language?: string;
  framework?: string;
  version?: string;
  category?: string;
  repository?: string;
  baseImage?: string;
  image?: string;
  dependencies?: string[];
  environmentVariables?: EnvironmentVariableInput[];
  configMaps?: ConfigMapInput[];
  secrets?: SecretInput[];
  ports?: number[];
  scripts?: ScriptInput[];
  spec?: JSON;
}

export interface GraphMetadataInput {
  data?: JSON;
}

export interface CreateKubernetesClusterInput {
  metadata?: JSON;
  name: string;
  provider?: string;
  region?: string;
  type?: KubernetesClusterType;
  version?: string;
  companyId: string;
  userId: string;
}

export interface CreateKubernetesGraphInput {
  description?: string;
  clusterId: string;
  name: string;
  tags?: string[];
  version?: string;
  companyId: string;
  userId: string;
}

export interface UpdateKubernetesClusterInput {
  id: string;
  name?: string;
  provider?: string;
  region?: string;
  type?: KubernetesClusterType;
  version?: string;
  metadata?: JSON;
}

export interface UpdateKubernetesGraphInput {
  description?: string;
  kubernetesCluster?: UpdateKubernetesClusterInput;
  metadata?: GraphMetadataInput;
  name?: string;
  tags?: string[];
  version?: string;
  id: string;
  userId?: string;
  companyId?: string;
}
