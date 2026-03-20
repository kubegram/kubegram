import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db } from '@/db';
import { teams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { mcpJson, mcpError } from '@/mcp/types';
import type { AuthContext } from '@/middleware/auth';

export function registerTeamTools(server: McpServer, _auth: AuthContext): void {
  server.registerTool(
    'list_teams',
    {
      title: 'List Teams',
      description: 'List all teams in the system',
      inputSchema: {},
    },
    async () => {
      const all = await db.select().from(teams);
      return mcpJson(all);
    }
  );

  server.registerTool(
    'get_team',
    {
      title: 'Get Team',
      description: 'Get a team by its ID',
      inputSchema: {
        id: z.number().describe('Team ID'),
      },
    },
    async ({ id }) => {
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, id))
        .limit(1);

      if (!team) return mcpError('Team not found');
      return mcpJson(team);
    }
  );
}
