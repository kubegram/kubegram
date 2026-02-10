# Plan: Local `@kubegram/common-ts` Access (No Publish)

## Goal
Make `./common-ts` consumable by `./kubegram-server` and `./kubegram-ui` without publishing to a registry.

## Constraints & Observations
- This repo is not currently a workspace (no root `package.json`).
- `kubegram-server` (Bun) and `kubegram-ui` (Vite) both import from `@kubegram/common-ts`.
- `common-ts` is a TypeScript package with `dist/` outputs.

## Recommended Approach (Option A): npm Workspaces at Repo Root
1. Add a root `package.json` with `workspaces`:
   - `common-ts`
   - `kubegram-server`
   - `kubegram-ui`
2. Update `kubegram-server/package.json` and `kubegram-ui/package.json` to depend on:
   - `"@kubegram/common-ts": "workspace:*"`
3. Install once at the root (e.g. `npm install` or `bun install`).
4. Build `common-ts` locally (`npm run build` in `common-ts`) or add a root script to build it first.
5. Verify imports resolve and dev servers run.

## Alternative (Option B): File Dependency Per App
1. In `kubegram-server/package.json` and `kubegram-ui/package.json`:
   - `"@kubegram/common-ts": "file:../common-ts"`
2. Run install in each project after the change.
3. Build `common-ts` locally before running apps.

## Alternative (Option C): Local Link
1. `npm link` from `common-ts`
2. `npm link @kubegram/common-ts` in `kubegram-server` and `kubegram-ui`
3. Build `common-ts` and use the linked package.

## Follow-up Tasks
- Ensure `common-ts` builds cleanly with local dependencies.
- Optionally add a root script to build/watch `common-ts` during dev.

## Decision Needed
Pick Option A (workspace), Option B (file deps), or Option C (link).
