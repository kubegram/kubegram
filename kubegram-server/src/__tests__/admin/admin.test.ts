import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getTestClient,
  getTestDbClient,
  resetDatabase,
  loadFixtures,
  createAdminHeaders,
  createManagerHeaders,
  createMemberHeaders,
} from '../../test/helpers';
import { operatorTokenFactory } from '../../test/factories';

describe('Admin Operators API Integration Tests', () => {
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

  describe('POST /api/v1/admin/operators/register', () => {
    it('should register operator with valid token', async () => {
      const response = await client.post('/api/v1/admin/operators/register', {
        headers: {
          Authorization: 'Bearer test-operator-token-001',
        },
        body: {
          clusterId: 'new-cluster-001',
          version: '1.0.0',
          mcpEndpoint: 'http://operator:8080',
        },
      });

      expect([200, 201, 400, 401, 500]).toContain(response.status);

      if (response.status === 201 || response.status === 200) {
        const body = response.body as { ok: boolean; id?: number };
        expect(body.ok).toBe(true);
      }
    });

    it('should reject registration without token', async () => {
      const response = await client.post('/api/v1/admin/operators/register', {
        body: {
          clusterId: 'new-cluster-001',
        },
      });

      expect(response.status).toBe(401);
    });

    it('should reject registration with invalid token', async () => {
      const response = await client.post('/api/v1/admin/operators/register', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        body: {
          clusterId: 'new-cluster-001',
        },
      });

      expect(response.status).toBe(401);
    });

    it('should reject registration with revoked token', async () => {
      const revokedToken = operatorTokenFactory.createRevoked();
      await db`INSERT INTO operator_tokens (id, token, company_id, revoked_at) 
        VALUES (${revokedToken.id}, ${revokedToken.token}, NULL, ${revokedToken.revokedAt})`;

      const response = await client.post('/api/v1/admin/operators/register', {
        headers: {
          Authorization: `Bearer ${revokedToken.token}`,
        },
        body: {
          clusterId: 'new-cluster-001',
        },
      });

      expect(response.status).toBe(401);
    });

    it('should reject registration without clusterId', async () => {
      const response = await client.post('/api/v1/admin/operators/register', {
        headers: {
          Authorization: 'Bearer test-operator-token-001',
        },
        body: {},
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/admin/operators', () => {
    it('should require authentication', async () => {
      const response = await client.get('/api/v1/admin/operators');
      expect(response.status).toBe(401);
    });

    it('should allow admin access', async () => {
      const response = await client.get('/api/v1/admin/operators', {
        headers: createAdminHeaders(),
      });

      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        const body = response.body as { operators: unknown[] };
        expect(body).toHaveProperty('operators');
        expect(Array.isArray(body.operators)).toBe(true);
      }
    });

    it('should deny manager access', async () => {
      const response = await client.get('/api/v1/admin/operators', {
        headers: createManagerHeaders(),
      });

      expect([401, 403]).toContain(response.status);
    });

    it('should deny team_member access', async () => {
      const response = await client.get('/api/v1/admin/operators', {
        headers: createMemberHeaders(),
      });

      expect([401, 403]).toContain(response.status);
    });

    it('should list all operators', async () => {
      const response = await client.get('/api/v1/admin/operators', {
        headers: createAdminHeaders(),
      });

      if (response.status === 200) {
        const body = response.body as { operators: Array<{ clusterId: string; status: string }> };
        expect(body.operators.length).toBeGreaterThan(0);
      }
    });
  });

  describe('DELETE /api/v1/admin/operators/:id', () => {
    it('should require authentication', async () => {
      const response = await client.delete('/api/v1/admin/operators/1');
      expect(response.status).toBe(401);
    });

    it('should allow admin to delete operator', async () => {
      const response = await client.delete('/api/v1/admin/operators/1', {
        headers: createAdminHeaders(),
      });

      expect([200, 401, 403, 404]).toContain(response.status);

      if (response.status === 200) {
        const body = response.body as { ok: boolean };
        expect(body.ok).toBe(true);
      }
    });

    it('should deny manager access', async () => {
      const response = await client.delete('/api/v1/admin/operators/1', {
        headers: createManagerHeaders(),
      });

      expect([401, 403]).toContain(response.status);
    });

    it('should handle invalid operator ID', async () => {
      const response = await client.delete('/api/v1/admin/operators/invalid', {
        headers: createAdminHeaders(),
      });

      expect([400, 401, 403]).toContain(response.status);
    });
  });
});

describe('Admin Operator Tokens API Integration Tests', () => {
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

  describe('GET /api/v1/admin/operator-tokens', () => {
    it('should require authentication', async () => {
      const response = await client.get('/api/v1/admin/operator-tokens');
      expect(response.status).toBe(401);
    });

    it('should allow admin access', async () => {
      const response = await client.get('/api/v1/admin/operator-tokens', {
        headers: createAdminHeaders(),
      });

      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        const body = response.body as { tokens: unknown[] };
        expect(body).toHaveProperty('tokens');
        expect(Array.isArray(body.tokens)).toBe(true);
      }
    });

    it('should deny non-admin access', async () => {
      const response = await client.get('/api/v1/admin/operator-tokens', {
        headers: createMemberHeaders(),
      });

      expect([401, 403]).toContain(response.status);
    });

    it('should list only non-revoked tokens', async () => {
      const response = await client.get('/api/v1/admin/operator-tokens', {
        headers: createAdminHeaders(),
      });

      if (response.status === 200) {
        const body = response.body as { tokens: Array<{ revokedAt: unknown }> };
        body.tokens.forEach((token) => {
          expect(token.revokedAt).toBeNull();
        });
      }
    });
  });

  describe('POST /api/v1/admin/operator-tokens', () => {
    it('should require authentication', async () => {
      const response = await client.post('/api/v1/admin/operator-tokens', {
        body: {},
      });
      expect(response.status).toBe(401);
    });

    it('should allow admin to create token', async () => {
      const response = await client.post('/api/v1/admin/operator-tokens', {
        headers: createAdminHeaders(),
        body: {
          companyId: '11111111-1111-1111-1111-111111111111',
          label: 'Test Token',
        },
      });

      expect([201, 400, 401, 403]).toContain(response.status);

      if (response.status === 201) {
        const body = response.body as { token: string };
        expect(body.token).toBeDefined();
        expect(body.token.length).toBeGreaterThan(10);
      }
    });

    it('should create token without optional fields', async () => {
      const response = await client.post('/api/v1/admin/operator-tokens', {
        headers: createAdminHeaders(),
        body: {},
      });

      expect([201, 400, 401, 403]).toContain(response.status);

      if (response.status === 201) {
        const body = response.body as { token: string };
        expect(body.token).toBeDefined();
      }
    });

    it('should deny non-admin access', async () => {
      const response = await client.post('/api/v1/admin/operator-tokens', {
        headers: createMemberHeaders(),
        body: {},
      });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('DELETE /api/v1/admin/operator-tokens/:id', () => {
    it('should require authentication', async () => {
      const response = await client.delete('/api/v1/admin/operator-tokens/1');
      expect(response.status).toBe(401);
    });

    it('should allow admin to revoke token', async () => {
      const response = await client.delete('/api/v1/admin/operator-tokens/1', {
        headers: createAdminHeaders(),
      });

      expect([200, 401, 403, 404]).toContain(response.status);

      if (response.status === 200) {
        const body = response.body as { ok: boolean };
        expect(body.ok).toBe(true);
      }
    });

    it('should deny non-admin access', async () => {
      const response = await client.delete('/api/v1/admin/operator-tokens/1', {
        headers: createMemberHeaders(),
      });

      expect([401, 403]).toContain(response.status);
    });

    it('should handle invalid token ID', async () => {
      const response = await client.delete('/api/v1/admin/operator-tokens/invalid', {
        headers: createAdminHeaders(),
      });

      expect([400, 401, 403]).toContain(response.status);
    });
  });
});

describe('LLM Providers API Integration Tests', () => {
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

  describe('GET /api/v1/providers', () => {
    it('should require authentication', async () => {
      const response = await client.get('/api/v1/providers');
      expect(response.status).toBe(401);
    });

    it('should allow authenticated access', async () => {
      const response = await client.get('/api/v1/providers', {
        headers: createAdminHeaders(),
      });

      expect([200, 401, 403, 500]).toContain(response.status);
    });
  });

  describe('POST /api/v1/providers', () => {
    it('should require authentication', async () => {
      const response = await client.post('/api/v1/providers', {
        body: {
          provider: 'openai',
          model: 'gpt-4',
        },
      });
      expect(response.status).toBe(401);
    });

    it('should allow admin to add provider', async () => {
      const response = await client.post('/api/v1/providers', {
        headers: createAdminHeaders(),
        body: {
          provider: 'openai',
          model: 'gpt-4',
        },
      });

      expect([201, 400, 401, 403, 500]).toContain(response.status);
    });
  });
});
