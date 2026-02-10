/**
 * Plan Routes
 * 
 * REST API endpoints for planning functionality.
 * Proxies requests to RAG system for plan generation.
 */

import { Hono } from 'hono';
import * as v from 'valibot';
import { PlanService } from '@/services/plan';
import { type AuthContext } from '@/middleware/auth';
import logger from '@/utils/logger';

// Validation Schemas
const InitializePlanRequestSchema = v.object({
    graph: v.any(), // Graph data - now required
    userRequest: v.optional(v.string()),
    modelProvider: v.optional(v.string()),
    modelName: v.optional(v.string()),
});

type Variables = {
    auth: AuthContext;
};

const planRoutes = new Hono<{ Variables: Variables }>();

/**
 * POST /api/v1/graph/plan
 * Initialize a planning job
 */
planRoutes.post('/', async (c) => {
    try {
        const auth = c.get('auth');
        const body = await c.req.json();

        const validatedBody = v.parse(InitializePlanRequestSchema, body);
        const planService = new PlanService();

        const result = await planService.initializePlan(parseInt(auth.user.id), validatedBody);

        return c.json(result, 201);
    } catch (error) {
        if (error instanceof v.ValiError) {
            return c.json({ error: 'Validation error', details: error.message }, 400);
        }
        logger.error('Initialize plan error', { error });
        return c.json({ error: 'Failed to initialize plan' }, 500);
    }
});

/**
 * GET /api/v1/graph/plan/:jobId/status
 * Get status of a planning job
 */
planRoutes.get('/:jobId/status', async (c) => {
    try {
        const jobId = c.req.param('jobId');
        const planService = new PlanService();

        const status = await planService.getPlanStatus(jobId);
        return c.json(status);
    } catch (error) {
        logger.error('Get plan status error', { error });
        return c.json({ error: 'Failed to get plan status' }, 500);
    }
});

/**
 * GET /api/v1/graph/plan/:jobId/results
 * Get results of a planning job
 */
planRoutes.get('/:jobId/results', async (c) => {
    try {
        const jobId = c.req.param('jobId');
        const planService = new PlanService();

        const results = await planService.getPlanResults(jobId);
        return c.json(results);
    } catch (error) {
        logger.error('Get plan results error', { error });
        return c.json({ error: 'Failed to get plan results' }, 500);
    }
});

export default planRoutes;
