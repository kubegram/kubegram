# Plan: EventCache Fallback for PostgreSQL-less Deployments

## Context

The kubegram-server crashes at startup if `DATABASE_URL` is missing (non-null assertion in `src/db/index.ts`). The goal is: when PostgreSQL is unavailable, the server falls back to `EventCache` from `@kubegram/events` as an in-memory (or Redis-backed) entity store, so the server can run without a DB. Existing behavior when a DB *is* connected must be unchanged.

OpenAuth session tables are handled separately: the existing `ENABLE_HA=true` → Redis path already covers sessions without DB. No changes to the auth layer are needed for that concern.

---

## Implementation

### Phase 1 — Infrastructure (no behavior changes)

**1. `src/db/index.ts`** — Remove crash-on-import
- Remove `!` non-null assertion from `DATABASE_URL`
- Make `db` and `client` nullable (`| null`)
- Only construct the postgres client when `DATABASE_URL` is set
- Add `export async function testDatabaseConnection(): Promise<boolean>` — runs `SELECT 1` in a try/catch, returns `true`/`false`

**2. `src/config/env.ts`** — Add one field
```typescript
hasDatabaseUrl: !!process.env.DATABASE_URL,
```

**3. `src/db/entity-record.ts`** — New file: concrete `DomainEvent` subclass
```typescript
import { DomainEvent } from '@kubegram/events';

export class EntityRecord<T extends Record<string, unknown> = Record<string, unknown>>
  extends DomainEvent<T> {
  constructor(entityType: string, eventId: string, data: T, aggregateId?: string) {
    super(`kubegram.entity.${entityType}`, eventId, data, aggregateId);
  }
}
```
Event ID convention: `company:<uuid>`, `organization:<n>`, `team:<n>`, `user:<n>`, `project:<n>`, `job:<uuid>`, `artifact:<n>`, etc.  
`aggregateId` set to the parent entity's event ID for FK-scoped tables (enables `getEvents({ aggregateId })` lookups).

**4. `src/db/id-generator.ts`** — New file: sequential IDs for serial PK entities in cache mode
- In-memory counter per entity type
- When `ENABLE_HA=true` and Redis is available: uses `redis.incr('kubegram:id:<entityType>')` for cross-instance consistency

---

### Phase 2 — Repository interface and Drizzle implementations

**5. `src/repositories/base.ts`** — New file
```typescript
export interface FindOptions {
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

export interface BaseRepository<T, NewT = Partial<T>> {
  findAll(options?: FindOptions): Promise<T[]>;
  findById(id: string | number): Promise<T | null>;
  findOne(options: FindOptions): Promise<T | null>;
  create(data: NewT): Promise<T>;
  update(id: string | number, data: Partial<T>): Promise<T | null>;
  delete(id: string | number): Promise<boolean>;
}
```

**6. `src/repositories/drizzle/*.ts`** — 11 files, one per entity
Extract existing inline Drizzle queries from routes/services into these classes. This is a mechanical extraction — no query logic changes. Affected entities: companies, organizations, teams, users, projects, generationJobs, generationJobArtifacts, companyCertificates, companyLlmTokens, operatorTokens, operators.

**7. `src/repositories/index.ts`** — New file: factory + singleton
```typescript
export function getRepositories(): Repositories { ... }
export async function initializeRepositories(useCache: boolean): Promise<void> { ... }
```
`initializeRepositories(false)` wires the Drizzle implementations. At this point the Drizzle path is fully functional and tested.

---

### Phase 3 — Cache implementations and startup wiring

**8. `src/repositories/cache/*.ts`** — 11 files, one per entity
Each class holds a shared `EventCache` instance and implements `BaseRepository<T>`:
- `findAll` → `cache.getEvents({ eventType: 'kubegram.entity.<type>' })` + map `.data`
- `findById` → `cache.get('<type>:<id>')` + map `.data`
- `create` → generate ID, build record, `cache.add(new EntityRecord(...))`
- `update` → get existing, merge, `cache.add(...)` with same key
- `delete` → `cache.remove('<type>:<id>')`
- `findOne` → `findAll()` then filter in application code

