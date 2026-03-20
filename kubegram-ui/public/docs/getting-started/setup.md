<!-- order: 2 -->

# Local Development Setup

This guide explains how to install, configure, and run **Kubegram** locally for development, testing, and experimentation.

Kubegram runs fully on your local machine and integrates with IDEs, AI assistants, GitOps workflows, and Kubernetes clusters.

---

## Installation

### Homebrew (macOS / Linux)

```bash
brew install kubegram
```

Verify the installation:

```bash
kubegram version
```

---

### curl (Linux / CI environments)

```bash
curl -fsSL https://get.kubegram.dev/install.sh | bash
```

The installer places the `kubegram` binary in `/usr/local/bin`.

Verify the installation:

```bash
kubegram version
```

---

## Configuration

Kubegram is configured using environment variables. You only need to configure the providers and features you plan to use.

### Environment Variables

```env
# Admin access
KUBEGRAM_ADMIN_USERNAME=
KUBEGRAM_ADMIN_PASSWORD=

# OAuth (optional)
KUBEGRAM_OAUTH_PROVIDER=
KUBEGRAM_OAUTH_TOKEN=

# LLM Providers (configure one or more)
KUBEGRAM_OPENROUTER_TOKEN=
KUBEGRAM_ANTHROPIC_TOKEN=
KUBEGRAM_OPENAI_TOKEN=
KUBEGRAM_GOOGLE_TOKEN=
KUBEGRAM_DEEPSEEK_TOKEN=
```

---

### Using a `.env` File (Recommended)

```bash
cp .env.example .env
```

Populate the file, then load it:

```bash
export $(cat .env | xargs)
```

This keeps secrets out of shell history and source control.

---

## Quick Start

```bash
# 1. Install Kubegram
brew install kubegram

# 2. Configure an LLM provider
export KUBEGRAM_OPENAI_TOKEN=your-token-here

# 3. Start Kubegram
kubegram start

# 4. Load or create an architecture
kubegram load design.json
```

You now have a local Kubegram runtime ready for architecture design, validation, and deployment.

---

## Running Kubegram Locally

### Start Kubegram

```bash
kubegram start
```

Starts the local runtime, API, and background services.

#### Common Flags

```bash
kubegram start --port 8080
kubegram start --log-level debug
kubegram start --config ./kubegram.yaml
```

---

### Resume a Saved Design

```bash
kubegram load design.json
```

Restores architecture state from a previously saved design file.

---

## MCP (Model Context Protocol)

Kubegram exposes an MCP server for integration with IDEs and AI assistants.

### Start MCP Server

```bash
kubegram mcp start
```

By default, the MCP server runs in **local mode**, which starts the kubegram-operator binary directly on your machine.

#### Options

```bash
--mode string     Mode to run MCP server: local or cluster (default: "local")
--port int        Port to run MCP server on (default: 8080)
--token string    Auth token for the MCP server
--namespace       Kubernetes namespace (cluster mode only)
```

#### Modes

**Local mode** (default): Runs the operator binary directly on your machine.

```bash
kubegram mcp start --mode local --port 8080
```

**Cluster mode**: Port-forwards to the operator running in a Kubernetes cluster.

```bash
kubegram mcp start --mode cluster --namespace default --port 8080
```

### Stop MCP Server

```bash
kubegram mcp stop
```

### Check Status

```bash
kubegram mcp status
```

---

### Authentication

The MCP server requires a bearer token for authentication. You can provide it in several ways:

1. **Via command flag:**
   ```bash
   kubegram mcp start --token YOUR_TOKEN
   ```

2. **Via environment variable:**
   ```bash
   export KUBEGRAM_SERVER_TOKEN=your-token-here
   kubegram mcp start
   ```

3. **Via kubegram login:** Run `kubegram login` first to authenticate, and the token will be stored for future use.

### IDE & AI Assistant Integration

When the MCP server is running, IDEs and AI assistants can:

- Query architecture state
- Generate or modify designs
- Validate Kubernetes configurations
- Explain generated manifests

This enables in-editor, AI-assisted architecture workflows without leaving your development environment.

---

## Kubernetes Integration

Kubegram can be installed into a Kubernetes cluster to enable in-cluster execution, GitOps reconciliation, and operator-driven automation.

### Install Kubegram into a Cluster

```bash
kubegram cluster install
```

Uses the current Kubernetes context (`kubectl config current-context`).

---

### Uninstall Kubegram from a Cluster

```bash
kubegram cluster uninstall
```

Removes all Kubegram components from the cluster.

---

### Install the Kubegram Operator

```bash
kubegram operator install
```

The operator enables continuous reconciliation, automation, and runtime intelligence inside the cluster.

---

## Common Local Workflows

### Architecture-First Development

1. Start Kubegram locally
2. Design architecture using the canvas, IDE, or AI assistant
3. Validate and iterate locally
4. Commit generated artifacts to Git
5. Deploy using GitOps

---

### Local → Cluster Workflow

1. Design and validate locally
2. Install Kubegram into a target cluster
3. Enable GitOps reconciliation
4. Deploy progressively using canary or A/B strategies

---

## CLI Command Reference

```bash
kubegram start
kubegram load <design.json>

kubegram mcp start [--mode local|cluster] [--port PORT] [--token TOKEN]
kubegram mcp stop
kubegram mcp status

kubegram cluster install
kubegram cluster uninstall

kubegram operator install
```

Run `kubegram help` or `kubegram <command> --help` for full flag documentation.

---

## Next Steps

- [Visual Designer](../visual-designer/canvas-guide) — design your first infrastructure on the canvas
- [MCP & IDE Integration](../integrations/mcp-integration) — connect Kubegram to your editor or AI assistant
- [Architecture](./architecture) — understand how Kubegram's components fit together
- [Deployment Guide](../deployment/deployment) — deploy Kubegram to a production cluster
