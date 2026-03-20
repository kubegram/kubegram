import { Hono } from 'hono';
import { requireRole } from '../../../../middleware/auth';

const llmHealthRoutes = new Hono();

/**
 * GET /api/v1/admin/llm-health
 *
 * Returns the health state of the LLM router.
 *
 * NOTE: kubegram-server currently proxies LLM calls to kuberag via GraphQL
 * and does not run kubegram-core workflows directly. The router health state
 * lives inside the process that runs the workflows (currently kuberag).
 *
 * Full wiring is deferred until kubegram-server directly instantiates
 * kubegram-core workflows. At that point, inject the LLMRouter singleton
 * here and return its getHealthState() output.
 */
llmHealthRoutes.get('/', requireRole('admin'), (c) => {
    return c.json(
        {
            available: false,
            message: 'LLM router health reporting is not yet available in this process. ' +
                'Router state lives inside the kuberag service which handles LLM calls.',
        },
        503,
    );
});

export default llmHealthRoutes;
