# CLAUDE.md - @kubegram/kubegram-auth

OAuth authentication library built on OpenAuth.js with multi-provider support.

## Tech Stack

- **Runtime**: Node.js / Bun
- **Framework**: OpenAuth.js
- **Language**: TypeScript (strict mode)
- **Peer Dependencies**: ioredis (optional), lru-cache (optional)

## Project Structure

```
src/
├── index.ts                    # Main exports
├── openauth.ts                 # createAuthApp function
├── types.ts                    # TypeScript interfaces
├── session.ts                  # SessionManager class
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
Token verification and session validation.

```typescript
import { createSessionManager } from '@kubegram/kubegram-auth';

const sm = createSessionManager({
  issuer: 'https://auth.example.com',
  subjects: { user: v.object({ id: v.string(), provider: v.string() }) }
});

const result = await sm.verifyToken(token);
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript |
| `npm run type-check` | Type check only |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run check-all` | Type check + lint + format |
