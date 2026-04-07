/**
 * MCP Codegen Tool Handlers
 * Provides Kubernetes manifest generation capabilities via MCP tools
 */

import type { MCPToolResult } from '../types';
import type { MCPToolServiceContext } from '../tool-registry';
import { GraphType } from '../../types/enums';
import type { Graph, GraphNode, Edge } from '../../types/graph';
import type { WorkflowContext } from '../../types/workflow';
import { v4 as uuidv4 } from 'uuid';

const noWorkflow: MCPToolResult = {
  content: [{ type: 'text', text: 'CodegenWorkflow is not available on this MCPService instance.' }],
  isError: true,
};

/**
 * Generate Kubernetes manifests from a graph specification
 */
export async function generateManifests(
  service: MCPToolServiceContext,
  params: {
    graphId?: string;
    namespace?: string;
    name?: string;
    description?: string;
    nodes?: GraphNode[];
    edges?: Edge[];
    modelProvider?: string;
    customInstructions?: string;
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  if (!service.codegenWorkflow) return noWorkflow;
  const codegenWorkflow = service.codegenWorkflow;

  try {
    console.info(`Generating manifests for graph: ${params.graphId || 'new graph'}`);

    // Create graph if nodes are provided, otherwise use existing graph ID
    let graph: Graph;
    if (params.nodes && params.nodes.length > 0) {
      graph = {
        id: params.graphId || uuidv4(),
        name: params.name || 'Generated Graph',
        description: params.description || 'Generated from MCP request',
        namespace: params.namespace || 'default',
        graphType: GraphType.KUBERNETES,
        nodes: params.nodes,
        bridges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: context.userId,
        companyId: context.companyId,
      };
    } else if (params.graphId) {
      return {
        content: [{
          type: 'text',
          text: `Fetching existing graph with ID ${params.graphId} is not yet implemented. Please provide node specifications.`
        }],
        isError: false,
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: 'Either graphId or nodes must be provided to generate manifests.'
        }],
        isError: true,
      };
    }

    const threadId = uuidv4();
    const workflowContext: WorkflowContext = {
      threadId,
      jobId: context.jobId || uuidv4(),
      userId: context.userId,
      companyId: context.companyId,
    };

    const result = await codegenWorkflow.run(graph, threadId, workflowContext, {
      maxRetries: 3,
      modelProvider: params.modelProvider as any,
      customInstructions: params.customInstructions,
    });

    if (result.success) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            graphId: result.generatedCode?.graphId,
            namespace: result.generatedCode?.namespace,
            totalFiles: result.generatedCode?.totalFiles,
            nodes: result.generatedCode?.nodes?.map((node: any) => ({
              id: node.id,
              nodeType: node.nodeType,
              name: node.name,
            })),
            duration: result.duration,
          }, null, 2)
        }],
        isError: false,
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: `Code generation failed: ${result.error || 'Unknown error'}`
        }],
        isError: true,
      };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error generating manifests: ${errorMessage}` }],
      isError: true,
    };
  }
}

/**
 * Get the status of a running codegen workflow
 */
export async function getCodegenStatus(
  service: MCPToolServiceContext,
  params: {
    threadId: string;
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  if (!service.codegenWorkflow) return noWorkflow;
  const codegenWorkflow = service.codegenWorkflow;

  try {
    const status = await codegenWorkflow.getStatus(params.threadId);

    if (!status) {
      return {
        content: [{ type: 'text', text: `No workflow found with threadId: ${params.threadId}` }],
        isError: false,
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          status: status.status,
          currentStep: status.currentStep,
          progress: {
            totalSteps: status.stepHistory.length + 1,
            completedSteps: status.stepHistory.length,
            currentStepName: status.currentStep,
          },
          error: status.error,
          duration: status.duration,
          retryCount: status.retryCount,
          generatedConfigurations: status.generatedConfigurations ? {
            totalFiles: status.generatedConfigurations.totalFiles,
            namespace: status.generatedConfigurations.namespace,
            nodes: status.generatedConfigurations.nodes?.length || 0,
          } : null,
        }, null, 2)
      }],
      isError: false,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error getting status: ${errorMessage}` }],
      isError: true,
    };
  }
}

