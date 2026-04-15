import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? '';

// Alternative configuration for strict mode compatibility
const clientOptions = {
  // These settings help avoid strict mode issues
  prepare: false,
  transform: postgres.camel,
  connection: {
    application_name: 'kubegram-server-v2'
  },
  // Pool settings
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
};

export let client: ReturnType<typeof postgres> | null = null;
export let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

if (connectionString) {
  client = postgres(connectionString, clientOptions);
  db = drizzle(client, {
    schema,
    logger: process.env.NODE_ENV === 'development',
    casing: 'camelCase',
  });
}

export async function testDatabaseConnection(): Promise<boolean> {
  if (!client) return false;
  try {
    await client`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
