# Kubegram Operator: Kubernetes MCP Server Documentation

## Overview

The Kubegram Operator is a Kubernetes-native operator that serves as a Model Context Protocol (MCP) server, bridging the gap between AI agents and Kubernetes clusters. It exposes powerful tools for cluster management, deployment automation, and real-time operational intelligence through a unified MCP interface.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Agents    │    │  Kubegram      │    │  Kubernetes     │
│                 │◄──►│  Operator      │◄──►│  Cluster       │
│ • Claude       │    │                 │    │                 │
│ • OpenAI       │    │ • MCP Server   │    │ • Pods         │
│ • Gemini       │    │ • Local Tools  │    │ • Services     │
│ • Llama        │    │ • Proxies      │    │ • Deployments  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────┴────────┐              │
         │              │                 │              │
         ▼              ▼                 ▼              ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Argo CD      │ │  K8s MCP       │ │  External MCP   │
│   MCP Proxy    │ │  Server         │ │  Servers       │
│                 │ │                 │ │                 │
│ • GitOps       │ │ • Resources     │ │ • Custom Tools  │
│ • Apps         │ │ • Events       │ │ • Integrations │
│ • Sync         │ │ • Logs         │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Core Components

### 1. MCP Server Implementation

**Location**: `pkg/mcp/server.go`

The MCP server provides a unified interface for AI agents to interact with Kubernetes and external services.

**Key Features**:
- **Multi-Transport Support**: Stdio (default) and HTTP/SSE transports
- **Tool Registry**: Dynamic registration of local and proxied tools
- **Session Management**: Handles multiple concurrent AI agent connections
- **Proxy Architecture**: Seamless integration with external MCP servers

```go
// Server initialization
server := mcp.NewServer(&mcp.Implementation{
    Name:    "kubegram-operator",
    Version: "0.1.0",
}, nil)

// Register local tools
server.AddTool(&bashTool, tools.HandleBashCommand)
server.AddTool(&kubectlTool, tools.HandleKubectlCommand)
server.AddTool(&argoTool, tools.HandleArgoCDInstall)

// Register proxy tools
for _, tool := range remoteTools {
    server.AddTool(tool, proxyHandler)
}
```

### 2. Proxy Client System

**Location**: `pkg/mcp/proxy.go`

Proxy clients enable the operator to connect to and proxy external MCP servers, extending functionality beyond native tools.

**Supported Proxy Types**:
- **Stdio Proxy**: Spawns external MCP server processes (e.g., Node.js, Python)
- **SSE Proxy**: Connects to HTTP/SSE-based MCP servers
- **Automatic Discovery**: Dynamic tool listing and registration

```go
// Create stdio proxy (e.g., for Node.js MCP server)
proxy, err := NewStdioProxyClient(ctx, "argo", "npx", []string{
    "-y", "@modelcontextprotocol/server-filesystem", "/projects"
})

// Create SSE proxy (e.g., for remote MCP server)
proxy, err := NewSSEProxyClient(ctx, "k8s", "http://k8s-mcp:8080/sse")
```

### 3. WebSocket Transport Layer

**Location**: `pkg/transport/websocket.go`

Provides real-time bidirectional communication between AI agents and the operator.

**Features**:
- **Exponential Backoff**: Intelligent reconnection strategy
- **Connection Pooling**: Manages multiple concurrent connections
- **Message Routing**: Efficient JSON-RPC message handling
- **Health Monitoring**: Connection status and recovery

```go
// WebSocket transport for real-time communication
wsTransport := transport.NewWebSocketTransport("ws://llm-server:8665/operator")

// Server runs with automatic retry logic
for {
    if err := server.Run(ctx, wsTransport); err != nil {
        log.Error(err, "WebSocket disconnected, retrying...")
        time.Sleep(5 * time.Second)
    }
}
```

### 4. Local Tools Implementation

#### Bash Tool (`pkg/tools/bash.go`)

Executes shell commands on the operator's container with proper security controls.

```json
{
  "name": "bash",
  "description": "Execute a bash command. Use this tool to run shell commands on host system.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "description": "The bash command to execute"
      }
    },
    "required": ["command"]
  }
}
```

**Security Features**:
- Empty command prevention
- Context cancellation support
- Output capture and error handling
- Non-privileged user execution

#### Kubectl Tool (`pkg/tools/kubectl.go`)

Provides direct access to Kubernetes cluster operations.