/**
 * Cancel a running codegen workflow
 */
export async function cancelCodegen(
  service: MCPToolServiceContext,
  params: {
    threadId: string;
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  if (!service.codegenWorkflow) return noWorkflow;
  const codegenWorkflow = service.codegenWorkflow;

  try {
    const success = await codegenWorkflow.cancel(params.threadId);

    return {
      content: [{
        type: 'text',
        text: success
          ? `Successfully cancelled workflow: ${params.threadId}`
          : `Failed to cancel workflow ${params.threadId}. It may not exist or already be completed.`
      }],
      isError: !success,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error cancelling workflow: ${errorMessage}` }],
      isError: true,
    };
  }
}

/**
 * Validate generated Kubernetes manifests
 */
export async function validateManifests(
  service: MCPToolServiceContext,
  params: {
    threadId: string;
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  if (!service.codegenWorkflow) return noWorkflow;
  const codegenWorkflow = service.codegenWorkflow;

  try {
    const status = await codegenWorkflow.getStatus(params.threadId);

    if (!status) {
      return {
        content: [{ type: 'text', text: `No workflow found with threadId: ${params.threadId}` }],
        isError: false,
      };
    }

    const validationErrors = status.validationErrors || [];

    if (validationErrors.length === 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: true,
            message: 'All generated manifests are valid.',
            summary: {
              totalConfigurations: status.generatedConfigurations?.nodes?.length || 0,
              errors: 0,
              warnings: 0,
            }
          }, null, 2)
        }],
        isError: false,
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          valid: false,
          errors: validationErrors.filter((e: any) => e.severity === 'error').length,
          warnings: validationErrors.filter((e: any) => e.severity === 'warning').length,
          issues: validationErrors.map((e: any) => ({
            nodeId: e.nodeId,
            field: e.field,
            message: e.message,
            severity: e.severity,
          })),
        }, null, 2)
      }],
      isError: validationErrors.some((e: any) => e.severity === 'error'),
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error validating manifests: ${errorMessage}` }],
      isError: true,
    };
  }
}

/**
 * Get generated Kubernetes YAML manifests
 */
export async function getManifests(
  service: MCPToolServiceContext,
  params: {
    threadId: string;
    format?: 'yaml' | 'json';
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  if (!service.codegenWorkflow) return noWorkflow;
  const codegenWorkflow = service.codegenWorkflow;

  try {
    const status = await codegenWorkflow.getStatus(params.threadId);

    if (!status) {
      return {
        content: [{ type: 'text', text: `No workflow found with threadId: ${params.threadId}` }],
        isError: false,
      };
    }

    if (status.status !== 'completed') {
      return {
        content: [{ type: 'text', text: `Workflow is not complete. Current status: ${status.status}` }],
        isError: true,
      };
    }

    const nodes = status.generatedConfigurations?.nodes || [];
    const format = params.format || 'yaml';

    if (format === 'json') {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            graphId: status.generatedConfigurations?.graphId,
            namespace: status.generatedConfigurations?.namespace,
            manifests: nodes.map((node: any) => ({
              id: node.id,
              nodeType: node.nodeType,
              name: node.name,
              config: node.config,
              spec: node.spec,
            })),
          }, null, 2)
        }],
        isError: false,
      };
    }

    const combinedYaml = nodes
      .map((node: any) => `# ${node.nodeType}: ${node.name}\n${node.config || ''}`)
      .join('\n---\n\n');

    return {
      content: [{ type: 'text', text: combinedYaml }],
      isError: false,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error getting manifests: ${errorMessage}` }],
      isError: true,
    };
  }
}
