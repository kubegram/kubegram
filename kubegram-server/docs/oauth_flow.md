# OAuth Flow

Complete reference for the Kubegram OAuth 2.0 PKCE flow, covering all server and client code paths.

## High-Level Flow

```
[Browser] → LoginModal button click
  → initiateLogin thunk (kubegram-ui)
  → window.location.href = http://localhost:8090/oauth/authorize
  → [kubegram-server] /oauth/* handler strips /oauth prefix
  → OpenAuth /authorize: stores PKCE state in encrypted cookie
    → (single provider) redirects to /github/authorize
    → [kubegram-server] /:provider/authorize forwarder
    → OpenAuth /github/authorize: redirects to GitHub
      redirect_uri = http://localhost:8090/github/callback
  → [GitHub] user authenticates + authorizes app
  → [GitHub] GET http://localhost:8090/github/callback?code=...&state=...
  → [kubegram-server] /:provider/callback forwarder
  → OpenAuth /github/callback: exchanges code → calls success()
  → success(): upsert user in DB → ensure Company/Org/Team → ctx.subject()
  → OpenAuth issues JWT, redirects to:
      http://localhost:5173/auth/callback?code=...&state=...
  → [kubegram-ui] OAuthCallback: dispatches handleCallback thunk
  → exchangeCodeForTokens → tokens stored in localStorage['kubegram_auth']
  → navigate to saved redirect path (or /)
```

---

## Server-Side Code Path

### Middleware / Handler Chain (`kubegram-server/src/index.ts`)

Handlers are evaluated in registration order:

| # | Handler | Path | Behavior |
|---|---------|------|----------|
| 1 | `corsMiddleware` | `*` | Adds CORS headers, calls `next()` |
| 2 | `openAuthMiddleware` | `*` | Verifies Bearer token on protected routes, calls `next()` |
| 3 | `apiRoutes` | `/api/*` | All REST API routes; unmatched paths fall through |
| 4 | `/oauth/*` URL-rewrite | `/oauth/*` | Strips `/oauth` prefix, forwards to `app.handle()` |
| 5 | `/:provider/authorize` | `/:provider/authorize` | Single-provider case (see below); falls through on 404 |
| 6 | `/:provider/callback` | `/:provider/callback` | OAuth callback; falls through on 404 |
| 7 | `/.well-known/*` | `/.well-known/*` | JWKS + discovery doc from OpenAuth |
| 8 | `serveStatic` | `/assets/*`, `/*` | Static files from `./public` |
| 9 | `renderSSR` | `*` | React SSR fallback — serves `index.html` |

### Why URL-Rewriting Instead of `honoApp.route()`

OpenAuth uses `hono/tiny` internally, which lacks the `.routes` property that Hono's `route()` method requires for merging. Attempting `honoApp.route('/oauth', app.hono)` throws `TypeError: undefined is not an object (evaluating 'app.routes')`.

The workaround: a custom handler at `/oauth/*` strips the prefix and calls `app.handle(new Request(strippedUrl, c.req.raw))`. OpenAuth's router then sees root-level paths (`/authorize`, `/:provider/authorize`, etc.) and matches correctly.

```typescript
// kubegram-server/src/index.ts
honoApp.use('/oauth/*', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.slice('/oauth'.length) || '/';
  return app.handle(new Request(url.toString(), c.req.raw));
});
```

### Single-Provider Redirect (`/:provider/authorize`)

When only one provider is configured, OpenAuth's `/authorize` handler skips the provider-selection page and redirects directly to `/:provider/authorize` (e.g. `/github/authorize`) — **without** the `/oauth` prefix. Without a handler for this path, the request would fall through to the React SSR and render the UI.

```typescript
honoApp.use('/:provider/authorize', async (c, next) => {
  const response = await app.handle(c.req.raw);
  if (response.status !== 404) return response;
  return next();
});
```

### OAuth Callback Path (`/:provider/callback`)

