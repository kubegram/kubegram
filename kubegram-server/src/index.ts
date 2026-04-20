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

if (config.isSelfServe) {
  logger.info('Kubegram deployed on self-serve mode');
}

// Connect Redis when HA mode is enabled
if (config.enableHA) {
  logger.info('HA mode enabled, connecting to Redis...');
  await redisClient.connect();
}

import { testDatabaseConnection, db } from './db';
import { initializeRepositories } from './repositories';

const dbAvailable = config.hasDatabaseUrl && db && (await testDatabaseConnection());
if (!dbAvailable) {
  logger.warn('No DB connection — falling back to EventCache. Set ENABLE_HA=true for Redis-backed persistence.');
}
await initializeRepositories(!dbAvailable);

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

// API routes must be registered before the OpenAuth catch-all, otherwise the
// catch-all intercepts every request and returns 404 before routes are reached.
import { apiRoutes } from './routes';
honoApp.route('/api', apiRoutes);

// OpenAuth uses hono/tiny (a different Hono constructor), so honoApp.route() can't merge
// its routes (app.routes is undefined).  Instead we URL-rewrite: strip /oauth from the
// path so OpenAuth's root-level routes (/authorize, /:provider/*, /token, /.well-known/*)
// can match.  The select callback is hardcoded to basePath="/oauth" (see auth/openauth.ts)
// so provider-selection links still point to /oauth/github/authorize.
honoApp.use('/oauth/*', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.slice('/oauth'.length) || '/';
  return app.handle(new Request(url.toString(), c.req.raw));
});

// When only one provider is configured, OpenAuth's /authorize handler redirects directly
// to /:provider/authorize (without the /oauth prefix).  The browser follows that redirect
// to /github/authorize, so we forward it to OpenAuth here instead of hitting the SSR.
honoApp.use('/:provider/authorize', async (c, next) => {
  const response = await app.handle(c.req.raw);
  if (response.status !== 404) return response;
  return next();
});

// OpenAuth's getRelativeUrl computes the OAuth callback URL relative to the stripped URL
// (e.g. /github/authorize → /github/callback).  GitHub/Google redirect back to that
// non-prefixed path, so we need to forward it to OpenAuth from here.
honoApp.use('/:provider/callback', async (c, next) => {
  const response = await app.handle(c.req.raw);
  if (response.status !== 404) return response;
  return next();
});

// The OpenAuth discovery doc (GET /oauth/.well-known/oauth-authorization-server) returns
// jwks_uri without the /oauth prefix (e.g. http://localhost:8090/.well-known/jwks.json).
// Handle that root-level path so token verification works.
honoApp.use('/.well-known/*', async (c) => {
  return app.handle(c.req.raw);
});

// Static files
// Explicitly serve logo.png to ensure it works
honoApp.get('/logo.png', async (_c) => {
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
