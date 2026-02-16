## CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

Kubegram is an AI-driven visual Kubernetes infrastructure platform. Users design infrastructure on a drag-and-drop canvas, and the system generates production-ready Kubernetes manifests through multi-provider LLM integration with RAG (Retrieval-Augmented Generation).

## Workspace Structure

NPM workspaces monorepo with 6 TypeScript packages + 1 Go module:

```
kubegram/
├── common-ts/             # @kubegram/common-ts - Shared GraphQL SDK
├── common-events/         # @kubegram/common-events - Typed event system, pub/sub, caching
├── kuberag/               # RAG engine (GraphQL API + Dgraph + vector search)
├── kubegram-server/       # API Gateway + Auth (Hono on Bun, PostgreSQL, Drizzle ORM)
├── kubegram-ui/           # React canvas interface (Konva.js, Redux Toolkit)
├── kubegram-github-app/   # GitHub App webhook listener (Express, Octokit)
├── kubegram-operator/     # Kubernetes MCP Server (Go, controller-runtime)
├── docker-compose.yml     # Full stack: kuberag, kubegram-server, redis, postgres, dgraph
├── Makefile               # Docker management + CI targets
└── docs/                  # Project-level documentation
```

## Tech Stack

| Workspace | Runtime | Framework | Database/Storage | Key Libraries |
|-----------|---------|-----------|-----------------|---------------|
| kubegram-ui | Vite | React 19 + TypeScript | Redux + localStorage | Konva.js, Tailwind, Radix UI, Apollo Client |
| kubegram-server | Bun | Hono.js + TypeScript | PostgreSQL (Drizzle ORM), Redis | OpenAuth.js, Valibot, Winston |
| kuberag | Bun | GraphQL API + TypeScript | Dgraph (graph + vector), Redis | Multi-LLM (Claude, OpenAI, Gemini, DeepSeek, Ollama), Voyage AI embeddings |
| common-ts | Node.js | TypeScript | - | Axios, Zod, GraphQL codegen |
| common-events | Node.js | TypeScript | Optional Redis | eventemitter3, DDD domain events |
| kubegram-github-app | Node.js | Express + TypeScript | - | Octokit, Helmet, Winston |
| kubegram-operator | Go 1.24 | MCP SDK | - | client-go, controller-runtime, gorilla/websocket |

## Key Commands

### Root-Level (NPM Workspaces)

```bash
npm install                     # Install all workspace dependencies
npm run build:all               # Build all workspaces
npm run test:all                # Test all workspaces
npm run lint:all                # Lint all workspaces
npm run check:all               # Typecheck + lint + test all

# Per-workspace shortcuts
npm run dev:ui                  # UI dev server with HMR
npm run dev:server              # Server dev with hot reload
npm run dev:kuberag             # KubeRAG dev server
npm run dev:github-app          # GitHub App dev server
npm run build:ui                # Production UI build
npm run build:server            # Production server build
npm run codegen:common-ts       # Regenerate GraphQL types
```

### Docker Compose (via Makefile)

```bash
make up                         # Start all services (kuberag, server, redis, postgres, dgraph)
make down                       # Stop all services
make logs                       # Tail all logs
make logs-kuberag               # Tail kuberag logs
make logs-kubegram              # Tail server logs
make status                     # Show container status
make health-check               # Check all service health endpoints
make db-migrate                 # Run Drizzle migrations (drizzle-kit push)
make db-reset                   # Drop and recreate kubegram database
make redis-cli                  # Open Redis CLI
make rebuild-kuberag            # Rebuild and restart kuberag only
make rebuild-kubegram           # Rebuild and restart server only
make clean                      # Remove all containers and volumes
```

### Operator (Go)

```bash
cd kubegram-operator
make run                        # Run locally
make docker-build               # Build container image
make dev-up                     # Kind cluster setup
```

## Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| kubegram-server | 8090 | API Gateway + Auth |
| kuberag | 8665 | RAG GraphQL API |
| PostgreSQL | 5433 (host) / 5432 (container) | User/project data |
| Dgraph | 8080 | Graph + vector DB |
| Redis | 6379 | Cache + sessions + pub/sub |
| Node debugger | 9229 | KubeRAG debug |
| Bun debugger | 6465 (host) / 6464 (container) | Server debug |

