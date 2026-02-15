# API Reference

This comprehensive API reference covers all Kubegram APIs for infrastructure design, AI orchestration, GitOps automation, and cluster management.

## 📚 API Overview

### Base URLs

| Environment | Base URL | Authentication |
|-------------|-----------|----------------|
| **Development** | `http://localhost:8090` | Cookie-based session |
| **Staging** | `https://api.staging.kubegram.io` | OAuth 2.0 / SAML |
| **Production** | `https://api.kubegram.io` | OAuth 2.0 / SAML |

### Authentication

All API requests require authentication except public endpoints:

```bash
# Cookie-based authentication (browser)
curl -b "session_id=your_session" \
     http://localhost:8090/api/public/v1/auth/me

# Bearer token authentication (programmatic)
curl -H "Authorization: Bearer your_jwt_token" \
     https://api.kubegram.io/api/public/v1/auth/me

# MCP WebSocket authentication
const ws = new WebSocket('ws://localhost:8090/mcp?token=your_token');
```

## 🔐 Authentication APIs

### Current Session

**GET** `/api/public/v1/auth/me`

Get information about the current authenticated session.

**Response**:
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://avatars.githubusercontent.com/u/123456",
    "role": "team_member",
    "teamId": "team-456",
    "companyId": "company-789"
  },
  "sessionId": "sess_1a2b3c4d5e6f7g8h",
  "permissions": [
    "read:projects",
    "write:projects",
    "read:clusters"
  ],
  "expiresAt": "2024-01-15T18:00:00Z"
}
```

### OAuth Providers

**GET** `/api/public/v1/auth/providers`

Get list of configured OAuth providers.

**Response**:
```json
{
  "providers": [
    {
      "id": "github",
      "name": "GitHub",
      "enabled": true,
      "loginUrl": "https://api.kubegram.io/oauth/github"
    },
    {
      "id": "google",
      "name": "Google",
      "enabled": true,
      "loginUrl": "https://api.kubegram.io/oauth/google"
    },
    {
      "id": "okta",
      "name": "Okta",
      "enabled": false,
      "loginUrl": null
    }
  ]
}
```

### Logout

**POST** `/api/public/v1/auth/logout`

Terminate the current session.

**Request**:
```json
{
  "allDevices": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Session terminated successfully"
}
```

## 🏢 Entity Management APIs

### Companies

#### List Companies

**GET** `/api/public/v1/companies`

Get list of accessible companies.

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search term

**Response**:
```json
{
  "companies": [
    {
      "id": "company-789",
      "name": "Tech Corp",
      "tokens": 10000,
      "stripeCustomerId": "cus_1234567890",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T12:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Create Company

**POST** `/api/public/v1/companies`

Create a new company.

**Request**:
```json
{
  "name": "New Company",
  "tokens": 5000,
  "stripeCustomerId": "cus_new_customer_id"
}
```

**Response**:
```json
{
  "company": {
    "id": "company-new-id",
    "name": "New Company",
    "tokens": 5000,
    "stripeCustomerId": "cus_new_customer_id",
    "createdAt": "2024-01-15T14:00:00Z",
    "updatedAt": "2024-01-15T14:00:00Z"
  }
}
```

#### Update Company

**PUT** `/api/public/v1/companies/{companyId}`

Update company details.

**Request**:
```json
{
  "name": "Updated Company Name",
  "tokens": 7500
}
```

### Projects

#### Create Project

**POST** `/api/public/v1/projects`

Create a new infrastructure project.

**Request**:
```json
{
  "name": "Web Application Platform",
  "description": "E-commerce platform with microservices architecture",
  "teamId": "team-456",
  "metadata": {
    "environment": "production",
    "region": "us-west-2",
    "cloudProvider": "aws"
  }
}
```

**Response**:
```json
{
  "project": {
    "id": "proj-123456",
    "name": "Web Application Platform",
    "description": "E-commerce platform with microservices architecture",
    "teamId": "team-456",
    "status": "active",
    "createdAt": "2024-01-15T14:30:00Z",
    "updatedAt": "2024-01-15T14:30:00Z",
    "metadata": {
      "environment": "production",
      "region": "us-west-2",
      "cloudProvider": "aws"
    }
  }
}
```

#### Get Project Graph

**GET** `/api/public/v1/projects/{projectId}/graph`

Get the visual infrastructure graph for a project.

**Response**:
```json
{
  "graph": {
    "id": "graph-789",
    "projectId": "proj-123456",
    "name": "Web Application Platform",
    "nodes": [
      {
        "id": "node-1",
        "type": "load_balancer",
        "name": "Main Load Balancer",
        "position": { "x": 100, "y": 100 },
        "size": { "width": 120, "height": 60 },
        "config": {
          "type": "ApplicationLoadBalancer",
          "algorithm": "round_robin",
          "ssl": true
        }
      },
      {
        "id": "node-2",
        "type": "microservice",
        "name": "Web Service",
        "position": { "x": 100, "y": 250 },
        "size": { "width": 140, "height": 80 },
        "config": {
          "replicas": 3,
          "image": "nginx:1.21",
          "ports": [80],
          "resources": {
            "requests": { "cpu": "100m", "memory": "128Mi" },
            "limits": { "cpu": "500m", "memory": "512Mi" }
          }
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2",
        "type": "dependency",
        "config": {
          "protocol": "http",
          "port": 80
        }
      }
    ],
    "metadata": {
      "createdAt": "2024-01-15T14:30:00Z",
      "updatedAt": "2024-01-15T16:45:00Z",
      "version": 3
    }
  }
}
```

#### Update Project Graph

**PUT** `/api/public/v1/projects/{projectId}/graph`

Update the infrastructure graph.

**Request**:
```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "load_balancer",
      "name": "Updated Load Balancer",
      "position": { "x": 150, "y": 100 },
      "config": {
        "type": "ApplicationLoadBalancer",
        "algorithm": "least_connections"
      }
    }
  ],
  "edges": []
}
```

## 🤖 AI Orchestration APIs

### Code Generation

#### Submit Code Generation Job

**POST** `/api/public/v1/graph/codegen`

Submit a code generation job for an infrastructure graph.

**Request**:
```json
{
  "projectId": "proj-123456",
  "graphId": "graph-789",
  "input": {
    "modelProvider": "anthropic",
    "modelName": "claude-3-5-sonnet-20241022",
    "context": [
      "Production deployment with high availability",
      "Include monitoring and auto-scaling",
      "Optimize for cost efficiency"
    ],
    "options": {
      "costEstimation": true,
      "validateConfigurations": true,
      "generateManifests": true,
      "includeDocumentation": true
    }
  }
}
```

**Response**:
```json
{
  "job": {
    "id": "job-456789",
    "projectId": "proj-123456",
    "status": "pending",
    "progress": 0,
    "createdAt": "2024-01-15T15:00:00Z",
    "estimatedCompletion": "2024-01-15T15:05:00Z"
  }
}
```

#### Get Job Status

**GET** `/api/public/v1/graph/codegen/{jobId}`

Get the status of a code generation job.

**Response**:
```json
{
  "job": {
    "id": "job-456789",
    "status": "running",
    "progress": 65,
    "currentStep": "Generating Kubernetes manifests",
    "steps": [
      {
        "name": "Analyzing infrastructure graph",
        "status": "completed",
        "duration": "15s"
      },
      {
        "name": "Retrieving RAG context",
        "status": "completed",
        "duration": "8s"
      },
      {
        "name": "Generating Kubernetes manifests",
        "status": "running",
        "duration": "12s"
      }
    ],
    "createdAt": "2024-01-15T15:00:00Z",
    "updatedAt": "2024-01-15T15:01:00Z"
  }
}
```

#### Get Generated Code

**GET** `/api/public/v1/graph/codegen/{jobId}/result`

Get the generated Kubernetes manifests.

**Response**:
```json
{
  "job": {
    "id": "job-456789",
    "status": "completed",
    "completedAt": "2024-01-15T15:05:00Z"
  },
  "result": {
    "manifests": [
      {
        "fileName": "deployment.yaml",
        "generatedCode": "apiVersion: apps/v1\nkind: Deployment\n...",
        "assumptions": [
          "Application is stateless",
          "No external dependencies required",
          "Standard HTTP traffic patterns"
        ],
        "decisions": [
          "Used RollingUpdate strategy",
          "Configured 3 replicas for high availability",
          "Applied resource limits based on similar deployments"
        ],
        "entityName": "web-service",
        "entityId": "node-2",
        "entityType": "MICROSERVICE"
      }
    ],
    "costEstimate": {
      "monthlyCost": 156.78,
      "currency": "USD",
      "breakdown": {
        "compute": 89.45,
        "storage": 34.23,
        "network": 33.10
      }
    },
    "validationResults": {
      "status": "passed",
      "warnings": [
        "Consider adding pod disruption budget for production"
      ],
      "errors": []
    }
  }
}
```

### AI Provider Configuration

#### Get Available Providers

**GET** `/api/public/v1/ai/providers`

Get list of configured AI providers.

**Response**:
```json
{
  "providers": [
    {
      "id": "anthropic",
      "name": "Anthropic Claude",
      "enabled": true,
      "models": [
        {
          "id": "claude-3-5-sonnet-20241022",
          "name": "Claude 3.5 Sonnet",
          "maxTokens": 200000,
          "costPerMillionTokens": 15.0,
          "capabilities": ["text", "code", "reasoning"]
        }
      ]
    },
    {
      "id": "openai",
      "name": "OpenAI GPT",
      "enabled": true,
      "models": [
        {
          "id": "gpt-4-turbo",
          "name": "GPT-4 Turbo",
          "maxTokens": 128000,
          "costPerMillionTokens": 10.0,
          "capabilities": ["text", "code"]
        }
      ]
    }
  ]
}
```

## 🔄 GitOps APIs

### ArgoCD Integration

#### Get Deployment Status

**GET** `/api/public/v1/gitops/status/{applicationName}`

Get GitOps deployment status.

**Response**:
```json
{
  "application": {
    "name": "web-app",
    "namespace": "production",
    "syncStatus": "Synced",
    "healthStatus": "Healthy",
    "lastSync": "2024-01-15T14:45:00Z",
    "revision": "abc123def456",
    "deployments": [
      {
        "name": "web-service",
        "namespace": "production",
        "status": "Healthy",
        "replicas": {
          "desired": 3,
          "current": 3,
          "ready": 3
        },
        "images": [
          {
            "name": "web-app",
            "tag": "v1.2.3",
            "digest": "sha256:abc123..."
          }
        ]
      }
    ]
  }
}
```

#### Trigger Sync

**POST** `/api/public/v1/gitops/sync/{applicationName}`

Trigger a GitOps synchronization.

**Request**:
```json
{
  "revision": "abc123def456",
  "dryRun": false,
  "strategy": "hook"
}
```

**Response**:
```json
{
  "sync": {
    "id": "sync-789012",
    "application": "web-app",
    "status": "running",
    "startedAt": "2024-01-15T15:10:00Z",
    "estimatedCompletion": "2024-01-15T15:12:00Z"
  }
}
```

#### Rollback Deployment

**POST** `/api/public/v1/gitops/rollback/{applicationName}`

Rollback to a previous deployment.

**Request**:
```json
{
  "revision": "def456abc123",
  "prune": true,
  "dryRun": false
}
```

## 📊 Monitoring APIs

### Cluster Metrics

#### Get Metrics

**GET** `/api/public/v1/monitoring/metrics`

Get cluster monitoring metrics.

**Query Parameters**:
- `query` (string): Prometheus query
- `timeRange` (string): Time range (e.g., "1h", "24h", "7d")
- `step` (string): Step interval (default: "1m")

**Response**:
```json
{
  "metrics": {
    "query": "up{job=\"kubernetes-apiservers\"}",
    "timeRange": "1h",
    "data": [
      {
        "metric": {
          "job": "kubernetes-apiservers",
          "instance": "172.20.0.1:6443"
        },
        "values": [
          {
            "timestamp": "2024-01-15T14:00:00Z",
            "value": 1
          },
          {
            "timestamp": "2024-01-15T14:01:00Z",
            "value": 1
          }
        ]
      }
    ]
  }
}
```

### Events and Logs

#### Get Events

**GET** `/api/public/v1/monitoring/events`

Get Kubernetes events.

**Query Parameters**:
- `namespace` (string): Filter by namespace
- `type` (string): Event type (Warning, Normal)
- `since` (string): Events since (ISO 8601)
- `limit` (number): Maximum events to return

**Response**:
```json
{
  "events": [
    {
      "id": "evt-123456",
      "type": "Warning",
      "reason": "Unhealthy",
      "message": "Readiness probe failed",
      "source": {
        "component": "kubelet"
      },
      "involvedObject": {
        "kind": "Pod",
        "name": "web-service-7d8b9c9f-x4k2p",
        "namespace": "production"
      },
      "timestamp": "2024-01-15T14:30:00Z"
    }
  ]
}
```

## 🔌 MCP WebSocket API

### Connection

Connect to the MCP WebSocket endpoint:

```javascript
const ws = new WebSocket('ws://localhost:8090/mcp?token=your_jwt_token');

ws.onopen = () => {
  console.log('Connected to MCP bridge');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMCPMessage(message);
};
```

### Tool Call

Execute MCP tools via WebSocket:

```json
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "method": "tools/call",
  "params": {
    "name": "kubectl",
    "arguments": {
      "command": "get",
      "resource": "pods",
      "namespace": "production"
    }
  },
  "timestamp": "2024-01-15T15:20:00Z",
  "agentId": "claude-assistant",
  "sessionId": "session-456"
}
```

### Tool Response

Receive tool execution results:

```json
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "result": {
    "success": true,
    "data": {
      "pods": [
        {
          "name": "web-service-7d8b9c9f-x4k2p",
          "namespace": "production",
          "status": "Running",
          "ready": true,
          "restartCount": 0
        }
      ],
      "total": 1
    }
  },
  "timestamp": "2024-01-15T15:20:05Z"
}
```

## 🎨 Canvas APIs

### Node Management

#### Add Node

**POST** `/api/public/v1/canvas/{projectId}/nodes`

Add a new node to the canvas.

**Request**:
```json
{
  "type": "microservice",
  "name": "New Service",
  "position": { "x": 200, "y": 150 },
  "size": { "width": 140, "height": 80 },
  "config": {
    "replicas": 2,
    "image": "nginx:latest"
  }
}
```

#### Update Node

**PUT** `/api/public/v1/canvas/{projectId}/nodes/{nodeId}`

Update node properties.

**Request**:
```json
{
  "name": "Updated Service",
  "position": { "x": 250, "y": 200 },
  "config": {
    "replicas": 3
  }
}
```

#### Delete Node

**DELETE** `/api/public/v1/canvas/{projectId}/nodes/{nodeId}`

Remove a node from the canvas.

### Edge Management

#### Add Edge

**POST** `/api/public/v1/canvas/{projectId}/edges`

Create a connection between nodes.

**Request**:
```json
{
  "source": "node-1",
  "target": "node-2",
  "type": "dependency",
  "config": {
    "protocol": "http",
    "port": 80
  }
}
```

## 🔒 Error Handling

### Standard Error Response

All API errors follow this format:

```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to perform this action",
    "details": {
      "requiredPermission": "write:projects",
      "currentPermissions": ["read:projects"]
    },
    "timestamp": "2024-01-15T15:30:00Z",
    "requestId": "req-789012"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required or invalid |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server internal error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## 📈 Rate Limiting

### Rate Limits

| Endpoint | Limit | Time Window |
|----------|-------|-------------|
| **Authentication** | 10 requests | 1 minute |
| **Code Generation** | 5 requests | 5 minutes |
| **GraphQL API** | 1000 requests | 1 hour |
| **Canvas Operations** | 100 requests | 1 minute |
| **Monitoring** | 500 requests | 1 hour |

### Rate Limit Headers

Rate limited responses include these headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1642275600
```

## 🔍 SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @kubegram/sdk
```

```typescript
import { KubegramClient } from '@kubegram/sdk';

const client = new KubegramClient({
  baseURL: 'https://api.kubegram.io',
  token: 'your_jwt_token'
});

// Create a project
const project = await client.projects.create({
  name: 'My Application',
  description: 'Web application with microservices'
});

// Generate code
const job = await client.codegen.submit({
  projectId: project.id,
  input: {
    modelProvider: 'anthropic',
    context: ['Production deployment']
  }
});
```

### Python

```bash
pip install kubegram-python
```

```python
from kubegram import KubegramClient

client = KubegramClient(
    base_url='https://api.kubegram.io',
    token='your_jwt_token'
)

# Create a project
project = client.projects.create(
    name='My Application',
    description='Web application with microservices'
)

# Generate code
job = client.codegen.submit(
    project_id=project.id,
    input={
        'model_provider': 'anthropic',
        'context': ['Production deployment']
    }
)
```

### Go

```bash
go get github.com/kubegram/go-sdk
```

```go
package main

import (
    "github.com/kubegram/go-sdk"
    "context"
)

func main() {
    client := kubegram.NewClient("https://api.kubegram.io", "your_jwt_token")
    
    // Create a project
    project, err := client.Projects.Create(context.Background(), &kubegram.CreateProjectRequest{
        Name:        "My Application",
        Description: "Web application with microservices",
    })
    if err != nil {
        panic(err)
    }
    
    // Generate code
    job, err := client.CodeGen.Submit(context.Background(), &kubegram.CodeGenRequest{
        ProjectID: project.ID,
        Input: kubegram.CodeGenInput{
            ModelProvider: "anthropic",
            Context:      []string{"Production deployment"},
        },
    })
    if err != nil {
        panic(err)
    }
}
```

## 🧪 Testing and Development

### Sandbox Environment

For testing, use the sandbox environment:

- **Base URL**: `https://api.sandbox.kubegram.io`
- **No authentication required** for most endpoints
- **Auto-cleanup**: Resources deleted after 24 hours

### Test Tokens

Generate test tokens for development:

```bash
# Create a test token
curl -X POST https://api.sandbox.kubegram.io/api/public/v1/auth/test-token \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "test-user-123",
       "role": "admin",
       "expiresIn": "24h"
     }'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2024-01-16T15:00:00Z"
}
```

This API reference provides comprehensive documentation for all Kubegram capabilities, from basic entity management to advanced AI orchestration and real-time cluster operations via MCP.