import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db } from '@/db';
import { companies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { mcpJson, mcpError } from '@/mcp/types';
import type { AuthContext } from '@/middleware/auth';

export function registerCompanyTools(server: McpServer, _auth: AuthContext): void {
  server.registerTool(
    'list_companies',
    {
      title: 'List Companies',
      description: 'List all companies in the system',
      inputSchema: {},
    },
    async () => {
      const all = await db.select().from(companies);
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
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, id))
        .limit(1);

      if (!company) return mcpError('Company not found');
      return mcpJson(company);
    }
  );
}
