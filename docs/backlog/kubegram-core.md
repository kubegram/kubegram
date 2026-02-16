## Kubegram Core

Kubegram Core is a library that wraps the Kubegram entire functionality so that it becomes portable between the different kids of deployments.

### Problem Statement

Running Kubegram requires a lot of setup because of the microservice structure wich introduces a level complexity.

### Current State

This is the flow of the architecture:

- [architecture-reference.md](../architecture-reference.md)
- [kuberag](../../kuberag/CLAUDE.md)
- [MCP Integration](../../kuberag/MCP_INTEGRATION.md)

### Proposed Solution

Extract the Kuberag functionality into the package [kubegram-core](../../kubegram-core/) and use the [events](../../common-events/README.md) to manage the codge generation and planning events, and caching using both in memory caching and events and pubsub/distribured events (using redis). The library should have all of the function in the [common-ts](../../common-ts/) without the graphql part.

### Library Publishing

The library should be published the same way the events [worfk library is being publishedlow](../../.github/workflows/common-events-release.yml)

## Implementation Plan

### Architecture

```
kubegram-server → kuberag (GraphQL) → kubegram-core (services)
```

- **kuberag**: GraphQL API + Entity Service (Dgraph persistence) + Ingestion
- **kubegram-core**: Codegen + Planning + MCP (lazy-loaded)

### What Goes Where

| Component | Location |
|-----------|----------|
| GraphQL API (schema, resolvers) | kuberag |
| Entity Service (Dgraph) | kuberag |
| Codegen Service | kubegram-core |
| Plan Service | kubegram-core |
| MCP Server | kubegram-core (lazy on WebSocket connect) |
| LLM/RAG | kubegram-core |
| Events | @kubegram/common-events |

### Phase 1: Setup & Structure
- [x] Create kubegram-core package structure
- [x] Add to npm workspaces
- [x] Create GitHub Actions workflow for publishing
- [x] Define domain events for codegen/plan

### Phase 2: Copy from kuberag ✅
Copy and adapt these modules to kubegram-core:

1. **Types** - `types/graph.ts`, `types/codegen.ts`, `types/enums.ts`, `types/workflow.ts`
2. **Services** - `services/codegen-service.ts`, `services/plan-service.ts`
3. **Workflows** - `workflows/types.ts`, `workflows/codegen-workflow.ts`, `workflows/plan-workflow.ts`
4. **State** - Adapt `state/redis.ts`, `state/cache.ts`, `state/pubsub.ts` to use @kubegram/common-events
5. **LLM/RAG** - `llm/providers.ts`, `rag/embeddings.ts`, `rag/context.ts`, `prompts/*`
6. **MCP** - `mcp/*` (configure lazy-loading)

### Phase 3: Update kuberag
- [x] Add kubegram-core as dependency
- [x] Update imports to use kubegram-core for codegen/plan
- [x] Add deprecation notices to copied code
- [x] Keep: GraphQL layer, entity-service, Dgraph client

### Phase 4: MCP Lazy Loading ✅
- MCP server starts only when first WebSocket connects
- No `ENABLE_MCP` env var - connection-driven

### Phase 5: Publish & Deprecate
- [ ] Publish kubegram-core to GitHub Packages
- [ ] Add @deprecated comments in kuberag
- [ ] Update kuberag CLAUDE.md