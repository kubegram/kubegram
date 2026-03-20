<!-- order: 6 -->

# Use Your Tools with Kubegram

Kubegram's MCP server speaks standard HTTP — which means any tool that can make a POST request or load an MCP server can become a Kubernetes infrastructure co-pilot. Connect your editor, AI builder, or internal dashboard and start controlling your infrastructure through natural language.

---

## Quick Comparison

| Tool | Category | MCP Support | Best for |
|---|---|---|---|
| VSCode + Copilot | Editor | ✅ Native (`.vscode/mcp.json`) | IaC review, manifest suggestions, inline codegen |
| Cursor | Editor | ✅ Native (`.cursor/mcp.json`) | Infrastructure-aware code completion |
| Windsurf | Editor | ✅ Native (`mcp_config.json`) | Cascade AI queries Kubegram while writing YAML |
| Google Antigravity | Agentic editor | ✅ Native (Agent UI) | Autonomous infrastructure design and validation |
| Bolt | AI app builder | ⚡ HTTP fetch | Build Kubernetes dashboards; call MCP endpoint from generated code |
| Lovable | AI app builder | ✅ Native (dashboard) | Internal K8s ops apps with Kubegram context |
| Retool | Internal tools | ✅ Via Agents UI | Ops dashboards — project browser, job monitor, manifest viewer |

> **Getting your token**: Log in to Kubegram → open DevTools → Application → Local Storage → copy the `accessToken` from the `kubegram_auth` key. Use it as the Bearer token in every config below.

---

## Coding Agents & Editors

These tools run inside your editor. Once connected, just talk to the agent as you would normally — it will call Kubegram tools automatically when the context calls for it.

---

### VSCode + GitHub Copilot

GitHub Copilot Chat added native MCP support (GA, July 2025). Add Kubegram as a project-level MCP server so Copilot can query your projects and generate manifests without leaving your editor.

Create `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "kubegram": {
      "type": "http",
      "url": "http://localhost:8090/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer <your-token>"
      }
    }
  }
}
```

Reload VSCode. Open Copilot Chat (`Ctrl+Shift+I` / `Cmd+Shift+I`) and switch to **Agent mode** — Kubegram tools will appear in the tool list.

**Try asking:**
```
@kubegram Generate Kubernetes manifests for a 3-tier web app with a React frontend,
Node.js API, and PostgreSQL database in the production namespace.
```

---

### Cursor

Create `.cursor/mcp.json` in your project root (or `~/.cursor/mcp.json` for a global config):

```json
{
  "mcpServers": {
    "kubegram": {
      "url": "http://localhost:8090/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer <your-token>"
      }
    }
  }
}
```

Restart Cursor. Kubegram tools are now available in Composer and the Agent panel.

**Try asking:**
```
List my Kubegram projects and generate a deployment manifest for the
one named "checkout-service" — use Claude as the LLM provider.
```

> For a full tool reference and JSON-RPC examples, see the [MCP Integration guide](/docs/how-it-works/mcp-integration).

---

### Windsurf (Codeium)

Windsurf's Cascade AI supports remote MCP servers natively. Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "kubegram": {
      "serverUrl": "http://localhost:8090/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer <your-token>"
      }
    }
  }
}
```

Restart Windsurf. Cascade will automatically discover and use Kubegram tools when you're working on Helm charts, Kubernetes YAML, or infrastructure code.

**Try asking:**
```
I'm writing a Helm chart for a gRPC service. Pull my Kubegram project
"payments-api" and make sure my values.yaml matches the generated manifests.
```

---

### Google Antigravity

Google Antigravity (launched December 2025) is an agentic development environment built for autonomous, multi-step engineering tasks. It has native MCP support and pairs especially well with Kubegram for infrastructure design at scale.

**Setup:**
1. Open the Antigravity Agent window
2. Click **Manage MCP Servers** → **View raw config**
3. Add the Kubegram entry:

```json
{
  "mcpServers": {
    "kubegram": {
      "type": "http",
      "url": "http://localhost:8090/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer <your-token>"
      }
    }
  }
}
```

4. Save and restart the Agent session.

**Try asking:**
```
Design a microservices infrastructure for an e-commerce platform. Use the
Kubegram canvas context and generate production-ready Kubernetes manifests
with resource limits, health checks, and HPA configuration.
```

Antigravity agents can run `generate_manifests`, poll `get_codegen_status` autonomously, and return final YAML — all in one uninterrupted workflow.

---

## AI App Builders

These tools generate full-stack applications from a prompt. Kubegram handles the Kubernetes deployment layer, so you can build the UI and ops tooling without writing a backend by hand.

---

### Bolt (bolt.new / bolt.diy)

Bolt doesn't have a local MCP config file, but because the Kubegram MCP server is a plain HTTP endpoint, you can call it directly from code Bolt generates for you.

**Prompt Bolt to build a Kubegram dashboard:**
```
Build a React app that shows my Kubegram projects. For each project,
display the project name, team, and the status of its most recent
codegen job. Fetch data from http://localhost:8090/api/v1/mcp using
JSON-RPC (method: tools/call, name: list_projects). Use my bearer
token stored in localStorage under the key "kubegram_token".
```

Bolt will scaffold the fetch calls for you. The generated code will look like:

```typescript
async function listProjects(token: string) {
  const res = await fetch('http://localhost:8090/api/v1/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'list_projects', arguments: {} },
    }),
  });
  const { result } = await res.json();
  return JSON.parse(result.content[0].text);
}
```

> **bolt.diy users**: You can configure a global MCP server URL via environment variable `MCP_SERVER_URL=http://localhost:8090/api/v1/mcp` and include the Authorization header in your session configuration.

