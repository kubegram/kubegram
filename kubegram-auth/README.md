# @kubegram/kubegram-auth

OAuth authentication library built on [OpenAuth.js](https://openauth.js.org) with multi-provider support for Node.js/Bun.

## Features

- Multi-provider OAuth (GitHub, Google, GitLab, Okta, OIDC)
- Multiple storage backends (Memory, Redis, LRU+Redis)
- Session management with token verification
- TypeScript support
- Framework-agnostic (works with Hono, Express, etc.)

## Installation

```bash
npm install @kubegram/kubegram-auth
```

Optional dependencies:
```bash
npm install ioredis   # For Redis storage
npm install lru-cache # For LRU caching
```

## Usage

### Basic Setup

```typescript
import { createAuthApp, GithubProvider, GoogleProvider, createMemoryStorage } from '@kubegram/kubegram-auth';

const app = createAuthApp({
  providers: {
    github: {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scopes: ['user:email', 'read:user']
    },
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scopes: ['email', 'profile']
    }
  },
  storage: createMemoryStorage(),
  success: async (ctx, value) => {
    // Create or update user in your database
    const user = await syncUser(value);
    return ctx.subject('user', { id: user.id, provider: value.provider });
  },
  error: async (ctx, error) => {
    console.error('OAuth error:', error.message);
    return ctx.redirect('/login?error=auth_failed');
  }
});

// Handle requests
app.handle(request).then(response => {
  // Send response
});
```

### With Hono

```typescript
import { Hono } from 'hono';
import app from './auth';

const server = new Hono();
server.route('/oauth', app as any);
```

### With Redis Storage

```typescript
import Redis from 'ioredis';
import { createRedisStorage } from '@kubegram/kubegram-auth';

const redis = new Redis();
const storage = createRedisStorage(redis, { prefix: 'auth:' });

const authApp = createAuthApp({
  providers: { github: { clientID: '...', clientSecret: '...' }},
  storage
});
```

### Session Manager

```typescript
import { createSessionManager, createMemoryStorage } from '@kubegram/kubegram-auth';
import * as v from 'valibot';

const sm = createSessionManager({
  issuer: 'https://auth.example.com',
  subjects: {
    user: v.object({ id: v.string(), provider: v.string() })
  },
  storage: createMemoryStorage(),
  cacheOptions: { max: 1000, ttl: 300000 } // 5 min
});

// Verify JWT token
const result = await sm.verifyToken(token);
if (result) {
  console.log('User:', result.user);
}

// Validate session
const session = await sm.validateSession(sessionId);
```

## API Reference

### Core

- `createAuthApp(options)` - Create OAuth issuer app
- `issuer` - OpenAuth.js issuer (re-exported)

### Providers

- `GithubProvider` / `createGithubProvider(config)` - GitHub OAuth
- `GoogleProvider` / `createGoogleProvider(config)` - Google OAuth
- `GitLabProvider` / `createGitlabProvider(config)` - GitLab OAuth
- `OidcProvider` / `createOidcProvider(config)` - Generic OIDC/Okta

### Storage

- `createMemoryStorage(options)` - In-memory storage
- `createRedisStorage(redis, options)` - Redis storage
- `createLruRedisStorage(options)` - LRU + Redis write-through

### Session

- `SessionManager` - Token verification class
- `createSessionManager(options)` - Create session manager

### Types

- `UserSubject` - User subject type
- `AuthenticatedUser` - Authenticated user type
- `ProviderConfig` - Provider configuration
- `AuthStorage` - Storage interface
- `SuccessCallback` - OAuth success callback
- `ErrorCallback` - OAuth error callback
- `SessionManagerOptions` - Session manager options

## License

BUSL-1.1
