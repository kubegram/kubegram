import { Hono } from 'hono';

import operatorTokensRoutes from './operator-tokens';
import operatorsRoutes from './operators';
import llmHealthRoutes from './llm-health';

const adminRoutes = new Hono();

adminRoutes.route('/operator-tokens', operatorTokensRoutes);
adminRoutes.route('/operators', operatorsRoutes);
adminRoutes.route('/llm-health', llmHealthRoutes);

export { adminRoutes };