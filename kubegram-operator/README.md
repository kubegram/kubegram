# kubegram-operator

A Kubernetes operator that implements the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) to expose infrastructure management tools to AI clients. It connects AI systems (like Claude) directly to your cluster — enabling them to run `kubectl`, execute shell commands, and interact with ArgoCD through a standardized protocol.

## Overview

The operator acts as an MCP server inside your cluster. AI clients connect via WebSocket, HTTP/SSE, or Stdio and gain access to:

- **Local tools**: `bash`, `kubectl`, `install_argo_mcp`
- **Proxied tools**: dynamically discovered from external MCP servers (ArgoCD, Kubernetes MCP)

```
AI Client (Claude / LLM)
  ↔ WebSocket / HTTP+SSE / Stdio
    ↔ MCP Server
      ├── bash, kubectl, install_argo_mcp  (local)
      └── Proxy clients
          ├── Argo MCP Server  (Stdio or SSE)
          └── K8s MCP Server   (Stdio or SSE)
```

## Prerequisites

- Go 1.24+
- Docker
- Kubernetes cluster (Kind or Minikube for local dev)
- Helm 3
- `kubectl` in PATH

## Quick Start

### Local Development (Stdio)

```bash
cd kubegram-operator
make run
```

### Local Development (HTTP/SSE)

```bash
make run-http
# MCP endpoint: http://localhost:8080/sse
```

### Deploy to Kind

```bash
make dev-up       # build → load into Kind → helm install
make dev-down     # helm uninstall
```

### Deploy to Minikube

```bash
make minikube-dev-up   # build → load into Minikube → helm install
make restart           # rebuild + reinstall
```

## Installation via Helm

```bash
helm upgrade --install kubegram-operator ./charts/kubegram-operator \
  --namespace default \
  --set image.repository=ghcr.io/kubegram/kubegram-operator \
  --set image.tag=latest \
  --set llm.websocketUrl="ws://<your-llm-host>:8665"
```

### Key Helm Values

| Value | Default | Description |
|-------|---------|-------------|
| `image.repository` | `ghcr.io/kubegram/kubegram-operator` | Container image |
| `image.tag` | chart appVersion | Image tag |
| `mcp.http.enabled` | `true` | Enable HTTP/SSE transport on port 8080 |
| `mcp.proxies.argo.enabled` | `true` | Enable ArgoCD MCP proxy |
| `mcp.proxies.argo.command` | `npx -y @modelcontextprotocol/server-filesystem /projects` | Argo MCP spawn command |
| `mcp.proxies.k8s.enabled` | `true` | Enable Kubernetes MCP proxy |
| `mcp.proxies.k8s.command` | `uvx kubernetes-mcp-server` | K8s MCP spawn command |
| `llm.websocketUrl` | `ws://host.docker.internal:8665` | LLM WebSocket endpoint |
| `argoMcpServer.enabled` | `true` | Deploy embedded ArgoCD MCP sidecar |
| `k8sMcpServer.enabled` | `true` | Deploy embedded K8s MCP sidecar |
| `debug.enabled` | `false` | Enable Delve debugger on port 40000 |
| `kubegram.serverUrl` | `http://kubegram-server:8090` | Kubegram server URL |
| `kubegram.serverToken` | `""` | Auth token for Kubegram server |

## CLI Flags

```
-mcp-http-addr             Address for HTTP/SSE MCP server (e.g. ":8080")
-llm-websocket-url         WebSocket URL for LLM connection (env: LLM_HOST, default: ws://localhost:8665)
-argo-mcp-cmd              Command to spawn Argo MCP server (Stdio mode)
-argo-mcp-url              URL for remote Argo MCP server (SSE mode)
-k8s-mcp-cmd               Command to spawn K8s MCP server (Stdio mode)
-k8s-mcp-url               URL for remote K8s MCP server (SSE mode)
-metrics-bind-address      Metrics endpoint (default: ":8080")
-health-probe-bind-address Health probes (default: ":8081")
-leader-elect              Enable leader election for HA
```

## Transport Modes

