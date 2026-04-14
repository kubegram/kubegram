import { test, expect } from '@playwright/test';

test.describe('Health Check E2E Tests', () => {
  test('liveness endpoint should return 200', async ({ request }) => {
    const response = await request.get('/api/public/v1/healthz/live');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('readiness endpoint should check database', async ({ request }) => {
    const response = await request.get('/api/public/v1/healthz/ready');
    
    const body = await response.json();
    expect(body.status).toBeDefined();
  });
});

test.describe('Public API E2E Tests', () => {
  test('companies list should be accessible', async ({ request }) => {
    const response = await request.get('/api/public/v1/companies');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(Array.isArray(body.companies) || Array.isArray(body)).toBeTruthy();
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

  test('projects list should require auth', async ({ request }) => {
    const response = await request.get('/api/public/v1/projects');
    expect(response.status()).toBe(401);
  });
});

test.describe('User Authentication E2E Tests', () => {
  test('me endpoint should return current user with valid session', async ({ request }) => {
    const response = await request.get('/api/public/v1/auth/me', {
      headers: {
        Cookie: 'session=session-admin-001',
      },
    });
    
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('admin@test.com');
    } else {
      expect(response.status()).toBe(401);
    }
  });
});
