import { createClient, type Client } from '@openauthjs/openauth/client';
import type { AuthenticatedUser, Subjects, SessionManagerCallbacks } from './types.js';
import { SessionCache, createSessionCache, type SessionCacheStorage } from './cache/session-cache.js';

/**
 * Options for creating a SessionManager instance.
 * 
 * @property issuer - The OAuth issuer URL (e.g., 'https://auth.example.com')
 * @property clientID - Optional client ID (defaults to 'kubegram-web')
 * @property subjects - Valibot schema defining subject types
 * @property redis - Optional ioredis instance for L2 persistent storage
 * @property storage - Optional custom storage adapter for L2
 * @property cacheOptions - Configuration for L1 in-memory cache
 * @property callbacks - Optional callbacks for user enrichment and lifecycle events
 */
export interface SessionManagerOptions {
  issuer: string;
  clientID?: string;
  subjects: Subjects;
  redis?: any;
  storage?: SessionCacheStorage;
  cacheOptions?: {
    max?: number;
    ttl?: number;
  };
  callbacks?: SessionManagerCallbacks;
}

/**
 * Internal session data structure stored in cache.
 * @internal
 */
interface SessionData {
  subject: string;
  provider: string;
  expiresAt?: string;
}

/**
 * Session manager for token verification and session validation.
 * 
 * Provides a complete authentication solution with:
 * - JWT token verification via OpenAuth client
 * - Session validation with optional L1 (memory) and L2 (Redis) caching
 * - Callback hooks for enriching user data from external sources (e.g., database)
 * 
 * @example
 * ```typescript
 * const sm = createSessionManager({
 *   issuer: 'https://auth.example.com',
 *   subjects: { user: v.object({ id: v.string(), provider: v.string() }) },
 *   redis: redisClient,
 *   callbacks: {
 *     onVerifyToken: async (user) => {
 *       // Enrich from database
 *       return { ...user, email: dbUser.email, role: dbUser.role };
 *     }
 *   }
 * });
 * ```
 */
export class SessionManager {
  private client: Client;
  private subjects: Subjects;
  private cache: SessionCache;
  private callbacks?: SessionManagerCallbacks;

  constructor(options: SessionManagerOptions) {
    this.client = createClient({
      clientID: options.clientID ?? 'kubegram-web',
      issuer: options.issuer,
    });
    this.subjects = options.subjects;
    this.callbacks = options.callbacks;

    if (options.redis) {
      this.cache = createSessionCache({
        maxSize: options.cacheOptions?.max ?? 1000,
        ttl: options.cacheOptions?.ttl ?? (5 * 60 * 1000),
        storage: {
          get: (key: string) => options.redis!.get(key) as Promise<string | null>,
          set: (key: string, value: string, ttl?: number) => {
            if (ttl) {
              return options.redis!.set(key, value, 'EX', ttl) as Promise<void>;
            }
            return options.redis!.set(key, value) as Promise<void>;
          },
          delete: async (key: string) => {
            await options.redis!.del(key);
          }
        }
      });
    } else if (options.storage) {
      this.cache = createSessionCache({
        maxSize: options.cacheOptions?.max ?? 1000,
        ttl: options.cacheOptions?.ttl ?? (5 * 60 * 1000),
        storage: options.storage
      });
    } else {
      this.cache = createSessionCache({
        maxSize: options.cacheOptions?.max ?? 1000,
        ttl: options.cacheOptions?.ttl ?? (5 * 60 * 1000)
      });
    }
  }

