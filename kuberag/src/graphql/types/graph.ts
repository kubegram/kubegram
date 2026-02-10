/**
 * Pothos type registrations for Graph, GraphNode, Edge, GraphBridge, KubernetesCluster
 */

import type { SchemaBuilder } from '../schema';
import {
  ConnectionTypeEnum,
  DependencyTypeEnum,
  GraphNodeTypeEnum,
  GraphTypeEnum,
  KubernetesClusterTypeEnum,
} from './enums';
import type {
  Graph,
  GraphNode,
  Edge,
  GraphBridge,
  KubernetesCluster,
  EnvironmentVariable,
  ConfigMap,
  Secret,
  Script,
  ScriptResult,
} from '../../types/graph';

export function registerGraphTypes(builder: SchemaBuilder) {
  // Create refs
  const GraphRef = builder.objectRef<Graph>('Graph');
  const GraphNodeRef = builder.objectRef<GraphNode>('GraphNode');
  const KubernetesClusterRef = builder.objectRef<KubernetesCluster>('KubernetesCluster');

  // EnvironmentVariable
  builder.objectRef<EnvironmentVariable>('EnvironmentVariable').implement({
    fields: (t) => ({
      name: t.exposeString('name'),
      value: t.exposeString('value'),
    }),
  });

  // ConfigMap
  builder.objectRef<ConfigMap>('ConfigMap').implement({
    fields: (t) => ({
      name: t.exposeString('name'),
      key: t.exposeString('key', { nullable: true }),
      value: t.exposeString('value', { nullable: true }),
    }),
  });

  // Secret
  builder.objectRef<Secret>('Secret').implement({
    fields: (t) => ({
      name: t.exposeString('name'),
      key: t.exposeString('key', { nullable: true }),
      value: t.exposeString('value', { nullable: true }),
      encryptionPublicKey: t.exposeString('encryptionPublicKey'),
    }),
  });

  // ScriptResult
  builder.objectRef<ScriptResult>('ScriptResult').implement({
    fields: (t) => ({
      status: t.exposeString('status'),
      output: t.exposeString('output', { nullable: true }),
    }),
  });

  // Script
  builder.objectRef<Script>('Script').implement({
    fields: (t) => ({
      name: t.exposeString('name'),
      command: t.exposeString('command'),
      retryCount: t.exposeInt('retryCount', { nullable: true }),
    }),
  });

  // Edge
  builder.objectRef<Edge>('Edge').implement({
    fields: (t) => ({
      connectionType: t.expose('connectionType', {
        type: ConnectionTypeEnum,
      }),
      node: t.field({
        type: GraphNodeRef,
        resolve: (edge) => edge.node,
      }),
    }),
  });

  // GraphBridge
  builder.objectRef<GraphBridge>('GraphBridge').implement({
    fields: (t) => ({
      connectionType: t.expose('connectionType', {
        type: ConnectionTypeEnum,
      }),
      graph: t.field({
        type: GraphRef,
        resolve: (bridge) => bridge.graph,
      }),
    }),
  });

  // GraphNode
  GraphNodeRef.implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      name: t.exposeString('name'),
      companyId: t.exposeString('companyId'),
      userId: t.exposeString('userId'),
      nodeType: t.expose('nodeType', { type: GraphNodeTypeEnum }),
      dependencyType: t.expose('dependencyType', { type: DependencyTypeEnum, nullable: true }),
      namespace: t.exposeString('namespace', { nullable: true }),
      createdAt: t.exposeString('createdAt', { nullable: true }),
      updatedAt: t.exposeString('updatedAt', { nullable: true }),
      orginalNodeName: t.exposeString('orginalNodeName', { nullable: true }),
      orginalNodeId: t.exposeString('orginalNodeId', { nullable: true }),
      orginalNodeType: t.exposeString('orginalNodeType', { nullable: true }),
      spec: t.field({
        type: 'JSON',
        nullable: true,
        resolve: (node) => node.spec ?? null,
      }),
      config: t.field({
        type: 'YAML',
        nullable: true,
        resolve: (node) => node.config ?? null,
      }),
      edges: t.field({
        type: ['Edge'],
        nullable: true,
        resolve: (node) => node.edges ?? null,
      }),
      microservice: t.field({
        type: 'Microservice',
        nullable: true,
        resolve: (node) => node.microservice ?? null,
      }),
      database: t.field({
        type: 'Database',
        nullable: true,
        resolve: (node) => node.database ?? null,
      }),
      cache: t.field({
        type: 'Cache',
        nullable: true,
        resolve: (node) => node.cache ?? null,
      }),
      messageQueue: t.field({
        type: 'MessageQueue',
        nullable: true,
        resolve: (node) => node.messageQueue ?? null,
      }),
      proxy: t.field({
        type: 'Proxy',
        nullable: true,
        resolve: (node) => node.proxy ?? null,
      }),
      loadBalancer: t.field({
        type: 'LoadBalancer',
        nullable: true,
        resolve: (node) => node.loadBalancer ?? null,
      }),
      monitoring: t.field({
        type: 'Monitoring',
        nullable: true,
        resolve: (node) => node.monitoring ?? null,
      }),
      gateway: t.field({
        type: 'Gateway',
        nullable: true,
        resolve: (node) => node.gateway ?? null,
      }),
    }),
  });

  // Graph
  GraphRef.implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      name: t.exposeString('name'),
      description: t.exposeString('description', { nullable: true }),
      createdAt: t.exposeString('createdAt', { nullable: true }),
      updatedAt: t.exposeString('updatedAt', { nullable: true }),
      graphType: t.expose('graphType', { type: GraphTypeEnum }),
      userId: t.exposeString('userId'),
      companyId: t.exposeString('companyId'),
      nodes: t.field({
        type: [GraphNodeRef],
        nullable: true,
        resolve: (graph) => graph.nodes ?? null,
      }),
      bridges: t.field({
        type: ['GraphBridge'],
        nullable: true,
        resolve: (graph) => graph.bridges ?? null,
      }),
      cluster: t.field({
        type: KubernetesClusterRef,
        nullable: true,
        resolve: (graph) => graph.cluster ?? null,
      }),
      subgraphs: t.field({
        type: [GraphRef],
        nullable: true,
        resolve: (graph) => graph.subgraphs ?? null,
      }),
      parent: t.field({
        type: GraphRef,
        nullable: true,
        resolve: (graph) => graph.parent ?? null,
      }),
    }),
  });

  // KubernetesCluster
  KubernetesClusterRef.implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      name: t.exposeString('name'),
      provider: t.exposeString('provider', { nullable: true }),
      region: t.exposeString('region', { nullable: true }),
      type: t.expose('type', { type: KubernetesClusterTypeEnum, nullable: true }),
      version: t.exposeString('version', { nullable: true }),
      metadata: t.exposeString('metadata', { nullable: true }),
      spec: t.field({
        type: 'JSON',
        nullable: true,
        resolve: (cluster) => cluster.spec ?? null,
      }),
    }),
  });
}
