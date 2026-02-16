# MCP Tools Documentation

## install_argo_mcp

Installs the Argo MCP Server sidecar/deployment into the cluster. Requires an existing Argo CD installation or can be used to add the MCP capability.

### Inputs

- `namespace` (string, default: "argocd"): Namespace to install into.
- `mcp_token` (string, required): Argo CD API Token for the MCP Server.

### Example Usage

```json
{
  "name": "install_argo_mcp",
  "arguments": {
    "namespace": "my-argocd",
    "mcp_token": "eyJhbGciOiJ..."
  }
}
```

## bash

Execute a bash command on the host system.

### Inputs

- `command` (string, required): The bash command to execute.

## kubectl

Execute a kubectl command.

### Inputs

- `command` (string, required): The kubectl command arguments (e.g., "get pods").
- `yaml` (string): Optional YAML string to apply (equivalent to `echo "..." | kubectl apply -f -`).
