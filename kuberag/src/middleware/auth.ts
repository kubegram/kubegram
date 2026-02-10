import type { Context, Next } from "hono";
import { openauthClient, subjects } from "../auth/client";

export interface AuthContext {
  userId: string;
  provider: string;
}

/**
 * Auth middleware for kuberag.
 * Verifies Bearer tokens issued by kubegram-server via JWKS.
 * Sets `auth` on Hono context if valid.
 */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const verified = await openauthClient.verify(subjects, token);

    if ("err" in verified) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const authContext: AuthContext = {
      userId: verified.subject.properties.id,
      provider: verified.subject.properties.provider,
    };

    c.set("auth", authContext);
    await next();
  } catch (error) {
    console.error("Auth verification error:", error);
    return c.json({ error: "Authentication error" }, 401);
  }
}

/**
 * Optional auth middleware — sets `auth` on context if token is present and valid,
 * but does not block the request if absent.
 */
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const verified = await openauthClient.verify(subjects, token);

      if (!("err" in verified)) {
        c.set("auth", {
          userId: verified.subject.properties.id,
          provider: verified.subject.properties.provider,
        } satisfies AuthContext);
      }
    } catch {
      // Token invalid — proceed without auth
    }
  }

  await next();
}
