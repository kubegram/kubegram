import { vi } from 'vitest';

export * from './rag-client';
export * from './errors';
export * from './http';

export function setupGlobalMocks() {
  vi.mock('ioredis', () => {
    const RedisMock = vi.fn().mockImplementation(() => ({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      setex: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      exists: vi.fn().mockResolvedValue(0),
      keys: vi.fn().mockResolvedValue([]),
      expire: vi.fn().mockResolvedValue(1),
      ping: vi.fn().mockResolvedValue('PONG'),
      quit: vi.fn().mockResolvedValue('OK'),
      on: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
    }));
    return { default: RedisMock };
  });

  vi.mock('../../config/env', () => ({
    config: {
      nodeEnv: 'test',
      port: 8090,
      appUrl: 'http://localhost:8090',
      corsOrigin: 'http://localhost:3000',
      databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5435/kubegram_test',
      redisHost: 'localhost',
      redisPort: 6380,
      redisDb: 1,
      enableHa: false,
      jwtSecret: 'test-secret-key',
      internalSecret: 'test-internal-secret',
      githubClientId: 'test_github_client_id',
      githubClientSecret: 'test_github_client_secret',
      googleClientId: 'test_google_client_id',
      googleClientSecret: 'test_google_client_secret',
      kuberagUrl: 'http://localhost:8665/graphql',
    },
  }));

  vi.mock('../../utils/logger', () => ({
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn().mockReturnThis(),
    },
    createChildLogger: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  }));

  vi.mock('../../clients/rag-client', () => ({
    createRAGClient: vi.fn().mockReturnValue({
      initializeCodeGen: vi.fn().mockResolvedValue({ jobId: 'test-job-id', status: 'pending' }),
      getCodeGenStatus: vi.fn().mockResolvedValue({ status: 'completed', progress: 100 }),
      getCodeGenResults: vi.fn().mockResolvedValue({ artifacts: [] }),
      initializePlan: vi.fn().mockResolvedValue({ jobId: 'test-plan-job-id', status: 'pending' }),
      getPlanStatus: vi.fn().mockResolvedValue({ status: 'completed', progress: 100 }),
      getPlanResults: vi.fn().mockResolvedValue({ plan: { resources: [], dependencies: [] } }),
      initializeValidation: vi.fn().mockResolvedValue({ jobId: 'test-validation-job-id', status: 'pending' }),
      getValidationStatus: vi.fn().mockResolvedValue({ status: 'completed', progress: 100 }),
      getValidationResults: vi.fn().mockResolvedValue({ results: [], summary: { total: 0, valid: 0, invalid: 0 } }),
      getSuggestions: vi.fn().mockResolvedValue({ suggestions: [] }),
    }),
    initializeRAGClient: vi.fn(),
  }));
}

export async function clearMocks() {
  vi.clearAllMocks();
  vi.resetAllMocks();
}
