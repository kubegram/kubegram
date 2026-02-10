#!/usr/bin/env node

// Debug script to isolate the TypeError: 'arguments', 'callee', and 'caller' issue

import { db } from './src/db/index.js';
import { projects } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function testStoreProjectMetadata() {
  console.log('Testing storeProjectMetadata database operations...');
  
  try {
    // Test the problematic update operation (lines 45-52 in storeProjectMetadata)
    console.log('Testing update operation...');
    const projectInfo = { id: "1", name: "Test Project" };
    const teamId = 1;
    
    const [project] = await db.update(projects)
      .set({
        name: projectInfo.name || `Graph Project ${Date.now()}`,
        teamId: teamId,
        updatedAt: new Date()
      })
      .where(eq(projects.id, parseInt(projectInfo.id)))
      .returning();
    
    console.log('Update operation successful:', project);
    
    // Test the query operation (lines 55-56)
    console.log('Testing query operation...');
    const existingProject = await db.query.projects.findFirst({
      where: eq(projects.id, parseInt(projectInfo.id))
    });
    
    console.log('Query operation successful:', existingProject);
    
  } catch (error) {
    console.error('Error occurred:', error.message);
    console.error('Error stack:', error.stack);
  }
}

async function main() {
  console.log('Starting debug script...');
  
  try {
    await testStoreProjectMetadata();
  } catch (error) {
    console.error('Debug script failed:', error);
  }
  
  console.log('Debug script completed.');
  process.exit(0);
}

main().catch(error => {
  console.error('Main failed:', error);
  process.exit(1);
});
