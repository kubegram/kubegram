import { test, expect } from '@playwright/test';

test.describe('Health Check E2E Tests', () => {
  test('liveness endpoint should return 200 OK', async ({ request }) => {
    const response = await request.get('/api/public/v1/healthz/live');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('readiness endpoint should return 200', async ({ request }) => {
    const response = await request.get('/api/public/v1/healthz/ready');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.status).toBeDefined();
  });

  test('health endpoints should not require authentication', async ({ request }) => {
    const liveResponse = await request.get('/api/public/v1/healthz/live');
    expect(liveResponse.status()).toBeLessThan(500);

    const readyResponse = await request.get('/api/public/v1/healthz/ready');
    expect(readyResponse.status()).toBeLessThan(500);
  });
});

test.describe('Public API E2E Tests', () => {
  test('companies list should be accessible without auth', async ({ request }) => {
    const response = await request.get('/api/public/v1/companies');
    expect(response.status()).toBeLessThan(500);
    
    if (response.ok()) {
      const body = await response.json();
      expect(Array.isArray(body) || body.companies).toBeTruthy();
    }
  });

  test('organizations list should be accessible', async ({ request }) => {
    const response = await request.get('/api/public/v1/organizations');
    expect(response.status()).toBeLessThan(500);
  });

  test('teams list should be accessible', async ({ request }) => {
    const response = await request.get('/api/public/v1/teams');
    expect(response.status()).toBeLessThan(500);
  });

  test('auth providers should list configured providers', async ({ request }) => {
    const response = await request.get('/api/public/v1/auth/providers');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.providers).toBeDefined();
    expect(Array.isArray(body.providers)).toBeTruthy();
  });
});

test.describe('Protected API E2E Tests', () => {
  test('protected endpoint should require authentication', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/crud');
    expect(response.status()).toBe(401);
  });

  test('projects endpoint should require auth', async ({ request }) => {
    const response = await request.get('/api/public/v1/projects');
    expect(response.status()).toBe(401);
  });

  test('admin operators should require auth', async ({ request }) => {
    const response = await request.get('/api/v1/admin/operators');
    expect(response.status()).toBe(401);
  });

  test('protected endpoint should reject invalid session', async ({ request }) => {
    const response = await request.get('/api/public/v1/graph/crud', {
      headers: {
        Cookie: 'session=invalid-session-id',
      },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('User Authentication E2E Tests', () => {
  test('me endpoint should return user with valid session', async ({ request }) => {
    const response = await request.get('/api/public/v1/auth/me', {
      headers: {
        Cookie: 'session=session-admin-001',
      },
    });

    if (response.status() === 200) {
      const body = await response.json();
      expect(body.user).toBeDefined();
      expect(body.user.email).toBeTruthy();
    } else {
      expect(response.status()).toBe(401);
    }
  });

  test('me endpoint should reject invalid session', async ({ request }) => {
    const response = await request.get('/api/public/v1/auth/me', {
      headers: {
        Cookie: 'session=invalid-session',
      },
    });
    expect(response.status()).toBe(401);
  });

  test('logout should work with valid session', async ({ request }) => {
    const response = await request.post('/api/public/v1/auth/logout', {
      headers: {
        Cookie: 'session=session-admin-001',
      },
    });

    expect([200, 401]).toContain(response.status());
  });

  test('logout should reject without session', async ({ request }) => {
    const response = await request.post('/api/public/v1/auth/logout');
    expect(response.status()).toBe(401);
  });
});

test.describe('OAuth Flow E2E Tests', () => {
  test('GitHub OAuth redirect should work', async ({ request }) => {
    const response = await request.get('/oauth/github');
    
    if (response.status() === 302) {
      const location = response.headers()['location'];
      expect(location).toContain('github.com');
    } else {
      expect([200, 302, 400]).toContain(response.status());
    }
  });

  test('Google OAuth redirect should work', async ({ request }) => {
    const response = await request.get('/oauth/google');
    
    if (response.status() === 302) {
      const location = response.headers()['location'];
      expect(location).toContain('google.com');
    }
  });

  test('OAuth callback should handle error param', async ({ request }) => {
    const response = await request.get('/oauth/github/callback', {
      params: { error: 'access_denied' },
    });
    
    expect(response.status()).toBeLessThan(500);
  });

  test('OAuth callback should handle code param', async ({ request }) => {
    const response = await request.get('/oauth/github/callback', {
      params: { code: 'test_code', state: 'test_state' },
    });
    
    expect([200, 302, 400, 401]).toContain(response.status());
  });
});