Special cases:
- **`users`**: `create()` calls `findOne({ where: { email } })` first to enforce unique constraint
- **`operators`**: enforces `clusterId` uniqueness; **`operatorTokens`**: enforces `token` uniqueness
- **`generationJobArtifacts`**: `delete()` also cascades via `getEvents({ aggregateId: 'job:<uuid>' })`
- **Join-like queries** (e.g., jobs with project data): fetch records individually from their repositories then assemble

**9. `src/services/entity-resolver.ts`** — New file
Centralises FK-chain traversal helpers used across multiple routes/services:
```typescript
export async function getUserCompanyId(userId: number): Promise<string>
export async function getCompanyIdFromTeam(teamId: number): Promise<string>
```
These replace the copy-pasted 3-query chains in `crud.ts`, `providers.ts`, `openauth.ts`, etc.

**10. `src/index.ts`** — Wire startup detection
After the existing Redis connect block, add:
```typescript
const dbAvailable = config.hasDatabaseUrl && await testDatabaseConnection();
if (!dbAvailable) {
  logger.warn('No DB connection — falling back to EventCache. Set ENABLE_HA=true for Redis-backed persistence.');
}
await initializeRepositories(!dbAvailable);
```

`buildEntityCache()` (inside `initializeRepositories`) mirrors `WorkflowService`: `StorageMode.WRITE_THROUGH + RedisEventStorage` when `ENABLE_HA=true`, otherwise `StorageMode.MEMORY`.

---

### Phase 4 — Consumer migration

Replace `import { db } from '@/db'` + inline Drizzle calls with `getRepositories()` in:

**Services** (4 files)
- `src/services/permissions.ts` — all `db.select()` calls
- `src/services/codegen.ts` — job insert/select/update calls
- `src/services/plan.ts` — job reads
- `src/services/workflow.ts` — `db.update(generationJobs)` in promise callbacks

**Auth** (2 files)
- `src/auth/openauth.ts` — `ensureUserHasTeam`, OAuth `success` callback
- `src/middleware/auth.ts` — token validation user lookups

**Routes** (14 files)
- `src/routes/api/v1/companies.ts`
- `src/routes/api/v1/organizations.ts`
- `src/routes/api/v1/teams.ts`
- `src/routes/api/v1/users.ts`
- `src/routes/api/v1/projects.ts`
- `src/routes/api/v1/certificates.ts`
- `src/routes/api/v1/providers.ts`
- `src/routes/api/v1/iac.ts`
- `src/routes/api/v1/graph/crud.ts` (replace inline `getUserCompanyId` with `entity-resolver`)
- `src/routes/api/v1/graph/codegen.ts`
- `src/routes/internal.ts`
- `src/routes/tokens.ts`
- `src/routes/api/v1/admin/` (operators, operator-tokens)

**MCP Tools** (4 files)
- `src/mcp/tools/companies.ts`, `teams.ts`, `projects.ts`, `codegen.ts`
- `src/mcp/tools/health.ts` — add `if (!db)` guard before `db.execute()` (currently a null-dereference)

---

## New Files Summary

| File | Purpose |
|------|---------|
| `src/db/entity-record.ts` | Concrete `DomainEvent` wrapper for any entity |
| `src/db/id-generator.ts` | Sequential ID generation for serial-PK entities |
| `src/repositories/base.ts` | `BaseRepository<T>` interface |
| `src/repositories/index.ts` | Factory, `initializeRepositories()`, `getRepositories()` |
| `src/repositories/drizzle/{11 files}` | Drizzle implementations |
| `src/repositories/cache/{11 files}` | EventCache implementations |
| `src/services/entity-resolver.ts` | `getUserCompanyId()` and related FK-traversal helpers |

---

## Verification

1. **DB mode (existing)**: Start with `DATABASE_URL` set → `testDatabaseConnection()` returns `true` → Drizzle repositories used → all existing tests pass (`bun test`)
2. **No-DB mode**: Unset `DATABASE_URL` → server starts without crash → `GET /healthz/live` returns `200` → create/read/update/delete entities via API works against in-memory cache
3. **No-DB + HA mode**: Set `ENABLE_HA=true`, Redis running, no `DATABASE_URL` → cache uses `RedisEventStorage` (WRITE_THROUGH) → data persists across server restarts
