import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../config/app.config';
import logger from '../utils/logger';

export function webhookMiddleware(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-hub-signature-256'] as string;
  const payload = (req as any).rawBody;

  if (!signature) {
    logger.warn('Missing X-Hub-Signature-256 header');
    res.status(401).json({ error: 'Missing signature' });
    return;
  }

  if (!payload) {
    logger.warn('Missing request body');
    res.status(400).json({ error: 'Missing payload' });
    return;
  }

  const hmac = crypto.createHmac('sha256', config.github.webhookSecret!);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    logger.warn('Invalid webhook signature');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  // Add GitHub event headers to request object for later use
  (req as any).githubEvent = {
    id: req.headers['x-github-delivery'] as string,
    name: req.headers['x-github-event'] as string,
    signature: signature,
  };

  logger.info(`Webhook received: ${(req as any).githubEvent.name} - ${(req as any).githubEvent.id}`);
  next();
}