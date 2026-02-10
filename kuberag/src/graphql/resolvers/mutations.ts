/**
 * GraphQL mutation resolvers
 * Implements the Mutation fields in api/schema.graphql
 */

import { v4 as uuidv4 } from 'uuid';
import type { SchemaBuilder } from '../schema';
import { entityService } from '../../services/entity-service';
import { codegenService } from '../../services/codegen-service';
import { planService } from '../../services/plan-service';
import { GraphNodeType, GraphType } from '../../types/enums';
import type { Graph, GraphNode } from '../../types/graph';

export function registerMutations(builder: SchemaBuilder) {
  builder.mutationType({
    fields: (t) => ({
      // Create a graph
      createGraph: t.field({
        type: 'Graph',
        args: {
          input: t.arg({ type: 'CreateGraphInput', required: true }),
        },
        resolve: async (_root, args) => {
          return entityService.createGraph(args.input as any);
        },
      }),

      // Create a Kubernetes cluster
      createKubernetesCluster: t.field({
        type: 'KubernetesCluster',
        args: {
          input: t.arg({ type: 'CreateKubernetesClusterInput', required: true }),
        },
        resolve: async () => {
          throw new Error('createKubernetesCluster is not yet implemented');
        },
      }),

      // Create a Kubernetes graph
      createKubernetesGraph: t.field({
        type: 'Graph',
        args: {
          input: t.arg({ type: 'CreateKubernetesGraphInput', required: true }),
        },
        resolve: async (_root, args) => {
          const input = args.input as any;
          return entityService.createGraph({
            name: input.name,
            description: input.description,
            graphType: GraphType.KUBERNETES,
            companyId: input.companyId,
            userId: input.userId,
            clusterId: input.clusterId,
          });
        },
      }),

      // Update a graph
      updateGraph: t.field({
        type: 'Graph',
        nullable: true,
        args: {
          id: t.arg.id({ required: true }),
          input: t.arg({ type: 'UpdateGraphInput', required: true }),
        },
        resolve: async (_root, args) => {
          return entityService.updateGraph(args.id as string, args.input as any);
        },
      }),

      // Delete a graph
      deleteGraph: t.field({
        type: 'Boolean',
        args: {
          id: t.arg.id({ required: true }),
          companyId: t.arg.string(),
          userId: t.arg.string(),
        },
        resolve: async (_root, args) => {
          return entityService.deleteGraph(
            args.id as string,
            args.companyId ?? undefined,
            args.userId ?? undefined,
          );
        },
      }),

      // Create a microservice
      createMicroservice: t.field({
        type: 'Microservice',
        args: {
          input: t.arg({ type: 'CreateMicroserviceInput', required: true }),
        },
        resolve: async (_root, args) => {
          return entityService.createMicroservice(args.input as any);
        },
      }),

      // Update a microservice
      updateMicroservice: t.field({
        type: 'Microservice',
        nullable: true,
        args: {
          input: t.arg({ type: 'UpdateMicroserviceInput', required: true }),
        },
        resolve: async (_root, args) => {
          const input = args.input as any;
          return entityService.updateMicroservice(input.id, input);
        },
      }),

      // Update a Kubernetes cluster
      updateKubernetesCluster: t.field({
        type: 'KubernetesCluster',
        nullable: true,
        args: {
          input: t.arg({ type: 'UpdateKubernetesClusterInput', required: true }),
        },
        resolve: async () => {
          throw new Error('updateKubernetesCluster is not yet implemented');
        },
      }),

      // Update a Kubernetes graph
      updateKubernetesGraph: t.field({
        type: 'Graph',
        nullable: true,
        args: {
          input: t.arg({ type: 'UpdateKubernetesGraphInput', required: true }),
        },
        resolve: async (_root, args) => {
          const input = args.input as any;
          return entityService.updateGraph(input.id, {
            id: input.id,
            name: input.name,
            description: input.description,
          } as any);
        },
      }),

      // Delete a microservice
      deleteMicroservice: t.field({
        type: 'Boolean',
        args: {
          id: t.arg.id({ required: true }),
          companyId: t.arg.string({ required: true }),
          userId: t.arg.string(),
        },
        resolve: async (_root, args) => {
          return entityService.deleteMicroservice(
            args.id as string,
            args.companyId ?? undefined,
            args.userId ?? undefined,
          );
        },
      }),

      // Delete a Kubernetes cluster
      deleteKubernetesCluster: t.field({
        type: 'Boolean',
        args: {
          id: t.arg.id({ required: true }),
          companyId: t.arg.string({ required: true }),
          userId: t.arg.string(),
        },
        resolve: async () => {
          throw new Error('deleteKubernetesCluster is not yet implemented');
        },
      }),

      // Delete a Kubernetes graph
      deleteKubernetesGraph: t.field({
        type: 'Boolean',
        args: {
          id: t.arg.id({ required: true }),
          companyId: t.arg.string(),
          userId: t.arg.string(),
        },
        resolve: async (_root, args) => {
          return entityService.deleteGraph(
            args.id as string,
            args.companyId ?? undefined,
            args.userId ?? undefined,
          );
        },
      }),

      // Initialize code generation
      initializeCodeGen: t.field({
        type: 'JobStatus',
        args: {
          input: t.arg({ type: 'GenerateCodeInput', required: true }),
        },
        resolve: async (_root, args) => {
          const input = args.input as any;

          // Build GraphNode array from input nodes
          const graphNodes: GraphNode[] = [];
          if (input.graph.nodes) {
            for (const nodeInput of input.graph.nodes) {
              let nodeTypeEnum = GraphNodeType.MICROSERVICE;
              if (nodeInput.nodeType) {
                const upperType = nodeInput.nodeType.toUpperCase();
                if (upperType in GraphNodeType) {
                  nodeTypeEnum = GraphNodeType[upperType as keyof typeof GraphNodeType];
                } else {
                  console.warn(`Invalid nodeType '${nodeInput.nodeType}', falling back to MICROSERVICE`);
                }
              }

              graphNodes.push({
                id: nodeInput.id || uuidv4(),
                name: nodeInput.name,
                nodeType: nodeTypeEnum,
                companyId: nodeInput.companyId,
                userId: nodeInput.userId,
                namespace: nodeInput.namespace,
                spec: nodeInput.spec,
                edges: [],
              });
            }
          }

          const graph: Graph = {
            id: input.graph.id || uuidv4(),
            name: input.graph.name,
            graphType: input.graph.graphType || GraphType.MICROSERVICE,
            companyId: input.graph.companyId,
            userId: input.graph.userId,
            description: input.graph.description,
            nodes: graphNodes,
          };

          const provider = input.llmConfig?.provider ?? undefined;
          const modelName = input.llmConfig?.model ?? undefined;
          return codegenService.submitJob(
            graph,
            { modelProvider: provider, modelName },
            input.context
          );
        },
      }),

      // Deploy infrastructure (stub)
      deployInfrastructure: t.field({
        type: 'Graph',
        args: {
          input: t.arg({ type: 'DeployInfrastructureInput', required: true }),
        },
        resolve: async () => {
          // TODO: Implement deployment via MCP integration
          throw new Error('deployInfrastructure is not yet implemented');
        },
      }),

      // Initialize planning workflow
      initializePlan: t.field({
        type: 'PlanJobStatus',
        args: {
          input: t.arg({ type: 'InitializePlanInput', required: true }),
        },
        resolve: async (_root, args) => {
          const input = args.input as any;
          return planService.submitJob(input.userRequest || '', {
            modelProvider: input.modelProvider,
            modelName: input.modelName,
            graph: input.graph // Now required
          });
        },
      }),
    }),
  });
}
