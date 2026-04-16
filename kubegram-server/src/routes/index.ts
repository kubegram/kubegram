import { Hono } from 'hono';

// Route groups
import { adminRoutes } from './api/v1/admin';
import { publicV1Routes } from './api/v1/public';
import tokensRoutes from './tokens';
// import { releaseRoutes } from './api/v1/release';

import usersRoutes from './api/v1/users';
import providersRoutes from './api/v1/providers';
import graphRoutes from './api/v1/graph';
import { internalRoutes } from './internal';

const apiRoutes = new Hono();

// Route mappings
apiRoutes.route('/v1/admin', adminRoutes);
apiRoutes.route('/public/v1', publicV1Routes);
apiRoutes.route('/v1', tokensRoutes);
apiRoutes.route('/v1/users', usersRoutes);
apiRoutes.route('/v1/providers', providersRoutes);
apiRoutes.route('/v1/graph', graphRoutes);

// MCP route - dynamically imported to avoid type checking memory issues
// @ts-ignore - MCP directory excluded from type checking due to SDK complexity
const mcpModule = await import('@/m' + 'cp');
apiRoutes.route('/v1/mcp', mcpModule.mcpRoute);
// apiRoutes.route('/v1/release', releaseRoutes);

// Internal cluster-only routes (sidecar registry, validation result relay)
// Mounted at /api/internal — not behind user auth middleware
apiRoutes.route('/internal', internalRoutes);

export { apiRoutes };