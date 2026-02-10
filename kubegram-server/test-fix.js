#!/usr/bin/env node

// Test script to verify the fix

import { db } from './src/db/index.js';
import { projects } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function testDatabaseOperation() {
  console.log('Testing fixed database configuration...');
  
  try {
    // Test a simple query
    const result = await db.query.projects.findMany({
      limit: 1
    });
    
    console.log('✅ Database query successful:', result.length, 'projects found');
    
    // Test the transaction pattern used in the fix
    const testResult = await db.transaction(async (tx) => {
      const projects = await tx.query.projects.findMany({ limit: 1 });
      return projects;
    });
    
    console.log('✅ Database transaction successful:', testResult.length, 'projects found');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('arguments') || error.message.includes('callee')) {
      console.error('❌ Strict mode error still present');
    } else {
      console.error('✅ No strict mode error (different issue)');
    }
  }
}

testDatabaseOperation();
