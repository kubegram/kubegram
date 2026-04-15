import { describe, it, expect, beforeAll } from 'vitest';
import { getTestDbClient, resetDatabase, loadFixtures } from '../../test/helpers/db';

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    await resetDatabase();
    await loadFixtures();
  });

  describe('Schema and Fixtures', () => {
    it('should have companies table populated', async () => {
      const db = getTestDbClient();
      const result = await db`SELECT * FROM companies`;
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      const testCompany = result.find((c: any) => c.name === 'Test Company Inc');
      expect(testCompany).toBeDefined();
      expect(testCompany!!.tokens).toBe(1000);
    });

    it('should have organizations table populated', async () => {
      const db = getTestDbClient();
      const result = await db`SELECT * FROM organizations`;
      
      expect(result).toBeDefined();
      expect(result.length).toBe(3);
    });

    it('should have teams table populated', async () => {
      const db = getTestDbClient();
      const result = await db`SELECT * FROM teams`;
      
      expect(result).toBeDefined();
      expect(result.length).toBe(4);
    });

    it('should have users table populated with correct roles', async () => {
      const db = getTestDbClient();
      const result = await db`SELECT * FROM users ORDER BY id`;
      
      expect(result).toBeDefined();
      expect(result.length).toBe(5);
      
      expect(result[0].role).toBe('admin');
      expect(result[1].role).toBe('manager');
      expect(result[2].role).toBe('team_member');
    });

    it('should have projects table populated', async () => {
      const db = getTestDbClient();
      const result = await db`SELECT * FROM projects`;
      
      expect(result).toBeDefined();
      expect(result.length).toBe(3);
    });

    it('should have generation jobs table populated', async () => {
      const db = getTestDbClient();
      const result = await db`SELECT * FROM generation_jobs`;
      
      expect(result).toBeDefined();
      expect(result.length).toBe(3);
      
      const completedJob = result.find((j: any) => j.status === 'completed');
      expect(completedJob).toBeDefined();
      expect(completedJob!!.progress).toBe(100);
    });

    it('should have sessions table populated', async () => {
      const db = getTestDbClient();
      const result = await db`SELECT * FROM openauth_sessions`;
      
      expect(result).toBeDefined();
      expect(result.length).toBe(4);
    });
  });

  describe('Foreign Key Relationships', () => {
    it('should link users to teams', async () => {
      const db = getTestDbClient();
      const result = await db`
        SELECT u.id, u.email, u.team_id as "teamId", t.name as team_name
        FROM users u
        LEFT JOIN teams t ON u.team_id = t.id
        ORDER BY u.id
      `;
      
      expect(result[0].teamName).toBe('Platform Team');
      expect(result[2].teamName).toBe('Backend Team');
    });

    it('should link organizations to companies', async () => {
      const db = getTestDbClient();
      const result = await db`
        SELECT o.name as org_name, c.name as company_name
        FROM organizations o
        JOIN companies c ON o.company_id = c.id
      `;
      
      expect(result[0].companyName).toBe('Test Company Inc');
    });

    it('should link teams to organizations', async () => {
      const db = getTestDbClient();
      const result = await db`
        SELECT t.name as team_name, o.name as org_name
        FROM teams t
        JOIN organizations o ON t.organization_id = o.id
      `;
      
      expect(result[0].orgName).toBe('Engineering');
    });
  });

  describe('Data Integrity', () => {
    it('should enforce unique email constraint', async () => {
      const db = getTestDbClient();
      
      await expect(
        db`INSERT INTO users (name, email, role) VALUES ('Duplicate', 'admin@test.com', 'team_member')`
      ).rejects.toThrow();
    });

    it('should handle NULL foreign keys gracefully', async () => {
      const db = getTestDbClient();
      
      await db`INSERT INTO organizations (name) VALUES ('Orphan Org')`;
      const result = await db`SELECT * FROM organizations WHERE company_id IS NULL`;
      
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Orphan Org');
    });
  });
});

describe('Health Check Logic', () => {
  it('should validate database connectivity check pattern', async () => {
    const db = getTestDbClient();
    
    const result = await db`SELECT 1 as check`;
    expect(result).toBeDefined();
    expect(result[0].check).toBe(1);
  });
});
