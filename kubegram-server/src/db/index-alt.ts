import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

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

export const client = postgres(connectionString, clientOptions);

export const db = drizzle(client, { 
  schema,
  // Explicit settings for strict mode compatibility
  logger: process.env.NODE_ENV === 'development',
  casing: 'camelCase'
});
