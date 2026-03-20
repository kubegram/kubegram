import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AuthContext } from '@/middleware/auth';
import { registerProjectTools } from '@/mcp/tools/projects';
import { registerCodegenTools } from '@/mcp/tools/codegen';
import { registerPlanTools } from '@/mcp/tools/plan';
import { registerCompanyTools } from '@/mcp/tools/companies';
import { registerTeamTools } from '@/mcp/tools/teams';
import { registerUserTools } from '@/mcp/tools/users';
import { registerHealthTools } from '@/mcp/tools/health';

export function createMcpServer(auth: AuthContext): McpServer {
  const server = new McpServer({
    name: 'kubegram-mcp',
    version: '1.0.0',
  });

  registerProjectTools(server, auth);
  registerCodegenTools(server, auth);
  registerPlanTools(server, auth);
  registerCompanyTools(server, auth);
  registerTeamTools(server, auth);
  registerUserTools(server, auth);
  registerHealthTools(server, auth);

  return server;
}
