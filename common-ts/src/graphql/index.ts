// GraphQL Schema Exports
// This file exports all GraphQL schemas and provides utilities for working with them

// Note: GraphQL schema files are excluded from npm publish
// They are only used for development and code generation

// Axios-based GraphQL client (recommended)
export {
  AxiosGraphQLClient,
  createGraphQLClient,
  GraphQLRequestError,
  type GraphQLRequestConfig,
  type GraphQLResponse,
  type RawGraphQLResponse,
} from './axios-client.js';

// Axios-based GraphQL SDK
export { GraphQLSdk, createGraphQLSdk, type GraphQLSdkOptions } from './sdk.js';

// Generated client exports (legacy - for graphql-request compatibility)
export { getSdk } from './generated/client.js';
export type { Sdk } from './generated/client.js';

// Generated query exports
export {
  type GetConnectionTypeQuery,
  type GetConnectionTypeQueryVariables,
  type ValidateConnectionQuery,
  type ValidateConnectionQueryVariables,
  type ValidateGraphQuery,
  type ValidateGraphQueryVariables,
  type GetSuggestionQuery,
  type GetSuggestionQueryVariables,
} from './generated/client.js';

// Generated types exports (only TypeScript types, no runtime dependencies on .graphql files)
export * from './generated/types.js';

// Schema utilities
export interface GraphQLSchemaInfo {
  name: string;
  description: string;
  version: string;
  types: string[];
  queries: string[];
  mutations: string[];
  subscriptions: string[];
}

// Schema registry
export const SCHEMA_REGISTRY: Record<string, GraphQLSchemaInfo> = {
  main: {
    name: 'Main GraphQL Schema',
    description: 'Consolidated GraphQL schema for all resource types and operations',
    version: '1.0.0',
    types: [
      'GraphResource',
      'GraphNode',
      'Edge',
      'Graph',
      'Microservice',
      'ExternalDependency',
      'ConnectionType',
      'MicroserviceCategory',
      'ExternalDependencyCategory',
      'CloudProvider',
      'DeploymentStrategy',
      'ScalingStrategy',
      'Script',
      'EnvironmentVariable',
      'Secret',
      'ConfigMap',
      'NodeMetadata',
      'EdgeMetadata',
      'Position',
      'EdgeStyle',
      'BridgeNode',
      'GraphConnection',
      'GraphMetadata',
      'GraphConnectionMetadata',
    ],
    queries: [
      'microservice',
      'microservices',
      'externalDependency',
      'externalDependencies',
      'graph',
      'graphs',
      'node',
      'nodes',
      'edge',
      'edges',
    ],
    mutations: [
      'createMicroservice',
      'updateMicroservice',
      'deleteMicroservice',
      'createExternalDependency',
      'updateExternalDependency',
      'deleteExternalDependency',
      'createGraph',
      'updateGraph',
      'deleteGraph',
      'createNode',
      'updateNode',
      'deleteNode',
      'createEdge',
      'updateEdge',
      'deleteEdge',
    ],
    subscriptions: ['generateCode'],
  },
};

// Schema composition utilities
export function getAllSchemas(): string[] {
  return Object.keys(SCHEMA_REGISTRY);
}

export function getSchemaInfo(schemaName: string): GraphQLSchemaInfo | undefined {
  return SCHEMA_REGISTRY[schemaName];
}

export function getSchemaTypes(schemaName: string): string[] {
  const schema = SCHEMA_REGISTRY[schemaName];
  return schema ? schema.types : [];
}

export function getSchemaQueries(schemaName: string): string[] {
  const schema = SCHEMA_REGISTRY[schemaName];
  return schema ? schema.queries : [];
}

export function getSchemaMutations(schemaName: string): string[] {
  const schema = SCHEMA_REGISTRY[schemaName];
  return schema ? schema.mutations : [];
}

export function getSchemaSubscriptions(schemaName: string): string[] {
  const schema = SCHEMA_REGISTRY[schemaName];
  return schema ? schema.subscriptions : [];
}

// Schema validation utilities
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validateSchemaCompatibility(_schema1: string, _schema2: string): boolean {
  // This would implement schema compatibility validation
  // For now, return true as a placeholder
  return true;
}

export function mergeSchemas(schemas: string[]): string {
  // This would implement schema merging logic
  // For now, return a placeholder
  return schemas.join('\n\n');
}

