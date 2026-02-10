/**
 * All enum types ported from the GraphQL schema
 * Source: kuberag-old/api/graphql/schema.graphql
 */

// Graph Node type - represents all possible node types in the infrastructure graph
export enum GraphNodeType {
  // Kubernetes Core Resources
  POD = 'POD',
  SERVICE = 'SERVICE',
  DEPLOYMENT = 'DEPLOYMENT',
  STATEFULSET = 'STATEFULSET',
  DAEMONSET = 'DAEMONSET',
  REPLICASET = 'REPLICASET',
  JOB = 'JOB',
  CRONJOB = 'CRONJOB',
  
  // Kubernetes Configuration & Storage
  CONFIGMAP = 'CONFIGMAP',
  SECRET = 'SECRET',
  PERSISTENTVOLUME = 'PERSISTENTVOLUME',
  PERSISTENTVOLUMECLAIM = 'PERSISTENTVOLUMECLAIM',
  STORAGECLASS = 'STORAGECLASS',
  VOLUME = 'VOLUME',
  
  // Kubernetes Networking
  INGRESS = 'INGRESS',
  NETWORKPOLICY = 'NETWORKPOLICY',
  ENDPOINT = 'ENDPOINT',
  
  // Kubernetes RBAC & Security
  SERVICEACCOUNT = 'SERVICEACCOUNT',
  ROLE = 'ROLE',
  ROLEBINDING = 'ROLEBINDING',
  CLUSTERROLE = 'CLUSTERROLE',
  CLUSTERROLEBINDING = 'CLUSTERROLEBINDING',
  PODSECURITYPOLICY = 'PODSECURITYPOLICY',
  
  // Kubernetes Cluster Resources
  NAMESPACE = 'NAMESPACE',
  NODE = 'NODE',
  PRIORITYCLASS = 'PRIORITYCLASS',
  RESOURCEQUOTA = 'RESOURCEQUOTA',
  LIMITRANGE = 'LIMITRANGE',
  
  // Kubernetes Autoscaling
  HORIZONTALPODAUTOSCALER = 'HORIZONTALPODAUTOSCALER',
  VERTICALPODAUTOSCALER = 'VERTICALPODAUTOSCALER',
  PODDISRUPTIONBUDGET = 'PODDISRUPTIONBUDGET',
  
  // Kubernetes Custom Resources
  CUSTOMRESOURCEDEFINITION = 'CUSTOMRESOURCEDEFINITION',
  
  // Application & Infrastructure Types
  MICROSERVICE = 'MICROSERVICE',
  EXTERNAL_DEPENDENCY = 'EXTERNAL_DEPENDENCY',
  
  // Infrastructure Components
  DATABASE = 'DATABASE',
  CACHE = 'CACHE',
  MESSAGE_QUEUE = 'MESSAGE_QUEUE',
  PROXY = 'PROXY',
  LOAD_BALANCER = 'LOAD_BALANCER',
  GATEWAY = 'GATEWAY',
  
  // Monitoring
  MONITORING = 'MONITORING',
  
  // Utility Types
  CONFIG = 'CONFIG',
  COMMAND = 'COMMAND',
  DEBUGGING = 'DEBUGGING',
}

// Dependency type for infrastructure components
export enum DependencyType {
  DATABASE = 'DATABASE',
  CACHE = 'CACHE',
  MESSAGE_QUEUE = 'MESSAGE_QUEUE',
  PROXY = 'PROXY',
  LOAD_BALANCER = 'LOAD_BALANCER',
}

// Graph type - represents the overall type of the graph
export enum GraphType {
  KUBERNETES = 'KUBERNETES',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  ABSTRACT = 'ABSTRACT',
  DEBUGGING = 'DEBUGGING',
  MICROSERVICE = 'MICROSERVICE',
}

