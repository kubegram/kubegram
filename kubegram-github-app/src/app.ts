import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createNodeMiddleware } from '@octokit/app';
import config from './config/app.config';
import githubApp from './config/github.config';
import { webhookMiddleware } from './middleware/webhook.middleware';
import { healthCheckRouter } from './middleware/health.middleware';
import { pushHandler } from './handlers/push.handler';
import { pullRequestHandler } from './handlers/pull-request.handler';
import { releaseHandler } from './handlers/release.handler';
import { checkRunHandler } from './handlers/check-run.handler';
import { deployHandler } from './handlers/deploy.handler';
import logger from './utils/logger';

const app: express.Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  },
}));

// Health check endpoint
app.use('/health', healthCheckRouter);

// GitHub webhook endpoint
app.post('/api/github/webhooks', 
  webhookMiddleware,
  createNodeMiddleware(githubApp, {
    pathPrefix: '/api/github/webhooks',
  })
);

// Register webhook handlers
const webhooks = githubApp.webhooks;

webhooks.on('push', pushHandler as any);
webhooks.on('pull_request', pullRequestHandler as any);
webhooks.on('release', releaseHandler as any);
webhooks.on('check_run', checkRunHandler as any);

// Kubegram internal deploy endpoint — called by kubegram-server after codegen completes
app.post('/api/kubegram/deploy', deployHandler);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

const server = app.listen(config.port, () => {
  logger.info(`🚀 Kubegram GitHub App listening on port ${config.port}`);
  logger.info(`📝 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Webhook endpoint: http://localhost:${config.port}/api/github/webhooks`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;