Redis DB isolation: KubeRAG uses DB 0, kubegram-server uses DB 1.

## Architecture

### Code Generation Flow

```
Canvas Design (Konva.js)
  → POST /api/public/v1/graph/codegen (kubegram-server)
    → GraphQL InitializeCodeGen mutation (kuberag)
      → Graph analysis + RAG context retrieval (Dgraph vector search)
        → LLM call (multi-provider)
          → Kubernetes manifest generation + validation
  → Poll GET /api/public/v1/graph/codegen/:jobId/status
  → GET /:jobId/results → Redux store + localStorage
```

### Auth Flow

OpenAuth.js with OAuth 2.0 PKCE. Providers: GitHub, Google, GitLab, Okta, SSO/OIDC.

- Server endpoints: `/api/public/v1/auth/{provider}/login`, `/callback`, `/refresh`
- UI: Modal-based login, tokens stored in localStorage as `kubegram_auth`
- Sessions backed by `openauth_sessions` table in PostgreSQL

### Server API Routes

```
/api/public/v1/
├── auth/          # OAuth login, logout, current user
├── companies/     # Company CRUD + IaC manifests
├── organizations/ # Organization management
├── teams/         # Team management
├── users/         # User administration
├── projects/      # Project lifecycle
├── graph/
│   ├── codegen    # Code generation (POST, GET status, GET results, DELETE)
│   ├── crud       # Graph CRUD operations
│   └── plan       # Infrastructure planning
└── healthz/       # /live (liveness), /ready (readiness)
```

### Event System (common-events)

- TypedEventEmitter for type-safe events
- DomainEvent + DomainEventDispatcher (DDD patterns)
- EventBus with pluggable PubSubProvider (Local or Redis)
- EventCache with TTL/LRU eviction (Memory, Write-Through, or Storage-Only modes)
- SuspensionManager for request-response patterns
- ReminderManager for automated workflows

### MCP Operator (Go)

MCP server exposing tools: `bash`, `kubectl`, `install_argo_mcp`. Supports Stdio, HTTP/SSE, and WebSocket transports. Proxies to external MCP servers (ArgoCD, Kubernetes).

## Database Schema (PostgreSQL)

Key tables managed by Drizzle ORM:

- `companies` - Top-level orgs with billing (stripeCustomerID)
- `organizations` - Company subdivisions
- `teams` - Working groups within organizations
- `users` - Accounts with email, provider, avatar, role
- `projects` - graphId, graphMeta (JSON), teamId, createdBy
- `generation_jobs` - Code generation job tracking (graphId + projectId)
- `generation_job_artifacts` - Generated files per job
- `openauth_sessions` - User sessions
- `company_certificates` - Public key storage

Permission model: Company → Organization → Team → User. Team-based project ownership.

## Documentation Map

### Root Docs (`/docs/`)
- [index.md](docs/index.md) - Documentation hub
- [architecture-reference.md](docs/architecture-reference.md) - System architecture
- [backlog.md](docs/backlog.md) - Prioritized work items
- [achievements.md](docs/achievements.md) - Milestones
- [usage.md](docs/usage.md) - Usage guide
- [KUBEGRAM_SERVER.md](docs/KUBEGRAM_SERVER.md) - Server component overview
- [KUBEGRAM_OPERATOR.md](docs/KUBEGRAM_OPERATOR.md) - Operator component overview
- [RAG_SYSTEM.md](docs/RAG_SYSTEM.md) - RAG engine overview
- [UI.md](docs/UI.md) - UI component overview

