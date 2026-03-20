import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  github: {
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_PRIVATE_KEY,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
  
  kubegram: {
    eventBusUrl: process.env.KUBEGRAM_EVENT_BUS_URL || 'http://localhost:8090',
    eventBusApiKey: process.env.KUBEGRAM_EVENT_BUS_API_KEY,
    internalSecret: process.env.KUBEGRAM_INTERNAL_SECRET,
    serverUrl: process.env.KUBEGRAM_SERVER_URL || 'http://localhost:8090',
  },
  
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  
  health: {
    checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10), // 30 seconds
  },
};

export function validateConfig(): void {
  const requiredEnvVars = [
    'GITHUB_APP_ID',
    'GITHUB_PRIVATE_KEY', 
    'GITHUB_WEBHOOK_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => !config[varName as keyof typeof config]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

export default config;