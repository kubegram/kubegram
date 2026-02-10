# Kubegram

**The Agentic Orchestration Layer for Kubernetes**

Kubegram is an open source Platform-as-a-Service (PaaS) that transforms static Kubernetes management into an autonomous, agentic ecosystem. By leveraging Large Language Models (LLMs) and Retrieval-Augmented Generation (RAG), Kubegram bridges the gap between abstract architectural intent and production-ready GitOps execution.

## What Kubegram Does

**Vision-to-Infrastructure** -- Upload whiteboard sketches or abstract architecture graphs. Kubegram's RAG system analyzes them against best-practice patterns to generate production-ready Kubernetes manifests, complete with cost estimates and resource projections.

**Agentic Cluster Management** -- A custom Kubernetes Operator establishes a persistent WebSocket connection using Model Context Protocol (MCP), turning your cluster into a live context source. The LLM can query cluster state, logs, and events -- and issue operations through the MCP bridge for real-time troubleshooting.

**GitOps Orchestration** -- Every configuration is committed to version control before deployment. Kubegram orchestrates ArgoCD and FluxCD with automated RBAC auditing, vulnerability scanning, and intelligent rollbacks when health checks fail.

## Architecture

```
                    ┌──────────────┐
                    │  Kubegram UI │
                    │   (React)    │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────┴────────┐     ┌─────────┴────────┐
     │ Kubegram Server │     │     KubeRAG       │
     │  (Bun + Hono)   │────>│ (Bun + GraphQL)   │
     │  Auth, CRUD,    │     │ LLM Workflows,    │
     │  REST API       │     │ RAG, Code Gen     │
     └────────┬────────┘     └─────────┬─────────┘
              │                        │
     ┌────────┴────────┐     ┌─────────┴─────────┐
     │   PostgreSQL    │     │      Dgraph        │
     └─────────────────┘     │  (Graph + Vector)  │
                             └───────────────────-┘
              └──────────┬───────────┘
                  ┌──────┴──────┐
                  │    Redis    │
                  │ Cache + Pub/Sub │
                  └─────────────┘
```

## Repository Structure

```
kubegram/
├── kubegram-ui/        # React frontend
├── kubegram-server/    # API server (auth, CRUD, REST)
├── kuberag/            # GraphQL + LLM workflows + RAG engine
├── common-ts/          # Shared TypeScript SDK (@kubegram/common-ts)
├── k8s/                # Kubernetes deployment manifests
├── docs/               # Documentation
├── docker-compose.yml  # Local development stack
└── Makefile            # Development commands
```

| Package | Purpose | Tech |
|---------|---------|------|
| **kubegram-ui** | Frontend application | React, TypeScript, Vite |
| **kubegram-server** | Authentication, user management, REST API | Bun, Hono, Drizzle, PostgreSQL |
| **kuberag** | Infrastructure graph management, LLM code generation, RAG | Bun, GraphQL Yoga, Dgraph, Vercel AI SDK |
| **common-ts** | Shared GraphQL types, SDK client, utilities | TypeScript, GraphQL Codegen |

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Make (optional)

### Run Locally
```bash
# Start all services
make up

# Verify health
make health-check
```

| Service | URL |
|---------|-----|
| Kubegram UI | http://localhost:5173 |
| Kubegram Server | http://localhost:8090 |
| KubeRAG GraphQL | http://localhost:8665/graphql |

See [docs/usage.md](docs/usage.md) for full configuration, environment variables, and management commands.

## Key Capabilities

- **Visual-to-Code Synthesis** -- Abstract graphs and sketches become Kubernetes manifests via RAG-powered analysis
- **Multi-Provider LLM Support** -- Claude, OpenAI, Gemini, DeepSeek, and Ollama through a unified interface
- **Provider Agnostic** -- EKS, GKE, AKS, DigitalOcean, on-premise -- any Kubernetes distribution
- **MCP-Powered Operator** -- Stateful WebSocket bridge turns clusters into live LLM context sources
- **Enterprise Auth** -- SAML, OAuth (GitHub, Google), with agentic RBAC mapping
- **Predictive Scaling** -- Traffic pattern analysis via MCP for HPA/VPA configuration
- **Self-Healing** -- Automated detection and remediation of crash loops and resource contention

## Documentation

- [Docker Setup & Usage](docs/usage.md)
- [KubeRAG](kuberag/README.md)
- [Kubegram Server](kubegram-server/README.md)
- [Kubegram Server API Docs](kubegram-server/docs/api_docs.md)
- [Authentication Setup](kubegram-server/docs/OPENAUTH_SETUP.md)
- [common-ts SDK](common-ts/README.md)

## License

[Business Source License 1.1](LICENSE) -- Converts to GPL-3.0-or-later on 2030-02-10.
