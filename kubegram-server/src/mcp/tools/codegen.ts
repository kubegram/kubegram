import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db } from '@/db';
import { generationJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CodegenService } from '@/services/codegen';
import { GraphPermissions } from '@/services/permissions';
import { mcpJson, mcpError } from '@/mcp/types';
import type { AuthContext } from '@/middleware/auth';

const codegenService = new CodegenService();

export function registerCodegenTools(server: McpServer, auth: AuthContext): void {
  const userId = parseInt(auth.user.id);

  server.registerTool(
    'generate_manifests',
    {
      title: 'Generate Kubernetes Manifests',
      description:
        'Start a code generation job for a graph. Returns a jobId to poll for status.',
      inputSchema: {
        graphName: z.string().describe('Name of the graph / project'),
        graphType: z
          .enum(['KUBERNETES', 'INFRASTRUCTURE', 'ABSTRACT', 'DEBUGGING', 'MICROSERVICE'])
          .describe('Type of graph'),
        companyId: z.string().describe('Company UUID'),
        nodes: z.array(z.any()).describe('Graph nodes array'),
        bridges: z.array(z.any()).optional().describe('Graph edges/bridges array'),
        description: z.string().optional().describe('Graph description'),
        projectName: z.string().optional().describe('Project name (creates a new project if omitted)'),
        projectId: z.string().optional().describe('Existing project ID to associate with'),
        llmProvider: z
          .enum(['CLAUDE', 'OPENAI', 'GOOGLE', 'DEEPSEEK', 'GEMMA'])
          .optional()
          .describe('LLM provider to use'),
      },
    },
    async ({ graphName, graphType, companyId, nodes, bridges, description, projectName, projectId, llmProvider }) => {
      if (!auth.user.teamId) return mcpError('User has no team assigned');
      const teamId = auth.user.teamId;

      const graphData = {
        name: graphName,
        graphType,
        companyId,
        userId: auth.user.id,
        nodes,
        bridges: bridges ?? [],
        description,
      };

      try {
        const project = await codegenService.storeProjectMetadata(
          { id: projectId, name: projectName ?? graphName },
          graphData,
          userId,
          teamId
        );

        const jobStatus = await codegenService.initializeCodeGeneration({
          graph: graphData as any,
          project: { id: project.id.toString(), name: project.name },
          llmConfig: llmProvider ? { provider: llmProvider } : undefined,
        });

        await codegenService.storeJobMetadata(
          jobStatus.jobId,
          jobStatus.jobId,
          project.id,
          userId,
          { graph: graphData }
        );

        return mcpJson({
          jobId: jobStatus.jobId,
          status: jobStatus.status,
          step: jobStatus.step,
          projectId: project.id,
        });
      } catch (error) {
        return mcpError(`Failed to start generation: ${(error as Error).message}`);
      }
    }
  );

  server.registerTool(
    'get_codegen_status',
    {
      title: 'Get Codegen Job Status',
      description: 'Get the current status of a code generation job',
      inputSchema: {
        jobId: z.string().describe('Job ID returned from generate_manifests'),
      },
    },
    async ({ jobId }) => {
      const hasPermission = await GraphPermissions.canAccessJob(userId, jobId);
      if (!hasPermission) return mcpError('Job not found or access denied');

      try {
        const status = await codegenService.getJobStatus(jobId);
        return mcpJson(status);
      } catch (error) {
        return mcpError(`Failed to get job status: ${(error as Error).message}`);
      }
    }
  );

  server.registerTool(
    'get_codegen_results',
    {
      title: 'Get Codegen Results',
      description: 'Get the generated Kubernetes manifests for a completed job',
      inputSchema: {
        jobId: z.string().describe('Job ID of a completed generation job'),
      },
    },
    async ({ jobId }) => {
      const hasPermission = await GraphPermissions.canAccessJob(userId, jobId);
      if (!hasPermission) return mcpError('Job not found or access denied');

      try {
        // The Context parameter is only used for WebSocket sends (c.ws?.send).
        // In MCP context there is no WebSocket; those private methods safely no-op with an empty object.
        const results = await codegenService.getJobResults({} as any, jobId, userId);
        return mcpJson(results);
      } catch (error) {
        return mcpError(`Failed to get results: ${(error as Error).message}`);
      }
    }
  );

  server.registerTool(
    'cancel_codegen',
    {
      title: 'Cancel Codegen Job',
      description: 'Cancel a running code generation job',
      inputSchema: {
        jobId: z.string().describe('Job ID to cancel'),
      },
    },
    async ({ jobId }) => {
      const hasPermission = await GraphPermissions.canAccessJob(userId, jobId);
      if (!hasPermission) return mcpError('Job not found or access denied');

      await db
        .update(generationJobs)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(generationJobs.uuid, jobId));

      await codegenService.cleanupSubscription(jobId);
      return mcpJson({ success: true, jobId });
    }
  );
}
