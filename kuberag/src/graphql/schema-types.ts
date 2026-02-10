import type {
  Graph,
  GraphNode,
  Edge,
  GraphBridge,
  Microservice,
  Database,
  Cache,
  MessageQueue,
  Proxy,
  LoadBalancer,
  Monitoring,
  Gateway,
  KubernetesCluster,
  EnvironmentVariable,
  ConfigMap,
  Secret,
  Script,
  ScriptResult,
  EnvironmentVariableInput,
  ConfigMapInput,
  SecretInput,
  ScriptInput,
  EdgeInput,
  GraphBridgeInput,
  NodeInput,
  GraphInput,
  MicroserviceInput,
  DatabaseInput,
  CacheInput,
  MessageQueueInput,
  ProxyInput,
  LoadBalancerInput,
  MonitoringInput,
  GatewayInput,
  CreateGraphInput,
  UpdateGraphInput,
  CreateMicroserviceInput,
  UpdateMicroserviceInput,
  GraphMetadataInput,
  CreateKubernetesClusterInput,
  CreateKubernetesGraphInput,
  UpdateKubernetesClusterInput,
  UpdateKubernetesGraphInput,
} from '../types/graph';
import type {
  GeneratedCodeNode,
  GeneratedCodeGraph,
  GeneratedCodeMetadata,
  JobStatus,
  GraphValidation,
  ConnectionValidation,
  GraphConnectionSuggestion,
  Suggestion,
  JobStatusInput,
  LLMConfigInput,
  GenerateCodeInput,
  GeneratedCodeNodeInput,
  GeneratedCodeGraphInput,
  DeployInfrastructureInput,
  ValidateConnectionInput,
} from '../types/codegen';
import type { PlanJobStatus } from '../services/plan-service';
import type { PlanResult } from './types/plan';
import type {
  GraphNodeType,
  DependencyType,
  GraphType,
  ConnectionType,
  KubernetesClusterType,
  DeploymentStrategy,
  ModelProvider,
  JobStatusStatus,
} from '../types/enums';

export interface AppSchemaTypes extends PothosSchemaTypes.UserSchemaTypes {
  Defaults: 'v4';
  Scalars: {
    JSON: { Input: Record<string, any>; Output: Record<string, any> };
    DateTime: { Input: Date; Output: Date };
    YAML: { Input: string; Output: string };
    ID: { Input: string; Output: string };
  };
  Objects: {
    Graph: Graph;
    GraphNode: GraphNode;
    Edge: Edge;
    GraphBridge: GraphBridge;
    Microservice: Microservice;
    Database: Database;
    Cache: Cache;
    MessageQueue: MessageQueue;
    Proxy: Proxy;
    LoadBalancer: LoadBalancer;
    Monitoring: Monitoring;
    Gateway: Gateway;
    KubernetesCluster: KubernetesCluster;
    EnvironmentVariable: EnvironmentVariable;
    ConfigMap: ConfigMap;
    Secret: Secret;
    Script: Script;
    ScriptResult: ScriptResult;
    JobStatus: JobStatus;
    GeneratedCodeNode: GeneratedCodeNode;
    GeneratedCodeGraph: GeneratedCodeGraph;
    GeneratedCodeMetadata: GeneratedCodeMetadata;
    GraphValidation: GraphValidation;
    ConnectionValidation: ConnectionValidation;
    GraphConnectionSuggestion: GraphConnectionSuggestion;
    Suggestion: Suggestion;
    PlanJobStatus: PlanJobStatus;
    PlanResult: PlanResult;
  };
  Inputs: {
    EnvironmentVariableInput: EnvironmentVariableInput;
    ConfigMapInput: ConfigMapInput;
    SecretInput: SecretInput;
    ScriptInput: ScriptInput;
    EdgeInput: EdgeInput;
    GraphBridgeInput: GraphBridgeInput;
    NodeInput: NodeInput;
    GraphInput: GraphInput;
    MicroserviceInput: MicroserviceInput;
    DatabaseInput: DatabaseInput;
    CacheInput: CacheInput;
    MessageQueueInput: MessageQueueInput;
    ProxyInput: ProxyInput;
    LoadBalancerInput: LoadBalancerInput;
    MonitoringInput: MonitoringInput;
    GatewayInput: GatewayInput;
    CreateGraphInput: CreateGraphInput;
    UpdateGraphInput: UpdateGraphInput;
    CreateMicroserviceInput: CreateMicroserviceInput;
    UpdateMicroserviceInput: UpdateMicroserviceInput;
    GraphMetadataInput: GraphMetadataInput;
    CreateKubernetesClusterInput: CreateKubernetesClusterInput;
    CreateKubernetesGraphInput: CreateKubernetesGraphInput;
    UpdateKubernetesClusterInput: UpdateKubernetesClusterInput;
    UpdateKubernetesGraphInput: UpdateKubernetesGraphInput;
    JobStatusInput: JobStatusInput;
    LLMConfigInput: LLMConfigInput;
    GenerateCodeInput: GenerateCodeInput;
    GeneratedCodeNodeInput: GeneratedCodeNodeInput;
    GeneratedCodeGraphInput: GeneratedCodeGraphInput;
    DeployInfrastructureInput: DeployInfrastructureInput;
    ValidateConnectionInput: ValidateConnectionInput;
  };
  Enums: {
    GraphNodeType: GraphNodeType;
    DependencyType: DependencyType;
    GraphType: GraphType;
    ConnectionType: ConnectionType;
    KubernetesClusterType: KubernetesClusterType;
    DeploymentStrategy: DeploymentStrategy;
    ModelProvider: ModelProvider;
    JobStatusStatus: JobStatusStatus;
  };
  Root: object;
  Context: object;
  DefaultFieldNullability: true;
  DefaultInputFieldRequiredness: false;
  InferredFieldOptionsKind: 'Resolve';
}
