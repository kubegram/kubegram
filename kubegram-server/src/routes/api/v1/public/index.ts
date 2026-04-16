import { Hono } from 'hono';

// Individual route modules
import companies from '../companies';
import organizations from '../organizations';
import teams from '../teams';
import users from '../users';
import auth from '../auth';
import health from '../health';
import certificates from '../certificates';
import projects from '../projects';
import iac from '../iac';
import graph from '../graph';

const publicV1Routes = new Hono();

// Route mappings
publicV1Routes.route('/companies', companies);
publicV1Routes.route('/organizations', organizations);
publicV1Routes.route('/teams', teams);
publicV1Routes.route('/users', users);
publicV1Routes.route('/auth', auth);
publicV1Routes.route('/healthz', health);
publicV1Routes.route('/certificates', certificates);
publicV1Routes.route('/projects', projects);
publicV1Routes.route('/iac', iac);
publicV1Routes.route('/graph', graph);

export { publicV1Routes };