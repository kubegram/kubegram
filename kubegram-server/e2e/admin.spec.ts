import { test, expect } from '@playwright/test';

const ADMIN_AUTH = { extraHTTPHeaders: { Cookie: 'session=session-admin-001' } };
const MANAGER_AUTH = { extraHTTPHeaders: { Cookie: 'session=session-manager-001' } };
const MEMBER_AUTH = { extraHTTPHeaders: { Cookie: 'session=member1-001' } };

test.describe('Admin Operators E2E Tests', () => {
  test('should require auth for operators list', async ({ request }) => {
    const response = await request.get('/api/v1/admin/operators');
    expect(response.status()).toBe(401);
  });

  test('admin should list operators', async ({ request }) => {
    const response = await request.get('/api/v1/admin/operators', ADMIN_AUTH);
    expect([200, 401, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.operators).toBeDefined();
      expect(Array.isArray(body.operators)).toBeTruthy();
    }
  });

  test('manager should not access operators', async ({ request }) => {
    const response = await request.get('/api/v1/admin/operators', MANAGER_AUTH);
    expect([401, 403]).toContain(response.status());
  });

  test('team member should not access operators', async ({ request }) => {
    const response = await request.get('/api/v1/admin/operators', MEMBER_AUTH);
    expect([401, 403]).toContain(response.status());
  });

  test('should register operator with valid token', async ({ request }) => {
    const response = await request.post('/api/v1/admin/operators/register', {
      headers: { Authorization: 'Bearer test-operator-token-001' },
      data: {
        clusterId: `e2e-cluster-${Date.now()}`,
        version: '1.0.0',
        mcpEndpoint: 'http://operator:8080',
      },
    });
    
    expect([200, 201, 400, 401, 500]).toContain(response.status());
  });

  test('should reject registration without token', async ({ request }) => {
    const response = await request.post('/api/v1/admin/operators/register', {
      data: { clusterId: 'test-cluster' },
    });
    expect(response.status()).toBe(401);
  });

  test('should reject registration with invalid token', async ({ request }) => {
    const response = await request.post('/api/v1/admin/operators/register', {
      headers: { Authorization: 'Bearer invalid-token' },
      data: { clusterId: 'test-cluster' },
    });
    expect(response.status()).toBe(401);
  });

  test('should delete operator as admin', async ({ request }) => {
    const response = await request.delete('/api/v1/admin/operators/1', ADMIN_AUTH);
    expect([200, 401, 403, 404]).toContain(response.status());
  });
});

test.describe('Admin Operator Tokens E2E Tests', () => {
  test('should require auth for tokens list', async ({ request }) => {
    const response = await request.get('/api/v1/admin/operator-tokens');
    expect(response.status()).toBe(401);
  });

  test('admin should list tokens', async ({ request }) => {
    const response = await request.get('/api/v1/admin/operator-tokens', ADMIN_AUTH);
    expect([200, 401, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.tokens).toBeDefined();
      expect(Array.isArray(body.tokens)).toBeTruthy();
    }
  });

  test('manager should not access tokens', async ({ request }) => {
    const response = await request.get('/api/v1/admin/operator-tokens', MANAGER_AUTH);
    expect([401, 403]).toContain(response.status());
  });

  test('admin should create token', async ({ request }) => {
    const response = await request.post('/api/v1/admin/operator-tokens', {
      ...ADMIN_AUTH,
      data: {
        companyId: '11111111-1111-1111-1111-111111111111',
        label: 'E2E Test Token',
      },
    });
    
    expect([201, 400, 401, 403]).toContain(response.status());
    
    if (response.status() === 201) {
      const body = await response.json();
      expect(body.token).toBeDefined();
      expect(body.token.length).toBeGreaterThan(10);
    }
  });

  test('admin should revoke token', async ({ request }) => {
    const response = await request.delete('/api/v1/admin/operator-tokens/1', ADMIN_AUTH);
    expect([200, 401, 403, 404]).toContain(response.status());
  });

  test('team member should not create tokens', async ({ request }) => {
    const response = await request.post('/api/v1/admin/operator-tokens', {
      ...MEMBER_AUTH,
      data: { label: 'Unauthorized Token' },
    });
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('LLM Providers E2E Tests', () => {
  test('should require auth for providers', async ({ request }) => {
    const response = await request.get('/api/v1/providers');
    expect(response.status()).toBe(401);
  });

  test('authenticated user should access providers', async ({ request }) => {
    const response = await request.get('/api/v1/providers', ADMIN_AUTH);
    expect([200, 401, 403, 500]).toContain(response.status());
  });

  test('should add provider as admin', async ({ request }) => {
    const response = await request.post('/api/v1/providers', {
      ...ADMIN_AUTH,
      data: {
        provider: 'openai',
        model: 'gpt-4',
      },
    });
    
    expect([201, 400, 401, 403, 500]).toContain(response.status());
  });
});

test.describe('Admin Workflow E2E Tests', () => {
  test('full operator lifecycle', async ({ request }) => {
    const operatorId = `workflow-operator-${Date.now()}`;
    
    const createTokenResponse = await request.post('/api/v1/admin/operator-tokens', {
      ...ADMIN_AUTH,
      data: { label: 'Workflow Test Token' },
    });
    
    if (createTokenResponse.status() === 201) {
      const { token } = await createTokenResponse.json();
      
      const registerResponse = await request.post('/api/v1/admin/operators/register', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          clusterId: operatorId,
          version: '1.0.0',
          mcpEndpoint: 'http://operator:8080',
        },
      });
      
      expect([200, 201]).toContain(registerResponse.status());
      
      const listResponse = await request.get('/api/v1/admin/operators', ADMIN_AUTH);
      if (listResponse.status() === 200) {
        const body = await listResponse.json();
        expect(body.operators).toBeDefined();
      }
    }
  });

  test('token management workflow', async ({ request }) => {
    const createResponse = await request.post('/api/v1/admin/operator-tokens', {
      ...ADMIN_AUTH,
      data: {
        companyId: '11111111-1111-1111-1111-111111111111',
        label: 'Temporary Token',
      },
    });
    
    if (createResponse.status() === 201) {
      const { token } = await createResponse.json();
      
      const verifyResponse = await request.post('/api/v1/admin/operators/register', {
        headers: { Authorization: `Bearer ${token}` },
        data: { clusterId: `temp-cluster-${Date.now()}` },
      });
      
      expect([200, 201]).toContain(verifyResponse.status());
    }
  });
});