```json
{
  "name": "kubectl",
  "description": "Execute a kubectl command. Use this tool to interact with Kubernetes cluster.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "args": {
        "type": "array",
        "items": {"type": "string"},
        "description": "kubectl command arguments"
      }
    },
    "required": ["args"]
  }
}
```

**Use Cases**:
- Resource inspection (`kubectl get pods`, `kubectl describe deployment`)
- Configuration management (`kubectl apply`, `kubectl edit`)
- Debugging (`kubectl logs`, `kubectl exec`)

#### ArgoCD Installer Tool (`pkg/tools/argocd.go`)

Automates deployment of ArgoCD MCP server for GitOps integration.

```json
{
  "name": "install_argo_mcp",
  "description": "Installs Argo MCP Server sidecar/deployment into cluster.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "namespace": {
        "type": "string",
        "default": "argocd",
        "description": "Namespace to install into"
      },
      "mcp_token": {
        "type": "string",
        "description": "Argo CD API Token for MCP Server"
      }
    },
    "required": ["mcp_token"]
  }
}
```

**Deployment Manifest**:
- Creates ServiceAccount with proper RBAC
- Deploys Argo MCP server container
- Configures internal service communication
- Sets up health checks and resource limits

## Configuration

### Command Line Flags

**Primary Configuration** (set via CLI or Helm values):

```bash
# MCP Server Configuration
--mcp-http-addr ":8080"              # HTTP/SSE server address
--llm-websocket-url "ws://llm:8665"   # WebSocket to LLM service

# Proxy Configuration
--argo-mcp-cmd "npx @argoproj-labs/mcp-for-argocd"
--argo-mcp-url "http://argo-mcp:8080/sse"
--k8s-mcp-cmd "uvx kubernetes-mcp-server"
--k8s-mcp-url "http://k8s-mcp:8080/sse"

# Operator Configuration
--metrics-bind-address ":8080"
--health-probe-bind-address ":8081"
--leader-elect=false
```

### Helm Chart Configuration

**Location**: `charts/kubegram-operator/values.yaml`

```yaml
# Core MCP Settings
mcp:
  http:
    enabled: true
    port: 8080
  proxies:
    argo:
      enabled: true
      command: "npx -y @modelcontextprotocol/server-filesystem /projects"
      url: ""
    k8s:
      enabled: true
      command: "uvx kubernetes-mcp-server"
      url: ""

# External MCP Servers
argoMcpServer:
  enabled: true
  image:
    repository: radiantone/argocd-mcp
    tag: latest
  token: ""  # Must be provided

k8sMcpServer:
  enabled: true
  image:
    repository: quay.io/containers/kubernetes_mcp_server
    tag: latest

# LLM Integration
llm:
  websocketUrl: "ws://host.docker.internal:8665"

# Resource Management
resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi

# Security Settings
securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  runAsNonRoot: true
```

## Deployment Options

### 1. Local Development

**Quick Start**:
```bash
# Clone and run locally
git clone https://github.com/kubegram/kubegram-operator.git
cd kubegram-operator

# Run with stdio transport (default)
make run

# Run with HTTP/SSE transport on port 8080
make run-http

# Run with debug
make debug
```

**Development Features**:
- Hot reload during development
- Integrated debugging support (Delve)
- Comprehensive test suite
- Local Kind cluster integration

### 2. Docker Container

**Build Process**:
```bash
# Multi-stage Docker build
make docker-build

# Run container
docker run --rm -it \
  -e LLM_HOST=ws://localhost:8665 \
  -v ~/.kube:/root/.kube:ro \
  kubegram-operator:latest
```

**Container Features**:
- **Multi-stage build**: Minimal runtime image
- **Pre-installed tools**: kubectl, Helm, Node.js, Python, uv
- **Security**: Non-root user, read-only filesystem where possible
- **Debug support**: Delve debugger included

### 3. Kubernetes Deployment

**Helm Installation**:
```bash
# Add Helm repository (if needed)
helm repo add kubegram https://charts.kubegram.io
helm repo update

# Install operator
helm install kubegram-operator kubegram/kubegram-operator \
  --namespace kubegram-system \
  --create-namespace \
  --set llm.websocketUrl=ws://kubegram-server:8665 \
  --set argoMcpServer.token=your-argocd-token

# Upgrade existing installation
helm upgrade kubegram-operator kubegram/kubegram-operator \
  --namespace kubegram-system

# Uninstall
helm uninstall kubegram-operator --namespace kubegram-system
```

**Development Loop with Kind**:
```bash
# Automated development workflow
make dev-up    # Build, load to Kind, install
make dev-down  # Stop and clean Kind
make dev-reload # Rebuild and reinstall
```

