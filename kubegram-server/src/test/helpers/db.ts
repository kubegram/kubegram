import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let client: ReturnType<typeof postgres> | null = null;

export function getTestDbClient() {
  if (!client) {
    client = postgres(process.env.DATABASE_URL!, {
      prepare: false,
      transform: postgres.camel,
      connection: { application_name: 'kubegram-test' },
      max: 5,
    });
  }
  return client;
}

export async function resetDatabase(): Promise<void> {
  const testClient = getTestDbClient();
  
  await testClient.unsafe(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DELETE FROM ' || quote_ident(r.tablename);
      END LOOP;
    END $$;
  `);
}

export async function loadFixtures(): Promise<void> {
  const testClient = getTestDbClient();
  const fixturesDir = resolve(__dirname, '../../test/fixtures');
  
  const fixtureFiles = [
    '001-companies.sql',
    '002-organizations.sql',
    '003-teams.sql',
    '004-users.sql',
    '005-projects.sql',
    '006-generation-jobs.sql',
    '007-artifacts.sql',
    '008-operators.sql',
    '010-sessions.sql',
  ];
  
  for (const file of fixtureFiles) {
    const filePath = resolve(fixturesDir, file);
    try {
      const sql = readFileSync(filePath, 'utf-8');
      await testClient.unsafe(sql);
    } catch (error) {
      console.warn(`Warning: Could not load fixture ${file}:`, error);
    }
  }
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
  }
}

export { getTestDbClient as db };
