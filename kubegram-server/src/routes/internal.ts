/**
 * Internal Routes
 *
 * These routes are called by cluster-internal components (kubegram-sidecar,
 * kubegram-core ValidationWorkflow) and do NOT require user authentication.
 * They should only be reachable from within the Kubernetes cluster.
 *
 * Mounted at /api/internal (added in routes/index.ts alongside public routes).
 *
 * POST /api/internal/metrics/traffic
 *   → Sidecar reporter registration (populates SidecarRegistry with podIP)
 *
 * GET  /api/internal/sidecars?namespace=X
 *   → ValidationWorkflow DISCOVER_SIDECARS step
 *
 * POST /api/internal/sidecar/validate
 *   → ValidationWorkflow TRIGGER_TESTS step (proxies test cases to sidecar pods)
 *
 * GET  /api/internal/validation/results?correlationIds=…
 *   → ValidationWorkflow COLLECT_RESULTS polling
 *
 * POST /api/internal/sidecar/validation/results
 *   → Sidecar reports test results back after execution
 */

import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { sidecarRegistry } from '@/services/sidecar-registry';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { getRepositories } from '@/repositories';
import * as argocdService from '@/services/argocd';
import config from '@/config/env';
import logger from '@/utils/logger';

// In-memory result store keyed by correlationId.
// In production this should be Redis-backed; an in-process Map suffices for now
// since kubegram-server is single-replica during early development.
const resultStore = new Map<string, {
  correlationId: string;
  success: boolean;
  actualStatus: number;
  responseTimeMs: number;
  error?: string;
}>();

const internalRoutes = new Hono();

