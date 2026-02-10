import { Hono } from 'hono';

// Release route modules
import release from '../release';

const releaseRoutes = new Hono();

// Route mappings
releaseRoutes.route('/', release);

export { releaseRoutes };