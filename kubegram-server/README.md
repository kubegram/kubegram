# kubegram-server

API gateway and authentication server for the Kubegram platform. Built on [Hono.js](https://hono.dev) running on [Bun](https://bun.sh), with PostgreSQL (Drizzle ORM), Redis, and OpenAuth.js for multi-provider OAuth.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Framework | Hono.js |
| Database | PostgreSQL + Drizzle ORM |
| Cache / Sessions | Redis (optional — HA mode only) |
| Auth | OpenAuth.js (OAuth 2.0 PKCE) — GitHub, Google, GitLab, Okta |
| Validation | Valibot |
| Logging | Winston |
| MCP | `@modelcontextprotocol/sdk` v1.26+ |

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- PostgreSQL 16+
- Redis 7+ (only required when `ENABLE_HA=true`)

## Installation

```bash
bun install
```

## Environment Variables

Copy `.env.development` and fill in the required values:

```env
PORT=8090
APP_URL=http://localhost:8090
NODE_ENV=development
CORS_ORIGIN=http://localhost

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kubegram

# Redis — only needed when ENABLE_HA=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=1
ENABLE_HA=false

# KubeRAG — required for code generation and planning
KUBERAG_URL=http://localhost:8665/graphql

JWT_SECRET=your-secret-key

# OAuth providers — add whichever you need
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=
OKTA_CLIENT_ID=
OKTA_CLIENT_SECRET=
OKTA_DOMAIN=
```

## Running

### Development (hot reload)

```bash
bun run dev
```

### Development (with debugger on port 6464)

```bash
bun run dev:debug
```

### Production

```bash
bun run start
```

The server serves the pre-built UI from `./public`. Copy the UI build first:

```bash
# From the repo root
cp -r kubegram-ui/dist kubegram-server/public

# Or use the helper script from kubegram-server/
bun run copy-ui
```

## Database

```bash
# Apply schema (Drizzle push)
bun x drizzle-kit push --force

# Generate migration SQL
bun x drizzle-kit generate

# Open a psql shell (requires Docker Compose running)
bun run db:shell
```

The server falls back to an in-process EventCache when `DATABASE_URL` is absent or unreachable — useful for standalone local runs without Postgres.

## API Routes

All routes are prefixed with `/api`.

```
/api/public/v1/
├── auth/          # OAuth login, callback, logout, current user
├── companies/     # Company CRUD + IaC manifests
├── organizations/ # Organization management
├── teams/         # Team management
├── users/         # User administration
├── projects/      # Project lifecycle
├── certificates/  # Public key upload / generation
├── providers/     # OAuth provider config
├── graph/
│   ├── codegen    # POST start, GET :jobId/status, GET :jobId/results, DELETE :jobId
│   ├── crud       # Graph CRUD via KubeRAG
│   └── plan       # AI infrastructure planning
└── healthz/       # GET /live (liveness), GET /ready (readiness)

/api/v1/
├── admin/         # Admin-only endpoints
└── mcp            # Model Context Protocol server (see MCP_README.md)

/oauth/{provider}  # OpenAuth initiation + callback
```

## MCP Server

The server exposes an MCP endpoint at `/api/v1/mcp` for AI assistant integrations (Claude Desktop, Claude Code, etc.). See [MCP_README.md](./MCP_README.md) for full tool reference and client configuration.

## Project Structure

```
src/
├── index.ts                         # Server entry point (Hono app + static serving)
├── config/
│   ├── env.ts                       # Environment validation
│   └── secrets.ts                   # Secrets manager
├── auth/
│   ├── openauth.ts                  # OpenAuth app setup + providers
│   ├── redis-storage.ts             # Redis-backed session storage (HA mode)
│   └── ui.tsx                       # OAuth UI components (React SSR)
├── middleware/
│   ├── auth.ts                      # requireAuth, optionalAuth
│   ├── openauth.ts                  # OpenAuth middleware
│   ├── cors.ts                      # CORS configuration
│   └── parse-json-fields.ts         # JSON field parser
├── routes/
│   ├── index.ts                     # Route aggregator
│   └── api/v1/
│       ├── auth.ts
│       ├── health.ts
│       ├── companies.ts
│       ├── organizations.ts
│       ├── teams.ts
│       ├── users.ts
│       ├── projects.ts
│       ├── certificates.ts
│       ├── providers.ts
│       └── graph/
│           ├── codegen.ts
│           ├── crud.ts
│           └── plan.ts
├── mcp/                             # MCP server (see MCP_README.md)
│   ├── index.ts
│   ├── server.ts
│   ├── types.ts
│   └── tools/
├── services/
│   ├── codegen.ts
│   ├── permissions.ts
│   ├── oauth.ts
│   └── plan.ts
├── db/
│   ├── schema.ts                    # Drizzle table definitions
│   └── index.ts                     # Database client
├── ssr/
│   └── render.tsx                   # React SSR (serves ./public/index.html)
├── state/
│   └── redis.ts                     # Redis client
└── utils/
    ├── logger.ts                    # Winston logger
    └── retry.ts                     # Exponential backoff
```

## Troubleshooting

**UI not loading**
The server serves `./public/index.html` as the SPA entry point. If the page is blank or missing, copy the UI build:
```bash
bun run copy-ui   # from kubegram-server/
```

**Database connection errors**
```bash
bun x drizzle-kit push --force   # apply schema
bun run db:shell                  # open psql to inspect
```
If you just want to run the server without Postgres, leave `DATABASE_URL` unset — it will fall back to the in-process EventCache.

**Redis errors**
Redis is only required when `ENABLE_HA=true`. Set `ENABLE_HA=false` (the default) to run without Redis.

**OAuth callback errors**
Ensure `APP_URL` matches the redirect URI registered with your OAuth provider. The callback path is `APP_URL/oauth/{provider}/callback`.

**KubeRAG not reachable**
Code generation and planning features require a running KubeRAG instance. Set `KUBERAG_URL` to point to it. The rest of the API works without KubeRAG.
