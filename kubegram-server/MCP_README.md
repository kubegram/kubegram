# Kubegram MCP Server

The kubegram-server exposes a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server, allowing AI assistants (Claude Desktop, Claude Code, etc.) to interact with the Kubegram platform programmatically.

## Endpoint

```
/api/v1/mcp
```

Uses the **Streamable HTTP transport** in stateless mode (`enableJsonResponse: true`). POST handles tool calls; GET handles SSE streaming. A fresh `McpServer` instance is created per request — no in-memory session state, making it horizontally scalable. Compatible with MCP protocol version 2025-03-26+.

## Authentication

All requests require a valid Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

`requireAuth` resolves the token before the transport is created. Unauthenticated requests receive a `401` response.

## Client Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

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

### Claude Code

```bash
claude mcp add --transport http kubegram http://localhost:8090/api/v1/mcp \
  --header "Authorization: Bearer <your-jwt-token>"
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
| `create_project` | Create a new project in the current user's team |
| `update_project` | Update a project's name or graph metadata |
| `delete_project` | Soft-delete a project |

**`create_project` inputs**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✓ | Project name |
| `graphId` | string | — | Optional graph ID |
| `graphMeta` | string | — | Optional graph metadata (JSON string) |

**`update_project` inputs**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | number | ✓ | Project ID |
| `name` | string | — | New project name |
| `graphMeta` | string | — | New graph metadata (JSON string) |

---

### Code Generation

| Tool | Description |
|---|---|
| `generate_manifests` | Start a Kubernetes manifest generation job. Returns a `jobId` to poll. |
| `get_codegen_status` | Poll the status of a generation job (`pending` → `running` → `completed` / `failed`) |
| `get_codegen_results` | Retrieve the generated manifests for a completed job |
| `cancel_codegen` | Cancel a running generation job |

**`generate_manifests` inputs**

| Field | Type | Required | Description |
|---|---|---|---|
| `graphName` | string | ✓ | Name of the graph / project |
| `graphType` | enum | ✓ | `KUBERNETES` \| `INFRASTRUCTURE` \| `ABSTRACT` \| `DEBUGGING` \| `MICROSERVICE` |
| `companyId` | string | ✓ | Company UUID |
| `nodes` | array | ✓ | Graph nodes array |
| `bridges` | array | — | Graph edges/bridges array |
| `description` | string | — | Graph description |
| `projectName` | string | — | Project name (creates a new project if omitted) |
| `projectId` | string | — | Existing project ID to associate with |
| `llmProvider` | enum | — | `CLAUDE` \| `OPENAI` \| `GOOGLE` \| `DEEPSEEK` \| `GEMMA` |

---

### Infrastructure Planning

| Tool | Description |
|---|---|
| `create_plan` | Start an AI-driven infrastructure planning job for a graph |
| `get_plan_status` | Poll the status of a planning job |
| `get_plan_results` | Retrieve the results of a completed planning job |

**`create_plan` inputs**

| Field | Type | Required | Description |
|---|---|---|---|
| `graph` | any | ✓ | Graph data to plan infrastructure for |
| `userRequest` | string | — | Natural language instruction for the planner |
| `modelProvider` | string | — | LLM provider (e.g. `CLAUDE`, `OPENAI`) |
| `modelName` | string | — | LLM model name |

---

### Companies & Teams

| Tool | Description |
|---|---|
| `list_companies` | List all companies in the system |
| `get_company` | Get a company by UUID |
| `list_teams` | List all teams in the system |
| `get_team` | Get a team by ID |

---

### Users & Health

| Tool | Description |
|---|---|
| `get_current_user` | Returns `{ id, email, name, avatar, role, teamId }` for the authenticated user |
| `check_health` | Returns `{ server, database, timestamp }` — `database` is `"ok"`, `"error"`, or `"unavailable"` |

---

## Typical Workflow

```
1. get_current_user          → confirm auth, get teamId and companyId
2. list_projects             → browse existing projects
3. create_project            → create a project to hold the generation
4. generate_manifests        → kick off a codegen job with graph data
5. get_codegen_status        → poll until status = "completed"
6. get_codegen_results       → retrieve the generated YAML manifests
```

For infrastructure planning, replace steps 4–6 with `create_plan` → `get_plan_status` → `get_plan_results`.

---

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

Mounted in `src/routes/index.ts` at `/v1/mcp`, accessible at `/api/v1/mcp`.

### Design Notes

- **SDK**: [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) v1.26+
- **Transport**: `WebStandardStreamableHTTPServerTransport` with `enableJsonResponse: true` — Fetch API native, runs on Bun without a Node.js bridge
- **Stateless**: No `sessionIdGenerator` → no in-memory session map → horizontally scalable
- **Auth pattern**: `requireAuth(c)` resolves the `AuthContext` before the transport is created; tools close over it without threading context through the SDK
- **Schema**: Zod v3 shapes passed directly to `registerTool` as `inputSchema`
- **Return type**: Tools return `CallToolResult` via `mcpJson(data)` (success) or `mcpError(message)` (error, `isError: true`)
