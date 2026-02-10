/**
 * Types for code generation workflow and job status
 * Source: kuberag-old/api/graphql/schema.graphql
 */

import {
  GraphNode,
  Graph,
  GraphInput,
  Microservice,
  Database,
  Cache,
  MessageQueue,
  Proxy,
  LoadBalancer,
  Monitoring,
  Gateway,
  YAML,
  JSON,
  DateTime,
  ID,
  Script,
  ScriptInput,
  Edge,
} from './graph';
import { GraphNodeType, DependencyType, ModelProvider, ConnectionType, GraphType, JobStatusStatus } from './enums';

// ============================================================================
// Code Generation Types
// ============================================================================

export interface GeneratedCodeMetadata {
  fileName: string;
  path: string;
}

export interface GeneratedCodeNode {
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
  originalNodeName?: string;
  originalNodeId?: string;
  originalNodeType?: string;
  edges?: Edge[];
  spec?: JSON;
  config?: YAML;
  generatedCodeMetadata: GeneratedCodeMetadata;
  command?: Script;
}

export interface GeneratedCodeGraph {
  totalFiles: number;
  namespace: string;
  graphId: string;
  originalGraphId: string;
  nodes: GeneratedCodeNode[];
}

// ============================================================================
// Job Status and Workflow Types
// ============================================================================

export interface JobStatus {
  jobId: string;
  step: string;
  status: JobStatusStatus;
}

export interface JobStatusInput {
  jobId: string;
}

// ============================================================================
// Input Types for Code Generation
// ============================================================================

export interface LLMConfigInput {
  provider?: ModelProvider;
  model?: string;
}

export interface GenerateCodeInput {
  graph: GraphInput;
  llmConfig?: LLMConfigInput;
}

export interface GeneratedCodeNodeInput {
  name: string;
  nodeType: GraphNodeType;
  config?: YAML;
  id?: string;
  companyId?: string;
  userId?: string;
  namespace?: string;
  spec?: JSON;
  originalNodeName?: string;
  originalNodeId?: string;
  originalNodeType?: string;
  command?: ScriptInput;
}

export interface GeneratedCodeGraphInput {
  totalFiles: number;
  namespace: string;
  graphId: string;
  originalGraphId: string;
  nodes?: GeneratedCodeNodeInput[];
}

export interface DeployInfrastructureInput {
  graph: GeneratedCodeGraphInput;
}

// ============================================================================
// Validation and Suggestion Types
// ============================================================================

export interface GraphValidation {
  isValid: boolean;
  suggestedGraph: Graph;
}

export interface ConnectionValidation {
  isValid: boolean;
  suggestion: ConnectionType;
}

export interface GraphConnectionSuggestion {
  sourceId: string;
  sourceType: GraphNodeType;
  suggestions: Suggestion[];
}

export interface Suggestion {
  targetType: GraphNodeType;
  targetConnectionType: ConnectionType;
}

export interface ValidateConnectionInput {
  sourceId: ID;
  targetId: ID;
  connectionType?: ConnectionType;
}

export interface InitializePlanInput {
  graph: GraphInput;
  userRequest?: string;
  modelProvider?: string;
  modelName?: string;
}
