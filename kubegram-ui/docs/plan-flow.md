# Plan Flow

## Overview

The planning feature lets a user describe infrastructure changes in natural language and receive an AI-generated updated graph (new/modified Kubernetes nodes). It follows the same async job pattern as code generation: submit → poll → display.

```
Canvas (CanvasAIAssistant)
  → usePlanning hook
    → POST /api/v1/graph/plan  (kubegram-server)
      → KubeRAG GraphQL: InitializePlan  [primary]
        OR in-process WorkflowService    [fallback]
      ← jobId returned immediately
  → pollPlanCompletion(jobId)
    → GET /api/v1/graph/plan/:jobId/status  (repeated with backoff)
    → GET /api/v1/graph/plan/:jobId/results (once complete)
  → navigate('/plan-view', { state: { planResult } })
    → PlanViewPage: canvas + Spec/Context tabs
```

---

## UI Layer

### Trigger — CanvasAIAssistant + KonvaCanvas

**Files:** `src/components/CanvasAIAssistant.tsx`, `src/components/KonvaCanvas.tsx`

The AI Assistant panel has a "📋 Plan" mode tab. The user types a natural language request (e.g., "add HPA for the order service") and clicks **Generate Plan**. `KonvaCanvas` reads `selectedLlmProvider` / `selectedLlmModel` from Redux (`canvas.entities`) and calls:

```ts
generatePlan(currentGraph, userRequest, selectedLlmProvider, selectedLlmModel)
```

### Orchestration — usePlanning hook

**File:** `src/hooks/usePlanning.ts`

Local state only — no Redux slice. Manages `isPlanning`, `planResult`, `error`.

1. Calls `initializePlan(graph, userRequest, provider, model)` → receives `jobId`.
2. Calls `pollPlanCompletion(jobId, maxAttempts=60, initialDelay=2000ms)`.
   - 1.5× exponential backoff, capped at 10 s per poll.
3. On success: `navigate('/plan-view', { state: { planResult } })`.
4. On failure: sets `error` string.

### API Functions

**File:** `src/store/api/plan.ts`

| Function | HTTP | Purpose |
|---|---|---|
| `initializePlan()` | `POST /api/v1/graph/plan` | Submit job |
| `checkPlanStatus()` | `GET /api/v1/graph/plan/:id/status` | Poll status |
| `getPlanResults()` | `GET /api/v1/graph/plan/:id/results` | Fetch result |
| `pollPlanCompletion()` | — | Orchestrates polling with backoff |

**PlanResult shape** (from backend):
```ts
interface PlanResult {
  graph: CanvasGraph;   // updated graph with new/modified nodes
  context: string[];    // AI-generated assumptions, changes, recommendations
}
```

---

## Server Layer

**File:** `kubegram-server/src/services/plan.ts`

All endpoints require bearer token or session cookie auth.

### POST /api/v1/graph/plan

1. Validates input with Valibot schema.
2. `cleanGraphInput(graph)` — allowlist sanitization, normalises `nodeType` to UPPERCASE, strips canvas-only fields.
3. Forwards to KubeRAG via `graphqlSdk.InitializePlan()`.
   - **Fallback**: if KubeRAG is unreachable (ECONNREFUSED/ENOTFOUND/ETIMEDOUT), runs the workflow in-process via `WorkflowService`.
4. Returns `{ jobId, status, step }` immediately.

### GET /api/v1/graph/plan/:jobId/status and /results

- Checks `WorkflowService.isLocalJob(jobId)` — local jobs read from `EventCache`; remote jobs query KubeRAG GraphQL.

---

## Workflow Execution (kubegram-core)

**File:** `kubegram-core/src/workflows/plan-workflow.ts` (canonical)

Four sequential steps:

| Step | What happens |
|---|---|
| `ANALYZE_REQUEST` | LLM extracts infra requirements from the user's text |
| `GENERATE_GRAPH` | LLM generates new/modified graph nodes & edges |
| `VALIDATE_GRAPH` | Validates generated graph structure |
| `SAVE_GRAPH` | No-op — caller owns persistence |

Supports Claude, OpenAI, Gemini, Deepseek. Progress published via `WorkflowPubSub → EventBus → Redis`.

---

## Result Display — PlanViewPage

**File:** `src/pages/PlanViewPage.tsx` (route: `/plan-view`)

Receives `planResult` from React Router `location.state`. Two-panel layout:

- **Left** — Canvas rendering the planned graph via `JsonCanvasPage`.
- **Right** — 45% fixed panel with two tabs:
  - **Spec** tab — markdown-rendered plan specification. When no explicit markdown is provided, auto-derives it from the `context` array (groups into Changes / Assumptions / Recommendations sections).
  - **Context** tab — `context` array items rendered as individual cards.

### Mock data (preview mode only)

When `VITE_PREVIEW_MODE=true` and no route state is present, the page loads `MOCK_PLAN_RESULT` and `MOCK_PLAN_MARKDOWN` from `src/preview/mockData.ts`. This path is never taken in normal app usage.

---

## Route Map

| Route | Component | Access |
|---|---|---|
| `/plan-view` | `PlanViewPage` | `ProtectedRoute` |
| `/compare-view` | `CompareViewPage` | `ProtectedRoute` |
| `/test/plan` | `PlanTestPage` | Dev only |
| `/preview/plan-view` | `PlanViewPage` | Preview mode only |

---

## Key Architectural Notes

- **No Redux for plan state** — `usePlanning` uses local state; results travel between pages via `location.state`.
- **Dual-path resilience** — KubeRAG primary, in-process fallback; both expose the same job ID interface.
- **Shared async job pattern** — identical to codegen (same status enum, same polling backoff logic).
- **Input sanitization** — `cleanGraphInput()` uses an allowlist before the graph reaches the LLM.
- **Deprecation in progress** — `kuberag/src/workflows/plan-workflow.ts` is deprecated; `kubegram-core` is canonical.
