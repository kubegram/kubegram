/**
 * Pothos type registrations for code generation types:
 * GeneratedCodeNode, GeneratedCodeGraph, GeneratedCodeMetadata, JobStatus
 */

import type { SchemaBuilder } from '../schema';
import {
  ConnectionTypeEnum,
  DependencyTypeEnum,
  GraphNodeTypeEnum,
  JobStatusStatusEnum,
} from './enums';
import type {
  GeneratedCodeNode,
  GeneratedCodeGraph,
  GeneratedCodeMetadata,
  JobStatus,
  GraphValidation,
  ConnectionValidation,
  GraphConnectionSuggestion,
  Suggestion,
} from '../../types/codegen';

export function registerCodegenTypes(builder: SchemaBuilder) {
  // GeneratedCodeMetadata
  const GeneratedCodeMetadataRef = builder.objectRef<GeneratedCodeMetadata>('GeneratedCodeMetadata');
  GeneratedCodeMetadataRef.implement({
    fields: (t) => ({
      fileName: t.exposeString('fileName'),
      path: t.exposeString('path'),
    }),
  });

  // JobStatus
  const JobStatusRef = builder.objectRef<JobStatus>('JobStatus');
  JobStatusRef.implement({
    fields: (t) => ({
      jobId: t.exposeString('jobId'),
      step: t.exposeString('step'),
      status: t.expose('status', { type: JobStatusStatusEnum }),
    }),
  });

  // GeneratedCodeNode
  const GeneratedCodeNodeRef = builder.objectRef<GeneratedCodeNode>('GeneratedCodeNode');
  GeneratedCodeNodeRef.implement({
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
      originalNodeName: t.exposeString('originalNodeName', { nullable: true }),
      originalNodeId: t.exposeString('originalNodeId', { nullable: true }),
      originalNodeType: t.exposeString('originalNodeType', { nullable: true }),
      spec: t.field({
        type: 'JSON',
        nullable: true,
        resolve: (node) => node.spec ?? null,
      }),
      config: t.exposeString('config', { nullable: true }),
      generatedCodeMetadata: t.field({
        type: GeneratedCodeMetadataRef,
        resolve: (node) => node.generatedCodeMetadata,
      }),
      command: t.field({
        type: 'Script',
        nullable: true,
        resolve: (node) => node.command ?? null,
      }),
    }),
  });

  // GeneratedCodeGraph
  builder.objectRef<GeneratedCodeGraph>('GeneratedCodeGraph').implement({
    fields: (t) => ({
      totalFiles: t.exposeInt('totalFiles'),
      namespace: t.exposeString('namespace'),
      graphId: t.exposeString('graphId'),
      originalGraphId: t.exposeString('originalGraphId'),
      nodes: t.field({
        type: [GeneratedCodeNodeRef],
        resolve: (graph) => graph.nodes,
      }),
    }),
  });

  // GraphValidation
  builder.objectRef<GraphValidation>('GraphValidation').implement({
    fields: (t) => ({
      isValid: t.exposeBoolean('isValid'),
      suggestedGraph: t.field({
        type: 'Graph',
        resolve: (validation) => validation.suggestedGraph,
      }),
    }),
  });

  // ConnectionValidation
  builder.objectRef<ConnectionValidation>('ConnectionValidation').implement({
    fields: (t) => ({
      isValid: t.exposeBoolean('isValid'),
      suggestion: t.expose('suggestion', { type: ConnectionTypeEnum }),
    }),
  });

  // Suggestion
  const SuggestionRef = builder.objectRef<Suggestion>('Suggestion');
  SuggestionRef.implement({
    fields: (t) => ({
      targetType: t.expose('targetType', { type: GraphNodeTypeEnum }),
      targetConnectionType: t.expose('targetConnectionType', { type: ConnectionTypeEnum }),
    }),
  });

  // GraphConnectionSuggestion
  builder.objectRef<GraphConnectionSuggestion>('GraphConnectionSuggestion').implement({
    fields: (t) => ({
      sourceId: t.exposeString('sourceId'),
      sourceType: t.expose('sourceType', { type: GraphNodeTypeEnum }),
      suggestions: t.field({
        type: [SuggestionRef],
        resolve: (suggestion) => suggestion.suggestions,
      }),
    }),
  });
}
