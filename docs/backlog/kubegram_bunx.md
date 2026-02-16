## Kubegram Bunx

### Problem Statement

Presently to run Kubegram on the cloud, locally or anywhere one needs either to run on Docker or Kubernetes which might introduce a challenge to users who are just exploring the product. To fix this we have to create a version of Kubegram that runs as a bundle on bunx/npx on any machine so that users get to try it.

### Current Architecture



### Proposed Solution

Create a Bun/Hono server that runs a Bunx executable that is composed of the following structure:
```
kubegram-bunx
src/
├── index.ts                     # Hono app + MCP setup
├── config.ts                    # Environment validation (Zod)
├── services/
│   ├── codegen-service.ts       # Code generation business logic
│   ├── entity-service.ts        # Entity management
│   └── plan-service.ts          # Planning service
├── workflows/
│   ├── base-workflow.ts         # Base workflow state machine
│   ├── codegen-workflow.ts      # 5-step codegen workflow
│   ├── plan-workflow.ts         # Planning workflow
│   └── types.ts                 # Workflow state types
├── mcp/
│   ├── index.ts                 # MCP exports
│   ├── service.ts               # MCP service orchestrator
│   ├── workflow.ts              # MCP workflow state machine
│   ├── websocket-server.ts      # Standalone WS server (port 3001)
│   ├── websocket-handler.ts     # WS message handler
│   ├── connection-registry.ts   # Connection management
│   ├── tool-registry.ts         # Tool definitions + routing
│   ├── checkpointer.ts          # MCP state checkpointing
│   ├── types.ts                 # JSON-RPC 2.0 types
│   └── tools/
│       ├── codegen.ts           # 5 codegen tools
│       ├── planning.ts          # 5 planning tools
│       └── graphs.ts            # 6 graph management tools
├── rag/
│   ├── embeddings.ts            # Voyage AI embeddings provider
│   └── context.ts               # RAG context builder
├── llm/
│   └── providers.ts             # LLM provider factory (singleton)
├── prompts/
│   ├── system.ts                # System prompt builder
│   ├── node-generators.ts       # Per-node prompt generation
│   └── parser.ts                # LLM output parser (YAML)
├── db/
│   ├── client.ts                # Dgraph HTTP client
│   └── schema.graphql           # Dgraph schema definition
├── state/
│   ├── redis.ts                 # Redis client + connection
│   ├── cache.ts                 # Caching utilities
│   ├── pubsub.ts                # Pub/sub for workflow updates
│   └── checkpointer.ts          # Redis-backed workflow state
├── auth/
│   └── client.ts                # OpenAuth client (token verification)
├── middleware/
│   └── auth.ts                  # Bearer token auth middleware
├── types/
│   ├── graph.ts                 # Graph domain types
│   ├── codegen.ts               # Codegen types
│   ├── enums.ts                 # Enums (ModelProvider, GraphType, etc.)
│   ├── workflow.ts              # Workflow context types
│   └── ambient.d.ts             # Ambient type declarations
└── utils/
    └── codegen.ts               # Codegen utilities

scripts/
└── load-schema.ts               # Load Dgraph schema on startup

tests/
├── unit/                        # Unit tests
├── integration/                 # Integration tests
└── e2e/                         # End-to-end tests
```

### Sucees Criteria