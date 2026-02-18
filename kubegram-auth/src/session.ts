import { createClient, type Client } from '@openauthjs/openauth/client';
import type { AuthenticatedUser, Subjects } from './types.js';
import { SessionCache, createSessionCache, type SessionCacheStorage } from './cache/session-cache.js';

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
}

interface SessionData {
  subject: string;
  provider: string;
  expiresAt?: string;
}

export class SessionManager {
  private client: Client;
  private subjects: Subjects;
  private cache: SessionCache;

  constructor(options: SessionManagerOptions) {
    this.client = createClient({
      clientID: options.clientID ?? 'kubegram-web',
      issuer: options.issuer,
    });
    this.subjects = options.subjects;

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

      return {
        user: {
          id: userId,
          provider: provider ?? 'unknown',
        },
        sessionId: 'token-session',
      };
    } catch {
      return null;
    }
  }

  async validateSession(sessionId: string): Promise<{ user: AuthenticatedUser; sessionId: string } | null> {
    const cached = await this.cache.get(`session:${sessionId}`);
    if (cached) {
      try {
        const session: SessionData = JSON.parse(cached);

        if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
          await this.cache.delete(`session:${sessionId}`);
          return null;
        }

        return {
          user: {
            id: session.subject,
            provider: session.provider,
          },
          sessionId
        };
      } catch {
        return null;
      }
    }

    return null;
  }

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
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.cache.delete(`session:${sessionId}`);
  }

  getClient(): Client {
    return this.client;
  }
}

export function createSessionManager(options: SessionManagerOptions): SessionManager {
  return new SessionManager(options);
}