### Server Docs (`/kubegram-server/docs/`)
- [api_docs.md](kubegram-server/docs/api_docs.md) - REST API reference
- [schema.md](kubegram-server/docs/schema.md) - Database schema
- [oauth_flow.md](kubegram-server/docs/oauth_flow.md) - OAuth implementation
- [OPENAUTH_SETUP.md](kubegram-server/docs/OPENAUTH_SETUP.md) - OpenAuth setup guide
- [codegen.md](kubegram-server/docs/codegen.md) - Code generation flow
- [rag-integration-plan.md](kubegram-server/docs/rag-integration-plan.md) - RAG integration design
- [rag-integration-progress.md](kubegram-server/docs/rag-integration-progress.md) - Implementation status
- [swagger.yaml](kubegram-server/docs/swagger.yaml) - OpenAPI spec

### UI Docs (`/kubegram-ui/docs/`)
- [oauth_flow.md](kubegram-ui/docs/oauth_flow.md) - UI auth flow
- [state-management.md](kubegram-ui/docs/state-management.md) - Redux architecture
- [codegen-polling.md](kubegram-ui/docs/codegen-polling.md) - Polling with exponential backoff
- [enhanced-codegen.md](kubegram-ui/docs/enhanced-codegen.md) - Code generation results & storage
- [enhanced-codeviewpage.md](kubegram-ui/docs/enhanced-codeviewpage.md) - Code view layout

### Shared Package Docs
- [common-events/docs/caching.md](common-events/docs/caching.md) - Event caching architecture

## Environment Variables

### KubeRAG (`kuberag/.env.docker`)
```
PORT=8665
DGRAPH_HOST=dgraph
DGRAPH_HTTP_PORT=8080
REDIS_HOST=redis
REDIS_DB=0
ANTHROPIC_API_KEY=         # Required for Claude
OPENAI_API_KEY=            # Optional
GOOGLE_API_KEY=            # Optional
DEEPSEEK_API_KEY=          # Optional
```

### Kubegram Server (`kubegram-server/.env.docker`)
```
PORT=8090
APP_URL=http://localhost:8090
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/kubegram
REDIS_HOST=redis
REDIS_DB=1
KUBERAG_URL=http://kuberag:8665/graphql
JWT_SECRET=your-secret-key
GITHUB_CLIENT_ID=          # OAuth provider credentials
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### UI (`kubegram-ui/.env`)
```
VITE_API_URL=http://localhost:8090
VITE_FORCE_REAUTH=false
```

## CI/CD

- **GitHub Actions**: Auto-deploy UI to GitHub Pages (www.kubegram.com) on push to main
- **Makefile CI targets**: `make ci-all-common` and `make ci-all-common-events` for shared packages
- **Publishing**: `make ci-publish-common` / `make ci-publish-common-events` for npm publishing

## Development Guidelines

- No AI ads in commit messages
- TypeScript strict mode across all packages
- Interface-first design for services
- Follow existing patterns in each workspace
- Type-safe GraphQL via codegen (`npm run codegen:common-ts`)
- Use Drizzle ORM for all database operations (no raw SQL)
- Validate inputs with Valibot (server) or Zod (common-ts)
- Use structured logging (Winston) with context-aware child loggers

## Working with the Backlog

When asked "What's next?":
1. Check `/docs/backlog.md` first - source of truth for prioritized work
2. Check `/docs/backlog/` subdirectory for detailed task breakdowns
3. Break down high-level items into concrete tasks
4. Update status as work proceeds

## Troubleshooting

### Docker Services Won't Start
- Check `.env.docker` files exist in kuberag/ and kubegram-server/
- Ensure `NODE_AUTH_TOKEN` is set for private package access
- Run `make health-check` to identify unhealthy services
- Check logs: `make logs-kuberag` or `make logs-kubegram`

### Database Issues
- Run migrations: `make db-migrate`
- Reset database: `make db-reset`
- Check PostgreSQL: `docker-compose exec postgres pg_isready -U postgres`

### GraphQL Codegen
- Run `npm run codegen:common-ts` to regenerate types
- Ensure kuberag is running (schema is fetched from live server)
- Check `common-ts/codegen.yml` for configuration

### Redis Issues
- Flush cache: `make redis-flush`
- Check connectivity: `make redis-cli` then `PING`
- KubeRAG uses DB 0, server uses DB 1 - don't mix them
