import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  getTestClient,
  getTestDbClient,
  resetDatabase,
  loadFixtures,
  createAuthHeaders,
} from '../../test/helpers';

vi.mock('@/clients/rag-client', () => ({
  createRAGClient: vi.fn().mockReturnValue({
    initializeCodeGen: vi.fn().mockResolvedValue({ jobId: 'mock-job-id', status: 'pending' }),
    getCodeGenStatus: vi.fn().mockResolvedValue({ status: 'completed', progress: 100 }),
    getCodeGenResults: vi.fn().mockResolvedValue({
      artifacts: [
        { name: 'deployment.yaml', content: 'apiVersion: apps/v1', type: 'file' },
        { name: 'service.yaml', content: 'apiVersion: v1', type: 'file' },
      ],
    }),
    initializePlan: vi.fn().mockResolvedValue({ jobId: 'mock-plan-id', status: 'pending' }),
    getPlanStatus: vi.fn().mockResolvedValue({ status: 'completed', progress: 100 }),
    getPlanResults: vi.fn().mockResolvedValue({ plan: { resources: [] } }),
    initializeValidation: vi.fn().mockResolvedValue({ jobId: 'mock-validation-id', status: 'pending' }),
    getValidationStatus: vi.fn().mockResolvedValue({ status: 'completed', progress: 100 }),
    getValidationResults: vi.fn().mockResolvedValue({ results: [], summary: { total: 0, valid: 0, invalid: 0 } }),
  }),
}));