## Integration Patterns

### 1. AI Agent Integration

**Claude Desktop Configuration**:
```json
{
  "mcpServers": {
    "kubegram-operator": {
      "command": "node",
      "args": ["-e", "require('http').createServer((req, res) => { /* proxy logic */ }).listen(3000)"],
      "env": {
        "MCP_SERVER_URL": "http://kubegram-operator:8080/sse"
      }
    }
  }
}
```

**Direct WebSocket Connection**:
```javascript
// AI agent connects directly to operator
const ws = new WebSocket('ws://kubegram-operator:8665/operator');

// List available tools
const response = await fetch('http://kubegram-operator:8080/sse/tools', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ method: 'tools/list' })
});

// Execute kubectl command via MCP
const result = await fetch('http://kubegram-operator:8080/sse/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'kubectl',
      arguments: { args: ['get', 'pods', '-n', 'default'] }
    }
  })
});
```

### 2. ArgoCD Integration

**Automated Setup**:
```bash
# AI agent installs ArgoCD MCP integration
curl -X POST http://kubegram-operator:8080/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "install_argo_mcp",
    "arguments": {
      "namespace": "argocd",
      "mcp_token": "eyJhbGciOiJ..."
    }
  }'
```

**Resulting Capabilities**:
- GitOps pipeline management
- Application deployment via ArgoCD
- Sync status monitoring
- Rollback operations

### 3. Multi-Cluster Support

**Federation Pattern**:
```yaml
# Deploy operators in multiple clusters
apiVersion: v1
kind: ConfigMap
metadata:
  name: kubegram-config
data:
  clusters.yaml: |
    - name: production
      endpoint: ws://prod-kubegram-operator:8665
      kubeconfig: /etc/kubeconfig/prod
    - name: staging
      endpoint: ws://staging-kubegram-operator:8665
      kubeconfig: /etc/kubeconfig/staging
```

## Security Considerations

### 1. Container Security

**Hardening Measures**:
```dockerfile
# Security context in Dockerfile
USER 65532:65532
RUN chmod +x /usr/local/bin/kubectl
RUN chmod +x /manager

# Runtime security
securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  runAsNonRoot: true
  runAsUser: 65532
```

### 2. Network Security

**TLS Configuration**:
```yaml
# Enable TLS for WebSocket connections
apiVersion: v1
kind: Secret
metadata:
  name: kubegram-tls
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-cert>
  tls.key: <base64-encoded-key>
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: kubegram-config
data:
  config.yaml: |
    transport:
      websocket:
        tls:
          enabled: true
          certPath: /etc/tls/cert
          keyPath: /etc/tls/key
```

### 3. RBAC Configuration

**Minimal Privilege Principle**:
```yaml
# Operator permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: kubegram-operator
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

## Monitoring and Observability

### 1. Metrics Collection

**Prometheus Metrics**:
```yaml
# Metrics endpoint configuration
serviceMonitor:
  enabled: true
  additionalLabels:
    release: kube-prometheus-stack
  namespace: monitoring
```

**Available Metrics**:
- `mcp_requests_total` - Total MCP requests
- `mcp_request_duration_seconds` - Request processing time
- `mcp_proxy_connections_active` - Active proxy connections
- `kubegram_operator_reconcile_duration` - Reconciliation time

### 2. Logging Strategy

**Structured Logging**:
```go
// Go logger configuration
logger := log.Log.WithName("kubegram-operator").
  WithValues("component", "mcp-server")

logger.Info("Tool executed", 
  "tool", "kubectl",
  "args", args,
  "duration", duration,
  "success", true)
```

**Log Levels**:
- `info`: Standard operations, tool executions
- `debug`: Detailed connection info, message routing
- `error`: Failed operations, connection issues
- `warn`: Configuration issues, fallback activations

### 3. Health Checks

**Readiness and Liveness**:
```yaml
# Health probe configuration
livenessProbe:
  httpGet:
    path: /healthz
    port: 8081
  initialDelaySeconds: 30
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /readyz
    port: 8081
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Testing Strategy

### 1. Unit Testing

**Tool Testing**:
```go
func TestBashTool(t *testing.T) {
    tool := tools.NewBashTool()
    
    // Test tool registration
    if tool.Name != "bash" {
        t.Errorf("Expected tool name 'bash', got %s", tool.Name)
    }
    
    // Test handler execution
    result := tools.HandleBashCommand(ctx, &mcp.CallToolRequest{
        Params: mcp.CallToolParams{
            Arguments: json.RawMessage(`{"command": "echo 'test'"}`),
        },
    })
    
    if result.IsError {
        t.Errorf("Bash tool failed: %v", result.Content)
    }
}
```

