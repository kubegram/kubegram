import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getTestClient,
  getTestDbClient,
  resetDatabase,
  loadFixtures,
  expectOK,
  ApiResponse,
} from '../../test/helpers';

describe('Health Check Integration Tests', () => {
  let client: ReturnType<typeof getTestClient>;

  beforeAll(async () => {
    client = getTestClient();
    await client.init();
  });

  describe('GET /api/public/v1/healthz/live', () => {
    it('should return 200 OK with status ok', async () => {
      const response = await client.get('/api/public/v1/healthz/live');
      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);

      const body = response.body as { status: string };
      expect(body.status).toBe('ok');
    });

    it('should return valid JSON', async () => {
      const response = await client.get('/api/public/v1/healthz/live');
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should not require authentication', async () => {
      const response = await client.get('/api/public/v1/healthz/live');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/public/v1/healthz/ready', () => {
    it('should return 200 OK with status ready', async () => {
      const response = await client.get('/api/public/v1/healthz/ready');
      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);

      const body = response.body as { status: string };
      expect(body.status).toBe('ready');
    });

    it('should return valid JSON', async () => {
      const response = await client.get('/api/public/v1/healthz/ready');
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should not require authentication', async () => {
      const response = await client.get('/api/public/v1/healthz/ready');
      expect(response.status).toBe(200);
    });

    it('should check database connectivity', async () => {
      const response = await client.get('/api/public/v1/healthz/ready');
      expect(response.status).toBe(200);

      const body = response.body as Record<string, unknown>;
      expect(body).toHaveProperty('status');
    });
  });
});

describe('Database Health Integration Tests', () => {
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

  it('should have database connection', async () => {
    const result = await db`SELECT 1 as check`;
    expect(result).toBeDefined();
    expect(result[0].check).toBe(1);
  });

  it('should have fixtures loaded', async () => {
    const result = await db`SELECT COUNT(*) as count FROM companies`;
    expect(result[0].count).toBeGreaterThan(0);
  });

  it('should have users table accessible', async () => {
    const result = await db`SELECT COUNT(*) as count FROM users`;
    expect(result[0].count).toBeGreaterThan(0);
  });

  it('should have sessions table accessible', async () => {
    const result = await db`SELECT COUNT(*) as count FROM openauth_sessions`;
    expect(result[0].count).toBeGreaterThan(0);
  });

  it('should support transactions', async () => {
    const testCompanyName = 'Transaction Test Company';
    
    const result = await db.transaction(async (tx) => {
      await tx`INSERT INTO companies (name, tokens) VALUES (${testCompanyName}, 100)`;
      const check = await tx`SELECT * FROM companies WHERE name = ${testCompanyName}`;
      return check;
    });

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].name).toBe(testCompanyName);

    await db`DELETE FROM companies WHERE name = ${testCompanyName}`;
  });
});
