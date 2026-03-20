/**
 * Suggest Routes
 *
 * Synchronous AI canvas suggestion endpoint.
 * Calls kuberag's suggestImprovements query and returns results directly (no job queue).
 */

import { Hono } from 'hono';
import * as v from 'valibot';
import { graphqlSdk } from '@/clients/rag-client';
import { type AuthContext } from '@/middleware/auth';
import { cleanGraphInput } from '@/utils/graph-input-cleaner';
import logger from '@/utils/logger';

const SuggestRequestSchema = v.object({
    graph: v.any(),
    modelProvider: v.optional(v.string()),
    modelName: v.optional(v.string()),
});

type Variables = {
    auth: AuthContext;
};

const suggestRoutes = new Hono<{ Variables: Variables }>();

/**
 * POST /api/v1/graph/suggest
 * Returns AI suggestions for the given canvas graph synchronously.
 */
suggestRoutes.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const validatedBody = v.parse(SuggestRequestSchema, body);

        const result = await graphqlSdk.SuggestImprovements({
            input: {
                graph: cleanGraphInput(validatedBody.graph),
                modelProvider: validatedBody.modelProvider,
                modelName: validatedBody.modelName,
            },
        });

        if (result.errors?.length) {
            logger.error('kuberag suggestImprovements returned errors', { errors: result.errors });
            return c.json({ error: 'Suggestion service error', details: result.errors[0]?.message }, 502);
        }

        const suggestions = result.data?.suggestImprovements?.suggestions ?? [];
        return c.json({ suggestions });
    } catch (error) {
        if (error instanceof v.ValiError) {
            return c.json({ error: 'Validation error', details: error.message }, 400);
        }
        logger.error('Suggest route error', { error });
        return c.json({ error: 'Failed to get suggestions' }, 500);
    }
});

export default suggestRoutes;
