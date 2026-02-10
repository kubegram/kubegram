import { Hono } from 'hono';
import { serve } from 'bun';
import { serveStatic } from 'hono/bun';
import config from './config/env';
import { corsMiddleware } from './middleware/cors';
import { openAuthMiddleware, openAuthErrorHandler } from './middleware/openauth';
import { renderSSR } from './ssr/render';
import app from './auth/openauth';
import logger from './utils/logger';
import { redisClient } from './state/redis';

logger.info('Starting Kubegram Server', { mode: config.nodeEnv });
logger.info('Configuration', { publicDir: './public', corsOrigin: config.corsOrigin });

// Connect Redis when HA mode is enabled
if (config.enableHA) {
  logger.info('HA mode enabled, connecting to Redis...');
  await redisClient.connect();
}

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down...');
  if (config.enableHA) {
    await redisClient.close();
    logger.info('Redis disconnected');
  }
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const honoApp = new Hono();

// Middleware chain
honoApp.use('*', corsMiddleware);
honoApp.use('*', openAuthMiddleware);
honoApp.onError(openAuthErrorHandler);

// Mount OAuth app at root for /.well-known/ endpoints (JWKS, etc.)
honoApp.route('/', app);
// Also mount at /oauth for backwards compatibility
honoApp.route('/oauth', app);

// Static files
// Explicitly serve logo.png to ensure it works
honoApp.get('/logo.png', async (c) => {
  const file = Bun.file('./public/logo.png');
  return new Response(file, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600'
    }
  });
});

// Static files fallback
honoApp.use('/assets/*', serveStatic({ root: './public' }));
honoApp.use('/*', serveStatic({ root: './public' }));

// API routes
import { apiRoutes } from './routes';
honoApp.route('/api', apiRoutes);

// SSR fallback
honoApp.get('*', renderSSR);

const server = serve({
  fetch: honoApp.fetch,
  port: config.port,
  error(error) {
    logger.error('Server error', { error });
    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': config.corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  },
});

logger.info('Server running', { port: server.port, url: `http://localhost:${server.port}` });