OpenAuth's `getRelativeUrl(ctx, './callback')` computes the callback URL relative to the *stripped* request URL. When `/oauth/github/authorize` is stripped to `/github/authorize`, the computed callback is `/github/callback` — not `/oauth/github/callback`. GitHub therefore redirects to `http://localhost:8090/github/callback`, which needs its own forwarder.

```typescript
honoApp.use('/:provider/callback', async (c, next) => {
  const response = await app.handle(c.req.raw);
  if (response.status !== 404) return response;
  return next();
});
```

> **GitHub OAuth App**: The callback URL must be `http://localhost:8090/github/callback` — **not** `http://localhost:8090/oauth/github/callback`.

### `select` Callback — Provider Selection Page (`src/auth/openauth.ts:163`)

Renders a server-side React page listing available providers. The `basePath` must be `/oauth` so that provider buttons link to `/oauth/:provider/authorize`. It is hardcoded because the request URL has already been stripped of `/oauth` before OpenAuth sees it — dynamic extraction would yield `""`.

```typescript
// basePath is hardcoded because URL rewriting strips /oauth before OpenAuth sees req.url
const basePath = '/oauth';
```

Provider buttons in `src/auth/ui.tsx` use:
```javascript
window.location.href = basePath + '/' + provider + '/authorize';
// → /oauth/github/authorize  ✓
```

### `success` Callback (`src/auth/openauth.ts:202`)

Called by OpenAuth after the provider exchanges the authorization code:

1. Reads provider from `value.provider` (`github` or `google`)
2. Fetches user profile from provider API (`https://api.github.com/user`, `https://www.googleapis.com/oauth2/v2/userinfo`)
3. Upserts the user row in the `users` table (Drizzle ORM)
4. Calls `ensureUserHasTeam(userId, name)`:
   - If user already has a `teamId` → looks up the team, organization, and company
   - If not → creates a new Company → Organization → Team hierarchy with UUID-based names
5. Calls `ctx.subject('user', { id: userId.toString(), provider })` → OpenAuth issues a JWT and sets the session cookie
6. Sets three custom response headers:
   - `X-Kubegram-Company-Id`
   - `X-Kubegram-Organization-Id`
   - `X-Kubegram-Team-Id`

### Storage Backends (`kubegram-auth/src/storage/`)

| Backend | When used | Description |
|---------|-----------|-------------|
| `createMemoryStorage()` | Default / dev | In-process only; lost on restart |
| `createLruRedisStorage({ redis })` | `ENABLE_HA=true` | L1 LRU cache + L2 Redis write-through |

---

## Client-Side Code Path

### Login Trigger (`kubegram-ui/src/components/LoginModal.tsx:163`)

The login button calls `handleOAuthLogin('oidc')`, which dispatches the `initiateLogin` Redux thunk. The provider string is passed but not currently forwarded in the authorization URL query string.

### `initiateLogin` Thunk (`src/store/slices/oauth/oauthThunks.ts`)

1. Saves current page path to `localStorage['oauth_redirect_path']`
2. Constructs `callbackUrl = window.location.origin + '/auth/callback'` = `http://localhost:5173/auth/callback`
3. Calls `openAuthClient.authorize(callbackUrl, "code")` — returns an authorization URL
4. Sets `window.location.href = result.url` — full-page navigation to the server

### OpenAuth Client Config (`src/store/api/oauthConfig.ts`)

```typescript
issuer: `${VITE_API_URL}/oauth`   // http://localhost:8090/oauth
clientID: 'kubegram-ui'
```

The client discovers OpenAuth endpoints via `GET http://localhost:8090/oauth/.well-known/oauth-authorization-server`.

### `OAuthCallback` Component (`src/components/OAuthCallback.tsx`)

Mounted at `/auth/callback`. Reads `code` and `state` from URL search params:

- **Happy path** (`code` + `state` present): dispatches `handleCallback(code, state, callbackUrl)`
- **Error path** (`code` or `state` missing): calls `navigate('/login')`
  - This fires when OpenAuth redirects to `redirect_uri?error=...` (e.g. DB failure in `success`, provider error, or `redirect_uri_mismatch`)

