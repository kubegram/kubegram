# Kubegram UI — Diagrams

Four diagrams covering routes & navigation, auth flow, code generation flow, and the component/API map.

---

## 1. Route & Navigation Flow

```mermaid
flowchart TD
    U([User / Browser])

    U --> LP["/ — LandingPage\n(standalone, no sidebar)"]

    LP -->|"Get Started / Login button"| LM(["LoginModal\n(multi-provider OAuth)"])
    LP -->|docs link| DOCS["/docs/* — DocsPage\n(DocsLayout)"]
    LP -->|blog link| BLOG["/blog — BlogListPage\n(BlogLayout)"]
    LP -->|about link| ABOUT["/about — AboutPage\n(BlogLayout)"]
    BLOG --> BLOGPOST["/blog/:slug — BlogPage"]

    LM -->|"initiateLogin(provider)"| OP[("OAuth Provider\nGitHub / Google / GitLab / Okta / OIDC")]
    OP -->|"redirect with code"| CB["/auth/callback — OAuthCallback"]
    CB -->|"tokens stored → navigate"| HOME["/home — HomePage"]
    CB -->|auth error| RPT["/reports — ReportsPage"]

    HOME -->|"click project"| APP["/app — KonvaPage"]
    APP -->|"codegen complete"| CVJ["/code-view/:jobId — CodeViewPage\n🔒 ProtectedRoute"]

    subgraph SB["App Sidebar (all app pages)"]
        SBH["Home"]
        SBC["Canvas"]
        SBCV["Code View"]
        SBCM["Compare"]
    end

    APP --- SB
    HOME --- SB
    CVJ --- SB

    SBH -->|navigate| HOME
    SBC -->|navigate| APP
    SBCV -->|navigate| CV["/code-view — CodeViewPage\n🔒 ProtectedRoute"]
    SBCM -->|navigate| CM["/compare-view — CompareViewPage\n🔒 ProtectedRoute"]

    APP --> JC["/json-canvas — JsonCanvasPage"]
    APP --> KA["/konva — KonvaPage (alias)"]

    ERR(["401 / 403 response"]) -->|"window triggerLoginModal event"| LM

    subgraph DEV["Dev & Utility Routes (no auth)"]
        TC["/test/codegen — CodegenTestPage"]
        TP["/test/plan — PlanTestPage"]
        OI["/oauth-providers — OAuthProviderInfo"]
    end

    subgraph PREVIEW["Preview Mode Routes\n(VITE_PREVIEW_MODE=true, lazy-loaded)"]
        PC["/preview/canvas — KonvaPage"]
        PCO["/preview/code-view — CodeViewPage"]
        PCM["/preview/compare-view — CompareViewPage"]
        PPV["/preview/plan-view — PlanViewPage (React.lazy)"]
    end
```

---

## 2. OAuth & Auth Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Browser / UI
    participant LM as LoginModal
    participant OC as OAuthCallback
    participant AC as axiosClient (interceptors)
    participant SV as kubegram-server :8090
    participant OP as OAuth Provider

    User->>UI: Click "Get Started" or "Login"
    UI->>LM: Open modal (triggerLoginModal event)
    User->>LM: Select provider
    LM->>OP: Redirect with PKCE code_challenge
    OP-->>User: Consent screen
    User->>OP: Authorize
    OP->>OC: Redirect to /auth/callback?code=...

    OC->>OC: openAuthClient.exchange(code, verifier)
    OC->>SV: GET /api/v1/users/me
    SV-->>OC: user profile
    OC->>SV: GET /api/v1/public/teams?userId={id}
    SV-->>OC: team data
    OC->>SV: GET /api/v1/public/organizations?teamId={id}
    SV-->>OC: organization data
    OC->>SV: GET /api/v1/public/companies?organizationId={id}
    SV-->>OC: company data

    OC->>UI: Store kubegram_auth in localStorage
    OC->>UI: Dispatch to Redux oauth slice
    OC->>UI: Store context keys (x-kubegram-current-team, etc.)
    OC->>UI: navigate("/home")

    Note over AC,SV: Every Subsequent Request
    AC->>AC: Inject Authorization: Bearer {accessToken}
    AC->>AC: Inject X-Kubegram-Team-Id
    AC->>AC: Inject X-Kubegram-Organization-Id
    AC->>AC: Inject X-Kubegram-Company-Id

    Note over AC,SV: Silent Token Refresh (on 401)
    SV-->>AC: 401 Unauthorized
    AC->>AC: Queue failed request
    AC->>SV: POST /api/v1/public/auth/refresh
    SV-->>AC: new accessToken
    AC->>AC: Retry all queued requests

    Note over AC,SV: Hard Auth Failure (400 / 403)
    SV-->>AC: 400 / 403
    AC->>UI: Clear localStorage kubegram_auth
    AC->>UI: Dispatch logout to Redux
    AC->>UI: Emit triggerLoginModal event
