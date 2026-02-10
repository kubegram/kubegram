/**
 * Parse JSON Fields Middleware
 *
 * Normalizes request bodies where array fields (nodes, bridges) have been
 * double-serialized by the client — i.e. sent as JSON strings instead of
 * actual arrays.
 *
 * Handles both top-level fields (used by graph CRUD routes) and nested
 * fields under `body.graph` (used by codegen routes).
 */

import type { Context, Next } from 'hono';
import logger from '@/utils/logger';

/** Fields that should always be arrays when present. */
const ARRAY_FIELDS = ['nodes', 'bridges'] as const;

/**
 * Attempt to parse a value that is expected to be an array but may have
 * arrived as a JSON string.  Returns the parsed array on success, the
 * original value if it is already a non-string type, or throws on
 * malformed JSON.
 */
function coerceToArray(value: unknown, fieldName: string): unknown {
  if (typeof value !== 'string') return value;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new Error(
        `Expected "${fieldName}" to parse into an Array but got ${typeof parsed}`,
      );
    }
    return parsed;
  } catch (err) {
    throw new Error(
      `Failed to parse stringified "${fieldName}": ${(err as Error).message}`,
    );
  }
}

/**
 * Walk an object and coerce the known array fields in-place.
 * Returns `true` if any field was coerced.
 */
function normalizeArrayFields(obj: Record<string, unknown>): boolean {
  let changed = false;

  for (const field of ARRAY_FIELDS) {
    if (field in obj && typeof obj[field] === 'string') {
      obj[field] = coerceToArray(obj[field], field);
      changed = true;
    }
  }

  return changed;
}

/**
 * Hono middleware that intercepts POST / PUT requests, detects stringified
 * array fields, and replaces the request with a corrected body so that
 * downstream handlers receive proper arrays from `c.req.json()`.
 */
export async function parseJsonFields(c: Context, next: Next) {
  const method = c.req.method;

  // Only process methods that carry a JSON body.
  if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
    return next();
  }

  // Only process JSON content types.
  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return next();
  }

  try {
    const body = await c.req.json();

    let mutated = false;

    // Top-level fields (graph CRUD routes).
    mutated = normalizeArrayFields(body) || mutated;

    // Nested `graph` object (codegen routes).
    if (body.graph && typeof body.graph === 'object' && !Array.isArray(body.graph)) {
      mutated = normalizeArrayFields(body.graph) || mutated;
    }

    if (mutated) {
      logger.debug('parseJsonFields: coerced stringified array fields in request body');

      // Replace the request so that subsequent c.req.json() calls return
      // the corrected body.
      const newRequest = new Request(c.req.url, {
        method: c.req.method,
        headers: c.req.raw.headers,
        body: JSON.stringify(body),
      });

      // Hono exposes `c.req.raw` — overwrite it with the patched request.
      (c.req as any).raw = newRequest;
      // Also clear any cached json so Hono re-parses from the new body.
      (c.req as any).bodyCache = {};
    }

    await next();
  } catch (err) {
    logger.warn('parseJsonFields: bad request body', { error: (err as Error).message });
    return c.json(
      { error: 'Invalid request body', details: (err as Error).message },
      400,
    );
  }
}
