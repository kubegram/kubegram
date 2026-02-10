import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import type { UserSubject } from "../auth/openauth";
import { createClient } from "@openauthjs/openauth/client";
import * as v from "valibot";
import config from "../config/env";
import logger from "../utils/logger";
import { redisClient } from "../state/redis";
import { LRUCache } from "lru-cache";
import type { Next } from "hono";

// Create OpenAuth client for token verification
const openauthClient = createClient({
  clientID: "kubegram-web",
  issuer: config.appUrl,
});

// Define subjects schema matching the issuer
const subjects = {
  user: v.object({
    id: v.string(),
    provider: v.string(),
  })
};

export interface AuthContext {
  user: UserSubject;
  sessionId: string;
}

// L1 cache: in-memory LRU for fast session lookups (5 min TTL, max 1000)
const sessionCache = new LRUCache<string, AuthContext>({
  max: 1000,
  ttl: 1000 * 60 * 5,
});

interface SessionData {
  subject: string;
  provider: string;
  expiresAt?: string;
}

const SESSION_PREFIX = 'session:';
const SESSION_TTL_SECONDS = 86400; // 24 hours

/** Store a session in Redis (and LRU) */
export async function storeSession(
  sessionId: string,
  subject: string,
  provider: string,
  expiresAt?: Date
): Promise<void> {
  const data: SessionData = {
    subject,
    provider,
    expiresAt: expiresAt?.toISOString(),
  };

  if (config.enableHA) {
    const redis = redisClient.getClient();
    await redis.set(
      `${SESSION_PREFIX}${sessionId}`,
      JSON.stringify(data),
      'EX',
      SESSION_TTL_SECONDS
    );
  }
}

/** Delete a session from Redis and LRU */
export async function deleteSession(sessionId: string): Promise<void> {
  sessionCache.delete(sessionId);

  if (config.enableHA) {
    const redis = redisClient.getClient();
    await redis.del(`${SESSION_PREFIX}${sessionId}`).catch(() => {});
  }
}

/** Look up a session from LRU (L1) then Redis (L2) */
async function getSessionAuthContext(sessionCookie: string): Promise<AuthContext | null> {
  // L1: check LRU
  const cached = sessionCache.get(sessionCookie);
  if (cached) return cached;

  // L2: check Redis (only in HA mode)
  if (!config.enableHA) return null;

  try {
    const redis = redisClient.getClient();
    const raw = await redis.get(`${SESSION_PREFIX}${sessionCookie}`);
    if (!raw) return null;

    const session: SessionData = JSON.parse(raw);

    // Check expiry
    if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
      await redis.del(`${SESSION_PREFIX}${sessionCookie}`).catch(() => {});
      return null;
    }

    // Look up user by email (subject)
    const userRecords = await db.select()
      .from(users)
      .where(eq(users.email, session.subject))
      .limit(1);

    if (!userRecords.length) return null;

    const user = userRecords[0];
    const authContext: AuthContext = {
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatarUrl || undefined,
        role: user.role || undefined,
        teamId: user.teamId || undefined,
      } as UserSubject,
      sessionId: sessionCookie,
    };

    // Populate L1
    sessionCache.set(sessionCookie, authContext);
    return authContext;
  } catch (error) {
    logger.error('Redis session lookup error', { error });
    return null;
  }
}

/**
 * Middleware wrapper for requireAuth that works with Hono's middleware pattern
 */
export async function requireAuthMiddleware(c: Context, next: Next) {
  const result = await requireAuth(c);

  if (result instanceof Response) {
    return result;
  }

  c.set('auth', result);
  await next();
}

export async function requireAuth(c: Context): Promise<Response | AuthContext> {
  // Check for Bearer token first
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const verified = await openauthClient.verify(subjects, token);

      if ("err" in verified) {
        logger.error('Token verification failed', { error: verified.err });
        return c.json({ error: "Invalid token" }, 401);
      }

      const userId = verified.subject.properties.id;
      logger.debug('Token verified', {
        subjectId: userId,
        properties: verified.subject.properties
      });

      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId) || parsedUserId <= 0) {
        logger.error('Invalid user ID in token', { userId });
        return c.json({
          error: "Invalid token: user ID is not valid. Please re-authenticate to get a new token."
        }, 401);
      }

      const userRecords = await db.select()
        .from(users)
        .where(eq(users.id, parsedUserId))
        .limit(1);

      if (!userRecords.length) {
        logger.error('User not found for token subject', { userId: parsedUserId });
        return c.json({ error: "User not found" }, 401);
      }

      const user = userRecords[0];

      const authContext: AuthContext = {
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          avatar: user.avatarUrl || undefined,
          role: user.role || undefined,
          teamId: user.teamId || undefined
        } as UserSubject,
        sessionId: "token-session"
      };

      return authContext;
    } catch (error) {
      logger.error('Bearer token auth error', { error, issuer: config.appUrl });
      return c.json({ error: "Authentication error" }, 401);
    }
  }

  // Fall back to session cookie authentication
  const sessionCookie = getCookie(c, "session");

  if (!sessionCookie) {
    return c.json({ error: "No session found" }, 401);
  }

  const authContext = await getSessionAuthContext(sessionCookie);
  if (!authContext) {
    return c.json({ error: "Invalid session" }, 401);
  }

  return authContext;
}

export async function optionalAuth(c: Context): Promise<AuthContext | null> {
  // Check for Bearer token first
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const verified = await openauthClient.verify(subjects, token);

      if ("err" in verified) {
        return null;
      }

      const userId = verified.subject.properties.id;

      const userRecords = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);

      if (!userRecords.length) {
        return null;
      }

      const user = userRecords[0];

      return {
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          avatar: user.avatarUrl || undefined,
          role: user.role || undefined,
          teamId: user.teamId || undefined
        } as UserSubject,
        sessionId: "token-session"
      };
    } catch (error) {
      logger.error('Optional auth bearer token error', { error });
      return null;
    }
  }

  // Fall back to session cookie authentication
  const sessionCookie = getCookie(c, "session");
  if (!sessionCookie) return null;

  return getSessionAuthContext(sessionCookie);
}

export function requireRole(requiredRole: string) {
  return async (c: Context, next: () => Promise<void>) => {
    const auth = await requireAuth(c);

    if (auth instanceof Response) {
      return auth;
    }

    if (auth.user.role !== requiredRole && auth.user.role !== 'admin') {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    c.set('auth', auth);
    await next();
  };
}

export function requireAnyRole(roles: string[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const auth = await requireAuth(c);

    if (auth instanceof Response) {
      return auth;
    }

    if (!auth.user.role || (!roles.includes(auth.user.role) && auth.user.role !== 'admin')) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    c.set('auth', auth);
    await next();
  };
}
