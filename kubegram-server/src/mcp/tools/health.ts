import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { mcpJson } from '@/mcp/types';
import type { AuthContext } from '@/middleware/auth';

export function registerHealthTools(server: McpServer, _auth: AuthContext): void {
  server.registerTool(
    'check_health',
    {
      title: 'Check System Health',
      description: 'Check the health of kubegram-server and its dependencies',
      inputSchema: {},
    },
    async () => {
      let dbHealthy = false;
      try {
        if (db) {
          await db.execute(sql`SELECT 1`);
          dbHealthy = true;
        }
      } catch {
        // db is unhealthy
      }

      return mcpJson({
        server: 'ok',
        database: db ? (dbHealthy ? 'ok' : 'error') : 'unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  );
}
