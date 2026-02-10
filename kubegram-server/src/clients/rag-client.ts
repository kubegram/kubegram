/**
 * Centralized GraphQL Client Library
 * 
 * This module provides reusable GraphQL clients for the application:
 * - SDK Client for queries and mutations (HTTP)
 * - Subscription Client factory for real-time updates (WebSocket)
 * 
 * @module graphql-client
 */

import { GraphQL } from '@kubegram/common-ts';

/**
 * GraphQL Configuration
 * Reads from environment variables with fallback defaults
 */
export const graphqlConfig = {
  /** HTTP endpoint for queries and mutations */
  httpEndpoint: (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.KUBERAG_URL : process.env.KUBERAG_URL) || 'http://localhost:8665/graphql',
  /** Default retry configuration for subscriptions */
  retryAttempts: 5,
  retryDelay: 2000, // 2 seconds
} as const;

/**
 * Singleton GraphQL SDK instance for queries and mutations
 * 
 * Usage:
 * ```typescript
 * import { graphqlSdk } from '@/lib/graphql-client';
 * 
 * const result = await graphqlSdk.GetMicroservices();
 * ```
 */
export const graphqlSdk = GraphQL.createGraphQLSdk({
  endpoint: graphqlConfig.httpEndpoint,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
});

graphqlSdk.GenerateCode
/**
 * Re-export commonly used types from @kubegram/common-ts for convenience
 */
export type {
  // Graph types
  GraphNode,
  Graph,
  GraphInput,
  GraphNodeType,
  GraphType,
  Edge,

  // Connection types
  ConnectionType,
  ConnectionValidation,
  ConnectionValidationResult,
  ConnectionSuggestion,

  // Common scalars
  Maybe,

  // Generated code types
  GeneratedCodeGraph,
  GeneratedCodeNode,
  JobStatus,
  GenerateCodeInput,

  // Plan types
  InitializePlanInput,
  PlanResult,
  PlanJobStatus
} from '@kubegram/common-ts/dist/graphql';
