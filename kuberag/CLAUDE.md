## CLAUDE.md - KubeRAG

RAG engine for Kubernetes infrastructure graph management with LLM-powered manifest generation. Provides a GraphQL API and multi-provider LLM integration backed by Dgraph and Redis.

> **Note**: Core business logic (codegen, planning) has been extracted to [@kubegram/kubegram-core](https://github.com/kubegram/kubegram/tree/main/kubegram-core). See the Migration section below.

## Tech Stack

- **Runtime**: Bun
- **HTTP**: Hono.js
- **GraphQL**: GraphQL Yoga + Pothos schema builder
- **Graph DB**: Dgraph (graph storage + vector search)
- **Cache/State**: Redis (ioredis) - caching, pub/sub, checkpointing
- **LLM**: Vercel AI SDK - Claude (@ai-sdk/anthropic), OpenAI (@ai-sdk/openai), Gemini (@ai-sdk/google), DeepSeek, Ollama
- **Embeddings**: Voyage AI (primary), @xenova/transformers (local fallback)
- **Validation**: Zod
- **Logging**: Pino

## Project Structure

```
src/
├── index.ts                     # Hono app + GraphQL Yoga setup
├── config.ts                    # Environment validation (Zod)
├── graphql/
│   ├── schema.ts                # Pothos schema builder
│   ├── schema-types.ts          # TypeScript type definitions
│   ├── resolvers/
│   │   ├── queries.ts           # GraphQL query resolvers
│   │   └── mutations.ts         # GraphQL mutation resolvers
│   └── types/
│       ├── enums.ts             # GraphQL enums
│       ├── graph.ts             # Graph types
│       ├── codegen.ts           # Codegen types
│       ├── inputs.ts            # Input types
│       ├── plan.ts              # Plan types
│       ├── plan-inputs.ts       # Plan input types
│       └── resources.ts         # Resource types
├── services/
│   ├── codegen-service.ts      # Code generation (deprecated - use kubegram-core)
│   ├── entity-service.ts        # Entity management (Dgraph persistence)
│   └── plan-service.ts          # Planning (deprecated - use kubegram-core)
├── rag/
│   ├── embeddings.ts            # Voyage AI embeddings provider
│   └── context.ts              # RAG context builder
├── llm/
│   └── providers.ts            # LLM provider factory (singleton)
├── prompts/
│   ├── system.ts               # System prompt builder
│   ├── node-generators.ts      # Per-node prompt generation
│   └── parser.ts               # LLM output parser (YAML)
├── db/
│   ├── client.ts               # Dgraph HTTP client
│   └── schema.graphql          # Dgraph schema definition
├── state/
│   ├── redis.ts                # Redis client + connection
│   ├── cache.ts                # Caching utilities
│   ├── pubsub.ts               # Pub/sub for workflow updates
│   └── checkpointer.ts         # Redis-backed workflow state
├── auth/
│   └── client.ts               # OpenAuth client (token verification)
├── middleware/
│   └── auth.ts                # Bearer token auth middleware
├── types/
│   ├── graph.ts                # Graph domain types
│   ├── codegen.ts              # Codegen types
│   ├── enums.ts                # Enums (ModelProvider, GraphType, etc.)
│   ├── workflow.ts             # Workflow context types
│   └── ambient.d.ts            # Ambient type declarations
├── utils/
│   └── codegen.ts             # Codegen utilities
└── mcp/                        # MCP tools (deprecated - moved to kubegram-core)
    ├── index.ts
    ├── service.ts
    ├── workflow.ts
    ├── websocket-server.ts
    ├── websocket-handler.ts
    ├── connection-registry.ts
    ├── tool-registry.ts
    ├── checkpointer.ts
    ├── types.ts
    └── tools/
        ├── codegen.ts
        ├── planning.ts
        └── graphs.ts

scripts/
└── load-schema.ts              # Load Dgraph schema on startup

tests/
├── unit/                       # Unit tests
├── integration/                # Integration tests
└── e2e/                       # End-to-end tests
```

## Migration to kubegram-core

Core business logic has been extracted to [@kubegram/kubegram-core](https://github.com/kubegram/kubegram/tree/main/kubegram-core):

| Component | Status | Location |
|-----------|--------|----------|
| Codegen Service | Deprecated | Use `kubegram-core` |
| Plan Service | Deprecated | Use `kubegram-core` |
| Workflows | Deprecated | Use `kubegram-core` |
| MCP Server | Deprecated | Use `kubegram-core` |
| Entity Service | ✅ Kept | kuberag |
| GraphQL API | ✅ Kept | kuberag |
| Dgraph Client | ✅ Kept | kuberag |
| RAG/Embeddings | ✅ Kept | kuberag |

### Using kubegram-core

```typescript
import { CodegenService, PlanService, MCPService } from '@kubegram/kubegram-core';
```

## Key Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server with hot reload |
| `bun run dev:debug` | Debug mode (port 9229) |
| `bun run start` | Production server |
| `bun run build` | Build to dist/ |
| `bun test` | Run tests |
| `bun test --watch` | Watch mode |
| `bun test --coverage` | Coverage report |
| `bun run lint` | ESLint |
| `bun run lint:fix` | Fix lint issues |
| `bun run typecheck` | Type check (`tsc --noEmit`) |
| `bun run load-schema` | Load Dgraph schema |
| `bun run dc:up` | Docker compose up |
| `bun run dc:down` | Docker compose down |
| `bun run dc:rebuild` | Rebuild Docker images |

## Environment Variables

```
PORT=3000                          # HTTP server port (default: 3000)
NODE_ENV=development               # Environment
ENABLE_CORS=true                  # CORS (default: true)
LOG_LEVEL=info                    # Pino log level

DGRAPH_HOST=localhost              # Dgraph host
DGRAPH_HTTP_PORT=8080             # Dgraph HTTP port

REDIS_HOST=localhost              # Redis host
REDIS_PORT=6379                  # Redis port
REDIS_PASSWORD=                  # Redis password (optional)
REDIS_DB=0                       # Redis database (DB 0)

ANTHROPIC_API_KEY=               # Claude (required for default provider)
OPENAI_API_KEY=                  # OpenAI (optional)
GOOGLE_API_KEY=                  # Gemini (optional)
DEEPSEEK_API_KEY=                # DeepSeek (optional)
OLLAMA_BASE_URL=                  # Ollama URL (default: http://localhost:11434)
VOYAGE_API_KEY=                  # Voyage AI embeddings

ENABLE_AUTH=false                 # Enable Bearer token auth
OPENAUTH_ISSUER_URL=             # OpenAuth issuer URL
```

## Architecture

### GraphQL API

Schema built with Pothos (`src/graphql/schema.ts`):
- Custom scalars: JSON, DateTime, YAML, ID
- Types registered in order: enums → types → inputs → mutations
- Resolvers in `src/graphql/resolvers/`

Key operations:
- `generateCodegen` / `getCodgenStatus` / `cancelCodegen`
- `createPlan` / `getPlanStatus` / `cancelPlan`
- Graph CRUD queries and mutations

### Entity Service (Dgraph Persistence)

File: `src/services/entity-service.ts`

Manages:
- Graph CRUD operations
- Node creation/update/delete
- Dgraph schema management

### LLM Provider Factory

File: `src/llm/providers.ts`

Singleton pattern supporting Claude, OpenAI, Gemini, DeepSeek, Ollama. Uses Vercel AI SDK (`ai` package) for unified interface.

### RAG / Embeddings

- `src/rag/embeddings.ts` - Voyage AI with `voyage-code-2` model (1024 dimensions)
- `src/rag/context.ts` - Builds RAG context from Dgraph vector search results
- Embeddings cached in Redis after first computation

### State Management

All Redis-backed:
- **Cache**: LRU caching for codegen results
- **PubSub**: Real-time workflow status updates
- **Checkpointer**: Persistent workflow state for recovery

## Conventions

- Service files: `*-service.ts`
- Workflow files: `*-workflow.ts`
- GraphQL mutations: camelCase (`generateCodegen`, `createPlan`)
- Enum values: SCREAMING_SNAKE_CASE
- Input types: `*Input` suffix
- All imports use `.js` extension (ES modules)
- Environment validation at startup with Zod
- Service → Workflow → Infrastructure dependency direction

## Documentation

- [MCP_INTEGRATION.md](MCP_INTEGRATION.md) - WebSocket protocol details (deprecated - see kubegram-core)
- [README.md](README.md) - Project overview
- [jobstatus-sync-plan.md](jobstatus-sync-plan.md) - Job status sync design
- [kubegram-core/docs/](kubegram-core/docs/) - Core library documentation

## Troubleshooting

- **Schema not loaded**: Run `bun run load-schema` before starting
- **Redis connection refused**: Ensure Redis is running (`docker compose up redis`)
- **LLM API key missing**: Check `ANTHROPIC_API_KEY` or other provider env vars
- **Dgraph errors**: Check Dgraph is healthy at `http://localhost:8080/health`
