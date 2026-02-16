## CLAUDE.md - Kubegram Operator

Kubernetes operator implementing the Model Context Protocol (MCP) to expose infrastructure management tools (bash, kubectl, ArgoCD) to AI clients via WebSocket, HTTP/SSE, or Stdio transports.

## Tech Stack

- **Language**: Go 1.24
- **MCP**: github.com/modelcontextprotocol/go-sdk v1.1.0
- **Kubernetes**: k8s.io/client-go, sigs.k8s.io/controller-runtime
- **WebSocket**: github.com/gorilla/websocket
- **Schema**: github.com/google/jsonschema-go
- **Testing**: github.com/stretchr/testify

## Project Structure

```
cmd/
└── manager/
    └── main.go                  # Entry point with CLI flags

pkg/
├── mcp/
│   ├── server.go                # MCP server - tool registration + handler setup
│   └── proxy.go                 # Remote MCP server proxy (Stdio + SSE)
├── tools/
│   ├── bash.go                  # Bash command execution tool
│   ├── kubectl.go               # Kubectl command execution tool
│   └── argocd.go                # ArgoCD MCP installer tool
└── transport/
    └── websocket.go             # WebSocket transport (exponential backoff retry)

k8s/
└── argocd/
    ├── install.yaml             # ArgoCD installation manifests
    └── application.yaml         # ArgoCD test application

charts/
└── kubegram-operator/
    ├── Chart.yaml               # Helm chart metadata
    ├── values.yaml              # Default configuration
    └── templates/
        ├── deployment.yaml
        ├── service.yaml
        ├── serviceaccount.yaml
        ├── clusterrole.yaml
        ├── clusterrolebinding.yaml
        ├── argocd-mcp-deployment.yaml
        └── k8s-mcp-deployment.yaml

tests/
├── integration/
│   ├── mcp_server_test.go       # MCP server + tool registration tests
│   ├── argocd_installer_test.go # ArgoCD installer tests
│   └── mcp_k8s_test.go          # K8s proxy tests
└── e2e/
    └── e2e_test.go              # Full operator workflow tests

scripts/
└── setup_argocd.sh              # ArgoCD setup with test app + token
```

## Make Targets

| Target | Purpose |
|--------|---------|
| `make build` | Build binary to `bin/manager` |
| `make run` | Run locally (Stdio transport) |
| `make run-http` | Run locally with HTTP/SSE on :8080 |
| `make fmt` | Run `go fmt` |
| `make vet` | Run `go vet` |
| `make test-e2e` | Run E2E tests (`go test ./tests/e2e/... -v`) |
| `make docker-build` | Build Docker image (`IMG=kubegram-operator:latest`) |
| `make docker-push` | Push Docker image |
| `make kind-load` | Load image into Kind cluster |
| `make minikube-load` | Load image into Minikube |
| `make helm-install` | Install/upgrade Helm chart |
| `make helm-uninstall` | Uninstall Helm chart |
| `make dev-up` | Build → Kind load → Helm install |
| `make dev-down` | Helm uninstall |
| `make minikube-dev-up` | Build → Minikube load → Helm install |
| `make restart` | Rebuild and reinstall (Minikube) |
| `make deploy-argocd` | Deploy ArgoCD for testing |
| `make deploy-debug` | Deploy with Delve debugger enabled |
| `make debug-connect` | Port-forward to pod (port 40000) |
| `make debug-connect-http` | Port-forward HTTP MCP (port 8080) |

## CLI Flags

```
-metrics-bind-address         Metrics endpoint (default: ":8080")
-health-probe-bind-address    Health probes (default: ":8081")
-leader-elect                 Enable leader election for HA
-argo-mcp-cmd                 Command to spawn Argo MCP server (Stdio)
-argo-mcp-url                 URL for remote Argo MCP server (SSE)
-k8s-mcp-cmd                  Command to spawn K8s MCP server (Stdio)
-k8s-mcp-url                  URL for remote K8s MCP server (SSE)
-mcp-http-addr                Address for HTTP/SSE MCP server
-llm-websocket-url            WebSocket URL for LLM connection
```

Environment: `LLM_HOST` fallback for `-llm-websocket-url` (defaults to `ws://localhost:8665`)

## Architecture

### MCP Tools (3 local)

- **bash** - Execute shell commands with JSON-validated input
- **kubectl** - Execute kubectl with argument array
- **install_argo_mcp** - Install ArgoCD MCP server from k8s/ manifests

### Proxy Pattern

Remote MCP servers are proxied as local tools:
- **Stdio Proxy**: Spawns external process, communicates via stdin/stdout
- **SSE Proxy**: Connects to HTTP endpoint via Server-Sent Events
- Tools discovered dynamically via `ListTools()`, forwarded via `CallTool()`

### Transport Modes

1. **WebSocket** - For remote LLM clients. Operator initiates outbound connection. Exponential backoff retry (1s → 30s).
2. **HTTP/SSE** - For local testing. GET `/sse` for events, POST `/sse` for RPC.
3. **Stdio** - For local dev / Claude Desktop. stdin/stdout.

### Data Flow

```
AI Client (Claude/LLM)
  ↔ WebSocket / HTTP / Stdio
    ↔ MCP Server (pkg/mcp/server.go)
      ├── Local Tools (bash, kubectl, argocd)
      └── Proxy Clients
          ├── Argo MCP Server (Stdio or SSE)
          └── K8s MCP Server (Stdio or SSE)
```

## Helm Chart Configuration

Key values in `charts/kubegram-operator/values.yaml`:

```yaml
replicaCount: 1
image:
  repository: kubegram-operator
  tag: latest
mcp:
  http:
    enabled: true
    port: 8080
  proxies:
    argo:
      enabled: true
      command: "npx -y @modelcontextprotocol/server-filesystem /projects"
    k8s:
      enabled: true
      command: "uvx kubernetes-mcp-server"
llm:
  websocketUrl: "ws://host.docker.internal:8665"
debug:
  enabled: false
  port: 40000
```

## Docker Image

Multi-stage build. Runtime image includes: bash, curl, kubectl, Node.js, npm (for Argo MCP), Python3, uv (for K8s MCP), Helm, ca-certificates.

## Health Checks

- Liveness: `:8081/healthz`
- Readiness: `:8081/readyz`
- Metrics: `:8080/metrics` (Prometheus)

## Conventions

- Go standard formatting (`go fmt`)
- Packages: lowercase, no underscores
- Tool definition pattern: `NewXxxTool()` returns `mcp.Tool`, `HandleXxxCommand()` handles calls
- JSON schema validation via `jsonschema-go` reflection
- Context-aware operations throughout

## Troubleshooting

- **WebSocket won't connect**: Check `LLM_HOST` or `-llm-websocket-url` flag
- **kubectl not found**: Ensure kubectl is in PATH (included in Docker image)
- **Proxy tools empty**: Verify Argo/K8s MCP server commands or URLs are correct
- **Debug not working**: Use `make deploy-debug` then `make debug-connect` (Delve port 40000)
