import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcpJson } from '@/mcp/types';
import type { AuthContext } from '@/middleware/auth';

export function registerUserTools(server: McpServer, auth: AuthContext): void {
  server.registerTool(
    'get_current_user',
    {
      title: 'Get Current User',
      description: 'Get information about the currently authenticated user',
      inputSchema: {},
    },
    async () => {
      return mcpJson({
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
        avatar: auth.user.avatar,
        role: auth.user.role,
        teamId: auth.user.teamId,
      });
    }
  );
}