### 2. Integration Testing

**MCP Server Integration**:
```go
func TestMCPServerIntegration(t *testing.T) {
    // Start test server
    server := mcp.NewServer(&mcp.Implementation{
        Name:    "test-server",
        Version: "0.1.0",
    }, nil)
    
    // Register test tool
    server.AddTool(&testTool, testHandler)
    
    // Connect via SSE transport
    transport := &sdk.SSEClientTransport{
        Endpoint: "http://localhost:8080/sse",
    }
    
    session, err := client.Connect(ctx, transport, nil)
    if err != nil {
        t.Fatalf("Failed to connect: %v", err)
    }
    defer session.Close()
    
    // Test tool execution
    result, err := session.CallTool(ctx, &sdk.CallToolParams{
        Name: "test_tool",
        Arguments: map[string]interface{}{"param": "value"},
    })
    
    if err != nil {
        t.Errorf("Tool call failed: %v", err)
    }
}
```

### 3. End-to-End Testing

**AI Agent Integration Test**:
```go
func TestE2EAgentIntegration(t *testing.T) {
    // Deploy operator in test cluster
    make dev-up
    
    // Connect AI client
    client := NewAIClient("http://operator:8080/sse")
    
    // Execute workflow
    result := client.ExecuteWorkflow(&Workflow{
        Steps: []Step{
            {Tool: "kubectl", Args: []string{"get", "nodes"}},
            {Tool: "bash", Args: []string{"echo 'Cluster info retrieved'"}},
            {Tool: "install_argo_mcp", Args: map[string]interface{}{
                "namespace": "argocd",
                "mcp_token": testToken,
            }},
        },
    })
    
    // Verify results
    if !result.Success {
        t.Errorf("E2E workflow failed: %v", result.Error)
    }
}
```

## Performance Optimization

### 1. Connection Management

**Connection Pooling**:
```go
type ConnectionPool struct {
    mu          sync.RWMutex
    connections  map[string]*websocket.Conn
    maxConns    int
    timeout      time.Duration
}

func (p *ConnectionPool) Get(id string) (*websocket.Conn, error) {
    p.mu.RLock()
    defer p.mu.RUnlock()
    
    if conn, ok := p.connections[id]; ok {
        return conn, nil
    }
    
    return p.CreateConnection(id)
}
```

### 2. Memory Management

**Tool Result Caching**:
```go
type ResultCache struct {
    cache  map[string]*CachedResult
    mu     sync.RWMutex
    ttl    time.Duration
}

type CachedResult struct {
    Value     *mcp.CallToolResult
    Timestamp time.Time
    Hash      string
}

func (c *ResultCache) Get(key string) (*mcp.CallToolResult, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    
    if result, ok := c.cache[key]; ok {
        if time.Since(result.Timestamp) < c.ttl {
            return result.Value, true
        }
        delete(c.cache, key)
    }
    
    return nil, false
}
```

### 3. Resource Utilization

**CPU and Memory Optimization**:
```yaml
# Resource limits for optimal performance
resources:
  requests:
    cpu: 50m     # Base CPU for operator logic
    memory: 64Mi   # Base memory footprint
  limits:
    cpu: 200m     # Burst capacity for tool execution
    memory: 256Mi  # Buffer for concurrent operations
```

## Troubleshooting Guide

### 1. Common Issues

**Connection Problems**:
```bash
# Check WebSocket connectivity
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://kubegram-operator:8665/operator

# Check MCP server health
curl http://kubegram-operator:8080/healthz
```

**Tool Execution Failures**:
```bash
# Check kubectl access in pod
kubectl exec -it kubegram-operator-pod -- kubectl get pods

# Check bash tool permissions
kubectl exec -it kubegram-operator-pod -- bash -c "whoami && id"

# Check proxy connections
kubectl logs kubegram-operator-pod | grep -E "(proxy|connecting|disconnected)"
```

### 2. Debug Mode

**Enable Debug Logging**:
```yaml
# Helm values for debugging
debug:
  enabled: true
  port: 40000

# Environment variables
env:
  - name: LOG_LEVEL
    value: "debug"
  - name: LOG_FORMAT
    value: "json"
```

**Debug Workflow**:
```bash
# Start with debug
make debug

# Connect Delve debugger
dlv connect localhost:40000

# Check debug logs
kubectl logs -f kubegram-operator-pod | jq .
```

