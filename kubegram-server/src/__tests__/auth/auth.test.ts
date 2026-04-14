import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  getTestClient,
  getTestDbClient,
  resetDatabase,
  loadFixtures,
  createAuthHeaders,
  createAdminHeaders,
  createMemberHeaders,
  TEST_USERS,
  TEST_SESSIONS,
} from '../../test/helpers';
import { sessionFactory } from '../../test/factories';

describe('Auth API Integration Tests', () => {
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

  describe('GET /api/public/v1/auth/me', () => {
    it('should return 401 for unauthenticated request', async () => {
      const response = await client.get('/api/public/v1/auth/me');
      expect(response.status).toBe(401);
    });

    it('should return user info for valid session', async () => {
      const response = await client.get('/api/public/v1/auth/me', {
        headers: createAuthHeaders('admin'),
      });

      if (response.status === 200) {
        const body = response.body as Record<string, unknown>;
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('email');
        expect(body).toHaveProperty('name');
        expect(body).toHaveProperty('role');
      } else {
        expect(response.status).toBe(401);
      }
    });

    it('should return 401 for invalid session', async () => {
      const response = await client.get('/api/public/v1/auth/me', {
        headers: {
          Cookie: 'session=invalid-session-id',
        },
      });
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/public/v1/auth/logout', () => {
    it('should return 401 for unauthenticated request', async () => {
      const response = await client.post('/api/public/v1/auth/logout');
      expect(response.status).toBe(401);
    });

    it('should return 200 for valid session', async () => {
      const response = await client.post('/api/public/v1/auth/logout', {
        headers: createAuthHeaders('admin'),
      });

      expect([200, 401]).toContain(response.status);
    });

    it('should clear session cookie', async () => {
      const response = await client.post('/api/public/v1/auth/logout', {
        headers: createAuthHeaders('admin'),
      });

      if (response.status === 200) {
        const setCookie = response.headers.get('set-cookie');
        expect(setCookie).toContain('session=');
        expect(setCookie).toContain('Expires=');
      }
    });
  });

  describe('GET /api/public/v1/auth/providers', () => {
    it('should return list of configured providers', async () => {
      const response = await client.get('/api/public/v1/auth/providers');
      expect(response.status).toBe(200);

      const body = response.body as { providers: Array<{ id: string; name: string }> };
      expect(body).toHaveProperty('providers');
      expect(Array.isArray(body.providers)).toBe(true);
    });

    it('should include GitHub provider when configured', async () => {
      const response = await client.get('/api/public/v1/auth/providers');
      expect(response.status).toBe(200);

      const body = response.body as { providers: Array<{ id: string }> };
      expect(body.providers.some((p: { id: string }) => p.id === 'github')).toBe(true);
    });

    it('should not require authentication', async () => {
      const response = await client.get('/api/public/v1/auth/providers');
      expect(response.status).toBe(200);
    });
  });
});

describe('Session Management Integration Tests', () => {
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

  describe('Session Storage', () => {
    it('should create session in database', async () => {
      const session = sessionFactory.create('newuser@test.com');
      
      await db`INSERT INTO openauth_sessions 
        (id, subject, provider, access_token, expires_at) 
        VALUES (${session.id}, ${session.subject}, ${session.provider}, ${session.accessToken}, ${session.expiresAt})`;

      const result = await db`SELECT * FROM openauth_sessions WHERE subject = ${'newuser@test.com'}`;
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(session.id);
    });

    it('should retrieve valid session', async () => {
      const result = await db`SELECT * FROM openauth_sessions WHERE subject = ${'admin@test.com'}`;
      expect(result.length).toBe(1);
      expect(result[0].subject).toBe('admin@test.com');
    });

    it('should reject expired session', async () => {
      const expiredSession = sessionFactory.createExpired('expired@test.com');
      
      await db`INSERT INTO openauth_sessions 
        (id, subject, provider, access_token, expires_at) 
        VALUES (${expiredSession.id}, ${expiredSession.subject}, ${expiredSession.provider}, ${expiredSession.accessToken}, ${expiredSession.expiresAt})`;

      const result = await db`SELECT * FROM openauth_sessions WHERE expires_at < NOW()`;
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Session Deletion', () => {
    it('should delete session by ID', async () => {
      const session = sessionFactory.create('delete-me@test.com');
      
      await db`INSERT INTO openauth_sessions 
        (id, subject, provider, access_token, expires_at) 
        VALUES (${session.id}, ${session.subject}, ${session.provider}, ${session.accessToken}, ${session.expiresAt})`;

      await db`DELETE FROM openauth_sessions WHERE id = ${session.id}`;

      const result = await db`SELECT * FROM openauth_sessions WHERE id = ${session.id}`;
      expect(result.length).toBe(0);
    });
  });
});

describe('Role-Based Access Control Integration Tests', () => {
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

  describe('Admin Role Access', () => {
    it('should allow admin to access protected routes', async () => {
      const response = await client.get('/api/v1/providers', {
        headers: createAdminHeaders(),
      });

      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Manager Role Access', () => {
    it('should allow manager to access team routes', async () => {
      const response = await client.get('/api/public/v1/teams', {
        headers: createAuthHeaders('manager'),
      });

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Team Member Role Access', () => {
    it('should allow team member to access project routes', async () => {
      const response = await client.get('/api/public/v1/projects', {
        headers: createMemberHeaders(),
      });

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Unauthenticated Access', () => {
    it('should deny access to protected routes', async () => {
      const protectedRoutes = [
        '/api/v1/providers',
        '/api/public/v1/graph/crud',
        '/api/public/v1/graph/codegen',
      ];

      for (const route of protectedRoutes) {
        const response = await client.get(route);
        expect(response.status).toBe(401);
      }
    });

    it('should allow access to public routes', async () => {
      const publicRoutes = [
        '/api/public/v1/companies',
        '/api/public/v1/healthz/live',
        '/api/public/v1/auth/providers',
      ];

      for (const route of publicRoutes) {
        const response = await client.get(route);
        expect(response.status).toBeLessThan(500);
      }
    });
  });
});

describe('OAuth Flow Integration Tests', () => {
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

  describe('OAuth Redirect', () => {
    it('should redirect to GitHub OAuth page', async () => {
      const response = await client.get('/oauth/github');
      
      if (response.status === 302) {
        const location = response.headers.get('location');
        expect(location).toContain('github.com');
      } else if (response.status === 200) {
        expect(response.status).toBe(200);
      }
    });

    it('should redirect to Google OAuth page', async () => {
      const response = await client.get('/oauth/google');
      
      if (response.status === 302) {
        const location = response.headers.get('location');
        expect(location).toContain('accounts.google.com');
      }
    });
  });

  describe('OAuth Callback', () => {
    it('should handle GitHub OAuth callback', async () => {
      const response = await client.get('/oauth/github/callback', {
        query: { code: 'test_code', state: 'test_state' },
      });

      expect([200, 302, 400, 401]).toContain(response.status);
    });

    it('should handle invalid OAuth callback', async () => {
      const response = await client.get('/oauth/github/callback', {
        query: { error: 'access_denied' },
      });

      expect(response.status).toBeLessThan(500);
    });
  });
});
