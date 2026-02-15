/**
 * MCP Tool Registry
 * Central registry for all MCP tools exposed to the operator
 */

import { MCPTool, MCPToolResult } from './types';
import type { WorkflowContext } from '../types/workflow';

// Import tool handlers
import {
  generateManifests,
  getCodegenStatus,
  cancelCodegen,
  validateManifests,
  getManifests,
} from './tools/codegen';

import {
  createPlan,
  getPlanStatus,
  cancelPlan,
  analyzeGraph,
  getPlanGraph,
} from './tools/planning';

import {
  queryGraphs,
  getGraph,
  createGraph,
  updateGraph,
  deleteGraph,
  getRAGContext,
} from './tools/graphs';

// Tool registry with metadata
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  handler: (params: any, context: WorkflowContext) => Promise<MCPToolResult>;
}

export const mcpTools: ToolDefinition[] = [
  // Codegen tools
  {
    name: 'generate_manifests',
    description: 'Generate Kubernetes manifests from a graph specification',
    inputSchema: {
      type: 'object',
      properties: {
        graphId: { type: 'string', description: 'Existing graph ID (optional if nodes provided)' },
        namespace: { type: 'string', description: 'Kubernetes namespace' },
        name: { type: 'string', description: 'Graph name for new graphs' },
        description: { type: 'string', description: 'Graph description' },
        nodes: { type: 'array', description: 'Array of node specifications' },
        edges: { type: 'array', description: 'Array of edge specifications' },
        modelProvider: { type: 'string', description: 'LLM provider (claude, openai, etc.)' },
        customInstructions: { type: 'string', description: 'Custom instructions for code generation' },
      },
    },
    handler: generateManifests,
  },
  {
    name: 'get_codegen_status',
    description: 'Get the status of a running codegen workflow',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Workflow thread ID' },
      },
      required: ['threadId'],
    },
    handler: getCodegenStatus,
  },
  {
    name: 'cancel_codegen',
    description: 'Cancel a running codegen workflow',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Workflow thread ID' },
      },
      required: ['threadId'],
    },
    handler: cancelCodegen,
  },
  {
    name: 'validate_manifests',
    description: 'Validate generated Kubernetes manifests',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Workflow thread ID' },
      },
      required: ['threadId'],
    },
    handler: validateManifests,
  },
  {
    name: 'get_manifests',
    description: 'Get generated Kubernetes manifests',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Workflow thread ID' },
        format: { type: 'string', enum: ['yaml', 'json'], description: 'Output format' },
      },
      required: ['threadId'],
    },
    handler: getManifests,
  },

  // Planning tools
  {
    name: 'create_plan',
    description: 'Create an infrastructure plan from natural language requirements',
    inputSchema: {
      type: 'object',
      properties: {
        userRequest: { type: 'string', description: 'Natural language description of the infrastructure needed' },
        namespace: { type: 'string', description: 'Kubernetes namespace' },
        existingGraphId: { type: 'string', description: 'Optional existing graph to modify' },
        modelProvider: { type: 'string', description: 'LLM provider' },
        customContext: { type: 'array', items: { type: 'string' }, description: 'Custom context messages' },
      },
      required: ['userRequest'],
    },
    handler: createPlan,
  },
  {
    name: 'get_plan_status',
    description: 'Get the status of a running planning workflow',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Workflow thread ID' },
      },
      required: ['threadId'],
    },
    handler: getPlanStatus,
  },
  {
    name: 'cancel_plan',
    description: 'Cancel a running planning workflow',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Workflow thread ID' },
      },
      required: ['threadId'],
    },
    handler: cancelPlan,
  },
  {
    name: 'analyze_graph',
    description: 'Analyze a planned graph for issues and improvements',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Workflow thread ID' },
      },
      required: ['threadId'],
    },
    handler: analyzeGraph,
  },
  {
    name: 'get_plan_graph',
    description: 'Get the generated graph details',
    inputSchema: {
      type: 'object',
      properties: {
        threadId: { type: 'string', description: 'Workflow thread ID' },
        format: { type: 'string', enum: ['json', 'yaml'], description: 'Output format' },
      },
      required: ['threadId'],
    },
    handler: getPlanGraph,
  },

  // Graph management tools
  {
    name: 'query_graphs',
    description: 'Query existing graphs from the database',
    inputSchema: {
      type: 'object',
      properties: {
        namespace: { type: 'string', description: 'Filter by namespace' },
        graphType: { type: 'string', description: 'Filter by graph type' },
        nameContains: { type: 'string', description: 'Search in graph names' },
        limit: { type: 'number', description: 'Maximum results to return' },
        offset: { type: 'number', description: 'Pagination offset' },
      },
    },
    handler: queryGraphs,
  },
  {
    name: 'get_graph',
    description: 'Get a specific graph by ID',
    inputSchema: {
      type: 'object',
      properties: {
        graphId: { type: 'string', description: 'Graph ID' },
        includeNodes: { type: 'boolean', description: 'Include full node details' },
        includeBridges: { type: 'boolean', description: 'Include bridge details' },
      },
      required: ['graphId'],
    },
    handler: getGraph,
  },
  {
    name: 'create_graph',
    description: 'Create a new graph',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Graph name' },
        description: { type: 'string', description: 'Graph description' },
        namespace: { type: 'string', description: 'Kubernetes namespace' },
        graphType: { type: 'string', description: 'Graph type (KUBERNETES, INFRASTRUCTURE, etc.)' },
        nodes: { type: 'array', description: 'Initial nodes for the graph' },
      },
      required: ['name'],
    },
    handler: createGraph,
  },
  {
    name: 'update_graph',
    description: 'Update an existing graph',
    inputSchema: {
      type: 'object',
      properties: {
        graphId: { type: 'string', description: 'Graph ID' },
        name: { type: 'string', description: 'New graph name' },
        description: { type: 'string', description: 'New graph description' },
        namespace: { type: 'string', description: 'New namespace' },
      },
      required: ['graphId'],
    },
    handler: updateGraph,
  },
  {
    name: 'delete_graph',
    description: 'Delete a graph',
    inputSchema: {
      type: 'object',
      properties: {
        graphId: { type: 'string', description: 'Graph ID' },
      },
      required: ['graphId'],
    },
    handler: deleteGraph,
  },
  {
    name: 'get_rag_context',
    description: 'Get RAG context for a specific graph',
    inputSchema: {
      type: 'object',
      properties: {
        graphId: { type: 'string', description: 'Graph ID' },
        limit: { type: 'number', description: 'Number of similar graphs to retrieve' },
      },
      required: ['graphId'],
    },
    handler: getRAGContext,
  },
];

// Export tool names for easy reference
export const ToolNames = {
  // Codegen
  GENERATE_MANIFESTS: 'generate_manifests',
  GET_CODEGEN_STATUS: 'get_codegen_status',
  CANCEL_CODEGEN: 'cancel_codegen',
  VALIDATE_MANIFESTS: 'validate_manifests',
  GET_MANIFESTS: 'get_manifests',
  
  // Planning
  CREATE_PLAN: 'create_plan',
  GET_PLAN_STATUS: 'get_plan_status',
  CANCEL_PLAN: 'cancel_plan',
  ANALYZE_GRAPH: 'analyze_graph',
  GET_PLAN_GRAPH: 'get_plan_graph',
  
  // Graph management
  QUERY_GRAPHS: 'query_graphs',
  GET_GRAPH: 'get_graph',
  CREATE_GRAPH: 'create_graph',
  UPDATE_GRAPH: 'update_graph',
  DELETE_GRAPH: 'delete_graph',
  GET_RAG_CONTEXT: 'get_rag_context',
} as const;

// Helper to get tool by name
export function getTool(name: string): ToolDefinition | undefined {
  return mcpTools.find(tool => tool.name === name);
}