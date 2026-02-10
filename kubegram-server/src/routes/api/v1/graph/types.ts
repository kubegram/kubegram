/**
 * Graph Route Types
 * 
 * TypeScript interfaces and Valibot validation schemas for graph/codegen API.
 * Includes request/response types and internal data structures.
 */

import * as v from 'valibot';
import type {
  GraphInput,
  JobStatus,
  GeneratedCodeGraph
} from '@/clients/rag-client';

// Request/Response Schemas
export const GraphSchema = v.object({
  name: v.string(),
  description: v.optional(v.string()),
  graphType: v.picklist(['KUBERNETES', 'INFRASTRUCTURE', 'ABSTRACT', 'DEBUGGING', 'MICROSERVICE']),
  companyId: v.string(),
  userId: v.string(),
  nodes: v.array(v.any()), // Will be validated by GraphQL schema
  bridges: v.optional(v.array(v.any())),
});

export const CodeGenerationRequestSchema = v.object({
  graph: GraphSchema,
  project: v.object({
    id: v.optional(v.string()), // Optional for existing project
    name: v.optional(v.string()), // Optional for new project
    description: v.optional(v.string()),
  }),
  llmConfig: v.optional(v.object({
    provider: v.optional(v.picklist(['CLAUDE', 'GEMMA', 'DEEPSEEK', 'OPENAI', 'GOOGLE'])),
    model: v.optional(v.string()),
  })),
  context: v.optional(v.array(v.string())) // Optional context messages for enhanced generation
});

export const CodeGenerationResponseSchema = v.object({
  jobId: v.string(),
  step: v.string(),
  status: v.string(),
});

export const JobStatusResponseSchema = v.object({
  jobId: v.string(),
  step: v.string(),
  status: v.string(),
  generatedCode: v.optional(v.any()), // GeneratedCodeGraph
});

export const GeneratedCodeResponseSchema = v.object({
  graphId: v.string(),
  originalGraphId: v.string(),
  namespace: v.string(),
  totalFiles: v.number(),
  nodes: v.array(v.object({
    id: v.string(),
    name: v.string(),
    nodeType: v.string(),
    config: v.any(),
    generatedCodeMetadata: v.object({
      fileName: v.string(),
      path: v.string(),
    }),
    command: v.optional(v.object({
      name: v.string(),
      command: v.string(),
    })),
  })),
});

// Internal types
export interface StoredProject {
  id: number;
  name: string;
  graphId: string;
  graphMeta: string;
  teamId: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface StoredJob {
  id: number;
  uuid: string;
  graphId: string;
  projectId: number;
  requestedBy: number;
  status: string;
  config: string;
  resultData?: string;
  errorMessage?: string;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebSocketContext {
  jobId: string;
  userId: number;
  subscriptionClient?: any; // GraphQLSubscriptionClient
  unsubscribe?: () => void;
}

// GraphQL Type exports for convenience
export type {
  GraphInput,
  JobStatus,
  GeneratedCodeGraph
} from '@/clients/rag-client';