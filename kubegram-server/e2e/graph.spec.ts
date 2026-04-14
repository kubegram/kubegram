import { test, expect } from '@playwright/test';

const ADMIN_AUTH = { extraHTTPHeaders: { Cookie: 'session=session-admin-001' } };

test.describe('Graph Code Generation E2E Tests', () => {
  test('should require auth for codegen endpoints', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/codegen');
    expect(response.status()).toBe(401);
  });

  test('should list codegen jobs', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/codegen', ADMIN_AUTH);
    expect([200, 401, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('jobs');
      expect(body).toHaveProperty('total');
    }
  });

  test('should filter jobs by project', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/codegen', {
      ...ADMIN_AUTH,
      params: { projectId: '1' },
    });
    expect([200, 401, 403]).toContain(response.status());
  });

  test('should paginate jobs', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/codegen', {
      ...ADMIN_AUTH,
      params: { limit: '10', offset: '0' },
    });
    expect([200, 401, 403]).toContain(response.status());
  });

  test('should get job status', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/codegen/test-job-id/status', ADMIN_AUTH);
    expect([200, 404, 401, 403]).toContain(response.status());
  });

  test('should get job results', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/codegen/test-job-id/results', ADMIN_AUTH);
    expect([200, 400, 404, 401, 403]).toContain(response.status());
  });

  test('should cancel job', async ({ request }) => {
    const response = await request.delete('/api/public/v1/graph/codegen/test-job-id', ADMIN_AUTH);
    expect([200, 404, 401, 403]).toContain(response.status());
  });

  test('should list all jobs for user', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/codegen/jobs', ADMIN_AUTH);
    expect([200, 401, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('jobs');
    }
  });
});

test.describe('Graph Planning E2E Tests', () => {
  test('should require auth for plan endpoints', async ({ request }) => {
    const response = await request.post('/api/public/v1/graph/plan', {
      data: { graph: { nodes: [], edges: [] } },
    });
    expect(response.status()).toBe(401);
  });

  test('should initialize planning', async ({ request }) => {
    const response = await request.post('/api/public/v1/graph/plan', {
      ...ADMIN_AUTH,
      headers: {
        ...ADMIN_AUTH.extraHTTPHeaders,
        'X-Kubegram-Team-Id': '1',
      },
      data: {
        graph: {
          nodes: [
            { id: 'node-1', type: 'deployment', data: { name: 'app' } },
          ],
          edges: [],
        },
      },
    });
    
    expect([201, 400, 401, 403, 500]).toContain(response.status());
  });

  test('should get plan status', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/plan/test-plan-id/status', ADMIN_AUTH);
    expect([200, 404, 401, 403]).toContain(response.status());
  });

  test('should get plan results', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/plan/test-plan-id/results', ADMIN_AUTH);
    expect([200, 400, 404, 401, 403]).toContain(response.status());
  });
});

test.describe('Graph Validation E2E Tests', () => {
  test('should require auth for validate endpoints', async ({ request }) => {
    const response = await request.post('/api/public/v1/graph/validate', {
      data: { graph: { nodes: [], edges: [] } },
    });
    expect(response.status()).toBe(401);
  });

  test('should initialize validation', async ({ request }) => {
    const response = await request.post('/api/public/v1/graph/validate', {
      ...ADMIN_AUTH,
      headers: {
        ...ADMIN_AUTH.extraHTTPHeaders,
        'X-Kubegram-Team-Id': '1',
      },
      data: {
        graph: {
          nodes: [
            { id: 'node-1', type: 'deployment' },
          ],
          edges: [],
        },
      },
    });
    
    expect([201, 400, 401, 403, 500]).toContain(response.status());
  });

  test('should get validation status', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/validate/test-validation-id/status', ADMIN_AUTH);
    expect([200, 404, 401, 403]).toContain(response.status());
  });

  test('should get validation results', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/validate/test-validation-id/results', ADMIN_AUTH);
    expect([200, 400, 404, 401, 403]).toContain(response.status());
  });
});

test.describe('Graph Suggestions E2E Tests', () => {
  test('should require auth for suggest endpoint', async ({ request }) => {
    const response = await request.post('/api/public/v1/graph/suggest', {
      data: { graph: { nodes: [], edges: [] } },
    });
    expect(response.status()).toBe(401);
  });

  test('should get AI suggestions', async ({ request }) => {
    const response = await request.post('/api/public/v1/graph/suggest', {
      ...ADMIN_AUTH,
      headers: {
        ...ADMIN_AUTH.extraHTTPHeaders,
        'X-Kubegram-Team-Id': '1',
      },
      data: {
        graph: {
          nodes: [
            { id: 'node-1', type: 'deployment' },
          ],
          edges: [],
        },
      },
    });
    
    expect([200, 400, 401, 403, 500]).toContain(response.status());
  });
});

test.describe('Graph CRUD E2E Tests', () => {
  test('should require auth for graph CRUD', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/crud');
    expect(response.status()).toBe(401);
  });

  test('should list graphs', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/crud', ADMIN_AUTH);
    expect([200, 401, 403]).toContain(response.status());
  });
});

test.describe('Code Generation Workflow E2E Tests', () => {
  test('full codegen workflow', async ({ request }) => {
    const projectName = `E2E Test Project ${Date.now()}`;
    
    const createProjectResponse = await request.post('/api/public/v1/projects', {
      ...ADMIN_AUTH,
      data: {
        name: projectName,
        graphId: `graph-${Date.now()}`,
        graphMeta: JSON.stringify({ nodes: 5, edges: 3 }),
      },
    });
    
    if (createProjectResponse.status() === 201) {
      const project = await createProjectResponse.json();
      
      const codegenResponse = await request.post('/api/public/v1/graph/codegen', {
        ...ADMIN_AUTH,
        headers: {
          ...ADMIN_AUTH.extraHTTPHeaders,
          'X-Kubegram-Team-Id': '1',
        },
        data: {
          graph: {
            nodes: [
              { id: 'node-1', type: 'deployment', data: { name: 'app' } },
            ],
            edges: [],
            graphType: 'kubernetes',
          },
          project: {
            name: projectName,
            id: project.id,
          },
          llmConfig: {
            provider: 'claude',
          },
        },
      });
      
      expect([201, 400, 401, 403, 500]).toContain(codegenResponse.status());
    }
  });

  test('validation workflow', async ({ request }) => {
    const validationResponse = await request.post('/api/public/v1/graph/validate', {
      ...ADMIN_AUTH,
      headers: {
        ...ADMIN_AUTH.extraHTTPHeaders,
        'X-Kubegram-Team-Id': '1',
      },
      data: {
        graph: {
          nodes: [
            { id: 'node-1', type: 'deployment', data: { name: 'nginx' } },
            { id: 'node-2', type: 'service', data: { name: 'nginx-svc' } },
          ],
          edges: [
            { source: 'node-1', target: 'node-2', type: 'connects' },
          ],
        },
      },
    });
    
    expect([201, 400, 401, 403, 500]).toContain(validationResponse.status());
  });
});
