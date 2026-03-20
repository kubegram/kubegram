# Kubegram MCP Server

The kubegram-server exposes a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server, allowing AI assistants (Claude Desktop, Claude Code, etc.) to interact with the Kubegram platform programmatically.

## Endpoint

```
POST /api/v1/mcp
```

Uses the **Streamable HTTP transport** in stateless mode. Each request is fully independent — no session state is maintained on the server. Compatible with any MCP client that supports Streamable HTTP (MCP protocol version 2025-03-26+).

## Authentication

All requests require a valid Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

The token is validated before the MCP transport processes the request. Unauthenticated requests receive a `401` response.

## Client Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kubegram": {
      "type": "http",
      "url": "http://localhost:8090/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer <your-jwt-token>"
      }
    }
  }
}
```

### Curl (quick test)

```bash
curl -X POST http://localhost:8090/api/v1/mcp \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Available Tools

### Projects

| Tool | Description |
|---|---|
| `list_projects` | List all projects accessible to the current user (team-scoped) |
| `get_project` | Get a project by ID |
| `create_project` | Create a new project in the user's team |
| `update_project` | Update project name or graph metadata |
| `delete_project` | Soft-delete a project |

### Code Generation

| Tool | Description |
|---|---|
| `generate_manifests` | Start a Kubernetes manifest generation job from a graph. Returns a `jobId` to poll. |
| `get_codegen_status` | Poll the status of a generation job (`pending` → `running` → `completed`/`failed`) |
| `get_codegen_results` | Retrieve the generated manifests for a completed job |
| `cancel_codegen` | Cancel a running generation job |

### Infrastructure Planning

| Tool | Description |
|---|---|
| `create_plan` | Start an AI-driven infrastructure planning job for a graph |
| `get_plan_status` | Poll the status of a planning job |
| `get_plan_results` | Retrieve the results of a completed planning job |

### Companies & Teams

| Tool | Description |
|---|---|
| `list_companies` | List all companies |
| `get_company` | Get a company by UUID |
| `list_teams` | List all teams |
| `get_team` | Get a team by ID |

### Users & Health

| Tool | Description |
|---|---|
| `get_current_user` | Get the currently authenticated user's profile |
| `check_health` | Check server and database health |

## Typical Workflow

```
1. get_current_user          → confirm auth and see teamId
2. list_projects             → browse existing projects
3. create_project            → create a project to hold the generation
4. generate_manifests        → kick off a codegen job with graph data
5. get_codegen_status        → poll until status = "completed"
6. get_codegen_results       → retrieve the generated YAML manifests
```

For infrastructure planning, replace steps 4–6 with `create_plan` → `get_plan_status` → `get_plan_results`.

## Implementation

### File Structure

```
kubegram-server/src/mcp/
├── index.ts               # Hono route handler — mounts the MCP transport
├── server.ts              # McpServer factory — registers all tools
├── types.ts               # mcpJson() / mcpError() helpers
└── tools/
    ├── projects.ts
    ├── codegen.ts
    ├── plan.ts
    ├── companies.ts
    ├── teams.ts
    ├── users.ts
    └── health.ts
```

Registered in `src/routes/index.ts` at `/v1/mcp`.

### Design Notes

- **SDK**: [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) v1.26.0
- **Transport**: `WebStandardStreamableHTTPServerTransport` — Fetch API native, runs on Bun without any Node.js bridge
- **Stateless**: No `sessionIdGenerator` → no in-memory session map → horizontally scalable
- **Auth pattern**: `requireAuth(c)` resolves the `AuthContext` before the transport is created; tools close over it without any context threading through the SDK
- **Schema**: Zod v4 shapes passed directly to `registerTool` as `inputSchema`
- **Return type**: Tools return the SDK's `CallToolResult` via `mcpJson(data)` or `mcpError(message)`
