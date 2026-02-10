import { Hono } from 'hono';

// Route groups
import { adminRoutes } from './api/v1/admin';
import { publicV1Routes } from './api/v1/public';
import tokensRoutes from './tokens';
// import { releaseRoutes } from './api/v1/release';

import usersRoutes from './api/v1/users';
import providersRoutes from './api/v1/providers';
import graphRoutes from './api/v1/graph';

const apiRoutes = new Hono();

// Route mappings
apiRoutes.route('/v1/admin', adminRoutes);
apiRoutes.route('/v1/public', publicV1Routes);
apiRoutes.route('/v1', tokensRoutes);
apiRoutes.route('/v1/users', usersRoutes);
apiRoutes.route('/v1/providers', providersRoutes);
apiRoutes.route('/v1/graph', graphRoutes);
// apiRoutes.route('/v1/release', releaseRoutes);

export { apiRoutes };