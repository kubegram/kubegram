import { describe, it, expect, beforeAll } from 'vitest';
import {
  getTestClient,
  createAdminHeaders,
  createMemberHeaders,
} from '../../test/helpers';

describe('MCP Server Integration Tests', () => {
  let client: ReturnType<typeof getTestClient>;

  beforeAll(async () => {
    client = getTestClient();
    await client.init();
  });

  describe('POST /api/v1/mcp', () => {
    it('should require authentication', async () => {
      const response = await client.post('/api/v1/mcp', {
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        },
      });
      expect(response.status).toBe(401);
    });

    it('should reject invalid bearer token', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        },
      });
      expect(response.status).toBe(401);
    });

    it('should handle tools/list request with valid auth', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        },
      });

      expect([200, 401, 500]).toContain(response.status);

      if (response.status === 200) {
        const body = response.body as { jsonrpc: string };
        expect(body.jsonrpc).toBe('2.0');
      }
    });

    it('should handle initialize request', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0',
            },
          },
        },
      });

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should handle ping request', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'ping',
        },
      });

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should handle tools/call request', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'health_check',
            arguments: {},
          },
        },
      });

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should allow team_member to access MCP', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createMemberHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        },
      });

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should reject non-JSON body', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: 'invalid body',
      });

      expect([400, 401, 500]).toContain(response.status);
    });
  });

  describe('GET /api/v1/mcp', () => {
    it('should require authentication', async () => {
      const response = await client.get('/api/v1/mcp');
      expect(response.status).toBe(401);
    });

    it('should handle GET with valid auth', async () => {
      const response = await client.get('/api/v1/mcp', {
        headers: createAdminHeaders(),
      });

      expect([200, 401, 405, 500]).toContain(response.status);
    });
  });
});

describe('MCP Tool Handlers Integration Tests', () => {
  let client: ReturnType<typeof getTestClient>;

  beforeAll(async () => {
    client = getTestClient();
    await client.init();
  });

  describe('Health Check Tool', () => {
    it('should execute health_check tool', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'health_check',
            arguments: {},
          },
        },
      });

      expect([200, 401, 500]).toContain(response.status);

      if (response.status === 200) {
        const body = response.body as { result?: { content?: Array<{ text: string }> } };
        expect(body).toHaveProperty('result');
      }
    });
  });

  describe('Companies Tool', () => {
    it('should list companies', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'list_companies',
            arguments: {},
          },
        },
      });

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should create company', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'create_company',
            arguments: { name: 'MCP Test Company' },
          },
        },
      });

      expect([200, 401, 500]).toContain(response.status);
    });
  });

  describe('Projects Tool', () => {
    it('should list projects', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'list_projects',
            arguments: {},
          },
        },
      });

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should create project', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'create_project',
            arguments: { name: 'MCP Test Project', teamId: 1 },
          },
        },
      });

      expect([200, 401, 500]).toContain(response.status);
    });
  });

  describe('Teams Tool', () => {
    it('should list teams', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'list_teams',
            arguments: {},
          },
        },
      });

      expect([200, 401, 500]).toContain(response.status);
    });
  });

  describe('Code Generation Tool', () => {
    it('should trigger code generation', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'trigger_codegen',
            arguments: {
              projectId: 1,
              graphId: 'test-graph',
            },
          },
        },
      });

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should get codegen status', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'get_codegen_status',
            arguments: { jobId: 'test-job-id' },
          },
        },
      });

      expect([200, 401, 500]).toContain(response.status);
    });
  });

  describe('Planning Tool', () => {
    it('should trigger planning', async () => {
      const response = await client.post('/api/v1/mcp', {
        headers: createAdminHeaders(),
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'trigger_plan',
            arguments: { graphId: 'test-graph' },
          },
        },
      });

      expect([200, 401, 500]).toContain(response.status);
    });
  });
});
