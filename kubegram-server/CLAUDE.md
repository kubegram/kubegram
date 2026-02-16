## CLAUDE.md - Kubegram Server

API gateway and authentication server for the Kubegram platform. Built on Hono.js running on Bun with PostgreSQL (Drizzle ORM), Redis, and OpenAuth.js for multi-provider OAuth.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono.js
- **Database**: PostgreSQL with Drizzle ORM
- **Cache/Sessions**: Redis (ioredis) for HA mode
- **Auth**: OpenAuth.js (OAuth 2.0 PKCE) - GitHub, Google, GitLab, Okta
- **Validation**: Valibot
- **Logging**: Winston
- **SSR**: React 19 for server-rendered pages
- **GraphQL Client**: @kubegram/common-ts for KubeRAG integration

## Project Structure

```
src/
├── index.ts                         # Server entry point (Hono app)
├── config/
│   ├── env.ts                       # Environment validation
│   └── secrets.ts                   # Secrets manager
├── auth/
│   ├── openauth.ts                  # OpenAuth app setup + providers
│   ├── redis-storage.ts             # Redis-backed session storage (HA)
│   └── ui.tsx                       # OAuth UI components (React SSR)
├── middleware/
│   ├── auth.ts                      # requireAuth, optionalAuth
│   ├── openauth.ts                  # OpenAuth middleware
│   ├── cors.ts                      # CORS configuration
│   └── parse-json-fields.ts         # JSON field parser
├── routes/
│   ├── index.ts                     # Route aggregator
│   ├── api.ts                       # API route setup
│   ├── tokens.ts                    # Token endpoints
│   └── api/v1/
│       ├── auth.ts                  # OAuth login/logout/me
│       ├── health.ts                # Liveness + readiness probes
│       ├── companies.ts             # Company CRUD
│       ├── organizations.ts         # Organization CRUD
│       ├── teams.ts                 # Team CRUD
│       ├── users.ts                 # User management
│       ├── projects.ts              # Project CRUD
│       ├── certificates.ts          # Key management
│       ├── providers.ts             # OAuth provider config
│       ├── iac.ts                   # Kubernetes-style IaC endpoints
│       ├── release.ts               # Release management
│       ├── graph/
│       │   ├── index.ts             # Route aggregator
│       │   ├── types.ts             # Validation schemas
│       │   ├── codegen.ts           # Code generation (calls KubeRAG)
│       │   ├── crud.ts              # Graph CRUD operations
│       │   └── plan.ts              # Planning operations
│       ├── admin/index.ts           # Admin endpoints
│       ├── public/index.ts          # Public endpoints
│       └── release/index.ts         # Release endpoints
├── services/
│   ├── codegen.ts                   # Code generation orchestration
│   ├── permissions.ts               # Access control
│   ├── oauth.ts                     # OAuth provider management
│   └── plan.ts                      # Planning service
├── clients/
│   └── rag-client.ts               # KubeRAG GraphQL SDK client
├── db/
│   ├── schema.ts                    # Drizzle table definitions + relations
│   └── index.ts                     # Database client initialization
├── ssr/
│   └── render.tsx                   # React SSR rendering
├── state/
│   └── redis.ts                     # Redis client
├── errors/
│   └── codegen.ts                   # Codegen error types
└── utils/
    ├── logger.ts                    # Winston logger setup
    ├── retry.ts                     # Exponential backoff
    ├── graph-input-cleaner.ts       # Graph input validation
    └── strict-mode-handler.ts       # TypeScript strict mode utils
```

## Key Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server with hot reload |
| `bun run dev:debug` | Dev with debugger (port 6464) |
| `bun run start` | Production server |
| `bun test` | Run tests |
| `bun run lint` | ESLint |
| `bun run typecheck` | Type check (`tsc --noEmit`) |
| `bun run copy-ui` | Copy React build to public/ |
| `bun run db:clear` | Clear database |
| `bun run db:restore` | Restore database from backup |
| `bun run db:backup` | Backup database |
| `bun run db:reset` | Drop volumes and recreate |
| `bun run db:shell` | PostgreSQL shell |
| `bun x drizzle-kit push --force` | Apply migrations |
| `bun x drizzle-kit generate` | Generate migration SQL |

## Environment Variables

