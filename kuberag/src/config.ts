import { z } from 'zod';

// Environment variable schema with validation
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().transform(Number).default('3000'),
  ENABLE_CORS: z.string().transform(val => val.toLowerCase() === 'true').default('true'),
  
  // Dgraph Configuration
  DGRAPH_HOST: z.string().default('localhost'),
  DGRAPH_HTTP_PORT: z.string().transform(Number).default('8080'),
  
  // Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  
  // LLM Provider API Keys (Optional)
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  
  // Ollama Configuration
  OLLAMA_BASE_URL: z.string().optional(),
  
  // Voyage AI Configuration
  VOYAGE_API_KEY: z.string().optional(),
  
  // Application Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Security
  JWT_SECRET: z.string().optional(),
  ENCRYPTION_PUBLIC_KEY: z.string().optional(),

  // Auth (OpenAuth token verification via kubegram-server)
  OPENAUTH_ISSUER_URL: z.string().default('http://localhost:8090'),
  ENABLE_AUTH: z.string().transform(val => val.toLowerCase() === 'true').default('false'),
});

// Validate and parse environment variables
export const config = envSchema.parse(process.env);

// Export derived configuration values
export const dgraphConfig = {
  host: config.DGRAPH_HOST,
  httpPort: config.DGRAPH_HTTP_PORT,
  graphqlEndpoint: `http://${config.DGRAPH_HOST}:${config.DGRAPH_HTTP_PORT}/graphql`,
  adminEndpoint: `http://${config.DGRAPH_HOST}:${config.DGRAPH_HTTP_PORT}/admin`,
} as const;

export const redisConfig = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  db: config.REDIS_DB,
  url: config.REDIS_PASSWORD 
    ? `redis://:${config.REDIS_PASSWORD}@${config.REDIS_HOST}:${config.REDIS_PORT}/${config.REDIS_DB}`
    : `redis://${config.REDIS_HOST}:${config.REDIS_PORT}/${config.REDIS_DB}`,
} as const;

export const serverConfig = {
  port: config.PORT,
  enableCors: config.ENABLE_CORS,
  nodeEnv: config.NODE_ENV,
  logLevel: config.LOG_LEVEL,
} as const;

export const llmConfig = {
  anthropic: {
    apiKey: config.ANTHROPIC_API_KEY,
  },
  openai: {
    apiKey: config.OPENAI_API_KEY,
  },
  google: {
    apiKey: config.GOOGLE_API_KEY,
  },
  deepseek: {
    apiKey: config.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  },
  ollama: {
    baseURL: config.OLLAMA_BASE_URL || 'http://localhost:11434',
  },
} as const;

export const embeddingsConfig = {
  voyage: {
    apiKey: config.VOYAGE_API_KEY ?? '',
    baseURL: 'https://api.voyageai.com/v1/embeddings',
  },
} as const;

export const authConfig = {
  issuerUrl: config.OPENAUTH_ISSUER_URL,
  enableAuth: config.ENABLE_AUTH,
} as const;

// Type exports for use in other modules
export type Config = typeof config;
export type DgraphConfig = typeof dgraphConfig;
export type RedisConfig = typeof redisConfig;
export type ServerConfig = typeof serverConfig;
export type LLMConfig = typeof llmConfig;
export type EmbeddingsConfig = typeof embeddingsConfig;
export type AuthConfig = typeof authConfig;