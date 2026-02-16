# Kubegram Operator Context

## Overview
The Kubegram Operator is a Kubernetes Operator written in Go that also functions as a Model Context Protocol (MCP) Server. It is designed to bridge the gap between AI agents and Kubernetes clusters by exposing tools and proxies.

## Capabilities
1.  **Kubernetes Operator**: Built using `controller-runtime`, capable of reconciling Kubernetes resources (controllers to be implemented).
2.  **MCP Server**: Implements the Model Context Protocol to expose tools to AI clients.
    -   **Local Tools**:
        -   `bash`: Execute shell commands on the operator's container/host.
        -   `kubectl`: Execute kubectl commands against the cluster.
    -   **Proxied Tools**: Can connect to and proxy external MCP servers (e.g., Argo CD, Kubernetes MCP).
    -   **Transports**: Supports both Stdio (default) and HTTP/SSE transports.

## Architecture
-   **Language**: Go (Golang)
-   **Frameworks**:
    -   `sigs.k8s.io/controller-runtime`: For operator logic.
    -   `github.com/modelcontextprotocol/go-sdk`: For MCP server implementation.
-   **Deployment**: Docker container deployed via Helm Chart.

## Project Structure
-   `cmd/manager/main.go`: Entrypoint. Starts Operator Manager and MCP Server.
-   `pkg/mcp/`: MCP Server and Proxy implementation.
-   `pkg/tools/`: Local MCP tool implementations (`bash`, `kubectl`).
-   `charts/kubegram-operator/`: Helm Chart for deployment.
-   `Dockerfile`: Multi-stage Docker build.
-   `Makefile`: Build and deployment automation.

## Usage

### Local Development
You can run the operator locally using Go:

```bash
# Run with default Stdio transport
make run

# Run with HTTP/SSE transport on :8080
make run-http
```

### Docker Build
Build the Docker image:

```bash
make docker-build
```

### Kubernetes Deployment (Helm)
Deploy to a Kubernetes cluster using Helm:

```bash
# Install/Upgrade
make helm-install

# Uninstall
make helm-uninstall
```

For local Kind clusters, you can use the dev loop:
```bash
# Build image, load to Kind, and install Helm chart
make dev-up
```

### MCP Configuration
The MCP server can be configured via flags (or Helm values):
-   `--mcp-http-addr`: Address for HTTP/SSE server (e.g., `:8080`).
-   `--argo-mcp-cmd`: Command to run Argo MCP proxy.
-   `--k8s-mcp-cmd`: Command to run Kubernetes MCP proxy.

In Helm `values.yaml`:
```yaml
mcp:
  http:
    enabled: true
    port: 8080
  proxies:
    argo:
      enabled: false
      command: "..."
```
