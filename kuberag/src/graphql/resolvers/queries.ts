/**
 * GraphQL query resolvers
 * Implements the Query fields in api/schema.graphql
 */

import type { SchemaBuilder } from '../schema';
import { entityService } from '../../services/entity-service';
import { codegenService } from '../../services/codegen-service';
import { planService } from '../../services/plan-service';
import { ConnectionType, GraphNodeType, GraphType } from '../../types/enums';
import type { Graph, GraphNode } from '../../types/graph';
import { validateGraph as validateGraphStructure } from '../../utils/codegen';
import { ConnectionTypeEnum, GraphNodeTypeEnum } from '../types/enums';

const CONNECTION_RULES: Array<{
  sourceType: GraphNodeType;
  targetType: GraphNodeType;
  connectionType: ConnectionType;
}> = [
    { sourceType: GraphNodeType.SERVICE, targetType: GraphNodeType.DEPLOYMENT, connectionType: ConnectionType.SERVICE_EXPOSES_POD },
    { sourceType: GraphNodeType.SERVICE, targetType: GraphNodeType.POD, connectionType: ConnectionType.SERVICE_EXPOSES_POD },
    { sourceType: GraphNodeType.INGRESS, targetType: GraphNodeType.SERVICE, connectionType: ConnectionType.INGRESS_ROUTES_TO_SERVICE },
    { sourceType: GraphNodeType.POD, targetType: GraphNodeType.NODE, connectionType: ConnectionType.POD_RUNS_ON_NODE },
    { sourceType: GraphNodeType.DEPLOYMENT, targetType: GraphNodeType.REPLICASET, connectionType: ConnectionType.MANAGES },
    { sourceType: GraphNodeType.REPLICASET, targetType: GraphNodeType.POD, connectionType: ConnectionType.MANAGES },
    { sourceType: GraphNodeType.MICROSERVICE, targetType: GraphNodeType.DATABASE, connectionType: ConnectionType.MICROSERVICE_DEPENDS_ON },
    { sourceType: GraphNodeType.MICROSERVICE, targetType: GraphNodeType.CACHE, connectionType: ConnectionType.MICROSERVICE_DEPENDS_ON },
    { sourceType: GraphNodeType.MICROSERVICE, targetType: GraphNodeType.MESSAGE_QUEUE, connectionType: ConnectionType.MICROSERVICE_DEPENDS_ON },
  ];

function parseGraphNodeType(value: string): GraphNodeType | null {
  const upper = value.toUpperCase();
  if (upper in GraphNodeType) {
    return GraphNodeType[upper as keyof typeof GraphNodeType];
  }
  return null;
}

function findConnectionType(sourceType: GraphNodeType, targetType: GraphNodeType): ConnectionType | null {
  const match = CONNECTION_RULES.find(
    (rule) => rule.sourceType === sourceType && rule.targetType === targetType,
  );
  return match?.connectionType ?? null;
}