// ---------------------------------------------------------------------------
// POST /internal/metrics/traffic
// Sidecar reporter pushes periodic traffic stats + registers its podIP.
// ---------------------------------------------------------------------------
internalRoutes.post('/metrics/traffic', async (c) => {
  try {
    const body = await c.req.json() as {
      namespace: string;
      pod: string;
      pod_ip?: string;
      service: string;
      timestamp: string;
      active_connections: number;
    };

    if (!body.namespace || !body.pod) {
      return c.json({ error: 'namespace and pod are required' }, 400);
    }

    // Register (or refresh) sidecar entry so the validation workflow can find it
    sidecarRegistry.register(body.namespace, body.pod, body.pod_ip ?? '', body.service ?? '');

    logger.debug('Sidecar traffic report received', {
      namespace: body.namespace,
      pod: body.pod,
      podIP: body.pod_ip,
      activeConnections: body.active_connections,
    });

    return c.json({ ok: true });
  } catch (err) {
    logger.error('Failed to handle sidecar traffic report', { err });
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /internal/sidecars?namespace=X
// Used by kubegram-core ValidationWorkflow to discover sidecar pod IPs.
// ---------------------------------------------------------------------------
internalRoutes.get('/sidecars', (c) => {
  const namespace = c.req.query('namespace');
  if (!namespace) {
    return c.json({ error: 'namespace query parameter is required' }, 400);
  }
  const sidecars = sidecarRegistry.listByNamespace(namespace);
  return c.json({ sidecars });
});

// ---------------------------------------------------------------------------
// POST /internal/sidecar/validate
// kubegram-core sends test cases here; server fans them out to each sidecar pod.
// ---------------------------------------------------------------------------
internalRoutes.post('/sidecar/validate', async (c) => {
  try {
    const body = await c.req.json() as {
      namespace: string;
      testCases: Array<{
        correlationId: string;
        method: string;
        path: string;
        headers?: Record<string, string>;
        body?: unknown;
        expectedStatus: number;
      }>;
      timeoutSeconds?: number;
    };

    if (!body.namespace || !body.testCases?.length) {
      return c.json({ error: 'namespace and testCases are required' }, 400);
    }

    const sidecars = sidecarRegistry.listByNamespace(body.namespace);
    if (sidecars.length === 0) {
      logger.warn('No sidecars found for namespace — cannot proxy test cases', { namespace: body.namespace });
      return c.json({ ok: true, proxied: 0 });
    }

    // Fan out to all sidecar pods in the namespace concurrently.
    // Each sidecar knows its own target service, so we send the same test cases to all.
    const promises = sidecars.map(async (sidecar) => {
      const url = `http://${sidecar.podIP}:${sidecar.validatePort}/validate`;
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            test_cases: body.testCases.map(tc => ({
              correlation_id: tc.correlationId,
              method: tc.method,
              path: tc.path,
              headers: tc.headers,
              body: tc.body ?? null,
              expected_status: tc.expectedStatus,
            })),
            target_service: `${sidecar.service}:80`,
            timeout_seconds: body.timeoutSeconds ?? 30,
          }),
        });
      } catch (err) {
        logger.warn('Failed to proxy test cases to sidecar', {
          pod: sidecar.pod,
          podIP: sidecar.podIP,
          err,
        });
      }
    });

    await Promise.allSettled(promises);

    return c.json({ ok: true, proxied: sidecars.length });
  } catch (err) {
    logger.error('Failed to proxy validation trigger', { err });
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /internal/validation/results?correlationIds=id1,id2,...
// kubegram-core polls here during COLLECT_RESULTS step.
// Returns 202 if some IDs are still pending.
// ---------------------------------------------------------------------------
internalRoutes.get('/validation/results', (c) => {
  const idsParam = c.req.query('correlationIds');
  if (!idsParam) {
    return c.json({ error: 'correlationIds query parameter is required' }, 400);
  }

  const requestedIds = idsParam.split(',').map(id => id.trim()).filter(Boolean);
  const found = [];
  const pending = [];

  for (const id of requestedIds) {
    const result = resultStore.get(id);
    if (result) {
      found.push(result);
    } else {
      pending.push(id);
    }
  }

  const status = pending.length > 0 ? 202 : 200;
  return c.json({ results: found, pending }, status);
});

// ---------------------------------------------------------------------------
// POST /internal/sidecar/validation/results
// Sidecars call this after executing all test cases for a trigger.
// ---------------------------------------------------------------------------
internalRoutes.post('/sidecar/validation/results', async (c) => {
  try {
    const body = await c.req.json() as {
      namespace: string;
      pod: string;
      results: Array<{
        correlation_id: string;
        success: boolean;
        actual_status: number;
        response_time_ms: number;
        error?: string;
      }>;
      timestamp: string;
    };

    if (!body.results?.length) {
      return c.json({ ok: true });
    }

    for (const r of body.results) {
      resultStore.set(r.correlation_id, {
        correlationId: r.correlation_id,
        success: r.success,
        actualStatus: r.actual_status,
        responseTimeMs: r.response_time_ms,
        error: r.error,
      });
    }

    logger.info('Validation results received from sidecar', {
      namespace: body.namespace,
      pod: body.pod,
      count: body.results.length,
    });

    return c.json({ ok: true });
  } catch (err) {
    logger.error('Failed to store validation results from sidecar', { err });
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ---------------------------------------------------------------------------
// POST /internal/github/pr-merged
// kubegram-github-app calls this when a kubegram/deploy-* PR is merged into
// the default branch. kubegram-server looks up the project and triggers an
// ArgoCD sync for the configured application.
// ---------------------------------------------------------------------------
internalRoutes.post('/github/pr-merged', async (c) => {
  // Verify shared secret
  const secret = c.req.header('X-Kubegram-Secret');
  if (!config.kubegramInternalSecret || secret !== config.kubegramInternalSecret) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json() as {
      owner: string;
      repo: string;
      mergeCommitSha?: string;
    };

    if (!body.owner || !body.repo) {
      return c.json({ error: 'owner and repo are required' }, 400);
    }

    // Look up the project linked to this GitHub repository
    const repos = getRepositories();
    const all = await repos.projects.findAll();
    const project = all.find(p => p.githubOwner === body.owner && p.githubRepo === body.repo);

    if (!project?.argocdAppName) {
      logger.info('No ArgoCD app configured for merged PR repo — skipping sync', {
        owner: body.owner,
        repo: body.repo,
      });
      return c.json({ ok: true });
    }

    // Trigger ArgoCD sync asynchronously — do not block the webhook response
    argocdService.sync(project.argocdAppName).catch((err: unknown) =>
      logger.error('ArgoCD sync failed after PR merge', {
        owner: body.owner,
        repo: body.repo,
        appName: project.argocdAppName,
        err,
      }),
    );

    logger.info('ArgoCD sync initiated for merged Kubegram PR', {
      owner: body.owner,
      repo: body.repo,
      appName: project.argocdAppName,
    });

    return c.json({ ok: true });
  } catch (err) {
    logger.error('Failed to handle github/pr-merged', { err });
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { internalRoutes };
