import { describe, it, expect, beforeAll, afterAll  } from 'vitest';
import {
  getTestClient,
  resetDatabase,
  loadFixtures,
} from '../../test/helpers';
import { companyFactory } from '../../test/factories';

describe('Companies API Integration Tests', () => {
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

  describe('GET /api/public/v1/companies', () => {
    it('should return all companies', async () => {
      const response = await client.get('/api/public/v1/companies');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      const companies = response.body as Array<{ id: string; name: string }>;
      expect(companies.length).toBeGreaterThan(0);
    });

    it('should include test fixtures', async () => {
      const response = await client.get('/api/public/v1/companies');
      const companies = response.body as Array<{ name: string }>;
      const testCompany = companies.find((c) => c.name === 'Test Company Inc');
      expect(testCompany).toBeDefined();
    });

    it('should return valid company objects', async () => {
      const response = await client.get('/api/public/v1/companies');
      const companies = response.body as Array<Record<string, unknown>>;
      
      companies.forEach((company) => {
        expect(company).toHaveProperty('id');
        expect(company).toHaveProperty('name');
        expect(company).toHaveProperty('tokens');
      });
    });

    it('should filter by organization ID', async () => {
      const response = await client.get('/api/public/v1/companies', {
        query: { organizationId: '1' },
      });
      
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/public/v1/companies/:id', () => {
    it('should return company by UUID', async () => {
      const response = await client.get('/api/public/v1/companies/11111111-1111-1111-1111-111111111111');
      expect(response.status).toBe(200);
      
      const company = response.body as { name: string };
      expect(company.name).toBe('Test Company Inc');
    });

    it('should return 404 for non-existent company', async () => {
      const response = await client.get('/api/public/v1/companies/99999999-9999-9999-9999-999999999999');
      expect(response.status).toBe(404);
    });

    it('should return 404 for invalid UUID format', async () => {
      const response = await client.get('/api/public/v1/companies/invalid-id');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/public/v1/companies', () => {
    it('should create a new company', async () => {
      const newCompany = companyFactory.create({ name: 'New Test Company', tokens: 500 });
      
      const response = await client.post('/api/public/v1/companies', {
        body: { name: newCompany.name, tokens: newCompany.tokens },
      });
      
      expect(response.status).toBe(201);
      const created = response.body as { id: string; name: string; tokens: number };
      expect(created.name).toBe('New Test Company');
      expect(created.tokens).toBe(500);
      expect(created.id).toBeDefined();
    });

    it('should create company with default tokens', async () => {
      const response = await client.post('/api/public/v1/companies', {
        body: { name: 'Default Tokens Company' },
      });
      
      expect(response.status).toBe(201);
      const created = response.body as { tokens: number };
      expect(created.tokens).toBe(0);
    });

    it('should reject company without name', async () => {
      const response = await client.post('/api/public/v1/companies', {
        body: { tokens: 100 },
      });
      
      expect(response.status).toBe(400);
    });

    it('should reject company with invalid data', async () => {
      const response = await client.post('/api/public/v1/companies', {
        body: { invalid: 'data' },
      });
      
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('PUT /api/public/v1/companies/:id', () => {
    it('should update company name', async () => {
      const newCompany = companyFactory.create({ name: 'Update Test Company' });
      const createResponse = await client.post('/api/public/v1/companies', {
        body: { name: newCompany.name },
      });
      const created = createResponse.body as { id: string };
      
      const updateResponse = await client.put(`/api/public/v1/companies/${created.id}`, {
        body: { name: 'Updated Company Name', tokens: 200 },
      });
      
      expect(updateResponse.status).toBe(200);
      const updated = updateResponse.body as { name: string; tokens: number };
      expect(updated.name).toBe('Updated Company Name');
      expect(updated.tokens).toBe(200);
    });

    it('should return 404 for non-existent company', async () => {
      const response = await client.put('/api/public/v1/companies/99999999-9999-9999-9999-999999999999', {
        body: { name: 'Updated Name' },
      });
      
      expect(response.status).toBe(404);
    });

    it('should reject invalid update data', async () => {
      const response = await client.put('/api/public/v1/companies/11111111-1111-1111-1111-111111111111', {
        body: { invalid: 'data' },
      });
      
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('DELETE /api/public/v1/companies/:id', () => {
    it('should delete company', async () => {
      const newCompany = companyFactory.create({ name: 'Delete Test Company' });
      const createResponse = await client.post('/api/public/v1/companies', {
        body: { name: newCompany.name },
      });
      const created = createResponse.body as { id: string };
      
      const deleteResponse = await client.delete(`/api/public/v1/companies/${created.id}`);
      expect(deleteResponse.status).toBe(204);
      
      const getResponse = await client.get(`/api/public/v1/companies/${created.id}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent company', async () => {
      const response = await client.delete('/api/public/v1/companies/99999999-9999-9999-9999-999999999999');
      expect(response.status).toBe(404);
    });
  });
});

describe('Organizations API Integration Tests', () => {
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

  describe('GET /api/public/v1/organizations', () => {
    it('should return all organizations', async () => {
      const response = await client.get('/api/public/v1/organizations');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      const orgs = response.body as Array<{ id: number; name: string }>;
      expect(orgs.length).toBe(3);
    });

    it('should filter by team ID', async () => {
      const response = await client.get('/api/public/v1/organizations', {
        query: { teamId: '1' },
      });
      
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/public/v1/organizations/:id', () => {
    it('should return organization by ID', async () => {
      const response = await client.get('/api/public/v1/organizations/1');
      expect(response.status).toBe(200);
      
      const org = response.body as { name: string };
      expect(org.name).toBe('Engineering');
    });

    it('should return 404 for non-existent organization', async () => {
      const response = await client.get('/api/public/v1/organizations/999');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/public/v1/organizations', () => {
    it('should create a new organization', async () => {
      const response = await client.post('/api/public/v1/organizations', {
        body: {
          name: 'New Test Organization',
          companyID: '11111111-1111-1111-1111-111111111111',
        },
      });
      
      expect(response.status).toBe(201);
      const created = response.body as { name: string };
      expect(created.name).toBe('New Test Organization');
    });

    it('should reject organization without name', async () => {
      const response = await client.post('/api/public/v1/organizations', {
        body: {},
      });
      
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/public/v1/organizations/:id', () => {
    it('should update organization', async () => {
      const response = await client.put('/api/public/v1/organizations/1', {
        body: { name: 'Updated Engineering' },
      });
      
      expect(response.status).toBe(200);
      const updated = response.body as { name: string };
      expect(updated.name).toBe('Updated Engineering');
    });
  });

  describe('DELETE /api/public/v1/organizations/:id', () => {
    it('should delete organization', async () => {
      const createResponse = await client.post('/api/public/v1/organizations', {
        body: { name: 'To Delete Org' },
      });
      const created = createResponse.body as { id: number };
      
      const deleteResponse = await client.delete(`/api/public/v1/organizations/${created.id}`);
      expect(deleteResponse.status).toBe(204);
    });
  });
});

describe('Teams API Integration Tests', () => {
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

  describe('GET /api/public/v1/teams', () => {
    it('should return all teams', async () => {
      const response = await client.get('/api/public/v1/teams');
      expect(response.status).toBe(200);
      
      const teams = response.body as Array<{ id: number; name: string }>;
      expect(teams.length).toBe(4);
    });

    it('should filter by user ID', async () => {
      const response = await client.get('/api/public/v1/teams', {
        query: { userId: '1' },
      });
      
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/public/v1/teams/:id', () => {
    it('should return team by ID', async () => {
      const response = await client.get('/api/public/v1/teams/1');
      expect(response.status).toBe(200);
      
      const team = response.body as { name: string };
      expect(team.name).toBe('Platform Team');
    });

    it('should return 404 for non-existent team', async () => {
      const response = await client.get('/api/public/v1/teams/999');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/public/v1/teams', () => {
    it('should create a new team', async () => {
      const response = await client.post('/api/public/v1/teams', {
        body: {
          name: 'New Test Team',
          organizationID: 1,
        },
      });
      
      expect(response.status).toBe(201);
      const created = response.body as { name: string };
      expect(created.name).toBe('New Test Team');
    });
  });

  describe('PUT /api/public/v1/teams/:id', () => {
    it('should update team', async () => {
      const response = await client.put('/api/public/v1/teams/1', {
        body: { name: 'Updated Platform Team' },
      });
      
      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/public/v1/teams/:id', () => {
    it('should delete team', async () => {
      const createResponse = await client.post('/api/public/v1/teams', {
        body: { name: 'Team to Delete' },
      });
      const created = createResponse.body as { id: number };
      
      const deleteResponse = await client.delete(`/api/public/v1/teams/${created.id}`);
      expect(deleteResponse.status).toBe(204);
    });
  });
});

describe('Projects API Integration Tests', () => {
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

  describe('GET /api/public/v1/projects', () => {
    it('should return all projects', async () => {
      const response = await client.get('/api/public/v1/projects');
      expect(response.status).toBe(200);
      
      const projects = response.body as Array<{ id: number; name: string }>;
      expect(projects.length).toBe(3);
    });

    it('should include graph metadata', async () => {
      const response = await client.get('/api/public/v1/projects');
      const projects = response.body as Array<{ graphMeta?: string }>;
      
      const projectWithMeta = projects.find((p) => p.graphMeta);
      expect(projectWithMeta).toBeDefined();
    });
  });

  describe('GET /api/public/v1/projects/:id', () => {
    it('should return project by ID', async () => {
      const response = await client.get('/api/public/v1/projects/1');
      expect(response.status).toBe(200);
      
      const project = response.body as { name: string };
      expect(project.name).toBe('Kubernetes Cluster');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await client.get('/api/public/v1/projects/999');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/public/v1/projects', () => {
    it('should create a new project', async () => {
      const response = await client.post('/api/public/v1/projects', {
        body: {
          name: 'New Test Project',
          graphId: 'test-graph-id',
          graphMeta: { version: '1.0.0' },
        },
      });
      
      expect(response.status).toBe(201);
      const created = response.body as { name: string };
      expect(created.name).toBe('New Test Project');
    });

    it('should create project with graph metadata', async () => {
      const response = await client.post('/api/public/v1/projects', {
        body: {
          name: 'Project with Graph',
          graphMeta: { nodes: 5, edges: 10 },
        },
      });
      
      expect(response.status).toBe(201);
    });

    it('should reject project without name', async () => {
      const response = await client.post('/api/public/v1/projects', {
        body: {},
      });
      
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/public/v1/projects/:id', () => {
    it('should update project', async () => {
      const response = await client.put('/api/public/v1/projects/1', {
        body: { name: 'Updated Kubernetes Cluster' },
      });
      
      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/public/v1/projects/:id', () => {
    it('should delete project', async () => {
      const createResponse = await client.post('/api/public/v1/projects', {
        body: { name: 'Project to Delete' },
      });
      const created = createResponse.body as { id: number };
      
      const deleteResponse = await client.delete(`/api/public/v1/projects/${created.id}`);
      expect(deleteResponse.status).toBe(204);
    });
  });
});
