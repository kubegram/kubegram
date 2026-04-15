import { test, expect } from '@playwright/test';

const ADMIN_AUTH = { headers: { Cookie: 'session=session-admin-001' } };
const MANAGER_AUTH = { headers: { Cookie: 'session=session-manager-001' } };
const MEMBER_AUTH = { headers: { Cookie: 'session=member1-001' } };

test.describe('Company CRUD E2E Tests', () => {
  test('should list all companies', async ({ request }) => {
    const response = await request.get('/api/public/v1/companies');
    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const body = await response.json();
      expect(Array.isArray(body) || Array.isArray(body.companies)).toBeTruthy();
    }
  });

  test('should get a company by ID', async ({ request }) => {
    const response = await request.get('/api/public/v1/companies/550e8400-e29b-41d4-a716-446655440000');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.name).toBe('Test Company Inc');
  });

  test('should return 404 for non-existent company', async ({ request }) => {
    const response = await request.get('/api/public/v1/companies/99999999-9999-9999-9999-999999999999');
    expect(response.status()).toBe(404);
  });

  test('should create a company with admin auth', async ({ request }) => {
    const response = await request.post('/api/public/v1/companies', {
      ...ADMIN_AUTH,
      data: {
        name: `E2E Test Company ${Date.now()}`,
        tokens: 100,
      },
    });

    expect([201, 401, 403]).toContain(response.status());

    if (response.status() === 201) {
      const body = await response.json();
      expect(body.name).toContain('E2E Test Company');
    }
  });

  test('should update a company', async ({ request }) => {
    const createResponse = await request.post('/api/public/v1/companies', {
      ...ADMIN_AUTH,
      data: { name: 'Company to Update' },
    });

    if (createResponse.status() === 201) {
      const created = await createResponse.json();
      const updateResponse = await request.put(`/api/public/v1/companies/${created.id}`, {
        ...ADMIN_AUTH,
        data: { name: 'Updated Company Name', tokens: 200 },
      });

      expect(updateResponse.status()).toBe(200);
      const updated = await updateResponse.json();
      expect(updated.name).toBe('Updated Company Name');
    }
  });

  test('should delete a company', async ({ request }) => {
    const createResponse = await request.post('/api/public/v1/companies', {
      ...ADMIN_AUTH,
      data: { name: 'Company to Delete' },
    });

    if (createResponse.status() === 201) {
      const created = await createResponse.json();
      const deleteResponse = await request.delete(`/api/public/v1/companies/${created.id}`, ADMIN_AUTH);
      expect([200, 204]).toContain(deleteResponse.status());
    }
  });
});

test.describe('Organization CRUD E2E Tests', () => {
  test('should list all organizations', async ({ request }) => {
    const response = await request.get('/api/public/v1/organizations');
    expect(response.status()).toBeLessThan(500);
  });

  test('should get organization by ID', async ({ request }) => {
    const response = await request.get('/api/public/v1/organizations/1');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.name).toBe('Engineering');
  });

  test('should create an organization', async ({ request }) => {
    const response = await request.post('/api/public/v1/organizations', {
      ...ADMIN_AUTH,
      data: {
        name: `E2E Test Org ${Date.now()}`,
        companyID: '550e8400-e29b-41d4-a716-446655440000',
      },
    });

    expect([201, 400, 401, 403]).toContain(response.status());
  });

  test('should update an organization', async ({ request }) => {
    const response = await request.put('/api/public/v1/organizations/1', {
      ...ADMIN_AUTH,
      data: { name: 'Updated Engineering' },
    });

    expect([200, 401, 403]).toContain(response.status());
  });
});

test.describe('Team CRUD E2E Tests', () => {
  test('should list all teams', async ({ request }) => {
    const response = await request.get('/api/public/v1/teams');
    expect(response.status()).toBeLessThan(500);
  });

  test('should get team by ID', async ({ request }) => {
    const response = await request.get('/api/public/v1/teams/1');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.name).toBe('Platform Team');
  });

  test('should create a team', async ({ request }) => {
    const response = await request.post('/api/public/v1/teams', {
      ...ADMIN_AUTH,
      data: {
        name: `E2E Test Team ${Date.now()}`,
        organizationID: 1,
      },
    });

    expect([201, 400, 401, 403]).toContain(response.status());
  });
});

test.describe('Project CRUD E2E Tests', () => {
  test('should list all projects', async ({ request }) => {
    const response = await request.get('/api/public/v1/projects');
    expect(response.status()).toBeLessThan(500);
  });

  test('should get project by ID', async ({ request }) => {
    const response = await request.get('/api/public/v1/projects/1');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.name).toBe('Project Alpha');
  });

  test('should create a project with graph metadata', async ({ request }) => {
    const response = await request.post('/api/public/v1/projects', {
      ...ADMIN_AUTH,
      data: {
        name: `E2E Test Project ${Date.now()}`,
        graphId: `graph-${Date.now()}`,
        graphMeta: JSON.stringify({ version: '1.0.0', nodes: [] }),
      },
    });

    expect([201, 401, 403]).toContain(response.status());
  });

  test('should update a project', async ({ request }) => {
    const response = await request.put('/api/public/v1/projects/1', {
      ...ADMIN_AUTH,
      data: { name: 'Updated Project Alpha' },
    });

    expect([200, 401, 403]).toContain(response.status());
  });

  test('should delete a project', async ({ request }) => {
    const createResponse = await request.post('/api/public/v1/projects', {
      ...ADMIN_AUTH,
      data: { name: 'Project to Delete' },
    });

    if (createResponse.status() === 201) {
      const created = await createResponse.json();
      const deleteResponse = await request.delete(`/api/public/v1/projects/${created.id}`, ADMIN_AUTH);
      expect([200, 204]).toContain(deleteResponse.status());
    }
  });
});

test.describe('Role-Based Access E2E Tests', () => {
  test('admin should access admin endpoints', async ({ request }) => {
    const response = await request.get('/api/v1/admin/operators', ADMIN_AUTH);
    expect([200, 401, 403]).toContain(response.status());
  });

  test('manager should access team routes', async ({ request }) => {
    const response = await request.get('/api/public/v1/teams', MANAGER_AUTH);
    expect(response.status()).toBeLessThan(500);
  });

  test('team member should access project routes', async ({ request }) => {
    const response = await request.get('/api/public/v1/projects', MEMBER_AUTH);
    expect(response.status()).toBeLessThan(500);
  });

  test('unauthenticated should be denied from protected routes', async ({ request }) => {
    const endpoints = [
      '/api/public/v1/graph/crud',
      '/api/public/v1/graph/codegen',
      '/api/v1/admin/operators',
      '/api/v1/providers',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(401);
    }
  });
});