export function registerQueries(builder: SchemaBuilder) {
  builder.queryType({
    fields: (t) => ({
      // Get a graph by ID
      graph: t.field({
        type: 'Graph',
        nullable: true,
        args: {
          id: t.arg.id({ required: true }),
          companyId: t.arg.string(),
          userId: t.arg.string(),
        },
        resolve: async (_root, args) => {
          return entityService.getGraph(
            args.id as string,
            args.companyId ?? undefined,
            args.userId ?? undefined,
          );
        },
      }),

      // Get all graphs for a company
      graphs: t.field({
        type: ['Graph'],
        args: {
          companyId: t.arg.string({ required: true }),
          userId: t.arg.string(),
          limit: t.arg.int(),
        },
        resolve: async (_root, args) => {
          return entityService.getGraphs(
            args.companyId,
            args.userId ?? undefined,
            args.limit ?? undefined,
          );
        },
      }),

      // Get graphs by name
      graphByName: t.field({
        type: ['Graph'],
        args: {
          name: t.arg.string({ required: true }),
          companyId: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          const graph = await entityService.getGraphByName(args.name, args.companyId);
          return graph ? [graph] : [];
        },
      }),

      // Get a microservice by ID
      microservice: t.field({
        type: 'Microservice',
        nullable: true,
        args: {
          id: t.arg.id({ required: true }),
        },
        resolve: async (_root, args) => {
          return entityService.getMicroservice(args.id as string);
        },
      }),

      // Get all microservices
      microservices: t.field({
        type: ['Microservice'],
        args: {
          companyId: t.arg.string({ required: true }),
          limit: t.arg.int(),
        },
        resolve: async (_root, args) => {
          return entityService.getMicroservices(
            args.companyId,
            args.limit ?? undefined,
          );
        },
      }),

      // Get job status
      jobStatus: t.field({
        type: 'JobStatus',
        args: {
          input: t.arg({ type: 'JobStatusInput', required: true }),
        },
        resolve: async (_root, args) => {
          const status = await codegenService.getJobStatus(args.input.jobId);
          if (!status) {
            throw new Error(`Job not found: ${args.input.jobId}`);
          }
          return status;
        },
      }),

      // Get generated code
      generatedCode: t.field({
        type: 'GeneratedCodeGraph',
        nullable: true,
        args: {
          jobId: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          return codegenService.getGeneratedCode(args.jobId);
        },
      }),

      // Get plan result
      getPlan: t.field({
        type: 'PlanResult',
        nullable: true,
        args: {
          jobId: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          const result = await planService.getJobResult(args.jobId);
          return result?.planResult;
        }
      }),

      // Validate a graph structure
      validateGraph: t.field({
        type: 'GraphValidation',
        args: {
          graphId: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          const graph = await entityService.getGraph(args.graphId);
          if (!graph) {
            throw new Error(`Graph not found: ${args.graphId}`);
          }

          const validation = validateGraphStructure(graph as Graph);
          return {
            isValid: validation.isValid,
            suggestedGraph: graph,
          };
        },
      }),

      // Get external dependencies for a graph
      externalDependencies: t.field({
        type: ['GraphNode'],
        args: {
          graphId: t.arg.id({ required: true }),
        },
        resolve: async (_root, args) => {
          const graph = await entityService.getGraph(args.graphId as string);
          if (!graph || !graph.nodes) {
            return [];
          }
          return graph.nodes.filter((node) => node.nodeType === GraphNodeType.EXTERNAL_DEPENDENCY);
        },
      }),

      // Get nodes for a graph
      nodes: t.field({
        type: ['GraphNode'],
        args: {
          graphId: t.arg.id({ required: true }),
        },
        resolve: async (_root, args) => {
          const graph = await entityService.getGraph(args.graphId as string);
          return graph?.nodes ?? [];
        },
      }),

      // Get connection type between nodes (by node types)
      connectionType: t.field({
        type: ConnectionTypeEnum,
        nullable: true,
        args: {
          graphId: t.arg.id({ required: true }),
          sourceType: t.arg.string({ required: true }),
          targetType: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          const sourceType = parseGraphNodeType(args.sourceType);
          const targetType = parseGraphNodeType(args.targetType);

          if (!sourceType || !targetType) {
            return null;
          }

          return findConnectionType(sourceType, targetType);
        },
      }),

      // Validate a connection between nodes
      validateConnection: t.field({
        type: 'ConnectionValidation',
        args: {
          input: t.arg({ type: 'ValidateConnectionInput', required: true }),
        },
        resolve: async (_root, args) => {
          if (args.input.connectionType) {
            return {
              isValid: true,
              suggestion: args.input.connectionType,
            };
          }

          return {
            isValid: false,
            suggestion: ConnectionType.CUSTOM,
          };
        },
      }),

      // Get suggestions for graph connections
      getSuggestion: t.field({
        type: 'GraphConnectionSuggestion',
        args: {
          sourceId: t.arg.string({ required: true }),
          sourceType: t.arg({ type: GraphNodeTypeEnum, required: true }),
        },
        resolve: async (_root, args) => {
          const suggestions = CONNECTION_RULES
            .filter((rule) => rule.sourceType === args.sourceType)
            .map((rule) => ({
              targetType: rule.targetType,
              targetConnectionType: rule.connectionType,
            }));

          return {
            sourceId: args.sourceId,
            sourceType: args.sourceType,
            suggestions,
          };
        },
      }),

      // Get external dependency by ID
      externalDependency: t.field({
        type: 'GraphNode',
        args: {
          graphId: t.arg.id({ required: true }),
          id: t.arg.id({ required: true }),
        },
        resolve: async (_root, args) => {
          const graph = await entityService.getGraph(args.graphId as string);
          const node = graph?.nodes?.find((n) => n.id === (args.id as string));
          if (!node) {
            throw new Error(`External dependency not found: ${args.id}`);
          }
          return node as GraphNode;
        },
      }),

      // Get Kubernetes cluster by ID
      kubernetesCluster: t.field({
        type: 'KubernetesCluster',
        args: {
          id: t.arg.id({ required: true }),
        },
        resolve: async () => {
          throw new Error('kubernetesCluster is not yet implemented');
        },
      }),

      // Get all Kubernetes clusters
      kubernetesClusters: t.field({
        type: ['KubernetesCluster'],
        args: {
          companyId: t.arg.string({ required: true }),
        },
        resolve: async () => {
          return [];
        },
      }),

      // Get Kubernetes graph by ID
      kubernetesGraph: t.field({
        type: 'Graph',
        args: {
          id: t.arg.id({ required: true }),
        },
        resolve: async (_root, args) => {
          const graph = await entityService.getGraph(args.id as string);
          if (!graph || graph.graphType !== GraphType.KUBERNETES) {
            throw new Error(`Kubernetes graph not found: ${args.id}`);
          }
          return graph;
        },
      }),

      // Get all Kubernetes graphs
      kubernetesGraphs: t.field({
        type: ['Graph'],
        args: {
          companyId: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          const graphs = await entityService.getGraphs(args.companyId);
          return graphs.filter((graph) => graph.graphType === GraphType.KUBERNETES);
        },
      }),

      // Get Kubernetes resources by namespace
      kubernetesResourcesByNamespace: t.field({
        type: ['GraphNode'],
        args: {
          companyId: t.arg.string({ required: true }),
          namespace: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          const graphs = await entityService.getGraphs(args.companyId);
          const nodes = graphs
            .filter((graph) => graph.graphType === GraphType.KUBERNETES)
            .flatMap((graph) => graph.nodes ?? []);

          return nodes.filter((node) => node.namespace === args.namespace);
        },
      }),

      // Get Kubernetes resources by type
      kubernetesResourcesByType: t.field({
        type: ['GraphNode'],
        args: {
          companyId: t.arg.string({ required: true }),
          type: t.arg.string({ required: true }),
        },
        resolve: async (_root, args) => {
          const nodeType = parseGraphNodeType(args.type);
          if (!nodeType) {
            return [];
          }

          const graphs = await entityService.getGraphs(args.companyId);
          const nodes = graphs
            .filter((graph) => graph.graphType === GraphType.KUBERNETES)
            .flatMap((graph) => graph.nodes ?? []);

          return nodes.filter((node) => node.nodeType === nodeType);
        },
      }),

      // Get node by ID
      node: t.field({
        type: 'GraphNode',
        args: {
          id: t.arg.id({ required: true }),
        },
        resolve: async () => {
          throw new Error('node lookup by id is not yet implemented');
        },
      }),
    }),
  });
}
