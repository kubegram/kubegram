import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getRepositories } from '@/repositories';
import { mcpJson, mcpError } from '@/mcp/types';
import type { AuthContext } from '@/middleware/auth';

export function registerCompanyTools(server: McpServer, _auth: AuthContext): void {
  const repos = getRepositories();

  server.registerTool(
    'list_companies',
    {
      title: 'List Companies',
      description: 'List all companies in the system',
      inputSchema: {},
    },
    async () => {
      const all = await repos.companies.findAll();
      return mcpJson(all);
    }
  );

  server.registerTool(
    'get_company',
    {
      title: 'Get Company',
      description: 'Get a company by its UUID',
      inputSchema: {
        id: z.string().describe('Company UUID'),
      },
    },
    async ({ id }) => {
      const company = await repos.companies.findById(id);

      if (!company) return mcpError('Company not found');
      return mcpJson(company);
    }
  );
}
