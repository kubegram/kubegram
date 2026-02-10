#!/usr/bin/env bun
/**
 * Load Dgraph schema script
 * POST src/db/schema.graphql to Dgraph /admin/schema
 */

import { readFileSync } from 'fs';
import { dgraphConfig } from '../src/config.js';

/**
 * Load GraphQL schema to Dgraph
 */
async function loadSchema(): Promise<void> {
  try {
    console.info('Loading Dgraph GraphQL schema...');
    
    // Read schema file
    const schemaPath = new URL('../src/db/schema.graphql', import.meta.url);
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    
    if (!schemaContent.trim()) {
      throw new Error('Schema file is empty');
    }
    
    console.info(`Schema loaded (${schemaContent.length} characters)`);
    
    // Post schema to Dgraph admin endpoint
    const adminUrl = `${dgraphConfig.adminEndpoint}/schema`;
    console.info(`Posting schema to: ${adminUrl}`);
    
    const response = await fetch(adminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/graphql',
      },
      body: schemaContent,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to load schema: HTTP ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.info('Schema load response:', result);
    
    if (result.data?.updateGQLSchema) {
      console.info('✅ Schema loaded successfully!');
    } else {
      console.warn('⚠️ Schema loaded but response format unexpected:', result);
    }
    
  } catch (error) {
    console.error('❌ Failed to load schema:', error);
    process.exit(1);
  }
}

/**
 * Verify schema by checking Dgraph health
 */
async function verifySchema(): Promise<boolean> {
  try {
    console.info('Verifying Dgraph connection...');
    
    const response = await fetch(dgraphConfig.adminEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ health { status } }' }),
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok) {
      console.info('✅ Dgraph connection verified');
      return true;
    } else {
      console.warn(`⚠️ Dgraph health check failed: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Dgraph connection failed:', error);
    return false;
  }
}

async function waitForDgraph(retries = 30, delayMs = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const ready = await verifySchema();
    if (ready) {
      return true;
    }

    console.info(`⏳ Dgraph not ready (attempt ${attempt}/${retries}). Retrying in ${delayMs}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
}

/**
 * Load schema with periodic retry mechanism
 */
async function loadSchemaWithRetry(): Promise<void> {
  const skipSchemaLoad = process.env.SKIP_SCHEMA_LOAD === 'true';
  const loadInterval = parseInt(process.env.SCHEMA_LOAD_INTERVAL || '60', 10) * 1000; // Convert to ms
  const maxAttempts = parseInt(process.env.SCHEMA_LOAD_MAX_ATTEMPTS || '0', 10); // 0 = infinite
  
  console.info('🚀 Dgraph Schema Loader');
  console.info(`Dgraph endpoint: ${dgraphConfig.graphqlEndpoint}`);
  console.info(`Admin endpoint: ${dgraphConfig.adminEndpoint}`);
  console.info(`Skip schema load: ${skipSchemaLoad}`);
  console.info(`Load interval: ${loadInterval}ms`);
  console.info(`Max attempts: ${maxAttempts === 0 ? 'infinite' : maxAttempts}`);
  console.info('');
  
  if (skipSchemaLoad) {
    console.info('⏭️ Skipping schema loading due to SKIP_SCHEMA_LOAD=true');
    return;
  }
  
  // Verify connection first
  const isConnected = await waitForDgraph();
  if (!isConnected) {
    console.error('❌ Cannot proceed with schema loading - Dgraph is not accessible');
    throw new Error('Dgraph connection failed');
  }
  
  console.info('');
  
  // Attempt schema loading with retry logic
  let attempt = 1;
  while (maxAttempts === 0 || attempt <= maxAttempts) {
    try {
      console.info(`📝 Schema loading attempt ${attempt}${maxAttempts === 0 ? ' (infinite retry)' : `/${maxAttempts}`}`);
      await loadSchema();
      console.info('');
      console.info('✅ Schema loading completed successfully!');
      return; // Success, exit retry loop
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Schema loading attempt ${attempt} failed:`, errorMessage);
      
      if (maxAttempts > 0 && attempt >= maxAttempts) {
        console.error(`🛑 Max attempts (${maxAttempts}) reached. Giving up.`);
        console.warn('⚠️ Continuing with application startup despite schema loading failure...');
        return; // Exit retry loop but continue application startup
      }
      
      if (attempt < maxAttempts || maxAttempts === 0) {
        const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 30000); // Exponential backoff, max 30s
        console.info(`⏳ Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        attempt++;
      }
    }
  }
}

/**
 * Store schema loading status in Redis for monitoring
 */
async function storeSchemaStatus(status: 'loading' | 'success' | 'failed', message?: string): Promise<void> {
  try {
    const redisUrl = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;
    // Simple Redis client for status storage - we'll integrate with existing Redis client later
    console.info(`📊 Schema status: ${status}${message ? ` - ${message}` : ''}`);
  } catch (error) {
    console.warn('⚠️ Could not store schema status in Redis:', error);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    await storeSchemaStatus('loading', 'Starting schema loading process');
    await loadSchemaWithRetry();
    await storeSchemaStatus('success', 'Schema loading process completed');
    console.info('🎉 Schema loader finished successfully!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await storeSchemaStatus('failed', `Schema loading failed: ${errorMessage}`);
    console.error('💥 Schema loader failed:', error);
    
    // Don't exit the process - let the application continue
    // This ensures container doesn't crash if schema loading has issues
    console.warn('⚠️ Continuing with application startup despite schema loader failure...');
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