// Connection types between resources - represents all possible relationships
export enum ConnectionType {
  ALLOWS_TRAFFIC = 'ALLOWS_TRAFFIC',
  AUTHENTICATES = 'AUTHENTICATES',
  AUTHORIZES = 'AUTHORIZES',
  BACKS_UP = 'BACKS_UP',
  BACKS_UP_TO = 'BACKS_UP_TO',
  BELONGS_TO = 'BELONGS_TO',
  BINDS = 'BINDS',
  BLOCKS_TRAFFIC = 'BLOCKS_TRAFFIC',
  BRIDGES = 'BRIDGES',
  CACHES = 'CACHES',
  CLAIMS = 'CLAIMS',
  COMPRESSES = 'COMPRESSES',
  CONFIGURES = 'CONFIGURES',
  CONNECTS_TO = 'CONNECTS_TO',
  CUSTOM = 'CUSTOM',
  DEPENDS_ON = 'DEPENDS_ON',
  DEPENDS_ON_GRAPH = 'DEPENDS_ON_GRAPH',
  DEPLOYS_TO = 'DEPLOYS_TO',
  DISCOVERS = 'DISCOVERS',
  EGRESS_FROM = 'EGRESS_FROM',
  ENCRYPTS = 'ENCRYPTS',
  EXTENDS = 'EXTENDS',
  FAILS_OVER_TO = 'FAILS_OVER_TO',
  FROM = 'FROM',
  HAS = 'HAS',
  INGRESS_TO = 'INGRESS_TO',
  INHERITS_FROM = 'INHERITS_FROM',
  ISOLATES = 'ISOLATES',
  LIMITS = 'LIMITS',
  LOAD_BALANCES = 'LOAD_BALANCES',
  LOGS_TO = 'LOGS_TO',
  MANAGES = 'MANAGES',
  MANAGED_BY = 'MANAGED_BY',
  MESH_AUTHORIZES = 'MESH_AUTHORIZES',
  MESH_CIRCUIT_BREAKER = 'MESH_CIRCUIT_BREAKER',
  MESH_CONNECTS = 'MESH_CONNECTS',
  MESH_MIRRORS = 'MESH_MIRRORS',
  MESH_RETRIES = 'MESH_RETRIES',
  MESH_SPLITS_TRAFFIC = 'MESH_SPLITS_TRAFFIC',
  MESH_TIMEOUTS = 'MESH_TIMEOUTS',
  METRICS_TO = 'METRICS_TO',
  MONITORS = 'MONITORS',
  MOUNTS = 'MOUNTS',
  OPTIONAL_FOR = 'OPTIONAL_FOR',
  QUOTAS = 'QUOTAS',
  RATE_LIMITS = 'RATE_LIMITS',
  REGISTERS = 'REGISTERS',
  REPLICATES = 'REPLICATES',
  REQUESTS = 'REQUESTS',
  REQUIRES = 'REQUIRES',
  RESOLVES = 'RESOLVES',
  RESTORES_FROM = 'RESTORES_FROM',
  ROLLS_BACK = 'ROLLS_BACK',
  ROUTES_TO = 'ROUTES_TO',
  SERVICE_EXPOSES_POD = 'SERVICE_EXPOSES_POD',
  SCALES = 'SCALES',
  SIGNS = 'SIGNS',
  SYNC = 'SYNC',
  SYNCHRONIZES_WITH = 'SYNCHRONIZES_WITH',
  POD_RUNS_ON_NODE = 'POD_RUNS_ON_NODE',
  INGRESS_ROUTES_TO_SERVICE = 'INGRESS_ROUTES_TO_SERVICE',
  MICROSERVICE_DEPENDS_ON = 'MICROSERVICE_DEPENDS_ON',
  MICROSERVICE_CALLS = 'MICROSERVICE_CALLS',
  MICROSERVICE_PUBLISHES_TO = 'MICROSERVICE_PUBLISHES_TO',
  MICROSERVICE_SUBSCRIBES_TO = 'MICROSERVICE_SUBSCRIBES_TO',
  TRACES_TO = 'TRACES_TO',
  TRANSLATES_TO = 'TRANSLATES_TO',
  UPDATES = 'UPDATES',
  
  // Similarity
  SIMILAR_TO = 'SIMILAR_TO',
}

// Kubernetes cluster types
export enum KubernetesClusterType {
  HYBRID = 'HYBRID',
  MANAGED = 'MANAGED',
  SELF_HOSTED = 'SELF_HOSTED',
}

// Deployment strategies
export enum DeploymentStrategy {
  A_B_TESTING = 'A_B_TESTING',
  BLUE_GREEN = 'BLUE_GREEN',
  CANARY = 'CANARY',
  RECREATE = 'RECREATE',
  ROLLING_UPDATE = 'ROLLING_UPDATE',
}

// Job status values for background workflows
export enum JobStatusStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Model providers for LLM integration
export enum ModelProvider {
  claude = 'claude',
  gemma = 'gemma',
  deepseek = 'deepseek',
  openai = 'openai',
  google = 'google',
}

// Model names for each provider
export enum ModelName {
  // Claude
  CLAUDE_SONNET = 'claude-4-5-sonnet-latest',
  CLAUDE_HAIKU = 'claude-haiku-4-5-20251001',
  CLAUDE_OPUS = 'claude-opus-4-6',
  // OpenAI
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  // Google
  GEMINI_FLASH = 'gemini-2.0-flash',
  GEMINI_PRO = 'gemini-2.0-pro',
  // DeepSeek
  DEEPSEEK_CHAT = 'deepseek-chat',
  DEEPSEEK_REASONER = 'deepseek-reasoner',
  // Ollama/Gemma
  GEMMA_9B = 'gemma2:9b-instruct',
}

// Valid models per provider
export const VALID_MODELS: Record<ModelProvider, ModelName[]> = {
  [ModelProvider.claude]: [ModelName.CLAUDE_SONNET, ModelName.CLAUDE_HAIKU, ModelName.CLAUDE_OPUS],
  [ModelProvider.openai]: [ModelName.GPT_4O, ModelName.GPT_4O_MINI],
  [ModelProvider.google]: [ModelName.GEMINI_FLASH, ModelName.GEMINI_PRO],
  [ModelProvider.deepseek]: [ModelName.DEEPSEEK_CHAT, ModelName.DEEPSEEK_REASONER],
  [ModelProvider.gemma]: [ModelName.GEMMA_9B],
};

// Default model per provider
export const DEFAULT_MODEL: Record<ModelProvider, ModelName> = {
  [ModelProvider.claude]: ModelName.CLAUDE_SONNET,
  [ModelProvider.openai]: ModelName.GPT_4O_MINI,
  [ModelProvider.google]: ModelName.GEMINI_FLASH,
  [ModelProvider.deepseek]: ModelName.DEEPSEEK_CHAT,
  [ModelProvider.gemma]: ModelName.GEMMA_9B,
};

// Type exports for easy importing
export type GraphNodeTypeType = keyof typeof GraphNodeType;
export type DependencyTypeType = keyof typeof DependencyType;
export type GraphTypeType = keyof typeof GraphType;
export type ConnectionTypeType = keyof typeof ConnectionType;
export type KubernetesClusterTypeType = keyof typeof KubernetesClusterType;
export type DeploymentStrategyType = keyof typeof DeploymentStrategy;
export type ModelProviderType = keyof typeof ModelProvider;
export type ModelNameType = keyof typeof ModelName;
