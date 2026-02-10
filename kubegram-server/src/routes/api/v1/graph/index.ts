/**
 * Graph Routes Index
 * 
 * Route aggregator for graph-related endpoints.
 * Applies authentication middleware to all graph routes.
 */

import { Hono } from 'hono';
import { requireAuthMiddleware } from '@/middleware/auth';
import { parseJsonFields } from '@/middleware/parse-json-fields';
import codegen from './codegen';
import crud from './crud';
import codegenRoutes from './codegen'; // Renamed from 'codegen' to 'codegenRoutes'
import crudRoutes from './crud';     // Renamed from 'crud' to 'crudRoutes'
import planRoutes from './plan';      // Added import for planRoutes
import { type AuthContext } from '@/middleware/auth';

type Variables = {
    auth: AuthContext;
};

const graphRoutes = new Hono<{ Variables: Variables }>(); // Added type parameter

// Apply authentication to all graph routes
graphRoutes.use('*', requireAuthMiddleware);

// Normalize stringified array fields (nodes, bridges) before validation
graphRoutes.use('*', parseJsonFields);

// Route mappings
graphRoutes.route('/codegen', codegenRoutes); // Updated to codegenRoutes
graphRoutes.route('/crud', crudRoutes);       // Updated to crudRoutes
graphRoutes.route('/plan', planRoutes);       // Added planRoutes

export default graphRoutes;