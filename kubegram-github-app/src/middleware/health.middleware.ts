import { Router, Request, Response, IRouter } from 'express';
import config from '../config/app.config';
import logger from '../utils/logger';

const router: IRouter = Router();

let lastHealthCheck = Date.now();
let isHealthy = true;

router.get('/', (_req: Request, res: Response) => {
  const uptime = process.uptime();
  
  const healthStatus = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv,
    lastCheck: new Date(lastHealthCheck).toISOString(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
    },
  };

  res.status(isHealthy ? 200 : 503).json(healthStatus);
});

router.get('/ready', (_req: Request, res: Response) => {
  // Check if all required services are ready
  const ready = isHealthy && config.github.appId && config.github.privateKey;
  
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
  });
});

router.get('/live', (_req: Request, res: Response) => {
  // Liveness check - simple response to indicate the process is running
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid,
  });
});

// Health check utility functions
export function markHealthy(): void {
  isHealthy = true;
  lastHealthCheck = Date.now();
}

export function markUnhealthy(reason?: string): void {
  isHealthy = false;
  if (reason) {
    logger.error(`Service marked as unhealthy: ${reason}`);
  }
}

export { router as healthCheckRouter };