### `handleCallback` Thunk (`src/store/slices/oauth/oauthThunks.ts`)

1. Calls `openAuthApi.exchangeCodeForTokens(code, state, callbackUrl)`
2. Stores tokens in Redux `oauth` slice (persisted to `localStorage['kubegram_auth']`)
3. Dispatches `fetchUserContext` — loads user, company, org, and team data
4. Navigates to `localStorage['oauth_redirect_path']` or `/`

### Token Lifecycle

- **Storage**: `localStorage['kubegram_auth']` — `{ access, refresh, expiresAt }`
- **Refresh**: `oauthThunks.refreshTokens` exchanges the refresh token
- **Expiry**: `authErrorMiddleware` catches 401 responses globally, dispatches `clearAuth()`, and clears all tokens
- **Route guard**: `ProtectedRoute` checks `isAuthenticated` from Redux; redirects to `/login` on failure

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Redirected to `/login` after OAuth | `OAuthCallback` received no `code`/`state` (error redirect) | See rows below |
| `?error=redirect_uri_mismatch` | GitHub OAuth App callback URL wrong | Must be `http://localhost:8090/github/callback` |
| `?error=server_error` | `success` callback threw (DB unreachable, query failed) | Ensure PostgreSQL is running and migrations are applied (`make db-migrate`) |
| `/oauth/authorize` returns 404 | URL-rewrite handler missing or regex wrong | Verify `/oauth/*` handler in `src/index.ts` |
| Provider buttons navigate to `/github/authorize` (no 404 fix) | `/:provider/authorize` forwarder missing | Register handler before SSR fallback in `src/index.ts` |
| Provider selection links go to wrong path | `basePath` in `select` callback dynamically computed from stripped URL | Must be hardcoded to `'/oauth'` |
| JWKS / token verification fails | `/.well-known/jwks.json` not forwarded to OpenAuth | Verify `/.well-known/*` handler in `src/index.ts` |

---

## Configuration Checklist

### GitHub OAuth App (https://github.com/settings/developers)

```
Homepage URL:       http://localhost:8090
Authorization callback URL:  http://localhost:8090/github/callback
```

> The callback URL must **not** include `/oauth/` — it must be `/github/callback` directly.

### Server (`kubegram-server/.env`)

```
PORT=8090
APP_URL=http://localhost:8090
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kubegram
ENABLE_HA=false                # set true to use Redis-backed session storage
```

### UI (`kubegram-ui/.env`)

```
VITE_API_URL=http://localhost:8090
```

---

## Key Files Reference

| File | Role |
|------|------|
| `kubegram-server/src/index.ts` | Middleware chain, URL-rewrite handlers, provider/callback forwarders |
| `kubegram-server/src/auth/openauth.ts` | `success`, `select`, `error` callbacks; storage config |
| `kubegram-server/src/auth/ui.tsx` | Server-rendered provider selection HTML |
| `kubegram-server/src/middleware/openauth.ts` | Per-request token verification |
| `kubegram-auth/src/openauth.ts` | `createAuthApp` wrapper around `@openauthjs/openauth` |
| `kubegram-auth/src/storage/` | Memory, Redis, and LRU+Redis backends |
| `kubegram-ui/src/store/api/oauthConfig.ts` | OpenAuth client instance (issuer, clientID) |
| `kubegram-ui/src/store/api/openauth.ts` | `initiateLogin`, `exchangeCodeForTokens` |
| `kubegram-ui/src/store/slices/oauth/oauthThunks.ts` | `initiateLogin`, `handleCallback`, `fetchUserContext`, `refreshTokens` |
| `kubegram-ui/src/components/OAuthCallback.tsx` | Handles `/auth/callback` — happy path and error path |
| `kubegram-ui/src/components/LoginModal.tsx` | Login button, triggers `initiateLogin` |
| `kubegram-ui/src/components/ProtectedRoute.tsx` | Auth gate for protected pages |
| `kubegram-ui/src/store/middleware/authErrorMiddleware.ts` | Global 401 handler → clears auth |