// Type mapping utilities
export const TYPE_MAPPINGS: Record<string, string> = {
  // Core types
  GraphResource: 'main',
  GraphNode: 'main',
  Edge: 'main',
  Graph: 'main',
  ConnectionType: 'main',
  NodeMetadata: 'main',
  EdgeMetadata: 'main',
  Position: 'main',
  EdgeStyle: 'main',
  BridgeNode: 'main',
  GraphConnection: 'main',
  GraphMetadata: 'main',
  GraphConnectionMetadata: 'main',

  // Microservice types
  Microservice: 'main',
  Script: 'main',
  EnvironmentVariable: 'main',
  Secret: 'main',
  ConfigMap: 'main',
  MicroserviceCategory: 'main',
  DeploymentStrategy: 'main',
  ScalingStrategy: 'main',

  // External dependency types
  ExternalDependency: 'main',
  ExternalDependencyCategory: 'main',
  CloudProvider: 'main',
};

export function getTypeSchema(typeName: string): string | undefined {
  return TYPE_MAPPINGS[typeName];
}

export function getTypesBySchema(schemaName: string): string[] {
  return Object.entries(TYPE_MAPPINGS)
    .filter(([_, schema]) => schema === schemaName)
    .map(([type, _]) => type);
}

// Connection type utilities
export const CONNECTION_TYPE_CATEGORIES: Record<string, string[]> = {
  hierarchical: ['CONTAINS', 'BELONGS_TO'],
  network: ['ROUTES_TO', 'LOAD_BALANCES', 'PROXIES', 'INGRESS_TO', 'EGRESS_FROM'],
  serviceMesh: [
    'MESH_CONNECTS',
    'MESH_AUTHORIZES',
    'MESH_SPLITS_TRAFFIC',
    'MESH_MIRRORS',
    'MESH_RETRIES',
    'MESH_TIMEOUTS',
    'MESH_CIRCUIT_BREAKER',
  ],
  storage: ['MOUNTS', 'CLAIMS', 'BACKS_UP', 'REPLICATES'],
  security: ['AUTHENTICATES', 'AUTHORIZES', 'ENCRYPTS', 'SIGNS'],
  configuration: ['CONFIGURES', 'DEPENDS_ON', 'REQUIRES', 'OPTIONAL_FOR'],
  monitoring: ['MONITORS', 'LOGS_TO', 'METRICS_TO', 'TRACES_TO'],
  deployment: ['DEPLOYS_TO', 'SCALES', 'UPDATES', 'ROLLS_BACK'],
  networkPolicies: ['ALLOWS_TRAFFIC', 'BLOCKS_TRAFFIC', 'ISOLATES'],
  serviceDiscovery: ['DISCOVERS', 'REGISTERS', 'RESOLVES'],
  gitOps: ['SYNC'],
  resourceManagement: ['LIMITS', 'REQUESTS', 'QUOTAS', 'BINDS'],
  proxy: ['CACHES', 'COMPRESSES', 'RATE_LIMITS', 'REWRITES', 'REDIRECTS'],
  backup: ['BACKS_UP_TO', 'RESTORES_FROM', 'FAILS_OVER_TO'],
  custom: ['CUSTOM'],
  graphConnections: [
    'CONNECTS_TO',
    'BRIDGES',
    'SYNCHRONIZES_WITH',
    'DEPENDS_ON_GRAPH',
    'EXTENDS',
    'INHERITS_FROM',
  ],
};

export function getConnectionTypesByCategory(category: string): string[] {
  return CONNECTION_TYPE_CATEGORIES[category] || [];
}

export function getConnectionTypeCategory(connectionType: string): string | undefined {
  for (const [category, types] of Object.entries(CONNECTION_TYPE_CATEGORIES)) {
    if (types.includes(connectionType)) {
      return category;
    }
  }
  return undefined;
}

// Schema documentation utilities
export function generateSchemaDocumentation(): string {
  let documentation = '# GraphQL Schema Documentation\n\n';

  for (const info of Object.values(SCHEMA_REGISTRY)) {
    documentation += `## ${info.name}\n\n`;
    documentation += `${info.description}\n\n`;
    documentation += `**Version:** ${info.version}\n\n`;

    if (info.types.length > 0) {
      documentation += `### Types\n\n`;
      info.types.forEach(type => {
        documentation += `- \`${type}\`\n`;
      });
      documentation += '\n';
    }

    if (info.queries.length > 0) {
      documentation += `### Queries\n\n`;
      info.queries.forEach(query => {
        documentation += `- \`${query}\`\n`;
      });
      documentation += '\n';
    }

    if (info.mutations.length > 0) {
      documentation += `### Mutations\n\n`;
      info.mutations.forEach(mutation => {
        documentation += `- \`${mutation}\`\n`;
      });
      documentation += '\n';
    }

    if (info.subscriptions.length > 0) {
      documentation += `### Subscriptions\n\n`;
      info.subscriptions.forEach(subscription => {
        documentation += `- \`${subscription}\`\n`;
      });
      documentation += '\n';
    }
  }

  return documentation;
}

// Export all utilities (removed duplicate exports)
