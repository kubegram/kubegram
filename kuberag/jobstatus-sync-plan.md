# Job Status Sync Plan

## Goal
Align job status semantics and values across @common-ts, @kubegram-ui, @kubegram-server, and @kuberag using a single canonical contract.

## Current Snapshot
- @kuberag emits status values like `pending`, `running`, `completed`, `failed`, `cancelled` and uses step values like `queued`, `processing`, and workflow step names.
- @kubegram-server stores `pending|running|completed|failed|cancelled` in the DB, but API checks for both lowercase and uppercase values.
- @kubegram-ui expects `QUEUED|STARTED|COMPLETED|ERROR|CANCELLED` and treats other values as unknown.
- @common-ts exposes GraphQL `JobStatus.status` as a `String` and tests currently expect uppercase values.

## Proposed Canonical Status Contract
- Canonical status values: `pending`, `running`, `completed`, `failed`, `cancelled`.
- Canonical step values: workflow step names plus `queued` as the initial step.
- Legacy mapping (temporary): `QUEUED -> pending`, `STARTED -> running`, `ERROR -> failed`.

## Plan
1. Confirm the schema source of truth and lock the contract.
2. Decide whether to add a GraphQL `enum JobStatusStatus` (preferred for type safety).
3. @common-ts: export `JobStatusStatus`, `JOB_STATUS`, and helpers like `normalizeJobStatus` and `isTerminalJobStatus`.
4. @kuberag: update job status types to `JobStatusStatus` and ensure all emitted statuses use canonical values.
5. @kubegram-server: enforce canonical values in API responses and DB writes, remove dual-case checks, add legacy mapping during rollout.
6. @kubegram-ui: replace local status unions with `JobStatusStatus`, update polling and Redux logic, map canonical values to UI labels.
7. Update tests and docs to the canonical set and add coverage for transitions and timeouts.
8. Rollout sequence: backend first with compatibility mapping, then common-ts and UI; remove mappings after a deprecation window.

## Definition of Done
- All packages compile against the same `JobStatusStatus`.
- API responses always use canonical values.
- UI polling handles only canonical values (no dual-case checks).
- Tests pass and no unknown-status logs in normal flows.
