/**
 * MCP Planning Tool Handlers
 * Provides infrastructure planning capabilities via MCP tools
 */

import type { MCPToolResult } from '../types';
import { PlanWorkflow } from '../../workflows/plan-workflow';
import { planCheckpointer } from '../../state/checkpointer';
import { planPubSub } from '../../state/pubsub';
import { GraphType } from '../../types/enums';
import type { Graph, NodeInput, EdgeInput } from '../../types/graph';
import type { WorkflowContext } from '../../types/workflow';
import { v4 as uuidv4 } from 'uuid';

const planWorkflow = new PlanWorkflow();

/**
 * Create an infrastructure plan from natural language requirements
 */
export async function createPlan(
  params: {
    userRequest: string;
    namespace?: string;
    existingGraphId?: string;
    modelProvider?: string;
    customContext?: string[];
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  try {
    console.info(`Creating plan for request: ${params.userRequest.slice(0, 50)}...`);

    const threadId = uuidv4();
    const workflowContext: WorkflowContext = {
      threadId,
      jobId: context.jobId || uuidv4(),
      userId: context.userId,
      companyId: context.companyId,
      userContext: params.customContext,
    };

    // Create initial graph structure
    const initialGraph: Graph = {
      id: params.existingGraphId || uuidv4(),
      name: `Plan for: ${params.userRequest.slice(0, 50)}...`,
      description: params.userRequest,
      namespace: params.namespace || 'default',
      graphType: GraphType.KUBERNETES,
      nodes: [],
      bridges: [],
      userId: context.userId,
      companyId: context.companyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Run the plan workflow
    const result = await planWorkflow.run(
      params.userRequest,
      threadId,
      workflowContext,
      {
        maxRetries: 3,
        modelProvider: params.modelProvider as any,
        graph: initialGraph,
      }
    );

    if (result.success) {
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({
            success: true,
            threadId,
            graphId: result.planResult?.graph.id,
            graphName: result.planResult?.graph.name,
            nodeCount: result.planResult?.graph.nodes?.length || 0,
            context: result.planResult?.context,
            duration: result.duration,
          }, null, 2)
        }],
        isError: false,
      };
    } else {
      return {
        content: [{ 
          type: 'text', 
          text: `Planning failed: ${result.error || 'Unknown error'}` 
        }],
        isError: true,
      };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ 
        type: 'text', 
        text: `Error creating plan: ${errorMessage}` 
      }],
      isError: true,
    };
  }
}

/**
 * Get the status of a running planning workflow
 */
export async function getPlanStatus(
  params: {
    threadId: string;
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  try {
    const status = await planWorkflow.getStatus(params.threadId);
    
    if (!status) {
      return {
        content: [{ 
          type: 'text', 
          text: `No workflow found with threadId: ${params.threadId}` 
        }],
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
          userRequest: status.userRequest,
          graph: status.graph ? {
            id: status.graph.id,
            name: status.graph.name,
            nodeCount: status.graph.nodes?.length || 0,
          } : null,
          planContext: status.planContext,
          validationErrors: status.validationErrors?.map(err => ({
            field: err.field,
            message: err.message,
            severity: err.severity,
          })),
        }, null, 2)
      }],
      isError: false,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ 
        type: 'text', 
        text: `Error getting plan status: ${errorMessage}` 
      }],
      isError: true,
    };
  }
}

/**
 * Cancel a running planning workflow
 */
export async function cancelPlan(
  params: {
    threadId: string;
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  try {
    const success = await planWorkflow.cancel(params.threadId);
    
    return {
      content: [{ 
        type: 'text', 
        text: success 
          ? `Successfully cancelled planning workflow: ${params.threadId}` 
          : `Failed to cancel planning workflow ${params.threadId}. It may not exist or already be completed.`
      }],
      isError: !success,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ 
        type: 'text', 
        text: `Error cancelling plan: ${errorMessage}` 
      }],
      isError: true,
    };
  }
}

/**
 * Analyze a planned graph for issues and improvements
 */
export async function analyzeGraph(
  params: {
    threadId: string;
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  try {
    const status = await planWorkflow.getStatus(params.threadId);
    
    if (!status) {
      return {
        content: [{ 
          type: 'text', 
          text: `No workflow found with threadId: ${params.threadId}` 
        }],
        isError: false,
      };
    }

    if (!status.graph) {
      return {
        content: [{ 
          type: 'text', 
          text: 'No graph found in the workflow yet.' 
        }],
        isError: false,
      };
    }

    // Analyze graph structure
    const nodes = status.graph.nodes || [];
    const bridges = status.graph.bridges || [];
    
    const analysis = {
      totalNodes: nodes.length,
      totalBridges: bridges.length,
      nodeTypes: nodes.reduce((acc: Record<string, number>, node) => {
        const type = node.nodeType || node.microservice ? 'microservice' : node.database ? 'database' : 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      validation: {
        hasErrors: status.validationErrors && status.validationErrors.length > 0,
        errorCount: status.validationErrors?.length || 0,
        errors: status.validationErrors?.map(err => ({
          field: err.field,
          message: err.message,
          severity: err.severity,
        })),
      },
      recommendations: status.planContext?.filter((ctx: string) => 
        ctx.toLowerCase().includes('recommend') || 
        ctx.toLowerCase().includes('consider') ||
        ctx.toLowerCase().includes('should')
      ),
    };

    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify(analysis, null, 2)
      }],
      isError: false,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ 
        type: 'text', 
        text: `Error analyzing graph: ${errorMessage}` 
      }],
      isError: true,
    };
  }
}

/**
 * Get the generated graph details
 */
export async function getPlanGraph(
  params: {
    threadId: string;
    format?: 'json' | 'yaml';
  },
  context: WorkflowContext
): Promise<MCPToolResult> {
  try {
    const status = await planWorkflow.getStatus(params.threadId);
    
    if (!status) {
      return {
        content: [{ 
          type: 'text', 
          text: `No workflow found with threadId: ${params.threadId}` 
        }],
        isError: false,
      };
    }

    if (!status.graph) {
      return {
        content: [{ 
          type: 'text', 
          text: 'No graph has been generated yet.' 
        }],
        isError: false,
      };
    }

    const format = params.format || 'json';

    if (format === 'json') {
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({
            graph: {
              id: status.graph.id,
              name: status.graph.name,
              description: status.graph.description,
              namespace: status.graph.namespace,
              graphType: status.graph.graphType,
              nodes: status.graph.nodes?.map(node => ({
                id: node.id,
                name: node.name,
                nodeType: node.nodeType,
                namespace: node.namespace,
              })),
              bridges: status.graph.bridges,
            },
            context: status.planContext,
          }, null, 2)
        }],
        isError: false,
      };
    }

    // YAML format
    const yamlContent = `# Generated Graph
id: ${status.graph.id}
name: ${status.graph.name}
description: ${status.graph.description || 'N/A'}
namespace: ${status.graph.namespace || 'default'}
graphType: ${status.graph.graphType}

nodes:
${status.graph.nodes?.map(node => `  - id: ${node.id}
    name: ${node.name}
    nodeType: ${node.nodeType || 'unknown'}
    namespace: ${node.namespace || 'default'}`).join('\n') || '  []'}

context:
${status.planContext?.map((ctx: string) => `  - ${ctx}`).join('\n') || '  []'}
`;

    return {
      content: [{ 
        type: 'text', 
        text: yamlContent 
      }],
      isError: false,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ 
        type: 'text', 
        text: `Error getting plan graph: ${errorMessage}` 
      }],
      isError: true,
    };
  }
}