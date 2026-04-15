import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getRepositories } from '@/repositories';
import { mcpJson, mcpError } from '@/mcp/types';
import type { AuthContext } from '@/middleware/auth';

export function registerTeamTools(server: McpServer, _auth: AuthContext): void {
  const repos = getRepositories();

  server.registerTool(
    'list_teams',
    {
      title: 'List Teams',
      description: 'List all teams in the system',
      inputSchema: {},
    },
    async () => {
      const all = await repos.teams.findAll();
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
      const team = await repos.teams.findById(id);

      if (!team) return mcpError('Team not found');
      return mcpJson(team);
    }
  );
}
