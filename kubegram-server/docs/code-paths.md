# Kubegram Server — Code Paths

API gateway and auth server built on **Hono.js** running on **Bun**, backed by **PostgreSQL** (Drizzle ORM) and optional **Redis** (HA mode). Proxies graph operations to the **KubeRAG** service.

---

## 1. Request Lifecycle

Every inbound HTTP request passes through the same middleware chain before reaching a route handler.

```mermaid
flowchart TD
    REQ["HTTP Request"] --> CORS["corsMiddleware\nmiddleware/cors.ts"]
    CORS --> OAM["openAuthMiddleware\nmiddleware/openauth.ts"]
    OAM --> ROUTER["Hono Router\nindex.ts"]

    ROUTER -->|"/.well-known/*\n/oauth/*"| OAUTH["OpenAuth App\nauth/openauth.ts"]
    ROUTER -->|"/assets/*\n/logo.png"| STATIC["Static Files\nserveStatic"]
    ROUTER -->|"/api/public/v1/*"| PUBAPI["Public API Routes\nroutes/api/v1/public/"]
    ROUTER -->|"/api/v1/admin/*"| ADMIN["Admin Routes\nroutes/api/v1/admin/"]
    ROUTER -->|"/api/v1/graph/*"| GRAPH["Graph Routes\nroutes/api/v1/graph/"]
    ROUTER -->|"/api/v1/mcp"| MCP["MCP Endpoint\nmcp/index.ts"]
    ROUTER -->|"/api/v1/users\n/api/v1/providers\n/api/v1"| OTHER["Other API Routes\nusers, providers, tokens"]
    ROUTER -->|"/api/internal/*"| INT["Internal Routes\nroutes/internal.ts"]
    ROUTER -->|"/* fallback"| SSR["SSR Fallback\nssr/render.tsx"]

    PUBAPI --> AUTH_MW["requireAuth\nmiddleware/auth.ts"]
    GRAPH --> AUTH_MW
    MCP --> AUTH_MW
    ADMIN --> AUTH_MW

    AUTH_MW -->|"Bearer token or\nsession cookie"| HANDLER["Route Handler\nc.get('auth') → AuthContext"]
```

---

## 2. Authentication Flow

### 2a. OAuth Login (new session)

```mermaid
sequenceDiagram
    participant Client
    participant Server as kubegram-server
    participant DB as PostgreSQL
    participant Redis
    participant Provider as OAuth Provider<br/>(GitHub / Google / GitLab)

    Client->>Server: GET /oauth/{provider}
    Server->>Provider: Redirect (PKCE auth URL)
    Provider-->>Client: Login page
    Client->>Provider: User authorises
    Provider->>Server: GET /oauth/callback?code=...
    Server->>Provider: POST /token (exchange code)
    Provider-->>Server: access_token + profile

    Server->>DB: SELECT user WHERE email = ?
    alt New user
        Server->>DB: INSERT company → organization → team → user
    else Existing user
        Server->>DB: verify team membership
    end

    alt ENABLE_HA = true
        Server->>Redis: SETEX session:{id} (TTL)
    else
        Server->>Server: in-memory session store
    end

    Server-->>Client: Set-Cookie: session=... (HttpOnly, SameSite=Lax)
```

### 2b. Protected Route Access

```mermaid
flowchart LR
    REQ["Request with\nBearer token OR session cookie"] --> AUTH["requireAuth\nmiddleware/auth.ts"]
    AUTH -->|"Bearer JWT"| VERIFY["verifyToken(header)\ncheck JWT_SECRET"]
    AUTH -->|"session cookie"| SESS["validateSession(cookie)\nlookup in Redis / memory"]
    VERIFY --> DB_U["SELECT user FROM DB"]
    SESS --> DB_U
    DB_U -->|"user found"| CTX["c.set('auth', { user, sessionId })\n→ AuthContext available in handler"]
    DB_U -->|"not found"| E401["401 Unauthorized"]
```

---

## 3. Code Generation Flow

The most complex path — from canvas graph data to Kubernetes manifests.

```mermaid
sequenceDiagram
    participant Client
    participant Route as codegen.ts<br/>routes/api/v1/graph/
    participant SVC as CodegenService<br/>services/codegen.ts
    participant WF as WorkflowService<br/>(KubeRAG proxy)
    participant RAG as KubeRAG<br/>GraphQL API
    participant DB as PostgreSQL

    Client->>Route: POST /api/public/v1/graph/codegen<br/>{ graph: {nodes, bridges, graphType}, projectId? }
    Route->>Route: requireAuth → AuthContext
    Route->>Route: parseJsonFields (normalise arrays)

    Route->>SVC: storeProjectMetadata(graph, auth)
    SVC->>DB: UPSERT projects (graphMeta JSON)
    DB-->>SVC: project.id

    Route->>SVC: initializeCodeGeneration(graph, projectId)
    SVC->>SVC: cleanGraph (graph-input-cleaner.ts)
    SVC->>WF: executeCodegen(workflowGraph)
    WF->>RAG: GraphQL mutation InitializeCodeGen
    RAG-->>WF: { jobId, status }
    WF-->>SVC: { jobId, status }

    SVC->>DB: INSERT generation_jobs (uuid=jobId, status=pending)
    DB-->>SVC: job.id

    SVC-->>Route: { jobId, status, projectId }
    Route-->>Client: 202 { jobId, status, projectId }

    loop Polling
        Client->>Route: GET /api/public/v1/graph/codegen/:jobId/status
        Route->>DB: SELECT generation_jobs WHERE uuid = jobId
        DB-->>Route: { status, progress }
        alt still running
            Route-->>Client: 202 { status: "running", progress }
        else completed
            Route-->>Client: 200 { status: "completed" }
        end
    end

    Client->>Route: GET /api/public/v1/graph/codegen/:jobId/results
    Route->>DB: SELECT generation_job_artifacts WHERE job_id = ?
    DB-->>Route: [{ filename, content }]
    Route-->>Client: 200 { manifests: [...] }
```

