/**
 * Pothos type registrations for resource types:
 * Microservice, Database, Cache, MessageQueue, Proxy, LoadBalancer, Monitoring, Gateway
 */

import type { SchemaBuilder } from '../schema';
import type {
  Microservice,
  Database,
  Cache,
  MessageQueue,
  Proxy,
  LoadBalancer,
  Monitoring,
  Gateway,
} from '../../types/graph';

export function registerResourceTypes(builder: SchemaBuilder) {
  // Microservice
  builder.objectRef<Microservice>('Microservice').implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      graphId: t.exposeString('graphId', { nullable: true }),
      name: t.exposeString('name'),
      namespace: t.exposeString('namespace', { nullable: true }),
      language: t.exposeString('language', { nullable: true }),
      framework: t.exposeString('framework', { nullable: true }),
      version: t.exposeString('version', { nullable: true }),
      category: t.exposeString('category', { nullable: true }),
      repository: t.exposeString('repository', { nullable: true }),
      baseImage: t.exposeString('baseImage', { nullable: true }),
      image: t.exposeString('image', { nullable: true }),
      dependencies: t.exposeStringList('dependencies', { nullable: true }),
      ports: t.exposeIntList('ports', { nullable: true }),
      environmentVariables: t.field({
        type: ['EnvironmentVariable'],
        nullable: true,
        resolve: (ms) => ms.environmentVariables ?? null,
      }),
      configMaps: t.field({
        type: ['ConfigMap'],
        nullable: true,
        resolve: (ms) => ms.configMaps ?? null,
      }),
      secrets: t.field({
        type: ['Secret'],
        nullable: true,
        resolve: (ms) => ms.secrets ?? null,
      }),
      scripts: t.field({
        type: ['Script'],
        nullable: true,
        resolve: (ms) => ms.scripts ?? null,
      }),
      translatesTo: t.field({
        type: 'Graph',
        nullable: true,
        resolve: (ms) => ms.translatesTo ?? null,
      }),
      spec: t.field({
        type: 'JSON',
        nullable: true,
        resolve: (ms) => ms.spec ?? null,
      }),
    }),
  });

  // Database
  builder.objectRef<Database>('Database').implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      graphId: t.exposeString('graphId', { nullable: true }),
      kind: t.exposeString('kind'),
      url: t.exposeString('url'),
      name: t.exposeString('name'),
      namespace: t.exposeString('namespace', { nullable: true }),
      engine: t.exposeString('engine', { nullable: true }),
      version: t.exposeString('version', { nullable: true }),
      host: t.exposeString('host', { nullable: true }),
      port: t.exposeInt('port', { nullable: true }),
      databaseName: t.exposeString('databaseName', { nullable: true }),
      username: t.exposeString('username', { nullable: true }),
      connectionString: t.exposeString('connectionString', { nullable: true }),
      maxConnections: t.exposeInt('maxConnections', { nullable: true }),
      storageSize: t.exposeString('storageSize', { nullable: true }),
      storageClass: t.exposeString('storageClass', { nullable: true }),
      replicationEnabled: t.exposeBoolean('replicationEnabled', { nullable: true }),
      replicaCount: t.exposeInt('replicaCount', { nullable: true }),
      backupEnabled: t.exposeBoolean('backupEnabled', { nullable: true }),
      backupSchedule: t.exposeString('backupSchedule', { nullable: true }),
      sslEnabled: t.exposeBoolean('sslEnabled', { nullable: true }),
      charset: t.exposeString('charset', { nullable: true }),
      collation: t.exposeString('collation', { nullable: true }),
      environmentVariables: t.field({
        type: ['EnvironmentVariable'],
        nullable: true,
        resolve: (db) => db.environmentVariables ?? null,
      }),
      configMaps: t.field({
        type: ['ConfigMap'],
        nullable: true,
        resolve: (db) => db.configMaps ?? null,
      }),
      secrets: t.field({
        type: ['Secret'],
        nullable: true,
        resolve: (db) => db.secrets ?? null,
      }),
      translatesTo: t.field({
        type: 'Graph',
        nullable: true,
        resolve: (db) => db.translatesTo ?? null,
      }),
      spec: t.field({
        type: 'JSON',
        nullable: true,
        resolve: (db) => db.spec ?? null,
      }),
    }),
  });

  // Cache
  builder.objectRef<Cache>('Cache').implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      graphId: t.exposeString('graphId', { nullable: true }),
      name: t.exposeString('name'),
      kind: t.exposeString('kind'),
      url: t.exposeString('url'),
      namespace: t.exposeString('namespace', { nullable: true }),
      engine: t.exposeString('engine', { nullable: true }),
      version: t.exposeString('version', { nullable: true }),
      host: t.exposeString('host', { nullable: true }),
      port: t.exposeInt('port', { nullable: true }),
      clusterMode: t.exposeBoolean('clusterMode', { nullable: true }),
      replicaCount: t.exposeInt('replicaCount', { nullable: true }),
      maxMemory: t.exposeString('maxMemory', { nullable: true }),
      evictionPolicy: t.exposeString('evictionPolicy', { nullable: true }),
      persistenceEnabled: t.exposeBoolean('persistenceEnabled', { nullable: true }),
      persistenceStrategy: t.exposeString('persistenceStrategy', { nullable: true }),
      password: t.exposeString('password', { nullable: true }),
      tlsEnabled: t.exposeBoolean('tlsEnabled', { nullable: true }),
      sentinelEnabled: t.exposeBoolean('sentinelEnabled', { nullable: true }),
      sentinelHosts: t.exposeStringList('sentinelHosts', { nullable: true }),
      environmentVariables: t.field({
        type: ['EnvironmentVariable'],
        nullable: true,
        resolve: (cache) => cache.environmentVariables ?? null,
      }),
      configMaps: t.field({
        type: ['ConfigMap'],
        nullable: true,
        resolve: (cache) => cache.configMaps ?? null,
      }),
      secrets: t.field({
        type: ['Secret'],
        nullable: true,
        resolve: (cache) => cache.secrets ?? null,
      }),
      translatesTo: t.field({
        type: 'Graph',
        nullable: true,
        resolve: (cache) => cache.translatesTo ?? null,
      }),
      spec: t.field({
        type: 'JSON',
        nullable: true,
        resolve: (cache) => cache.spec ?? null,
      }),
    }),
  });

  // MessageQueue
  builder.objectRef<MessageQueue>('MessageQueue').implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      graphId: t.exposeString('graphId', { nullable: true }),
      name: t.exposeString('name'),
      kind: t.exposeString('kind'),
      url: t.exposeString('url'),
      namespace: t.exposeString('namespace', { nullable: true }),
      engine: t.exposeString('engine', { nullable: true }),
      version: t.exposeString('version', { nullable: true }),
      host: t.exposeString('host', { nullable: true }),
      port: t.exposeInt('port', { nullable: true }),
      protocol: t.exposeString('protocol', { nullable: true }),
      topics: t.exposeStringList('topics', { nullable: true }),
      queues: t.exposeStringList('queues', { nullable: true }),
      exchanges: t.exposeStringList('exchanges', { nullable: true }),
      clusterMode: t.exposeBoolean('clusterMode', { nullable: true }),
      replicaCount: t.exposeInt('replicaCount', { nullable: true }),
      partitions: t.exposeInt('partitions', { nullable: true }),
      replicationFactor: t.exposeInt('replicationFactor', { nullable: true }),
      retentionPeriod: t.exposeString('retentionPeriod', { nullable: true }),
      maxMessageSize: t.exposeString('maxMessageSize', { nullable: true }),
      dlqEnabled: t.exposeBoolean('dlqEnabled', { nullable: true }),
      dlqName: t.exposeString('dlqName', { nullable: true }),
      tlsEnabled: t.exposeBoolean('tlsEnabled', { nullable: true }),
      authEnabled: t.exposeBoolean('authEnabled', { nullable: true }),
      environmentVariables: t.field({
        type: ['EnvironmentVariable'],
        nullable: true,
        resolve: (mq) => mq.environmentVariables ?? null,
      }),
      configMaps: t.field({
        type: ['ConfigMap'],
        nullable: true,
        resolve: (mq) => mq.configMaps ?? null,
      }),
      secrets: t.field({
        type: ['Secret'],
        nullable: true,
        resolve: (mq) => mq.secrets ?? null,
      }),
      translatesTo: t.field({
        type: 'Graph',
        nullable: true,
        resolve: (mq) => mq.translatesTo ?? null,
      }),
      spec: t.field({
        type: 'JSON',
        nullable: true,
        resolve: (mq) => mq.spec ?? null,
      }),
    }),
  });

  // Proxy
  builder.objectRef<Proxy>('Proxy').implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      graphId: t.exposeString('graphId', { nullable: true }),
      name: t.exposeString('name'),
      kind: t.exposeString('kind'),
      url: t.exposeString('url'),
      namespace: t.exposeString('namespace', { nullable: true }),
      proxyType: t.exposeString('proxyType', { nullable: true }),
      version: t.exposeString('version', { nullable: true }),
      host: t.exposeString('host', { nullable: true }),
      port: t.exposeInt('port', { nullable: true }),
      protocol: t.exposeString('protocol', { nullable: true }),
      upstreams: t.exposeStringList('upstreams', { nullable: true }),
      tlsEnabled: t.exposeBoolean('tlsEnabled', { nullable: true }),
      rateLimitEnabled: t.exposeBoolean('rateLimitEnabled', { nullable: true }),
      rateLimitRequests: t.exposeInt('rateLimitRequests', { nullable: true }),
      rateLimitPeriod: t.exposeString('rateLimitPeriod', { nullable: true }),
      healthCheckEnabled: t.exposeBoolean('healthCheckEnabled', { nullable: true }),
      healthCheckPath: t.exposeString('healthCheckPath', { nullable: true }),
      healthCheckInterval: t.exposeString('healthCheckInterval', { nullable: true }),
      compressionEnabled: t.exposeBoolean('compressionEnabled', { nullable: true }),
      cachingEnabled: t.exposeBoolean('cachingEnabled', { nullable: true }),
      environmentVariables: t.field({
        type: ['EnvironmentVariable'],
        nullable: true,
        resolve: (proxy) => proxy.environmentVariables ?? null,
      }),
      configMaps: t.field({
        type: ['ConfigMap'],
        nullable: true,
        resolve: (proxy) => proxy.configMaps ?? null,
      }),
      secrets: t.field({
        type: ['Secret'],
        nullable: true,
        resolve: (proxy) => proxy.secrets ?? null,
      }),
      translatesTo: t.field({
        type: 'Graph',
        nullable: true,
        resolve: (proxy) => proxy.translatesTo ?? null,
      }),
      spec: t.field({
        type: 'JSON',
        nullable: true,
        resolve: (proxy) => proxy.spec ?? null,
      }),
    }),
  });

  // LoadBalancer
  builder.objectRef<LoadBalancer>('LoadBalancer').implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      graphId: t.exposeString('graphId', { nullable: true }),
      name: t.exposeString('name'),
      kind: t.exposeString('kind'),
      url: t.exposeString('url'),
      namespace: t.exposeString('namespace', { nullable: true }),
      loadBalancerType: t.exposeString('loadBalancerType', { nullable: true }),
      version: t.exposeString('version', { nullable: true }),
      host: t.exposeString('host', { nullable: true }),
      port: t.exposeInt('port', { nullable: true }),
      protocol: t.exposeString('protocol', { nullable: true }),
      backends: t.exposeStringList('backends', { nullable: true }),
      algorithm: t.exposeString('algorithm', { nullable: true }),
      healthCheckEnabled: t.exposeBoolean('healthCheckEnabled', { nullable: true }),
      healthCheckPath: t.exposeString('healthCheckPath', { nullable: true }),
      stickySessionEnabled: t.exposeBoolean('stickySessionEnabled', { nullable: true }),
      tlsEnabled: t.exposeBoolean('tlsEnabled', { nullable: true }),
      crossZoneEnabled: t.exposeBoolean('crossZoneEnabled', { nullable: true }),
      connectionDrainingEnabled: t.exposeBoolean('connectionDrainingEnabled', { nullable: true }),
      environmentVariables: t.field({
        type: ['EnvironmentVariable'],
        nullable: true,
        resolve: (lb) => lb.environmentVariables ?? null,
      }),
      configMaps: t.field({
        type: ['ConfigMap'],
        nullable: true,
        resolve: (lb) => lb.configMaps ?? null,
      }),
      secrets: t.field({
        type: ['Secret'],
        nullable: true,
        resolve: (lb) => lb.secrets ?? null,
      }),
      translatesTo: t.field({
        type: 'Graph',
        nullable: true,
        resolve: (lb) => lb.translatesTo ?? null,
      }),
      spec: t.field({
        type: 'JSON',
        nullable: true,
        resolve: (lb) => lb.spec ?? null,
      }),
    }),
  });

  // Monitoring
  builder.objectRef<Monitoring>('Monitoring').implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      graphId: t.exposeString('graphId', { nullable: true }),
      name: t.exposeString('name'),
      kind: t.exposeString('kind'),
      url: t.exposeString('url'),
      namespace: t.exposeString('namespace', { nullable: true }),
      monitoringType: t.exposeString('monitoringType', { nullable: true }),
      version: t.exposeString('version', { nullable: true }),
      host: t.exposeString('host', { nullable: true }),
      port: t.exposeInt('port', { nullable: true }),
      scrapeInterval: t.exposeString('scrapeInterval', { nullable: true }),
      scrapeTimeout: t.exposeString('scrapeTimeout', { nullable: true }),
      retentionPeriod: t.exposeString('retentionPeriod', { nullable: true }),
      storageSize: t.exposeString('storageSize', { nullable: true }),
      metrics: t.exposeStringList('metrics', { nullable: true }),
      dashboards: t.exposeStringList('dashboards', { nullable: true }),
      alertRules: t.exposeStringList('alertRules', { nullable: true }),
      alertmanagerEnabled: t.exposeBoolean('alertmanagerEnabled', { nullable: true }),
      alertmanagerUrl: t.exposeString('alertmanagerUrl', { nullable: true }),
      exporters: t.exposeStringList('exporters', { nullable: true }),
      serviceMonitors: t.exposeStringList('serviceMonitors', { nullable: true }),
      remoteWriteEnabled: t.exposeBoolean('remoteWriteEnabled', { nullable: true }),
      remoteWriteUrl: t.exposeString('remoteWriteUrl', { nullable: true }),
      tlsEnabled: t.exposeBoolean('tlsEnabled', { nullable: true }),
      authEnabled: t.exposeBoolean('authEnabled', { nullable: true }),
      environmentVariables: t.field({
        type: ['EnvironmentVariable'],
        nullable: true,
        resolve: (mon) => mon.environmentVariables ?? null,
      }),
      configMaps: t.field({
        type: ['ConfigMap'],
        nullable: true,
        resolve: (mon) => mon.configMaps ?? null,
      }),
      secrets: t.field({
        type: ['Secret'],
        nullable: true,
        resolve: (mon) => mon.secrets ?? null,
      }),
      translatesTo: t.field({
        type: 'Graph',
        nullable: true,
        resolve: (mon) => mon.translatesTo ?? null,
      }),
      spec: t.field({
        type: 'JSON',
        nullable: true,
        resolve: (mon) => mon.spec ?? null,
      }),
    }),
  });

  // Gateway
  builder.objectRef<Gateway>('Gateway').implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      graphId: t.exposeString('graphId', { nullable: true }),
      name: t.exposeString('name'),
      kind: t.exposeString('kind'),
      url: t.exposeString('url'),
      namespace: t.exposeString('namespace', { nullable: true }),
      gatewayType: t.exposeString('gatewayType', { nullable: true }),
      version: t.exposeString('version', { nullable: true }),
      host: t.exposeString('host', { nullable: true }),
      port: t.exposeInt('port', { nullable: true }),
      protocol: t.exposeString('protocol', { nullable: true }),
      routes: t.exposeStringList('routes', { nullable: true }),
      upstreams: t.exposeStringList('upstreams', { nullable: true }),
      domains: t.exposeStringList('domains', { nullable: true }),
      basePath: t.exposeString('basePath', { nullable: true }),
      tlsEnabled: t.exposeBoolean('tlsEnabled', { nullable: true }),
      authEnabled: t.exposeBoolean('authEnabled', { nullable: true }),
      corsEnabled: t.exposeBoolean('corsEnabled', { nullable: true }),
      rateLimitEnabled: t.exposeBoolean('rateLimitEnabled', { nullable: true }),
      healthCheckEnabled: t.exposeBoolean('healthCheckEnabled', { nullable: true }),
      healthCheckPath: t.exposeString('healthCheckPath', { nullable: true }),
      websocketEnabled: t.exposeBoolean('websocketEnabled', { nullable: true }),
      environmentVariables: t.field({
        type: ['EnvironmentVariable'],
        nullable: true,
        resolve: (gw) => gw.environmentVariables ?? null,
      }),
      configMaps: t.field({
        type: ['ConfigMap'],
        nullable: true,
        resolve: (gw) => gw.configMaps ?? null,
      }),
      secrets: t.field({
        type: ['Secret'],
        nullable: true,
        resolve: (gw) => gw.secrets ?? null,
      }),
      translatesTo: t.field({
        type: 'Graph',
        nullable: true,
        resolve: (gw) => gw.translatesTo ?? null,
      }),
      spec: t.field({
        type: 'JSON',
        nullable: true,
        resolve: (gw) => gw.spec ?? null,
      }),
    }),
  });
}
