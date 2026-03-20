import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import type { UserSubject } from "../auth/openauth";
import { createSessionManager } from '@kubegram/kubegram-auth';
import * as v from "valibot";
import config from "../config/env";
import logger from "../utils/logger";
import { redisClient } from "../state/redis";
import type { Next } from "hono";
import type { AuthenticatedUser } from '@kubegram/kubegram-auth';

const SESSION_TTL_SECONDS = 86400;

const sessionManager = createSessionManager({
  issuer: config.appUrl,
  subjects: { user: v.object({ id: v.string(), provider: v.string() }) },
  redis: config.enableHA ? redisClient.getClient() : undefined,
  cacheOptions: {
    max: 1000,
    ttl: 5 * 60 * 1000
  },
  callbacks: {
    onVerifyToken: async (user: AuthenticatedUser) => {
      const parsedId = parseInt(user.id);
      if (isNaN(parsedId)) {
        logger.error('Invalid user ID in token', { userId: user.id });
        return null;
      }

      const userRecords = await db.select()
        .from(users)
        .where(eq(users.id, parsedId))
        .limit(1);

      if (!userRecords.length) {
        logger.error('User not found for token subject', { userId: parsedId });
        return null;
      }

      const dbUser = userRecords[0];
      return {
        id: dbUser.id.toString(),
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatarUrl || undefined,
        role: dbUser.role || undefined,
        teamId: dbUser.teamId?.toString(),
        provider: user.provider
      };
    },

    onValidateSession: async (user: AuthenticatedUser) => {
      const userRecords = await db.select()
        .from(users)
        .where(eq(users.email, user.id))
        .limit(1);

      if (!userRecords.length) {
        logger.error('User not found for session subject', { subject: user.id });
        return null;
      }

      const dbUser = userRecords[0];
      return {
        id: dbUser.id.toString(),
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatarUrl || undefined,
        role: dbUser.role || undefined,
        teamId: dbUser.teamId?.toString(),
        provider: user.provider
      };
    }
  }
});

export interface AuthContext {
  user: UserSubject;
  sessionId: string;
}

function toAuthContext(result: { user: AuthenticatedUser; sessionId: string }): AuthContext {
  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      avatar: result.user.avatar,
      role: result.user.role,
      teamId: result.user.teamId
    } as UserSubject,
    sessionId: result.sessionId
  };
}

export async function storeSession(
  sessionId: string,
  subject: string,
  provider: string,
  expiresAt?: Date
): Promise<void> {
  await sessionManager.storeSession(sessionId, subject, provider, expiresAt ? SESSION_TTL_SECONDS : undefined);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await sessionManager.deleteSession(sessionId);
}

export async function requireAuthMiddleware(c: Context, next: Next) {
  const result = await requireAuth(c);

  if (result instanceof Response) {
    return result;
  }

  c.set('auth', result);
  await next();
}

export async function requireAuth(c: Context): Promise<Response | AuthContext> {
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const result = await sessionManager.verifyToken(token);

      if (!result) {
        logger.error('Token verification failed');
        return c.json({ error: "Invalid token" }, 401);
      }

      logger.debug('Token verified', {
        subjectId: result.user.id,
        provider: result.user.provider
      });

      return toAuthContext(result);
    } catch (error) {
      logger.error('Bearer token auth error', { error, issuer: config.appUrl });
      return c.json({ error: "Authentication error" }, 401);
    }
  }

  const sessionCookie = getCookie(c, "session");

  if (!sessionCookie) {
    return c.json({ error: "No session found" }, 401);
  }

  const result = await sessionManager.validateSession(sessionCookie);

  if (!result) {
    return c.json({ error: "Invalid session" }, 401);
  }

  return toAuthContext(result);
}

export async function optionalAuth(c: Context): Promise<AuthContext | null> {
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const result = await sessionManager.verifyToken(token);

      if (!result) {
        return null;
      }

      return toAuthContext(result);
    } catch (error) {
      logger.error('Optional auth bearer token error', { error });
      return null;
    }
  }

  const sessionCookie = getCookie(c, "session");
  if (!sessionCookie) return null;

  const result = await sessionManager.validateSession(sessionCookie);
  if (!result) return null;

  return toAuthContext(result);
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
