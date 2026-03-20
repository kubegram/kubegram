import { Hono } from 'hono';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { requireAuth } from '@/middleware/auth';
import { createMcpServer } from '@/mcp/server';
import logger from '@/utils/logger';

const mcpRoute = new Hono();

/**
 * POST /api/v1/mcp
 *
 * Primary MCP endpoint using the Streamable HTTP transport in stateless mode.
 * A new McpServer + transport is created per request, with the resolved
 * AuthContext injected into tools via closure.
 *
 * Compatible with Claude Desktop and any MCP client that supports Streamable HTTP.
 *
 * Example Claude Desktop config:
 * {
 *   "mcpServers": {
 *     "kubegram": {
 *       "url": "http://localhost:8090/api/v1/mcp",
 *       "headers": { "Authorization": "Bearer <token>" }
 *     }
 *   }
 * }
 */
mcpRoute.all('/', async (c) => {
  // 1. Auth check — reads Authorization header only, does not consume the body
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    // 2. Stateless transport — no sessionIdGenerator means no session state is kept
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    // 3. Fresh MCP server per request; auth is closed over in every tool handler
    const server = createMcpServer(authResult);
    await server.connect(transport);

    // 4. Let the transport handle the raw Fetch Request and return a Fetch Response
    return transport.handleRequest(c.req.raw);
  } catch (error) {
    logger.error('MCP handler error', { error });
    return c.json({ error: 'MCP server error' }, 500);
  }
});

export { mcpRoute };
