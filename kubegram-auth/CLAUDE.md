# CLAUDE.md - @kubegram/kubegram-auth

OAuth authentication library built on OpenAuth.js with multi-provider support.

## Tech Stack

- **Runtime**: Node.js / Bun
- **Framework**: OpenAuth.js
- **Language**: TypeScript (strict mode)
- **Peer Dependencies**: ioredis (optional), lru-cache (optional), redis (optional)

## Project Structure

```
src/
├── index.ts                    # Main exports
├── openauth.ts                 # createAuthApp function
├── types.ts                    # TypeScript interfaces
├── session.ts                  # SessionManager class
├── cache/
│   ├── index.ts               # Cache exports
│   └── session-cache.ts       # L1 memory cache (LRU) with optional L2 storage
├── providers/
│   ├── index.ts               # Provider exports
│   ├── github.ts              # GitHub OAuth
│   ├── google.ts              # Google OAuth
│   ├── gitlab.ts              # GitLab OAuth (via Slack provider)
│   └── okta.ts                # Okta / Generic OIDC
└── storage/
    ├── index.ts                # Storage exports
    ├── memory.ts               # In-memory storage
    ├── redis.ts                # Redis storage
    └── lru-redis.ts           # LRU + Redis write-through
```

## Architecture

### Two-Layer Cache (SessionCache)

The library uses a two-layer caching strategy for sessions:

```
┌─────────────────────────────────────────────────────────────┐
│                      Request                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  L1: In-Memory Cache (LRU)                                  │
│  - Fast local lookups                                       │
│  - Default: 1000 max entries, 5 min TTL                     │
│  - Automatically evicts least recently used                  │
└─────────────────────────────────────────────────────────────┘
          │ miss
          ▼
┌─────────────────────────────────────────────────────────────┐
│  L2: Optional Persistent Storage                            │
│  - Redis or custom storage backend                          │
│  - Write-through: writes to both L1 and L2                  │
│  - Provides HA across instances                             │
└─────────────────────────────────────────────────────────────┘
```

## Key APIs

### createAuthApp(options)
Creates an OAuth issuer app with providers, storage, and callbacks.

```typescript
import { createAuthApp, GithubProvider, createMemoryStorage } from '@kubegram/kubegram-auth';

const app = createAuthApp({
  providers: {
    github: { clientID: '...', clientSecret: '...' }
  },
  storage: createMemoryStorage(),
  success: async (ctx, value) => {
    return ctx.subject('user', { id: userId, provider: value.provider });
  }
});
```

### SessionManager
Token verification and session validation with optional callbacks for DB enrichment.

```typescript
import { createSessionManager, type AuthenticatedUser } from '@kubegram/kubegram-auth';
import * as v from 'valibot';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const sm = createSessionManager({
  issuer: 'https://auth.example.com',
  subjects: { user: v.object({ id: v.string(), provider: v.string() }) },
  redis: redisClient,  // Optional: enables L2 Redis storage
  cacheOptions: {
    max: 1000,         // L1 max entries
    ttl: 300000       // L1 TTL in ms (5 min)
  },
  callbacks: {
    // Called after token verification to enrich user from DB
    onVerifyToken: async (user) => {
      const dbUsers = await db.select().from(users)
        .where(eq(users.id, parseInt(user.id)));
      if (!dbUsers[0]) return null;
      return {
        id: dbUsers[0].id.toString(),
        email: dbUsers[0].email,
        name: dbUsers[0].name,
        avatar: dbUsers[0].avatarUrl,
        role: dbUsers[0].role,
        teamId: dbUsers[0].teamId?.toString(),
        provider: user.provider
      };
    },

    // Called after session validation to enrich user from DB
    onValidateSession: async (user) => {
      // user.id contains the email (subject from session)
      const dbUsers = await db.select().from(users)
        .where(eq(users.email, user.id));
      if (!dbUsers[0]) return null;
      return {
        id: dbUsers[0].id.toString(),
        email: dbUsers[0].email,
        name: dbUsers[0].name,
        role: dbUsers[0].role,
        provider: user.provider
      };
    },

    // Called when a session is created
    onSessionCreate: async (sessionId, subject, provider) => {
      console.log('Session created:', sessionId, subject);
    },

    // Called when a session is deleted
    onSessionDelete: async (sessionId) => {
      console.log('Session deleted:', sessionId);
    }
  }
});

// Verify a token
const result = await sm.verifyToken(token);
if (result) {
  console.log('User:', result.user);  // Enriched user from DB
}

// Validate a session
const session = await sm.validateSession(sessionId);
if (session) {
  console.log('User:', session.user);  // Enriched user from DB
}
```

### SessionCache (Low-Level)

For direct cache control without SessionManager:

```typescript
import { createSessionCache } from '@kubegram/kubegram-auth';

const cache = createSessionCache({
  maxSize: 500,
  ttl: 60000,  // 1 minute
  storage: {
    get: async (key) => redis.get(key),
    set: async (key, value, ttl) => redis.set(key, value, 'EX', ttl),
    delete: async (key) => redis.del(key)
  }
});

await cache.set('key', 'value', 5000);  // 5 second TTL
const value = await cache.get('key');
await cache.delete('key');
```

## Storage Options

| Storage | Use Case | Description |
|---------|----------|-------------|
| `createMemoryStorage()` | Dev/Single instance | In-memory, not shared |
| `createRedisStorage()` | HA/Production | Redis-backed, shared |
| `createLruRedisStorage()` | HA/Performance | L1 LRU + L2 Redis |

## Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript |
| `npm run type-check` | Type check only |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run check-all` | Type check + lint + format |