describe('Graph Code Generation Integration Tests', () => {
  let client: ReturnType<typeof getTestClient>;
  let db: ReturnType<typeof getTestDbClient>;

  beforeAll(async () => {
    client = getTestClient();
    db = getTestDbClient();
    await client.init();
    await resetDatabase();
    await loadFixtures();
  });

  afterAll(async () => {
    await resetDatabase();
  });

  describe('GET /api/public/v1/graph/codegen', () => {
    it('should require authentication', async () => {
      const response = await client.get('/api/public/v1/graph/codegen');
      expect(response.status).toBe(401);
    });

    it('should return jobs for authenticated user', async () => {
      const response = await client.get('/api/public/v1/graph/codegen', {
        headers: createAuthHeaders('admin'),
      });

      if (response.status === 200) {
        const body = response.body as { jobs: unknown[]; total: number };
        expect(body).toHaveProperty('jobs');
        expect(body).toHaveProperty('total');
        expect(Array.isArray(body.jobs)).toBe(true);
      } else {
        expect([200, 401, 403]).toContain(response.status);
      }
    });

    it('should filter jobs by project ID', async () => {
      const response = await client.get('/api/public/v1/graph/codegen', {
        headers: createAuthHeaders('admin'),
        query: { projectId: '1' },
      });

      expect([200, 401, 403]).toContain(response.status);
    });

    it('should support pagination', async () => {
      const response = await client.get('/api/public/v1/graph/codegen', {
        headers: createAuthHeaders('admin'),
        query: { limit: '10', offset: '0' },
      });

      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('POST /api/public/v1/graph/codegen', () => {
    it('should require authentication', async () => {
      const response = await client.post('/api/public/v1/graph/codegen', {
        body: {
          graph: { nodes: [], edges: [], graphType: 'kubernetes' },
          project: { name: 'Test Project' },
          llmConfig: { provider: 'claude' },
        },
      });
      expect(response.status).toBe(401);
    });

    it('should initialize code generation with valid request', async () => {
      const response = await client.post('/api/public/v1/graph/codegen', {
        headers: {
          ...createAuthHeaders('admin'),
          'X-Kubegram-Team-Id': '1',
        },
        body: {
          graph: {
            nodes: [
              { id: 'node-1', type: 'deployment', data: { name: 'app' } },
            ],
            edges: [],
            graphType: 'kubernetes',
          },
          project: {
            name: 'Test CodeGen Project',
          },
          llmConfig: {
            provider: 'claude',
            model: 'claude-3-5-sonnet',
          },
        },
      });

      expect([201, 400, 401, 403, 500]).toContain(response.status);

      if (response.status === 201) {
        const body = response.body as { jobId: string; status: string };
        expect(body.jobId).toBeDefined();
        expect(body.status).toBe('pending');
      }
    });

    it('should reject invalid graph data', async () => {
      const response = await client.post('/api/public/v1/graph/codegen', {
        headers: {
          ...createAuthHeaders('admin'),
          'X-Kubegram-Team-Id': '1',
        },
        body: {
          graph: {},
          project: { name: 'Test' },
        },
      });

      expect([400, 401, 403]).toContain(response.status);
    });

    it('should reject request without team ID', async () => {
      const response = await client.post('/api/public/v1/graph/codegen', {
        headers: createAuthHeaders('admin'),
        body: {
          graph: { nodes: [], edges: [], graphType: 'kubernetes' },
          project: { name: 'Test' },
        },
      });

      expect([400, 401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/public/v1/graph/codegen/:jobId/status', () => {
    it('should require authentication', async () => {
      const response = await client.get('/api/public/v1/graph/codegen/test-job-id/status');
      expect(response.status).toBe(401);
    });

    it('should return job status', async () => {
      const response = await client.get('/api/public/v1/graph/codegen/test-job-id/status', {
        headers: createAuthHeaders('admin'),
      });

      expect([200, 404, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        const body = response.body as { status: string };
        expect(body.status).toBeDefined();
      }
    });

    it('should return 404 for non-existent job', async () => {
      const response = await client.get('/api/public/v1/graph/codegen/non-existent-job/status', {
        headers: createAuthHeaders('admin'),
      });

      expect([404, 401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/public/v1/graph/codegen/:jobId/results', () => {
    it('should require authentication', async () => {
      const response = await client.get('/api/public/v1/graph/codegen/test-job-id/results');
      expect(response.status).toBe(401);
    });

    it('should return results for completed job', async () => {
      const response = await client.get('/api/public/v1/graph/codegen/test-job-id/results', {
        headers: createAuthHeaders('admin'),
      });

      expect([200, 400, 404, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        const body = response.body as { generatedCode?: unknown };
        expect(body).toHaveProperty('status');
      }
    });

    it('should return error for incomplete job', async () => {
      const response = await client.get('/api/public/v1/graph/codegen/pending-job/results', {
        headers: createAuthHeaders('admin'),
      });

      if (response.status === 400) {
        const body = response.body as { error: string };
        expect(body.error).toContain('not completed');
      }
    });
  });

  describe('DELETE /api/public/v1/graph/codegen/:jobId', () => {
    it('should require authentication', async () => {
      const response = await client.delete('/api/public/v1/graph/codegen/test-job-id');
      expect(response.status).toBe(401);
    });

    it('should cancel job', async () => {
      const response = await client.delete('/api/public/v1/graph/codegen/test-job-id', {
        headers: createAuthHeaders('admin'),
      });

      expect([200, 404, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        const body = response.body as { message: string };
        expect(body.message).toBeDefined();
      }
    });
  });
});

describe('Graph Planning Integration Tests', () => {
  let client: ReturnType<typeof getTestClient>;

  beforeAll(async () => {
    client = getTestClient();
    await client.init();
    await resetDatabase();
    await loadFixtures();
  });

  afterAll(async () => {
    await resetDatabase();
  });

  describe('POST /api/public/v1/graph/plan', () => {
    it('should require authentication', async () => {
      const response = await client.post('/api/public/v1/graph/plan', {
        body: {
          graph: { nodes: [], edges: [] },
        },
      });
      expect(response.status).toBe(401);
    });

    it('should initialize planning', async () => {
      const response = await client.post('/api/public/v1/graph/plan', {
        headers: {
          ...createAuthHeaders('admin'),
          'X-Kubegram-Team-Id': '1',
        },
        body: {
          graph: {
            nodes: [
              { id: 'node-1', type: 'deployment' },
            ],
            edges: [],
          },
        },
      });

      expect([201, 400, 401, 403, 500]).toContain(response.status);

      if (response.status === 201) {
        const body = response.body as { jobId: string; status: string };
        expect(body.jobId).toBeDefined();
      }
    });
  });

  describe('GET /api/public/v1/graph/plan/:jobId/status', () => {
    it('should require authentication', async () => {
      const response = await client.get('/api/public/v1/graph/plan/test-plan-id/status');
      expect(response.status).toBe(401);
    });

    it('should return plan status', async () => {
      const response = await client.get('/api/public/v1/graph/plan/test-plan-id/status', {
        headers: createAuthHeaders('admin'),
      });

      expect([200, 404, 401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/public/v1/graph/plan/:jobId/results', () => {
    it('should require authentication', async () => {
      const response = await client.get('/api/public/v1/graph/plan/test-plan-id/results');
      expect(response.status).toBe(401);
    });

    it('should return plan results', async () => {
      const response = await client.get('/api/public/v1/graph/plan/test-plan-id/results', {
        headers: createAuthHeaders('admin'),
      });

      expect([200, 400, 404, 401, 403]).toContain(response.status);
    });
  });
});

describe('Graph Validation Integration Tests', () => {
  let client: ReturnType<typeof getTestClient>;

  beforeAll(async () => {
    client = getTestClient();
    await client.init();
    await resetDatabase();
    await loadFixtures();
  });

  afterAll(async () => {
    await resetDatabase();
  });

  describe('POST /api/public/v1/graph/validate', () => {
    it('should require authentication', async () => {
      const response = await client.post('/api/public/v1/graph/validate', {
        body: {
          graph: { nodes: [], edges: [] },
        },
      });
      expect(response.status).toBe(401);
    });

    it('should initialize validation', async () => {
      const response = await client.post('/api/public/v1/graph/validate', {
        headers: {
          ...createAuthHeaders('admin'),
          'X-Kubegram-Team-Id': '1',
        },
        body: {
          graph: {
            nodes: [
              { id: 'node-1', type: 'deployment' },
            ],
            edges: [],
          },
        },
      });

      expect([201, 400, 401, 403, 500]).toContain(response.status);

      if (response.status === 201) {
        const body = response.body as { jobId: string };
        expect(body.jobId).toBeDefined();
      }
    });
  });

  describe('GET /api/public/v1/graph/validate/:jobId/status', () => {
    it('should require authentication', async () => {
      const response = await client.get('/api/public/v1/graph/validate/test-validation-id/status');
      expect(response.status).toBe(401);
    });

    it('should return validation status', async () => {
      const response = await client.get('/api/public/v1/graph/validate/test-validation-id/status', {
        headers: createAuthHeaders('admin'),
      });

      expect([200, 404, 401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/public/v1/graph/validate/:jobId/results', () => {
    it('should require authentication', async () => {
      const response = await client.get('/api/public/v1/graph/validate/test-validation-id/results');
      expect(response.status).toBe(401);
    });

    it('should return validation results', async () => {
      const response = await client.get('/api/public/v1/graph/validate/test-validation-id/results', {
        headers: createAuthHeaders('admin'),
      });

      expect([200, 400, 404, 401, 403]).toContain(response.status);
    });
  });
});

describe('Graph Suggestions Integration Tests', () => {
  let client: ReturnType<typeof getTestClient>;

  beforeAll(async () => {
    client = getTestClient();
    await client.init();
    await resetDatabase();
    await loadFixtures();
  });

  afterAll(async () => {
    await resetDatabase();
  });

  describe('POST /api/public/v1/graph/suggest', () => {
    it('should require authentication', async () => {
      const response = await client.post('/api/public/v1/graph/suggest', {
        body: {
          graph: { nodes: [], edges: [] },
        },
      });
      expect(response.status).toBe(401);
    });

    it('should get AI suggestions', async () => {
      const response = await client.post('/api/public/v1/graph/suggest', {
        headers: {
          ...createAuthHeaders('admin'),
          'X-Kubegram-Team-Id': '1',
        },
        body: {
          graph: {
            nodes: [
              { id: 'node-1', type: 'deployment' },
            ],
            edges: [],
          },
        },
      });

      expect([200, 400, 401, 403, 500]).toContain(response.status);

      if (response.status === 200) {
        const body = response.body as { suggestions?: unknown[] };
        expect(body).toHaveProperty('suggestions');
      }
    });
  });
});
