import type { Context, Next } from 'hono';
import logger from '../utils/logger';
import config from '@/config/env';

// OpenAuth logging middleware
export const openAuthMiddleware = async (c: Context, next: Next) => {
  // Only apply to OAuth routes
  if (!c.req.path.startsWith('/oauth')) {
    return next();
  }

  const method = c.req.method;
  const path = c.req.path;
  const userAgent = c.req.header('user-agent');
  const forwardedFor = c.req.header('x-forwarded-for');
  const realIp = c.req.header('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

  // Log OAuth attempts with detailed info
  logger.debug(`🔐 OAuth ${method} ${path}`, {
    ip: ip.replace(/\d+\.\d+\.\d+\.\d+/, 'x.x.x.x'), // Mask IP for privacy
    userAgent: userAgent?.split(' ')[0] || 'unknown', // Just browser name
    timestamp: new Date().toISOString()
  });

  // Add security headers for OAuth routes
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add CORS headers specifically for OAuth
  if (config.isDevelopment) {
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return next();
};

// Error handling wrapper for OAuth routes
export const openAuthErrorHandler = (error: Error, c: Context) => {
  const isOAuthRoute = c.req.path.startsWith('/oauth');

  if (!isOAuthRoute) {
    // Let other error handlers deal with non-OAuth routes
    throw error;
  }

  logger.error('OAuth route error', {
    path: c.req.path,
    method: c.req.method,
    error: error.message,
    stack: error.stack
  });

  // Provide user-friendly error messages
  if (error.message.includes('provider not found') || error.message.includes('not configured')) {
    return c.json({
      error: 'OAuth provider not configured',
      message: 'Please contact your administrator to set up OAuth providers'
    }, 503);
  }

  if (error.message.includes('database') || error.message.includes('connection')) {
    return c.json({
      error: 'Authentication service unavailable',
      message: 'Please try again later'
    }, 503);
  }

  if (error.message.includes('invalid_client') || error.message.includes('invalid_grant')) {
    return c.json({
      error: 'Invalid OAuth credentials',
      message: 'Please check your OAuth configuration'
    }, 400);
  }

  // Generic OAuth error
  return c.json({
    error: 'Authentication failed',
    message: 'Please try the authentication process again'
  }, 500);
};