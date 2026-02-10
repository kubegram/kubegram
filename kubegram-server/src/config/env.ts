import { SecretsManager } from './secrets';

export const config = {
    port: parseInt(process.env.PORT || '8090', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost',
    isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    // OpenAuth configuration
    appUrl: process.env.APP_URL || 'http://localhost:8090',
    // OAuth provider credentials
    githubClientId: process.env.GITHUB_CLIENT_ID || '',
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    gitlabClientId: process.env.GITLAB_CLIENT_ID || '',
    gitlabClientSecret: process.env.GITLAB_CLIENT_SECRET || '',
    oktaClientId: process.env.OKTA_CLIENT_ID || '',
    oktaClientSecret: process.env.OKTA_CLIENT_SECRET || '',
    oktaDomain: process.env.OKTA_DOMAIN || '',
    // Database configuration
    databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/kubegram',
    // Redis configuration
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    redisPassword: process.env.REDIS_PASSWORD || '',
    redisDb: parseInt(process.env.REDIS_DB || '0', 10),
    // HA mode: when true, OpenAuth storage uses Redis for cross-instance session sharing
    enableHA: (process.env.ENABLE_HA || 'false').toLowerCase() === 'true',
    // Security
    globalEncryptionKey: SecretsManager.getGlobalEncryptionKey(),
};

export default config;