---

### Lovable (lovable.dev)

Lovable has native MCP support via personal connectors — configured once in the dashboard, available in every project.

**Setup:**
1. Go to **Settings → Integrations → Add Custom MCP**
2. Fill in:
   - **Name**: `Kubegram`
   - **URL**: `http://localhost:8090/api/v1/mcp` *(or your hosted URL)*
   - **Auth**: Bearer Token → paste your JWT
3. Save. The connector is now available in every Lovable Agent session.

**Try asking:**
```
Build an internal Kubernetes operations portal. It should list all my
Kubegram projects, show the status of ongoing codegen jobs, and let
me trigger new manifest generation by selecting nodes. Use Kubegram
as the backend via the connected MCP server.
```

Lovable's agent will call `list_projects`, `get_codegen_status`, and `generate_manifests` automatically while scaffolding the UI, wiring up real data from your Kubegram workspace without you writing a single API call.

---

## Internal Tool Platforms

### Retool

Retool Agents support remote MCP servers with bearer token authentication — ideal for building Kubernetes ops dashboards for your team without a custom backend.

**Setup:**
1. Open your Retool workspace → **Agents** → select or create an agent
2. Click **Tools** → **Connect MCP Server**
3. Enter:
   - **Server URL**: `http://localhost:8090/api/v1/mcp`
   - **Auth type**: Bearer Token
   - **Token**: `<your-jwt-token>`
4. Save. The agent can now call all 17 Kubegram tools.

**Building a project dashboard:**

In a Retool app, add a **JavaScript Query** that calls the agent:

```javascript
// Query: "kubegrampProjects"
return await retoolAgent.run(
  'List all my Kubegram projects and for each one get the status of its latest codegen job',
  { mcpServer: 'kubegram' }
);
```

Or call the MCP endpoint directly via a **REST API resource**:

```
POST http://localhost:8090/api/v1/mcp
Authorization: Bearer {{ kubegram_token.value }}
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_projects",
    "arguments": {}
  }
}
```

Bind the response to a Table component — you'll have a live project browser in minutes.

---

## Ready-to-Paste Prompts

Copy these directly into your agent of choice.

### Editor agents (VSCode, Cursor, Windsurf, Antigravity)

```
Generate Kubernetes manifests for a Node.js API with 3 replicas,
resource limits of 500m CPU and 512Mi memory, and a HorizontalPodAutoscaler
targeting 70% CPU. Use my default project or create one called "api-service".
```

```
Check the status of my most recent codegen job. If it's complete,
show me the generated YAML for the Deployment and Service resources.
```

```
Create an infrastructure plan for a multi-region microservice setup
with 4 services: auth, payments, notifications, and an API gateway.
Summarise the recommendations in bullet points.
```

```
List all my Kubegram projects created in the last 30 days.
For each one, tell me the team it belongs to and whether it
has a completed codegen job.
```

### AI app builders (Bolt, Lovable)

```
Build a Kubernetes infrastructure dashboard that shows:
- A list of all my Kubegram projects
- The status badge of the latest codegen job for each project
- A "Generate Manifests" button that triggers a new job
- A modal that shows the generated YAML when a job completes
Fetch all data from the Kubegram MCP server at http://localhost:8090/api/v1/mcp.
```

```
Build an internal ops portal for my team. It should let us browse
Kubegram projects, trigger infrastructure planning jobs, and view
the AI-generated recommendations. Use Tailwind for styling and
React Query for data fetching.
```

### Internal tools (Retool)

```
Create a Retool dashboard with three panels: (1) a table of all
Kubegram projects with their team and creation date, (2) a job
status tracker that polls every 5 seconds for active jobs,
(3) a YAML viewer that displays the generated manifests when
a job completes. Use the Kubegram MCP server as the data source.
```

---

## See Also

- [MCP Integration Guide](./mcp-integration) — full tool reference, workflow examples, and raw JSON-RPC reference
- [Local Development Setup](../getting-started/setup) — install and run Kubegram locally before connecting your agent
