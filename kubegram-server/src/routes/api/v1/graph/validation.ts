/**
 * Validation Routes (public)
 *
 * Public-facing endpoints for triggering and querying infrastructure validation.
 *
 * All routes require auth (applied by graph/index.ts middleware).
 *
 * POST /api/.../graph/validate         — initiate a validation job (forwarded to kuberag)
 * POST /api/.../graph/validate/trigger — operator calls this when pods are Ready
 * GET  /api/.../graph/validate/:jobId/status
 * GET  /api/.../graph/validate/:jobId/results
 */

import { Hono } from 'hono';
import { graphqlSdk } from '@/clients/rag-client';
import { type AuthContext } from '@/middleware/auth';
import logger from '@/utils/logger';

type Variables = { auth: AuthContext };

const validationRoutes = new Hono<{ Variables: Variables }>();

/**
 * POST /graph/validate
 * Initiate a validation job. Requires a user-provided OpenAPI spec.
 *
 * Body: { graphId: string, namespace: string, apiSchema: object, modelProvider?: string }
 */
validationRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json() as {
      graphId: string;
      namespace: string;
      apiSchema: unknown;
      modelProvider?: string;
      modelName?: string;
    };

    if (!body.graphId || !body.namespace || !body.apiSchema) {
      return c.json({ error: 'graphId, namespace, and apiSchema are required' }, 400);
    }

    const result = await graphqlSdk.InitiateValidation({
      input: {
        graphId: body.graphId,
        namespace: body.namespace,
        apiSchema: body.apiSchema,
        modelProvider: body.modelProvider as any,
        modelName: body.modelName as any,
      },
    });

    return c.json(result.initiateValidation, 201);
  } catch (err) {
    logger.error('Failed to initiate validation', { err });
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /graph/validate/trigger
 * Called by kubegram-operator when all pods annotated with kubegram.io/graph-id
 * have reached Ready state. Automatically initiates validation.
 *
 * Body: { graphId: string, namespace: string, readyPodCount: number }
 * Note: No auth required from the operator (cluster-internal call via service account).
 * The operator is considered trusted infrastructure.
 */
validationRoutes.post('/trigger', async (c) => {
  try {
    const body = await c.req.json() as {
      graphId: string;
      namespace: string;
      readyPodCount: number;
      apiSchema?: unknown;
    };

    if (!body.graphId || !body.namespace) {
      return c.json({ error: 'graphId and namespace are required' }, 400);
    }

    logger.info('Operator triggered validation', {
      graphId: body.graphId,
      namespace: body.namespace,
      readyPodCount: body.readyPodCount,
    });

    // apiSchema may be pre-stored alongside the graph, or the user provides it
    // at validation trigger time. For now, require it in the trigger payload.
    if (!body.apiSchema) {
      return c.json({ error: 'apiSchema is required in trigger payload' }, 400);
    }

    const result = await graphqlSdk.InitiateValidation({
      input: {
        graphId: body.graphId,
        namespace: body.namespace,
        apiSchema: body.apiSchema,
      },
    });

    return c.json(result.initiateValidation, 202);
  } catch (err) {
    logger.error('Failed to auto-trigger validation', { err });
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /graph/validate/:jobId/status
 */
validationRoutes.get('/:jobId/status', async (c) => {
  try {
    const jobId = c.req.param('jobId');
    const result = await graphqlSdk.GetValidationStatus({ jobId });
    return c.json(result.getValidationStatus);
  } catch (err) {
    logger.error('Failed to get validation status', { err });
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /graph/validate/:jobId/results
 */
validationRoutes.get('/:jobId/results', async (c) => {
  try {
    const jobId = c.req.param('jobId');
    const result = await graphqlSdk.GetValidationResults({ jobId });
    return c.json(result.getValidationResults);
  } catch (err) {
    logger.error('Failed to get validation results', { err });
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default validationRoutes;