```

---

## 3. Code Generation Flow

```mermaid
sequenceDiagram
    actor User
    participant KP as KonvaPage
    participant CGM as CodeGenerationModal
    participant AC as axiosClient
    participant SV as kubegram-server :8090
    participant CVP as CodeViewPage
    participant RDX as Redux codegen slice
    participant LS as localStorage

    User->>KP: Design canvas (nodes + connections)
    User->>KP: Click "Generate Code" in toolbar
    KP->>CGM: Open modal

    User->>CGM: Select LLM provider + model
    User->>CGM: Confirm

    CGM->>AC: POST /api/v1/public/graph/codegen
    Note right of AC: Body: { graph, llmConfig, project, context }
    AC->>SV: POST /api/v1/public/graph/codegen
    SV-->>AC: { jobId }
    AC-->>CGM: jobId

    CGM->>RDX: dispatch startJobTracking({ jobId, graphId })
    CGM->>KP: navigate("/code-view/{jobId}")

    loop Exponential Backoff Polling
        Note over CVP,SV: Delays: start 30s → ×1.5 per poll → max 5 min per poll → 30 min total timeout
        CVP->>AC: GET /api/v1/public/graph/codegen/{jobId}/status
        AC->>SV: GET /api/v1/public/graph/codegen/{jobId}/status
        SV-->>AC: { status }
        AC-->>CVP: status
        CVP->>RDX: dispatch updateJobStatus({ jobId, status })

        alt status = PENDING or RUNNING
            CVP->>CVP: Wait backoff interval, poll again
        else status = COMPLETED
            CVP->>AC: GET /api/v1/public/graph/codegen/{jobId}/results
            AC->>SV: GET /api/v1/public/graph/codegen/{jobId}/results
            SV-->>AC: { graphId, nodes[{ id, config, spec, generatedCodeMetadata }] }
            AC-->>CVP: CodegenResults
            CVP->>LS: Save to kubegram_generated_code (localStorage + 30-day cookie)
            CVP->>RDX: dispatch completeJobTracking({ jobId, results })
        else status = FAILED
            CVP->>RDX: dispatch failJobTracking({ jobId, error })
            CVP->>User: Show error message
        end
    end

    CVP->>User: Render 70% canvas + 30% CodePanel with generated YAML/JSON
    CVP->>CVP: JobHistorySidebar loads GET /api/v1/public/graph/codegen?projectId={id}
```

---

## 4. Component & API Map

```mermaid
flowchart LR
    subgraph PAGES["Pages"]
        HP["HomePage"]
        KP["KonvaPage\n(/app, /konva)"]
        CVP["CodeViewPage\n(/code-view/:jobId)"]
        CMV["CompareViewPage\n(/compare-view)"]
        LP2["LoginPage + OAuthCallback\n(/login, /auth/callback)"]
    end

    subgraph COMP["Key Components"]
        PL["ProjectList"]
        KC["KonvaCanvas"]
        TB["KonvaToolbar"]
        CGM["CodeGenerationModal\n+ CodeGenerationPanel"]
        AIS["AISuggestionPanel\n(CanvasAIAssistant)"]
        SB["Sidebar"]
        CP["CodePanel"]
        JHS["JobHistorySidebar"]
        GCD["GeneratedCodeDisplay"]
        GSP["GraphSyncProvider\n(background sync)"]
    end

    subgraph STORE["Redux Store"]
        CS["canvas\n(entities, activity, configs, data)"]
        CGS["codegen\n(jobs, history, stats)"]
        OS["oauth\n(user, tokens, isAuthenticated)"]
        PS["project + company\n+ organization + team"]
    end

    subgraph API["kubegram-server API :8090"]
        AU["GET /api/v1/users/me"]
        PR["GET /api/v1/providers"]
        PJ["GET|POST /api/v1/public/projects\nGET|PUT|DELETE /api/v1/public/projects/:id"]
        GR["GET|PUT /api/v1/public/graph/crud/:graphId"]
        CG1["POST /api/v1/public/graph/codegen"]
        CG2["GET /api/v1/public/graph/codegen/:id/status"]
        CG3["GET /api/v1/public/graph/codegen/:id/results"]
        CG4["GET /api/v1/public/graph/codegen?projectId="]
        SG["POST /api/v1/graph/suggest"]
        TM["GET|POST|PUT|DELETE /api/v1/public/teams"]
        ORG["GET|POST|PUT|DELETE /api/v1/public/organizations"]
        CO["GET|POST|PUT|DELETE /api/v1/public/companies"]
        RF["POST /api/v1/public/auth/refresh"]
        LO["POST /api/v1/public/auth/logout"]
    end

    HP --> PL --> PJ
    HP --> SB

    KP --> KC
    KP --> TB
    KP --> CGM
    KP --> AIS
    KP --> SB
    KP --> PR
    KC --> GR
    CGM --> CG1
    CGM --> CG2
    AIS --> SG
    GSP --> GR

    CVP --> CP
    CVP --> JHS
    CVP --> GCD
    CVP --> CG2
    CVP --> CG3
    JHS --> CG4
    CVP --> SB

    CMV --> GR
    CMV --> SB

    LP2 --> AU
    LP2 --> TM
    LP2 --> ORG
    LP2 --> CO

    OS --> AU
    OS --> RF
    OS --> LO
    PS --> TM
    PS --> ORG
    PS --> CO
    PS --> PJ
```
