# CLAUDE.md - Kubegram Core

Core library for Kubegram providing codegen, planning, MCP integration, and RAG functionality.

## Overview

Kubegram Core extracts the business logic from Kuberag into a portable library that can be used standalone or embedded in other applications. It provides:

- **Code Generation**: Transform infrastructure graphs into Kubernetes manifests
- **Infrastructure Planning**: AI-powered infrastructure planning
- **MCP Integration**: Model Context Protocol server for Kubernetes operations
- **RAG Context**: Retrieval-Augmented Generation for better LLM outputs

## Tech Stack

- **Runtime**: Bun (or Node.js)
- **TypeScript**: Strict mode
- **Events**: @kubegram/common-events for pub/sub and orchestration
- **LLM**: Vercel AI SDK (@ai-sdk/anthropic, @ai-sdk/openai, etc.)
- **Embeddings**: Voyage AI
- **Validation**: Zod
- **MCP**: WebSocket server (ws)

## Project Structure

```
src/
├── index.ts                     # Main exports
├── config.ts                    # Environment validation
├── events/
│   ├── codegen.ts              # Codegen domain events
│   └── plan.ts                 # Plan domain events
├── services/
│   ├── codegen-service.ts       # Code generation logic
│   ├── entity-service.ts        # Entity management
│   └── plan-service.ts         # Planning logic
├── workflows/
│   ├── base-workflow.ts         # Base workflow state machine
│   ├── codegen-workflow.ts      # 5-step codegen workflow
│   ├── plan-workflow.ts         # Planning workflow
│   └── types.ts                 # Workflow state types
├── mcp/
│   ├── index.ts                 # MCP exports
│   ├── service.ts               # MCP service orchestrator
│   ├── websocket-server.ts       # WS server
│   ├── tool-registry.ts         # Tool definitions
│   └── tools/                   # MCP tools
├── rag/
│   ├── embeddings.ts            # Embeddings provider
│   └── context.ts               # RAG context builder
├── llm/
│   └── providers.ts             # LLM provider factory
├── prompts/
│   ├── system.ts                # System prompt builder
│   ├── node-generators.ts       # Per-node prompts
│   └── parser.ts                # Output parser
├── db/
│   └── client.ts                # Dgraph client
├── state/
│   ├── redis.ts                 # Redis client
│   ├── cache.ts                 # Caching
│   ├── pubsub.ts                # Pub/sub
│   └── checkpointer.ts          # State persistence
└── types/
    ├── graph.ts                 # Graph types
    ├── codegen.ts               # Codegen types
    ├── enums.ts                 # Enums
    └── workflow.ts               # Workflow types
```

## Key Concepts

### Event-Driven Architecture

Kubegram Core uses `@kubegram/common-events` for all orchestration:

```typescript
import { EventBus, DomainEvent } from '@kubegram/common-events';

// Subscribe to events
eventBus.subscribe('codegen.progress', async (event) => {
  console.log(`Progress: ${event.progress}%`);
});

// Publish events
const event = new CodegenStartedEvent(jobId, userId, graphId, graphData);
await eventBus.publish(event);
```

### Workflows

Workflows manage long-running operations:

1. **CodegenWorkflow**: 5 steps (Get/Create Graph → Get Prompt → LLM Call → Build K8s Graph → Validate)
2. **PlanWorkflow**: Analyze graph, generate plan, validate

Workflows publish progress events and can be resumed from checkpoints.

### MCP Integration

MCP (Model Context Protocol) provides tools for external systems:

- **Codegen Tools**: generate_manifests, get_status, cancel, validate, get_results
- **Planning Tools**: create_plan, get_status, cancel, analyze, get_plan
- **Graph Tools**: query, get, create, update, delete, get_rag_context

Enable via `ENABLE_MCP=true` environment variable.

## Environment Variables

```
# Core
NODE_ENV=development
LOG_LEVEL=info

# Database (Dgraph)
DGRAPH_HOST=localhost
DGRAPH_HTTP_PORT=8080

# Redis (optional, for distributed mode)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# LLM Providers
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=
DEEPSEEK_API_KEY=
OLLAMA_BASE_URL=

# Embeddings
VOYAGE_API_KEY=

# MCP
ENABLE_MCP=true
MCP_WS_PORT=3001
MCP_LOG_LEVEL=info

# Auth
ENABLE_AUTH=false
OPENAUTH_ISSUER_URL=
```

## Usage

### Initialize Core

```typescript
import { KubegramCore } from '@kubegram/kubegram-core';

const core = new KubegramCore({
  dgraphHost: process.env.DGRAPH_HOST,
  redisHost: process.env.REDIS_HOST,
  llmProviders: {
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY }
  }
});

await core.initialize();
```

### Run Code Generation

```typescript
import { CodegenService } from '@kubegram/kubegram-core';

const service = new CodegenService(core.eventBus, core.llmProvider);

const result = await service.initializeCodegen({
  userId: 'user-123',
  graphId: 'graph-456',
  graphData: { nodes: [...], edges: [...] },
  options: { provider: 'anthropic', model: 'claude-3-5-sonnet' }
});

console.log(`Job started: ${result.jobId}`);
```

### Start MCP Server

```typescript
import { MCPService } from '@kubegram/kubegram-core';

const mcp = new MCPService(core);

await mcp.start(3001);
```

## Conventions

- Service files: `*-service.ts`
- Workflow files: `*-workflow.ts`
- Domain events: `events/*.ts`
- Types: `types/*.ts`
- All imports use `.js` extension (ES modules)
- Environment validation at startup with Zod

## Publishing

The library is published to GitHub Packages via GitHub Actions:

```bash
# Version bump
npm version patch

# Push to trigger release
git push && git push --tags
```

See `.github/workflows/kubegram-core-release.yml` for the release workflow.