---

## 4. Service & Repository Layers

All route handlers go through a permission check before touching the database via the repository abstraction.

```mermaid
flowchart TD
    HANDLER["Route Handler"] --> PERM["GraphPermissions\nservices/permissions.ts"]

    PERM -->|"canAccessProject(userId, projectId)"| REPO["getRepositories()\nrepositories/index.ts"]
    PERM -->|"getUserAccessibleProjects(userId)"| REPO
    PERM -->|"denied"| E403["403 Forbidden"]

    REPO --> DRIZZLE["Drizzle ORM\ndb/index.ts"]
    REPO -->|"DB unavailable"| CACHE["EventCache\nin-memory fallback"]

    DRIZZLE --> PG["PostgreSQL\n:5432"]

    REPO --> REPOS["Repositories:\n• projects\n• users\n• companies\n• organizations\n• teams\n• generationJobs\n• generationJobArtifacts\n• companyCertificates\n• companyLlmTokens\n• operatorTokens\n• operators"]
```

---

## 5. MCP Tool Dispatch

Claude Desktop (and other MCP clients) connect via a stateless HTTP transport and call registered tools.

```mermaid
flowchart TD
    CLIENT["MCP Client\n(e.g. Claude Desktop)"] -->|"POST /api/v1/mcp"| MCPEP["MCP Endpoint\nmcp/index.ts"]

    MCPEP --> AUTH_MW["requireAuth\n→ AuthContext"]
    AUTH_MW --> SERVER["McpServer\n(stateless HTTP transport)"]

    SERVER --> TOOLS["Registered Tools"]

    TOOLS --> T1["generate_manifests\nmcp/tools/codegen.ts\n→ CodegenService"]
    TOOLS --> T2["get_codegen_status\nmcp/tools/codegen.ts\n→ DB query"]
    TOOLS --> T3["list_projects\nmcp/tools/projects.ts\n→ getRepositories()"]
    TOOLS --> T4["plan_infrastructure\nmcp/tools/codegen.ts\n→ KubeRAG plan"]
    TOOLS --> T5["get_company_info\nmcp/tools/companies.ts\n→ getRepositories()"]
    TOOLS --> T6["list_teams\nmcp/tools/teams.ts\n→ getRepositories()"]
    TOOLS --> T7["health_check\nmcp/tools/health.ts\n→ DB + Redis ping"]

    T1 --> CODEGEN_SVC["CodegenService\nservices/codegen.ts"]
    T3 --> REPO["getRepositories()\nrepositories/"]
    T5 --> REPO
    T6 --> REPO
    CODEGEN_SVC --> RAG["KubeRAG\nclients/rag-client.ts"]
```

---

## 6. Internal Routes (no user auth)

Cluster-internal endpoints used by sidecars and CI/CD automation.

```mermaid
flowchart LR
    SIDECAR["Pod Sidecar"] -->|"POST /api/internal/metrics/traffic"| REG["Sidecar Registry\nservices/sidecar-registry.ts"]
    SIDECAR -->|"POST /api/internal/sidecar/validation/results"| RESULTS["Result Store"]

    ORCHESTRATOR["Orchestrator"] -->|"GET /api/internal/sidecars?namespace=X"| DISC["Sidecar Discovery"]
    ORCHESTRATOR -->|"POST /api/internal/sidecar/validate"| TRIGGER["Trigger Test Cases"]
    ORCHESTRATOR -->|"GET /api/internal/validation/results"| RESULTS

    GITHUB["GitHub App\nWebhook"] -->|"POST /api/internal/github/pr-merged\n(HMAC-verified secret)"| ARGO["ArgoCD Sync\nservices/argocd.ts"]
```

---

## Glossary

| Term | Meaning |
|------|---------|
| **KubeRAG** | RAG engine at `KUBERAG_URL` — handles LLM calls, graph analysis, vector search (Dgraph) |
| **MCP** | Model Context Protocol — lets Claude Desktop call server tools directly |
| **HA mode** | High-availability mode (`ENABLE_HA=true`) — uses Redis for session storage instead of in-memory |
| **AuthContext** | `{ user, sessionId }` injected by `requireAuth` middleware into every protected handler |
| **EventCache** | In-memory LRU/TTL cache used as fallback when PostgreSQL is unavailable |
| **Drizzle ORM** | Type-safe SQL query builder; all DB access goes through `src/db/schema.ts` definitions |
