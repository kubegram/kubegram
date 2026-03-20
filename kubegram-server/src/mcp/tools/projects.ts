import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { GraphPermissions } from '@/services/permissions';
import { mcpJson, mcpError } from '@/mcp/types';
import type { AuthContext } from '@/middleware/auth';

export function registerProjectTools(server: McpServer, auth: AuthContext): void {
  const userId = parseInt(auth.user.id);

  server.registerTool(
    'list_projects',
    {
      title: 'List Projects',
      description: 'List all projects accessible to the current user (team-scoped)',
      inputSchema: {},
    },
    async () => {
      const userProjects = await GraphPermissions.getUserAccessibleProjects(userId);
      return mcpJson(userProjects);
    }
  );

  server.registerTool(
    'get_project',
    {
      title: 'Get Project',
      description: 'Get a specific project by ID',
      inputSchema: {
        id: z.number().describe('Project ID'),
      },
    },
    async ({ id }) => {
      const canAccess = await GraphPermissions.canAccessProject(userId, id);
      if (!canAccess) return mcpError('Project not found or access denied');

      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
        .limit(1);

      if (!project) return mcpError('Project not found');
      return mcpJson(project);
    }
  );

  server.registerTool(
    'create_project',
    {
      title: 'Create Project',
      description: "Create a new project in the current user's team",
      inputSchema: {
        name: z.string().describe('Project name'),
        graphId: z.string().optional().describe('Optional graph ID'),
        graphMeta: z.string().optional().describe('Optional graph metadata as a JSON string'),
      },
    },
    async ({ name, graphId, graphMeta }) => {
      if (!auth.user.teamId) return mcpError('User has no team assigned');
      const teamId = auth.user.teamId;

      const [project] = await db
        .insert(projects)
        .values({ name, graphId, graphMeta, teamId, createdBy: userId })
        .returning();

      return mcpJson(project);
    }
  );

  server.registerTool(
    'update_project',
    {
      title: 'Update Project',
      description: 'Update an existing project',
      inputSchema: {
        id: z.number().describe('Project ID'),
        name: z.string().optional().describe('New project name'),
        graphMeta: z.string().optional().describe('New graph metadata as a JSON string'),
      },
    },
    async ({ id, name, graphMeta }) => {
      const canAccess = await GraphPermissions.canAccessProject(userId, id);
      if (!canAccess) return mcpError('Project not found or access denied');

      const [updated] = await db
        .update(projects)
        .set({ ...(name && { name }), ...(graphMeta && { graphMeta }), updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();

      if (!updated) return mcpError('Project not found');
      return mcpJson(updated);
    }
  );

  server.registerTool(
    'delete_project',
    {
      title: 'Delete Project',
      description: 'Soft-delete a project',
      inputSchema: {
        id: z.number().describe('Project ID to delete'),
      },
    },
    async ({ id }) => {
      const canAccess = await GraphPermissions.canAccessProject(userId, id);
      if (!canAccess) return mcpError('Project not found or access denied');

      await db
        .update(projects)
        .set({ deletedAt: new Date() })
        .where(eq(projects.id, id));

      return mcpJson({ success: true, id });
    }
  );
}
