## CLAUDE.md

This file provides guidance to Claude Code when working with code in this directory.

## Project Overview

`kubegram-cli` is the standalone Go CLI binary for the Kubegram platform. It gives users a single entrypoint to start the local development stack, load architecture designs, and deploy the Kubegram operator onto Kubernetes clusters — without requiring a host `helm` binary or manually orchestrating Docker Compose services.

It lives at `kubegram-cli/` as an independent Go module inside the monorepo, consistent with `kubegram-operator/` (also a standalone Go module, not an NPM workspace).

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Go 1.24 |
| CLI framework | [Cobra](https://github.com/spf13/cobra) v1.9.1 |
| Configuration | [Viper](https://github.com/spf13/viper) v1.20.0 |
| Helm integration | `helm.sh/helm/v3` v3.17.0 (Go SDK — no host binary needed) |
| Kubernetes client | `k8s.io/client-go` v0.34.1 |
| Terminal colour | `fatih/color` v1.18.0 |

## Project Structure

```
kubegram-cli/
├── cmd/
│   └── kubegram/
│       └── main.go               # Entry point — calls cli.Execute()
├── internal/
│   ├── cli/                      # Cobra command definitions (thin wrappers)
│   │   ├── root.go               # Root command, Viper init, command registration
│   │   ├── version.go            # kubegram version
│   │   ├── start.go              # kubegram start
│   │   ├── load.go               # kubegram load <file>
│   │   ├── cluster.go            # kubegram cluster install/uninstall
│   │   ├── operator.go           # kubegram operator install
│   │   └── mcp.go                # kubegram mcp start/stop/status (local process + cluster port-forward)
│   ├── config/
│   │   └── config.go             # Config struct + Viper SetDefaults / Load
│   ├── compose/
│   │   └── compose.go            # docker compose wrapper: Up, Down, CheckDaemon
│   ├── health/
│   │   └── health.go             # HTTP health polling with exponential backoff
│   ├── k8s/
│   │   └── context.go            # Kubeconfig helpers: GetRestConfig, CurrentContext
│   ├── helm/
│   │   └── helm.go               # Helm SDK wrapper: Install, Uninstall, FindChartPath
│   ├── operator/
│   │   └── install.go            # operator install business logic
│   └── cluster/
│       ├── install.go            # cluster install business logic
│       └── uninstall.go          # cluster uninstall business logic
├── Makefile
├── Dockerfile                    # Multi-stage build (golang:1.24 → debian:bookworm-slim)
└── go.mod
```

## Key Commands

### Makefile (run inside `kubegram-cli/`)

| Target | What it does |
|---|---|
| `make build` | `go fmt + vet`, then builds `bin/kubegram` with version ldflags |
| `make install` | Builds, then copies binary to `$(GOPATH)/bin/kubegram` |
| `make test` | `go test ./... -v` |
| `make cross-build` | Builds for darwin-arm64, darwin-amd64, linux-amd64, linux-arm64, windows-amd64 |
| `make package` | Runs `cross-build`, then tarballs each binary into `dist/` |
| `make docker-build` | Builds multi-stage Docker image tagged `kubegram-cli:<VERSION>` |
| `make clean` | Removes `bin/` and `dist/` |

### Makefile (run from the repo root)

| Target | What it does |
|---|---|
| `make build-cli` | Delegates to `kubegram-cli/Makefile build` |
| `make release-cli` | Delegates to `kubegram-cli/Makefile cross-build package` |

## CLI Commands Reference

### Global flags (all commands)

```
--config string      path to kubegram.yaml (default: ./kubegram.yaml)
--log-level string   debug | info | warn | error (default: info)
```

### `kubegram version`
Prints version, commit hash, build date, and Go version. Values are injected at link time via `-ldflags`.

### `kubegram start`
Starts all Kubegram services locally using Docker Compose.

```
--port int              override kubegram-server port (default: 8090 from config)
--compose-file string   explicit path to docker-compose.yml (auto-detected if not set)
```

Services started: kubegram-server (8090), kuberag (8665), PostgreSQL (5433), Redis (6379), Dgraph (8080).

### `kubegram load <design.json>`
Reads a JSON design file and POSTs it to the running server's graph CRUD API.

```
--api-url string    server base URL (default: http://localhost:<port>)
--api-token string  Bearer auth token (or env: KUBEGRAM_AUTH_API_TOKEN)
```

### `kubegram cluster install` / `kubegram operator install`
Deploy the Kubegram operator Helm chart. `cluster install` is the primary command; `operator install` is a scoped alias.

```
--namespace string      target namespace (default: default)
--context string        kubectl context (default: current context)
--image-tag string      operator image tag (default: latest)
--chart-path string     Helm chart directory (auto-detected if not set)
--set strings           Helm values — repeatable (--set key=value)
-f, --values strings    Helm values files — repeatable
```

### `kubegram cluster uninstall`

```
--namespace string      namespace of the release (default: default)
--context string        kubectl context (default: current context)
--release-name string   Helm release name (default: kubegram-operator)
```

### `kubegram mcp start|stop|status`
Manage the Kubegram MCP server (backed by the `kubegram-operator` binary).

```
--mode string       local (default) or cluster
--port int          local port (default: 8080)
--token string      bearer token — falls back to mcp.token config or KUBEGRAM_SERVER_TOKEN env
--namespace string  Kubernetes namespace for cluster mode (default: default)
```

**Local mode** — finds `kubegram-operator` (or `manager`) in PATH or `~/.kubegram/bin/`, spawns it with `--mcp-http-addr :<port>`, and writes the PID to `~/.kubegram/mcp.pid`. The `KUBEGRAM_SERVER_TOKEN` and `KUBEGRAM_SERVER_URL` env vars are forwarded to the operator process.

**Cluster mode** — verifies the operator deployment exists in the target namespace, then runs `kubectl port-forward` to expose it locally on `--port`. Requires a valid kubeconfig and `kubectl` in PATH.

`kubegram mcp status` — prints running PID, URL (`http://localhost:<port>/mcp`), and whether a bearer token is configured.

`kubegram mcp stop` — sends SIGTERM to the process and removes `~/.kubegram/mcp.pid`. Cleans up stale PID files automatically.

## Configuration (`kubegram.yaml`)

```yaml
server:
  port: 8090
  logLevel: info

compose:
  file: ""              # auto-detected by walking up from CWD

operator:
  chartPath: ""         # auto-detected by walking up from CWD
  namespace: default
  values: {}

llm:
  anthropicToken: ""    # env: KUBEGRAM_LLM_ANTHROPICTOKEN
  openAIToken: ""       # env: KUBEGRAM_LLM_OPENAITOKEN
  googleToken: ""       # env: KUBEGRAM_LLM_GOOGLETOKEN
  deepSeekToken: ""     # env: KUBEGRAM_LLM_DEEPSEEKTOKEN

auth:
  adminUsername: ""     # env: KUBEGRAM_AUTH_ADMINUSERNAME
  adminPassword: ""     # env: KUBEGRAM_AUTH_ADMINPASSWORD

mcp:
  port: 8080            # local MCP server port (env: KUBEGRAM_MCP_PORT)
  mode: local           # local or cluster (env: KUBEGRAM_MCP_MODE)
  token: ""             # bearer token (env: KUBEGRAM_MCP_TOKEN or KUBEGRAM_SERVER_TOKEN)
```

Viper applies the `KUBEGRAM_` prefix to all env overrides, replacing `.` with `_` (e.g. `KUBEGRAM_SERVER_PORT` overrides `server.port`).

## Architecture

### Walk-up heuristics
Both `compose.FindComposeFile()` and `helm.FindChartPath()` walk up from `os.Getwd()` to the filesystem root — the same heuristic `git` uses to find `.git`. This means the binary works correctly from any subdirectory inside the monorepo without hardcoding paths.

- `docker-compose.yml` → found by `compose.FindComposeFile()`
- `kubegram-operator/charts/kubegram-operator/Chart.yaml` → parent dir returned by `helm.FindChartPath()`

### Helm SDK (no binary required)
`internal/helm/helm.go` uses `helm.sh/helm/v3/pkg/action` directly:
- `action.NewUpgrade(cfg)` with `Install: true` implements `helm upgrade --install`
- `action.NewUninstall(cfg)` implements `helm uninstall`
- Namespace creation uses `ensureNamespace()` via `k8s.io/client-go` (because `action.Upgrade` does not expose `CreateNamespace`)

### Health polling
`internal/health.WaitForServices()` polls HTTP health endpoints with exponential backoff:
- Initial interval: 2s → cap: 30s, deadline: 5 minutes (context-scoped)
- kubegram-server: `GET http://localhost:<port>/api/public/v1/healthz/live`
- kuberag: `GET http://localhost:8665/health`

### Version injection
`Version`, `Commit`, and `BuildDate` are package-level `var` declarations in `internal/cli/version.go`, overridden at link time:
```makefile
-X github.com/kubegram/kubegram-cli/internal/cli.Version=$(VERSION)
-X github.com/kubegram/kubegram-cli/internal/cli.Commit=$(GIT_COMMIT)
-X github.com/kubegram/kubegram-cli/internal/cli.BuildDate=$(BUILD_DATE)
```

### Command / business-logic split
- `internal/cli/` — Cobra command definitions only (flag parsing, user output, delegation)
- `internal/cluster/`, `internal/operator/` — business logic (Helm calls, chart resolution)
- `internal/helm/`, `internal/k8s/`, `internal/compose/`, `internal/health/` — infrastructure wrappers

## Development Guidelines

- New commands go in `internal/cli/`; business logic stays in the appropriate domain package
- Reuse shared Helm install flags via `addHelmInstallFlags()` and `parseInstallFlags()` in `internal/cli/cluster.go`
- Use `RunE` (not `Run`) on all commands so Cobra propagates errors correctly
- Wrap errors with `%w` and include user-actionable hints in the message (e.g. `"run: helm dependency update <path>"`)
- No AI ads in commit messages

## Troubleshooting

**`docker-compose.yml not found`**
Run `kubegram start` from inside the monorepo, or pass `--compose-file /path/to/docker-compose.yml`.

**`kubegram-operator Helm chart not found`**
Run `kubegram operator install` from inside the monorepo, or pass `--chart-path kubegram-operator/charts/kubegram-operator`.

**`failed to load Helm chart … chart dependency not installed`**
The argo-cd sub-chart has not been downloaded. Run:
```bash
helm dependency update kubegram-operator/charts/kubegram-operator
```

**`unable to load kubeconfig`**
Ensure `~/.kube/config` exists and the target cluster is reachable. Use `--context` to specify a context explicitly.

**Health checks time out after `kubegram start`**
Services may still be pulling images on first run. Follow logs with:
```bash
docker compose logs -f
```
Health polling has a 5-minute deadline before the CLI gives up.