```
PORT=8090                           # Server port
APP_URL=http://localhost:8090       # Public URL
NODE_ENV=development                # Environment
CORS_ORIGIN=http://localhost        # CORS allowed origin
ENABLE_HA=false                     # HA mode (Redis sessions)

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kubegram

REDIS_HOST=localhost                # Redis (for HA mode)
REDIS_PORT=6379
REDIS_DB=1                          # DB 1 (DB 0 is KubeRAG)

KUBERAG_URL=http://kuberag:8665/graphql   # KubeRAG endpoint

JWT_SECRET=                         # JWT signing secret
GLOBAL_ENCRYPTION_KEY=              # Data encryption key

GITHUB_CLIENT_ID=                   # OAuth providers
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=
OKTA_CLIENT_ID=
OKTA_CLIENT_SECRET=
OKTA_DOMAIN=
```

## API Routes

```
/api/public/v1/
├── auth/              # OAuth: login, logout, me, providers
├── companies/         # Company CRUD + IaC manifests
├── organizations/     # Organization CRUD
├── teams/             # Team CRUD
├── users/             # User management
├── projects/          # Project lifecycle
├── certificates/      # Key upload/generation
├── providers/         # OAuth provider config
├── iac/               # Kubernetes-style IaC (CRD format)
├── graph/
│   ├── codegen        # POST (start), GET :jobId/status, GET :jobId/results, DELETE :jobId
│   ├── crud           # Graph CRUD via KubeRAG
│   └── plan           # Infrastructure planning
├── release/           # Release management
└── healthz/           # /live, /ready

/api/v1/admin/         # Admin-only endpoints
/oauth/{provider}      # OAuth initiation + callback
```

## Database Schema

Tables in `src/db/schema.ts` (Drizzle ORM):

- **companies** - uuid PK, name, tokens, stripeCustomerID
- **organizations** - serial PK, name, FK companyId
- **teams** - serial PK, name, FK organizationId
- **users** - serial PK, email, name, avatar, role, provider, FK teamId
- **projects** - serial PK, graphId, graphMeta (JSON), FK teamId, createdBy
- **generation_jobs** - Codegen job tracking (graphId + projectId, status, result)
- **generation_job_artifacts** - Generated files per job
- **openauth_sessions** - OAuth sessions (subject, expiresAt)
- **company_certificates** - Public key storage

Permission hierarchy: Company → Organization → Team → User

## Architecture

### Auth Flow
1. Client hits `/oauth/{provider}` → redirects to OAuth provider
2. Provider callback → OpenAuth exchanges code for token
3. Session stored in DB (or Redis in HA mode)
4. `requireAuth` middleware validates session cookie on protected routes

### Code Generation
1. Route `POST /graph/codegen` receives graph data
2. `CodegenService` validates input and cleans graph
3. Calls KubeRAG via `graphqlSdk.generateCodegen()`
4. Creates tracking record in `generation_jobs` table
5. Client polls `GET /graph/codegen/:jobId/status`
6. On completion, `GET /:jobId/results` returns generated manifests

### KubeRAG Integration
- `src/clients/rag-client.ts` creates typed GraphQL SDK from `@kubegram/common-ts`
- All graph operations (codegen, CRUD, planning) proxy through to KubeRAG

## Conventions

- Route files use plural names: `companies.ts`, `organizations.ts`
- Service files use singular: `codegen.ts`, `oauth.ts`
- All routes require auth except `/oauth/*`, `/healthz/*`, and explicit public routes
- Drizzle relations defined for eager loading
- Soft deletes via `deletedAt` column
- Input validation with Valibot schemas in route handlers
- Logging via Winston with child loggers

## Documentation

- [AGENTS.md](AGENTS.md) - Comprehensive API documentation
- [docs/api_docs.md](docs/api_docs.md) - REST API reference
- [docs/schema.md](docs/schema.md) - Database schema
- [docs/oauth_flow.md](docs/oauth_flow.md) - OAuth implementation
- [docs/codegen.md](docs/codegen.md) - Code generation flow
- [docs/rag-integration-progress.md](docs/rag-integration-progress.md) - RAG integration status

## Troubleshooting

- **Session not found**: User needs to re-authenticate via OAuth
- **Migration failed**: Run `bun x drizzle-kit push --force`
- **CORS errors**: Check `CORS_ORIGIN` matches request origin
- **React build missing**: Run `bun run copy-ui` to copy UI build to `public/`
- **Redis in HA mode**: Verify `ENABLE_HA=true` and Redis config
- **KubeRAG connection**: Ensure `KUBERAG_URL` is correct and KubeRAG is running
