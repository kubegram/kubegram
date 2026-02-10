/**
 * Pothos input type registrations for all GraphQL input types
 */

import type { SchemaBuilder } from '../schema';
import {
  ConnectionTypeEnum,
  DependencyTypeEnum,
  GraphNodeTypeEnum,
  GraphTypeEnum,
  KubernetesClusterTypeEnum,
  ModelProviderEnum,
  ModelNameEnum,
} from './enums';

export function registerInputTypes(builder: SchemaBuilder) {
  // EnvironmentVariableInput
  const EnvironmentVariableInput = builder.inputType('EnvironmentVariableInput', {
    fields: (t) => ({
      name: t.string({ required: true }),
      value: t.string({ required: true }),
    }),
  });

  // ConfigMapInput
  const ConfigMapInput = builder.inputType('ConfigMapInput', {
    fields: (t) => ({
      name: t.string({ required: true }),
      key: t.string(),
      value: t.string(),
    }),
  });

  // SecretInput
  const SecretInput = builder.inputType('SecretInput', {
    fields: (t) => ({
      name: t.string({ required: true }),
      key: t.string(),
      value: t.string(),
      encryptionPublicKey: t.string({ required: true }),
    }),
  });

  // ScriptInput
  const ScriptInput = builder.inputType('ScriptInput', {
    fields: (t) => ({
      name: t.string({ required: true }),
      command: t.string({ required: true }),
    }),
  });

  // MicroserviceInput
  builder.inputType('MicroserviceInput', {
    fields: (t) => ({
      id: t.id(),
      graphId: t.string(),
      name: t.string(),
      namespace: t.string(),
      language: t.string(),
      framework: t.string(),
      version: t.string(),
      category: t.string(),
      repository: t.string(),
      baseImage: t.string(),
      image: t.string(),
      dependencies: t.stringList(),
      environmentVariables: t.field({ type: [EnvironmentVariableInput] }),
      configMaps: t.field({ type: [ConfigMapInput] }),
      secrets: t.field({ type: [SecretInput] }),
      ports: t.intList(),
      scripts: t.field({ type: [ScriptInput] }),
      spec: t.field({ type: 'JSON' }),
    }),
  });

  // DatabaseInput
  builder.inputType('DatabaseInput', {
    fields: (t) => ({
      id: t.id(),
      graphId: t.string(),
      kind: t.string(),
      url: t.string(),
      name: t.string(),
      namespace: t.string(),
      engine: t.string(),
      version: t.string(),
      host: t.string(),
      port: t.int(),
      databaseName: t.string(),
      username: t.string(),
      connectionString: t.string(),
      maxConnections: t.int(),
      storageSize: t.string(),
      storageClass: t.string(),
      replicationEnabled: t.boolean(),
      replicaCount: t.int(),
      backupEnabled: t.boolean(),
      backupSchedule: t.string(),
      sslEnabled: t.boolean(),
      charset: t.string(),
      collation: t.string(),
      environmentVariables: t.field({ type: [EnvironmentVariableInput] }),
      configMaps: t.field({ type: [ConfigMapInput] }),
      secrets: t.field({ type: [SecretInput] }),
      spec: t.field({ type: 'JSON' }),
    }),
  });

  // CacheInput
  builder.inputType('CacheInput', {
    fields: (t) => ({
      id: t.id(),
      graphId: t.string(),
      kind: t.string(),
      url: t.string(),
      name: t.string(),
      namespace: t.string(),
      engine: t.string(),
      version: t.string(),
      host: t.string(),
      port: t.int(),
      clusterMode: t.boolean(),
      replicaCount: t.int(),
      maxMemory: t.string(),
      evictionPolicy: t.string(),
      persistenceEnabled: t.boolean(),
      persistenceStrategy: t.string(),
      password: t.string(),
      tlsEnabled: t.boolean(),
      sentinelEnabled: t.boolean(),
      sentinelHosts: t.stringList(),
      environmentVariables: t.field({ type: [EnvironmentVariableInput] }),
      configMaps: t.field({ type: [ConfigMapInput] }),
      secrets: t.field({ type: [SecretInput] }),
      spec: t.field({ type: 'JSON' }),
    }),
  });

  // MessageQueueInput
  builder.inputType('MessageQueueInput', {
    fields: (t) => ({
      id: t.id(),
      graphId: t.string(),
      kind: t.string(),
      url: t.string(),
      name: t.string(),
      namespace: t.string(),
      engine: t.string(),
      version: t.string(),
      host: t.string(),
      port: t.int(),
      protocol: t.string(),
      topics: t.stringList(),
      queues: t.stringList(),
      exchanges: t.stringList(),
      clusterMode: t.boolean(),
      replicaCount: t.int(),
      partitions: t.int(),
      replicationFactor: t.int(),
      retentionPeriod: t.string(),
      maxMessageSize: t.string(),
      dlqEnabled: t.boolean(),
      dlqName: t.string(),
      tlsEnabled: t.boolean(),
      authEnabled: t.boolean(),
      environmentVariables: t.field({ type: [EnvironmentVariableInput] }),
      configMaps: t.field({ type: [ConfigMapInput] }),
      secrets: t.field({ type: [SecretInput] }),
      spec: t.field({ type: 'JSON' }),
    }),
  });

  // ProxyInput
  builder.inputType('ProxyInput', {
    fields: (t) => ({
      id: t.id(),
      graphId: t.string(),
      kind: t.string(),
      url: t.string(),
      name: t.string(),
      namespace: t.string(),
      proxyType: t.string(),
      version: t.string(),
      host: t.string(),
      port: t.int(),
      protocol: t.string(),
      upstreams: t.stringList(),
      tlsEnabled: t.boolean(),
      rateLimitEnabled: t.boolean(),
      rateLimitRequests: t.int(),
      rateLimitPeriod: t.string(),
      healthCheckEnabled: t.boolean(),
      healthCheckPath: t.string(),
      healthCheckInterval: t.string(),
      compressionEnabled: t.boolean(),
      cachingEnabled: t.boolean(),
      environmentVariables: t.field({ type: [EnvironmentVariableInput] }),
      configMaps: t.field({ type: [ConfigMapInput] }),
      secrets: t.field({ type: [SecretInput] }),
      spec: t.field({ type: 'JSON' }),
    }),
  });

  // LoadBalancerInput
  builder.inputType('LoadBalancerInput', {
    fields: (t) => ({
      id: t.id(),
      graphId: t.string(),
      kind: t.string(),
      url: t.string(),
      name: t.string(),
      namespace: t.string(),
      loadBalancerType: t.string(),
      version: t.string(),
      host: t.string(),
      port: t.int(),
      protocol: t.string(),
      backends: t.stringList(),
      algorithm: t.string(),
      healthCheckEnabled: t.boolean(),
      healthCheckPath: t.string(),
      stickySessionEnabled: t.boolean(),
      tlsEnabled: t.boolean(),
      crossZoneEnabled: t.boolean(),
      connectionDrainingEnabled: t.boolean(),
      environmentVariables: t.field({ type: [EnvironmentVariableInput] }),
      configMaps: t.field({ type: [ConfigMapInput] }),
      secrets: t.field({ type: [SecretInput] }),
      spec: t.field({ type: 'JSON' }),
    }),
  });

  // MonitoringInput
  builder.inputType('MonitoringInput', {
    fields: (t) => ({
      id: t.id(),
      graphId: t.string(),
      kind: t.string(),
      url: t.string(),
      name: t.string(),
      namespace: t.string(),
      monitoringType: t.string(),
      version: t.string(),
      host: t.string(),
      port: t.int(),
      scrapeInterval: t.string(),
      scrapeTimeout: t.string(),
      retentionPeriod: t.string(),
      storageSize: t.string(),
      metrics: t.stringList(),
      dashboards: t.stringList(),
      alertRules: t.stringList(),
      alertmanagerEnabled: t.boolean(),
      alertmanagerUrl: t.string(),
      exporters: t.stringList(),
      serviceMonitors: t.stringList(),
      remoteWriteEnabled: t.boolean(),
      remoteWriteUrl: t.string(),
      tlsEnabled: t.boolean(),
      authEnabled: t.boolean(),
      environmentVariables: t.field({ type: [EnvironmentVariableInput] }),
      configMaps: t.field({ type: [ConfigMapInput] }),
      secrets: t.field({ type: [SecretInput] }),
      spec: t.field({ type: 'JSON' }),
    }),
  });

  // GatewayInput
  builder.inputType('GatewayInput', {
    fields: (t) => ({
      id: t.id(),
      graphId: t.string(),
      name: t.string(),
      kind: t.string(),
      url: t.string(),
      namespace: t.string(),
      gatewayType: t.string(),
      version: t.string(),
      host: t.string(),
      port: t.int(),
      protocol: t.string(),
      routes: t.stringList(),
      upstreams: t.stringList(),
      domains: t.stringList(),
      basePath: t.string(),
      tlsEnabled: t.boolean(),
      authEnabled: t.boolean(),
      corsEnabled: t.boolean(),
      rateLimitEnabled: t.boolean(),
      healthCheckEnabled: t.boolean(),
      healthCheckPath: t.string(),
      websocketEnabled: t.boolean(),
      environmentVariables: t.field({ type: [EnvironmentVariableInput] }),
      configMaps: t.field({ type: [ConfigMapInput] }),
      secrets: t.field({ type: [SecretInput] }),
      spec: t.field({ type: 'JSON' }),
    }),
  });

  // EdgeInput
  const EdgeInput = builder.inputType('EdgeInput', {
    fields: (t) => ({
      connectionType: t.field({ type: ConnectionTypeEnum, required: true }),
      node: t.field({ type: 'NodeInput', required: true }),
      id: t.id(),
      startNodeId: t.string(),
      endNodeId: t.string(),
      startX: t.float(),
      startY: t.float(),
      endX: t.float(),
      endY: t.float(),
    }),
  });

  // GraphBridgeInput
  const GraphBridgeInput = builder.inputType('GraphBridgeInput', {
    fields: (t) => ({
      connectionType: t.field({ type: ConnectionTypeEnum, required: true }),
      graphId: t.id({ required: true }),
    }),
  });

  // NodeInput
  builder.inputType('NodeInput', {
    fields: (t) => ({
      name: t.string({ required: true }),
      companyId: t.string({ required: true }),
      userId: t.string({ required: true }),
      nodeType: t.string(),
      dependencyType: t.field({ type: DependencyTypeEnum }),
      microservice: t.field({ type: 'MicroserviceInput' }),
      database: t.field({ type: 'DatabaseInput' }),
      cache: t.field({ type: 'CacheInput' }),
      messageQueue: t.field({ type: 'MessageQueueInput' }),
      proxy: t.field({ type: 'ProxyInput' }),
      loadBalancer: t.field({ type: 'LoadBalancerInput' }),
      monitoring: t.field({ type: 'MonitoringInput' }),
      gateway: t.field({ type: 'GatewayInput' }),
      namespace: t.string(),
      createdAt: t.string(),
      updatedAt: t.string(),
      edges: t.field({ type: [EdgeInput] }),
      spec: t.field({ type: 'JSON' }),
      id: t.id(),
      label: t.string(),
      iconSrc: t.string(),
      x: t.float(),
      y: t.float(),
      width: t.float(),
      height: t.float(),
      type: t.string(),
    }),
  });

  // GraphInput
  builder.inputType('GraphInput', {
    fields: (t) => ({
      name: t.string({ required: true }),
      userId: t.string({ required: true }),
      companyId: t.string({ required: true }),
      id: t.string(),
      description: t.string(),
      graphType: t.field({ type: GraphTypeEnum }),
      nodes: t.field({ type: ['NodeInput'] }),
      bridges: t.field({ type: [GraphBridgeInput] }),
      clusterId: t.string(),
    }),
  });

  // GraphMetadataInput
  builder.inputType('GraphMetadataInput', {
    fields: (t) => ({
      data: t.field({ type: 'JSON' }),
    }),
  });

  // ValidateConnectionInput
  builder.inputType('ValidateConnectionInput', {
    fields: (t) => ({
      sourceId: t.id({ required: true }),
      targetId: t.id({ required: true }),
      connectionType: t.field({ type: ConnectionTypeEnum }),
    }),
  });

  // CreateGraphInput
  builder.inputType('CreateGraphInput', {
    fields: (t) => ({
      name: t.string({ required: true }),
      description: t.string(),
      graphType: t.field({ type: GraphTypeEnum, required: true }),
      companyId: t.string({ required: true }),
      userId: t.string({ required: true }),
      clusterId: t.string(),
      nodes: t.field({ type: ['NodeInput'] }),
      bridges: t.field({ type: [GraphBridgeInput] }),
    }),
  });

  // UpdateGraphInput
  builder.inputType('UpdateGraphInput', {
    fields: (t) => ({
      id: t.id({ required: true }),
      name: t.string(),
      description: t.string(),
      graphType: t.field({ type: GraphTypeEnum }),
      clusterId: t.string(),
      nodes: t.field({ type: ['NodeInput'] }),
      bridges: t.field({ type: [GraphBridgeInput] }),
    }),
  });

  // CreateKubernetesClusterInput
  builder.inputType('CreateKubernetesClusterInput', {
    fields: (t) => ({
      metadata: t.field({ type: 'JSON' }),
      name: t.string({ required: true }),
      provider: t.string(),
      region: t.string(),
      type: t.field({ type: KubernetesClusterTypeEnum }),
      version: t.string(),
      companyId: t.string({ required: true }),
      userId: t.string({ required: true }),
    }),
  });

  // CreateKubernetesGraphInput
  builder.inputType('CreateKubernetesGraphInput', {
    fields: (t) => ({
      description: t.string(),
      clusterId: t.string({ required: true }),
      name: t.string({ required: true }),
      tags: t.stringList(),
      version: t.string(),
      companyId: t.string({ required: true }),
      userId: t.string({ required: true }),
    }),
  });

  // UpdateKubernetesClusterInput
  builder.inputType('UpdateKubernetesClusterInput', {
    fields: (t) => ({
      id: t.id({ required: true }),
      name: t.string(),
      provider: t.string(),
      region: t.string(),
      type: t.field({ type: KubernetesClusterTypeEnum }),
      version: t.string(),
      metadata: t.field({ type: 'JSON' }),
    }),
  });

  // UpdateKubernetesGraphInput
  builder.inputType('UpdateKubernetesGraphInput', {
    fields: (t) => ({
      description: t.string(),
      kubernetesCluster: t.field({ type: 'UpdateKubernetesClusterInput' }),
      metadata: t.field({ type: 'GraphMetadataInput' }),
      name: t.string(),
      tags: t.stringList(),
      version: t.string(),
      id: t.id({ required: true }),
      userId: t.string(),
      companyId: t.string(),
    }),
  });

  // CreateMicroserviceInput
  builder.inputType('CreateMicroserviceInput', {
    fields: (t) => ({
      name: t.string({ required: true }),
      graphId: t.id({ required: true }),
      language: t.string({ required: true }),
      version: t.string({ required: true }),
      baseImage: t.string({ required: true }),
      image: t.string({ required: true }),
      companyId: t.string({ required: true }),
      userId: t.string({ required: true }),
      framework: t.string(),
      dependencies: t.stringList(),
      environmentVariables: t.field({ type: [EnvironmentVariableInput] }),
      configMaps: t.field({ type: [ConfigMapInput] }),
      secrets: t.field({ type: [SecretInput] }),
      ports: t.intList(),
      scripts: t.field({ type: [ScriptInput] }),
    }),
  });

  // UpdateMicroserviceInput
  builder.inputType('UpdateMicroserviceInput', {
    fields: (t) => ({
      id: t.id({ required: true }),
      companyId: t.string({ required: true }),
      userId: t.string({ required: true }),
      graphId: t.id(),
      name: t.string(),
      language: t.string(),
      version: t.string(),
      baseImage: t.string(),
      image: t.string(),
      framework: t.string(),
      dependencies: t.stringList(),
      environmentVariables: t.field({ type: [EnvironmentVariableInput] }),
      configMaps: t.field({ type: [ConfigMapInput] }),
      secrets: t.field({ type: [SecretInput] }),
      ports: t.intList(),
      scripts: t.field({ type: [ScriptInput] }),
    }),
  });

  // LLMConfigInput
  builder.inputType('LLMConfigInput', {
    fields: (t) => ({
      provider: t.field({ type: ModelProviderEnum }),
      model: t.field({ type: ModelNameEnum }),
    }),
  });

  // GenerateCodeInput
  builder.inputType('GenerateCodeInput', {
    fields: (t) => ({
      graph: t.field({ type: 'GraphInput', required: true }),
      llmConfig: t.field({ type: 'LLMConfigInput' }),
      context: t.stringList(), // Optional array of strings for additional context
    }),
  });

  // JobStatusInput
  builder.inputType('JobStatusInput', {
    fields: (t) => ({
      jobId: t.string({ required: true }),
    }),
  });

  // GeneratedCodeNodeInput
  builder.inputType('GeneratedCodeNodeInput', {
    fields: (t) => ({
      name: t.string({ required: true }),
      nodeType: t.field({ type: GraphNodeTypeEnum, required: true }),
      config: t.string(),
      id: t.string(),
      companyId: t.string(),
      userId: t.string(),
      namespace: t.string(),
      spec: t.field({ type: 'JSON' }),
      orginalNodeName: t.string(),
      orginalNodeId: t.string(),
      orginalNodeType: t.string(),
      command: t.field({ type: ScriptInput }),
    }),
  });

  // GeneratedCodeGraphInput
  builder.inputType('GeneratedCodeGraphInput', {
    fields: (t) => ({
      totalFiles: t.int({ required: true }),
      namespace: t.string({ required: true }),
      graphId: t.string({ required: true }),
      originalGraphId: t.string({ required: true }),
      nodes: t.field({ type: ['GeneratedCodeNodeInput'] }),
    }),
  });

  // DeployInfrastructureInput
  builder.inputType('DeployInfrastructureInput', {
    fields: (t) => ({
      graph: t.field({ type: 'GeneratedCodeGraphInput', required: true }),
    }),
  });
}
