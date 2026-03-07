# @kubegram/kubegram-core

Core library for Kubegram - portable codegen, planning, MCP, and RAG functionality.

## Overview

Kubegram Core extracts the core business logic from Kuberag into a portable TypeScript library. It provides:

- 🚀 **Code Generation**: Transform infrastructure graphs into Kubernetes manifests
- 📋 **Infrastructure Planning**: AI-powered infrastructure planning
- 🔌 **MCP Integration**: Model Context Protocol server for Kubernetes operations
- 🧠 **RAG Context**: Retrieval-Augmented Generation for better LLM outputs
- 📡 **Event-Driven**: Built on `@kubegram/common-events` for orchestration

## Installation

```bash
npm install @kubegram/kubegram-core
```

For Redis support (optional):

```bash
npm install redis
```

## Quick Start

```typescript
import { KubegramCore } from '@kubegram/kubegram-core';

const core = new KubegramCore({
  dgraphHost: 'localhost',
  dgraphHttpPort: 8080,
  redisHost: 'localhost',
  llmProviders: {
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY }
  }
});

await core.initialize();

// Run code generation
const result = await core.codegen.initialize({
  userId: 'user-123',
  graphId: 'graph-456',
  graphData: { nodes: [...], edges: [...] },
  options: { provider: 'anthropic' }
});

console.log('Job ID:', result.jobId);
```

## Features

### Code Generation

Generate Kubernetes manifests from infrastructure graphs:

```typescript
const service = new CodegenService(core.eventBus, core.llmProvider);

const result = await service.initializeCodegen({
  userId: 'user-123',
  graphId: 'graph-456',
  graphData: graphInput,
  options: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet'
  }
});

// Subscribe to progress
core.eventBus.subscribe('codegen.progress', (event) => {
  console.log(`Progress: ${event.progress}% - ${event.message}`);
});
```

### Infrastructure Planning

AI-powered infrastructure planning:

```typescript
const planService = new PlanService(core.eventBus, core.llmProvider);

const result = await planService.initializePlan({
  userId: 'user-123',
  graphId: 'graph-456',
  planningType: 'cost-optimization'
});
```

### MCP Server

Start an MCP server for external integrations:

```typescript
const mcp = new MCPService(core);

await mcp.start({
  port: 3001,
  enableAuth: false
});
```

### Event-Driven Architecture

All operations emit domain events:

```typescript
import { EventBus } from '@kubegram/common-events';

const eventBus = new EventBus({ enableCache: true });

eventBus.subscribe('codegen.completed', async (event) => {
  console.log(`Job ${event.jobId} completed`);
  console.log('Manifests:', event.manifests);
});

eventBus.subscribe('codegen.failed', async (event) => {
  console.error(`Job ${event.jobId} failed:`, event.error);
});
```

## API Reference

### KubegramCore

Main class that initializes all services.

```typescript
interface KubegramCoreOptions {
  dgraphHost: string;
  dgraphHttpPort?: number;
  redisHost?: string;
  redisPort?: number;
  redisDb?: number;
  redisPassword?: string;
  llmProviders: LLMProviders;
  enableMcp?: boolean;
  mcpPort?: number;
  logLevel?: string;
}

class KubegramCore {
  eventBus: EventBus;
  codegen: CodegenService;
  plan: PlanService;
  mcp: MCPService;
  
  constructor(options: KubegramCoreOptions);
  async initialize(): Promise<void>;
  async shutdown(): Promise<void>;
}
```

### CodegenService

Handles code generation operations.

```typescript
class CodegenService {
  constructor(eventBus: EventBus, llmProvider: LLMProvider);
  
  async initializeCodegen(input: CodegenInput): Promise<CodegenResult>;
  async getJobStatus(jobId: string): Promise<JobStatus>;
  async cancelJob(jobId: string): Promise<void>;
}
```

### PlanService

Handles infrastructure planning operations.

```typescript
class PlanService {
  constructor(eventBus: EventBus, llmProvider: LLMProvider);
  
  async initializePlan(input: PlanInput): Promise<PlanResult>;
  async getPlanStatus(jobId: string): Promise<JobStatus>;
  async cancelPlan(jobId: string): Promise<void>;
}
```

### MCPService

Model Context Protocol server.

```typescript
class MCPService {
  constructor(core: KubegramCore);
  
  async start(options: MCPStartOptions): Promise<void>;
  async stop(): Promise<void>;
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DGRAPH_HOST` | Dgraph host | localhost |
| `DGRAPH_HTTP_PORT` | Dgraph HTTP port | 8080 |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `REDIS_DB` | Redis database | 0 |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `VOYAGE_API_KEY` | Voyage AI API key | - |
| `ENABLE_MCP` | Enable MCP server | false |
| `MCP_WS_PORT` | MCP WebSocket port | 3001 |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Kubegram Core                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Events    │  │   Services  │  │       Workflows         │ │
│  │ (common-    │←→│  Codegen    │←→│  CodegenWorkflow        │ │
│  │  events)    │  │  Plan       │  │  PlanWorkflow           │ │
│  └─────────────┘  │  Entity     │  └─────────────────────────┘ │
│                   └──────┬──────┘                              │
│                          ↓                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │     LLM    │  │    RAG      │  │         MCP            │ │
│  │  Providers │  │  Embeddings │  │  WebSocket Server      │ │
│  └─────────────┘  │  Context    │  └─────────────────────────┘ │
│                   └─────────────┘                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐                              │
│  │   Dgraph   │  │    Redis    │                              │
│  │ (Graph +   │  │ (Cache +    │                              │
│  │  Vector)   │  │  Pub/Sub)   │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

## Related Packages

- [@kubegram/common-ts](https://github.com/kubegram/kubegram/tree/main/common-ts) - GraphQL SDK
- [@kubegram/common-events](https://github.com/kubegram/kubegram/tree/main/common-events) - Event library

## License

BUSL-1.1 - see LICENSE file for details.