  /**
   * Verify a JWT access token from the Authorization header.
   * 
   * Validates the token using the OpenAuth client and optionally enriches
   * the user data via the onVerifyToken callback.
   * 
   * @param token - JWT token from Bearer authorization header
   * @returns Enriched user context with session ID, or null if invalid
   * 
   * @example
   * ```typescript
   * const result = await sm.verifyToken(token);
   * if (result) {
   *   console.log(result.user.email);  // Enriched from DB via callback
   * }
   * ```
   */
  async verifyToken(token: string): Promise<{ user: AuthenticatedUser; sessionId: string } | null> {
    try {
      const verified = await this.client.verify(this.subjects, token);

      if ('err' in verified) {
        return null;
      }

      const userId = verified.subject.properties.id;
      const provider = verified.subject.properties.provider;

      if (!userId) {
        return null;
      }

      let user: AuthenticatedUser = {
        id: userId,
        provider: provider ?? 'unknown',
      };

      if (this.callbacks?.onVerifyToken) {
        const enriched = await this.callbacks.onVerifyToken(user);
        if (!enriched) {
          return null;
        }
        user = enriched;
      }

      return {
        user,
        sessionId: 'token-session',
      };
    } catch {
      return null;
    }
  }

  /**
   * Validate a session by ID (e.g., from session cookie).
   * 
   * Checks the L1 cache first, then falls back to L2 storage if available.
   * Optionally enriches user data via the onValidateSession callback.
   * 
   * @param sessionId - Session identifier from cookie or storage
   * @returns Enriched user context with session ID, or null if invalid/expired
   * 
   * @example
   * ```typescript
   * const session = await sm.validateSession(sessionId);
   * if (session) {
   *   console.log(session.user.email);  // Enriched from DB
   * }
   * ```
   */
  async validateSession(sessionId: string): Promise<{ user: AuthenticatedUser; sessionId: string } | null> {
    const cached = await this.cache.get(`session:${sessionId}`);
    if (cached) {
      try {
        const session: SessionData = JSON.parse(cached);

        if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
          await this.cache.delete(`session:${sessionId}`);
          return null;
        }

        let user: AuthenticatedUser = {
          id: session.subject,
          provider: session.provider,
        };

        if (this.callbacks?.onValidateSession) {
          const enriched = await this.callbacks.onValidateSession(user);
          if (!enriched) {
            return null;
          }
          user = enriched;
        }

        return {
          user,
          sessionId
        };
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Store a new session.
   * 
   * Saves to L1 cache immediately, and optionally to L2 storage.
   * Calls onSessionCreate callback after successful storage.
   * 
   * @param sessionId - Unique session identifier
   * @param subject - User identifier (usually email or user ID)
   * @param provider - OAuth provider name
   * @param ttl - Optional time-to-live in seconds
   * 
   * @example
   * ```typescript
   * await sm.storeSession('abc123', 'user@example.com', 'github', 86400);
   * ```
   */
  async storeSession(
    sessionId: string,
    subject: string,
    provider: string,
    ttl?: number
  ): Promise<void> {
    const data: SessionData = {
      subject,
      provider,
      expiresAt: ttl ? new Date(Date.now() + ttl).toISOString() : undefined,
    };

    await this.cache.set(`session:${sessionId}`, JSON.stringify(data), ttl);

    if (this.callbacks?.onSessionCreate) {
      await this.callbacks.onSessionCreate(sessionId, subject, provider);
    }
  }

  /**
   * Delete a session.
   * 
   * Removes from L1 cache and optionally L2 storage.
   * Calls onSessionDelete callback after deletion.
   * 
   * @param sessionId - Session identifier to delete
   * 
   * @example
   * ```typescript
   * await sm.deleteSession('abc123');
   * ```
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.cache.delete(`session:${sessionId}`);

    if (this.callbacks?.onSessionDelete) {
      await this.callbacks.onSessionDelete(sessionId);
    }
  }

  /**
   * Get the underlying OpenAuth client.
   * Useful for advanced token operations.
   */
  getClient(): Client {
    return this.client;
  }
}

/**
 * Factory function to create a SessionManager instance.
 * 
 * @param options - Configuration options for the session manager
 * @returns Configured SessionManager instance
 * 
 * @example
 * ```typescript
 * const sm = createSessionManager({
 *   issuer: 'https://auth.example.com',
 *   subjects: { user: v.object({ id: v.string() }) }
 * });
 * ```
 */
export function createSessionManager(options: SessionManagerOptions): SessionManager {
  return new SessionManager(options);
}
