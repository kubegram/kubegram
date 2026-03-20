import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PlanService } from '@/services/plan';
import { mcpJson, mcpError } from '@/mcp/types';
import type { AuthContext } from '@/middleware/auth';

const planService = new PlanService();

export function registerPlanTools(server: McpServer, auth: AuthContext): void {
  const userId = parseInt(auth.user.id);

  server.registerTool(
    'create_plan',
    {
      title: 'Create Infrastructure Plan',
      description: 'Start an AI-driven infrastructure planning job for a graph',
      inputSchema: {
        graph: z.any().describe('Graph data to plan infrastructure for'),
        userRequest: z
          .string()
          .optional()
          .describe('Natural language instruction for the planner'),
        modelProvider: z.string().optional().describe('LLM provider (e.g. CLAUDE, OPENAI)'),
        modelName: z.string().optional().describe('LLM model name'),
      },
    },
    async ({ graph, userRequest, modelProvider, modelName }) => {
      try {
        const result = await planService.initializePlan(userId, {
          graph,
          userRequest,
          modelProvider,
          modelName,
        });
        return mcpJson(result);
      } catch (error) {
        return mcpError(`Failed to create plan: ${(error as Error).message}`);
      }
    }
  );

  server.registerTool(
    'get_plan_status',
    {
      title: 'Get Plan Status',
      description: 'Get the status of an infrastructure planning job',
      inputSchema: {
        jobId: z.string().describe('Job ID returned from create_plan'),
      },
    },
    async ({ jobId }) => {
      try {
        const status = await planService.getPlanStatus(jobId);
        return mcpJson(status);
      } catch (error) {
        return mcpError(`Failed to get plan status: ${(error as Error).message}`);
      }
    }
  );

  server.registerTool(
    'get_plan_results',
    {
      title: 'Get Plan Results',
      description: 'Get the results of a completed infrastructure planning job',
      inputSchema: {
        jobId: z.string().describe('Job ID of a completed planning job'),
      },
    },
    async ({ jobId }) => {
      try {
        const results = await planService.getPlanResults(jobId);
        return mcpJson(results);
      } catch (error) {
        return mcpError(`Failed to get plan results: ${(error as Error).message}`);
      }
    }
  );
}