### 3. Performance Issues

**Resource Monitoring**:
```bash
# Check resource usage
kubectl top pod -l app=kubegram-operator

# Check connection counts
kubectl exec -it kubegram-operator-pod -- \
  netstat -an | grep ":8080\|:8665"

# Check proxy health
curl -s http://kubegram-operator:8080/metrics | grep mcp_proxy
```

## Migration and Upgrades

### 1. Version Compatibility

**Semantic Versioning**:
- **Major (X.0.0)**: Breaking changes, migration required
- **Minor (X.Y.0)**: New features, backward compatible
- **Patch (X.Y.Z)**: Bug fixes, drop-in replacement

### 2. Upgrade Process

**Rolling Upgrade**:
```bash
# Backup current configuration
kubectl get configmap kubegram-operator-config -o yaml > backup.yaml

# Upgrade with zero downtime
helm upgrade kubegram-operator kubegram/kubegram-operator \
  --namespace kubegram-system \
  --set image.tag=v0.2.0 \
  --reuse-values \
  --wait

# Verify upgrade
kubectl rollout status deployment/kubegram-operator
```

### 3. Configuration Migration

**Backward Compatibility**:
```go
// Handle deprecated configuration
type Config struct {
    NewSetting    string `json:"new_setting"`
    OldSetting    string `json:"old_setting,omitempty"`
}

func (c *Config) Migrate() {
    if c.OldSetting != "" && c.NewSetting == "" {
        c.NewSetting = c.OldSetting
        log.Info("Migrated deprecated config", 
            "old_setting", c.OldSetting,
            "new_setting", c.NewSetting)
    }
}
```

## Best Practices

### 1. Deployment Best Practices

**Production Readiness**:
```yaml
# Use immutable image tags
image:
  tag: "0.1.0"  # Not "latest"

# Enable leader election
leaderElection: true

# Set resource limits
resources:
  limits:
    cpu: 200m
    memory: 256Mi

# Use dedicated namespace
namespace: kubegram-system
```

### 2. Security Best Practices

**Network Policies**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: kubegram-operator-netpol
spec:
  podSelector:
    matchLabels:
      app: kubegram-operator
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: kubegram-system
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kubegram-system
    - namespaceSelector:
        matchLabels:
          name: argocd
```

### 3. Monitoring Best Practices

**Alerting Rules**:
```yaml
# Prometheus alerts
groups:
- name: kubegram-operator
  rules:
  - alert: KubegramOperatorDown
    expr: up{job="kubegram-operator"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Kubegram operator is down"
      
  - alert: MCPConnectionsHigh
    expr: mcp_connections_active > 100
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High number of MCP connections"
```

## API Reference

### MCP Tool Registry

| Tool Name | Description | Arguments | Return Type |
|------------|-------------|------------|--------------|
| `bash` | Execute shell commands | `command` (string) | Command output, error |
| `kubectl` | Execute kubectl commands | `args` (array) | kubectl output, error |
| `install_argo_mcp` | Install ArgoCD MCP server | `namespace`, `mcp_token` | Installation status, service URL |

### WebSocket Messages

**Tool Call Format**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "kubectl",
    "arguments": {
      "args": ["get", "pods"]
    }
  },
  "id": "req-123"
}
```

**Response Format**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "NAMESPACE   NAME   READY   STATUS    RESTARTS   AGE\n"
      }
    ],
    "isError": false
  },
  "id": "req-123"
}
```

### Configuration Schema

**Complete Configuration**:
```yaml
# Core operator settings
replicaCount: 1
image:
  repository: kubegram-operator
  tag: "0.1.0"

# MCP server configuration
mcp:
  http:
    enabled: true
    port: 8080
  proxies:
    argo:
      enabled: true
      command: "npx -y @modelcontextprotocol/server-filesystem"
      url: ""
    k8s:
      enabled: true
      command: "uvx kubernetes-mcp-server"
      url: ""

# External service configuration
argoMcpServer:
  enabled: true
  token: ""
k8sMcpServer:
  enabled: true

# LLM integration
llm:
  websocketUrl: "ws://kubegram-server:8665"

# Resource management
resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 50m
    memory: 64Mi

# Security settings
securityContext:
  runAsNonRoot: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
```

---

The Kubegram Operator serves as the critical bridge between AI agents and Kubernetes infrastructure, providing secure, scalable, and extensible MCP-based access to cluster operations, deployment automation, and real-time operational intelligence.