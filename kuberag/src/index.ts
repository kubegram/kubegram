/**
 * KubeRAG server entry point
 * Hono app with graphql-yoga middleware, health checks, and CORS
 * Includes MCP WebSocket server integration
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema';
import { serverConfig, dgraphConfig, redisConfig, authConfig, mcpConfig } from './config';
import { redisClient } from './state/redis';
import { requireAuth } from './middleware/auth';
import { MCPWebSocketServer } from './mcp/websocket-server';

const app = new Hono();

// CORS middleware (conditional)
if (serverConfig.enableCors) {
  app.use('/*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Upgrade', 'Connection'],
  }));
}

// Health check endpoints
app.get('/', (c) => c.json({ status: 'ok', service: 'kuberag' }));
app.get('/health', (c) => c.json({
  status: 'ok',
  service: 'kuberag',
  timestamp: new Date().toISOString(),
  dgraph: dgraphConfig.graphqlEndpoint,
  redis: `${redisConfig.host}:${redisConfig.port}`,
  mcp: mcpConfig.enabled,
}));

// GraphQL Yoga instance
const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  landingPage: serverConfig.nodeEnv !== 'production',
});

// Auth middleware on /graphql (conditional on ENABLE_AUTH)
if (authConfig.enableAuth) {
  app.use('/graphql', requireAuth);
}

// Mount graphql-yoga on /graphql
app.on(['GET', 'POST', 'OPTIONS'], '/graphql', async (c) => {
  const response = await yoga.handle(c.req.raw);
  return response;
});

// MCP WebSocket server (started after main server)
let mcpServer: MCPWebSocketServer | null = null;

// Startup
const port = serverConfig.port;
console.info(`Starting KubeRAG server on port ${port}...`);
console.info(`GraphQL endpoint: http://localhost:${port}/graphql`);
console.info(`Health check: http://localhost:${port}/health`);
console.info(`Dgraph: ${dgraphConfig.graphqlEndpoint}`);
console.info(`Redis: ${redisConfig.host}:${redisConfig.port}`);
console.info(`Auth: ${authConfig.enableAuth ? `enabled (issuer: ${authConfig.issuerUrl})` : 'disabled'}`);
console.info(`MCP: ${mcpConfig.enabled ? `enabled on port ${mcpConfig.wsPort}` : 'disabled'}`);

// Connect Redis before serving (lazyConnect requires explicit connect)
await redisClient.connect();

// Start MCP WebSocket server if enabled
if (mcpConfig.enabled) {
  mcpServer = new MCPWebSocketServer();
  await mcpServer.start();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.info('Shutting down...');
  try {
    if (mcpServer) {
      await mcpServer.stop();
    }
    await redisClient.close();
    console.info('Redis disconnected');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.info('Shutting down...');
  try {
    if (mcpServer) {
      await mcpServer.stop();
    }
    await redisClient.close();
    console.info('Redis disconnected');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

export default {
  port,
  fetch: app.fetch,
};