| Mode | Use Case | How |
|------|----------|-----|
| **WebSocket** | Production / remote LLM | Operator dials out; exponential backoff retry (1s → 30s) |
| **HTTP/SSE** | Local testing | `GET /sse` for events, `POST /sse` for RPC |
| **Stdio** | Claude Desktop / local dev | stdin/stdout |

## MCP Tools

### Local Tools

| Tool | Description |
|------|-------------|
| `bash` | Execute shell commands with JSON-validated input |
| `kubectl` | Run kubectl with an argument array |
| `install_argo_mcp` | Apply ArgoCD MCP manifests from `k8s/argocd/` |

### Proxied Tools

Tools are discovered dynamically via `ListTools()` from external MCP servers and forwarded transparently. The proxy supports both Stdio (spawned process) and SSE (HTTP endpoint) backends.

## Project Structure

```
cmd/manager/main.go          # Entry point + CLI flags
pkg/
├── mcp/
│   ├── server.go            # Tool registration + handler setup
│   └── proxy.go             # Remote MCP proxy (Stdio + SSE)
├── tools/
│   ├── bash.go
│   ├── kubectl.go
│   └── argocd.go
└── transport/
    └── websocket.go         # WebSocket transport with backoff retry
charts/kubegram-operator/    # Helm chart
k8s/argocd/                  # ArgoCD install + test application manifests
tests/
├── integration/             # MCP server, ArgoCD installer, K8s proxy tests
└── e2e/                     # Full operator workflow tests
scripts/
└── setup_argocd.sh          # ArgoCD setup with test app + token
```

## Make Targets

```bash
make build              # Build binary to bin/manager
make run                # Run locally (Stdio)
make run-http           # Run locally with HTTP/SSE on :8080
make fmt                # go fmt
make vet                # go vet
make test-unit          # Unit + integration tests (no cluster required)
make test-e2e           # E2E tests against Minikube
make ci                 # Full CI: helm validation + unit tests
make validate-helm      # Helm lint + template + dry-run
make docker-build       # Build Docker image (IMG=kubegram-operator:latest)
make docker-push        # Push Docker image
make kind-load          # Load image into Kind
make minikube-load      # Load image into Minikube
make helm-install       # Install/upgrade Helm chart
make helm-uninstall     # Uninstall Helm chart
make dev-up             # build → Kind load → helm install
make dev-down           # helm uninstall
make minikube-dev-up    # build → Minikube load → helm install
make restart            # rebuild + reinstall (Minikube)
make deploy-argocd      # Deploy ArgoCD for testing
make deploy-debug       # Deploy with Delve debugger
make debug-connect      # Port-forward to Delve (port 40000)
make debug-connect-http # Port-forward HTTP MCP (port 8080)
```

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `:8081/healthz` | Liveness probe |
| `:8081/readyz` | Readiness probe |
| `:8080/metrics` | Prometheus metrics |

## Debugging

```bash
make deploy-debug       # Deploy with Delve enabled
make debug-connect      # kubectl port-forward to port 40000
# Then attach your IDE or dlv connect localhost:40000
```

## Testing

```bash
# Unit + integration tests (no cluster needed)
make test-unit

# E2E tests (requires Minikube running)
make test-e2e

# Full CI pipeline
make ci
```

## Docker Image

Multi-stage build. The runtime image includes: `bash`, `curl`, `kubectl`, Node.js + npm (for Argo MCP), Python3 + uv (for K8s MCP), Helm, and CA certificates.

```bash
make docker-build IMG=ghcr.io/kubegram/kubegram-operator:v0.1.0
make docker-push  IMG=ghcr.io/kubegram/kubegram-operator:v0.1.0
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| WebSocket won't connect | Check `LLM_HOST` env or `-llm-websocket-url` flag |
| `kubectl` not found | Ensure kubectl is in PATH (included in Docker image) |
| Proxy tools list is empty | Verify Argo/K8s MCP server command or URL is correct |
| Debug not attaching | Run `make deploy-debug` first, then `make debug-connect` |

## Related

- [KUBEGRAM_OPERATOR.md](../docs/KUBEGRAM_OPERATOR.md) — Component overview
- [Helm chart values](charts/kubegram-operator/values.yaml)
- [MCP Go SDK](https://github.com/modelcontextprotocol/go-sdk)
