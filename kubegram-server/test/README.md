# Integration Testing Guide

## Overview

This directory contains the integration testing infrastructure for kubegram-server.

## Architecture

```
test/
├── fixtures/          # SQL seed data
│   ├── schema.sql     # Database schema
│   ├── 001-*.sql      # Seed data (companies, users, etc.)
│   └── 010-*.sql      # Session fixtures
└── scripts/           # Shell scripts for test management
    ├── setup-test-db.sh
    ├── reset-test-db.sh
    └── teardown-test.sh

src/
├── test/
│   ├── setup.ts       # Global test setup
│   ├── teardown.ts    # Global teardown
│   ├── helpers/        # Test utilities
│   │   ├── auth.ts    # Auth helpers & mocks
│   │   ├── db.ts      # Database helpers
│   │   ├── request.ts # HTTP request helpers
│   │   ├── api.ts     # API test utilities
│   │   └── index.ts   # Re-exports
│   ├── mocks/         # Mock implementations
│   │   ├── index.ts   # Mock setup & exports
│   │   ├── rag-client.ts  # RAG client mocks
│   │   ├── errors.ts  # Error mocks
│   │   └── http.ts    # HTTP mocks
│   ├── factories/     # Test data factories
│   │   └── index.ts   # Factory functions
│   └── __tests__/     # Integration tests
└── e2e/               # E2E Playwright tests
```

## Test Types

### 1. Unit Tests (`src/__tests__/`)
- Fast, isolated tests
- Mock external dependencies
- Run with: `bun test`

### 2. Integration Tests (`src/__tests__/`)
- Test full request/response cycles
- Use real PostgreSQL via Docker
- Run with: `bun test:integration`

### 3. E2E Tests (`e2e/`)
- Full browser-based testing with Playwright
- Test complete user workflows
- Run with: `bun test:e2e`

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Bun.js

### Setup

```bash
# Start test services (PostgreSQL + Redis)
docker-compose -f docker-compose.test.yml up -d

# Load test fixtures
bun run test:setup

# Run integration tests
bun test src/__tests__

# Run with coverage
bun test:coverage

# Run E2E tests (starts dev server automatically)
bun test:e2e
```

### Teardown

```bash
# Stop and remove test services
bun run test:teardown

# Or just stop without removing volumes
docker-compose -f docker-compose.test.yml down
```

## Test Scripts

| Script | Description |
|--------|-------------|
| `bun test` | Run all unit tests |
| `bun test:watch` | Run tests in watch mode |
| `bun test:coverage` | Run tests with coverage report |
| `bun test:integration` | Run integration tests (starts Docker) |
| `bun test:integration:watch` | Run integration tests in watch mode |
| `bun test:e2e` | Run E2E tests with Playwright |
| `bun test:e2e:ui` | Run E2E tests with Playwright UI |
| `bun test:ci` | Run tests for CI (generates JUnit XML) |
| `bun test:setup` | Setup test database |
| `bun test:reset` | Reset test database (clean slate) |
| `bun test:teardown` | Stop test services |
| `bun test:all` | Run all tests (integration + E2E) |

## Environment

Tests use `.env.test` with:
- PostgreSQL: `localhost:5435`
- Redis: `localhost:6380`
- App URL: `http://localhost:8090`

## Test Fixtures

### Database Schema
The test schema mirrors production with:
- All production tables
- Proper foreign key constraints
- Indexes for performance

### Seed Data

| Table | Count | Description |
|-------|-------|-------------|
| companies | 3 | Test Company Inc, Acme Corp, Demo Organization |
| organizations | 3 | Engineering, Product, DevOps |
| teams | 4 | Platform, Backend, Frontend, Infrastructure |
| users | 5 | Admin, Manager, 3 Team Members |
| projects | 3 | Sample projects |
| generation_jobs | 3 | pending, running, completed, failed states |
| openauth_sessions | 4 | One per test user |

### Test Users

| User | Role | Team | Session Cookie |
|------|------|------|----------------|
| admin@test.com | admin | Platform Team | session-admin-001 |
| manager@test.com | manager | Platform Team | session-manager-001 |
| member1@test.com | team_member | Backend Team | session-member1-001 |
| demo@test.com | team_member | Infrastructure | session-demo-001 |

## Test Utilities

### Auth Helpers (`src/test/helpers/auth.ts`)

```typescript
import {
  TEST_USERS,           // Predefined test users
  TEST_SESSIONS,       // Session IDs for each user
  createAuthHeaders,    // Create headers with session cookie
  createBearerHeaders,  // Create headers with bearer token
  createAdminHeaders,   // Admin auth headers
  createMemberHeaders,  // Team member auth headers
  createMockAuthContext,
} from '@/test/helpers/auth';
```

### Request Helpers (`src/test/helpers/request.ts`)

```typescript
import { getTestClient, ApiResponse, expectOK, expectCREATED } from '@/test/helpers';

describe('API Tests', () => {
  let client = getTestClient();
  
  beforeAll(async () => {
    await client.init();
  });

  it('should make authenticated request', async () => {
    const response = await client.get('/api/v1/resource', {
      headers: createAuthHeaders('admin'),
    });
    
    const body = await expectOK(response);
    expect(body).toBeDefined();
  });

  it('should handle query params', async () => {
    const response = await client.get('/api/v1/resource', {
      query: { limit: '10', offset: '0' },
    });
    
    await expectOK(response);
  });

  it('should send JSON body', async () => {
    const response = await client.post('/api/v1/resource', {
      headers: createAdminHeaders(),
      body: { name: 'New Resource' },
    });
    
    const body = await expectCREATED(response);
  });
});
```

### API Test Helpers (`src/test/helpers/api.ts`)

```typescript
import {
  createCrudTests,      // Generate CRUD test suite
  createPaginationTests, // Generate pagination tests
  createSortingTests,    // Generate sorting tests
  createFilteringTests,  // Generate filtering tests
  expectOK,
  expectCREATED,
  expectUNAUTHORIZED,
  expectNOTFOUND,
  expectBADREQUEST,
} from '@/test/helpers';

// Create comprehensive CRUD tests
createCrudTests({
  singular: 'company',
  plural: 'companies',
  createData: { name: 'New Company' },
  updateData: { name: 'Updated Company' },
}, createAdminHeaders, (id) => `/api/v1/companies/${id}`, () => '/api/v1/companies');

// Create pagination tests
createPaginationTests(() => '/api/v1/companies');

// Create filtering tests
createFilteringTests(() => '/api/v1/companies', ['name', 'status']);
```

### Response Assertions (`src/test/helpers/api.ts`)

```typescript
import { expectOK, expectCREATED, expectUNAUTHORIZED } from '@/test/helpers';

it('should return 200 OK', async () => {
  const response = await client.get('/api/v1/resource');
  const body = await expectOK(response);
});

it('should return 201 Created', async () => {
  const response = await client.post('/api/v1/resource', { body: {} });
  const body = await expectCREATED(response);
});

it('should return 401 Unauthorized', async () => {
  const response = await client.get('/api/v1/protected');
  await expectUNAUTHORIZED(response);
});

it('should return 400 Bad Request', async () => {
  const response = await client.post('/api/v1/resource', { body: { invalid: true } });
  await expectBADREQUEST(response);
});
```

## Factories (`src/test/factories/index.ts`)

Generate test data on-the-fly:

```typescript
import {
  companyFactory,
  organizationFactory,
  teamFactory,
  userFactory,
  projectFactory,
  generationJobFactory,
  artifactFactory,
  sessionFactory,
  graphFactory,
} from '@/test/factories';

// Create single entity
const company = companyFactory.create({ name: 'My Company' });

// Create multiple entities
const teams = teamFactory.createMultiple(5);

// Create with relations
const users = userFactory.createMultiple(3, { teamId: 1 });

// Create in specific state
const pendingJob = generationJobFactory.createPending();
const completedJob = generationJobFactory.createCompleted();
const failedJob = generationJobFactory.createFailed();

// Create admin/manager
const admin = userFactory.createAdmin();
const manager = userFactory.createManager();

// Create expired session
const expiredSession = sessionFactory.createExpired('user@test.com');
```

## Mocks

### RAG Client Mock (`src/test/mocks/rag-client.ts`)

```typescript
import { createMockRAGClient, createMockRAGClientWithStatus } from '@/test/mocks';

// Create mock with custom responses
const mockRAG = createMockRAGClient({
  codegenStatus: { status: 'completed', progress: 100 },
  codegenResults: {
    artifacts: [
      { name: 'deployment.yaml', content: '...', type: 'file' },
    ],
  },
});

// Use preset status
const mockRAG = createMockRAGClientWithStatus('completed');
```

### Error Mocks (`src/test/mocks/errors.ts`)

```typescript
import {
  HttpError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  createMockErrorResponse,
} from '@/test/mocks';

// Throw typed errors
throw new ValidationError('Invalid input', { field: 'name' });
throw new NotFoundError('Company');

// Use mock responses
const response = createMockErrorResponse(404, 'Not found', 'NOT_FOUND');
```

### HTTP Mocks (`src/test/mocks/http.ts`)

```typescript
import {
  createMockHttpClient,
  createMockKuberagClient,
  createMockGitHubClient,
  createMockArgoCDClient,
} from '@/test/mocks';

// Create custom mock routes
const mockClient = createMockHttpClient([
  { method: 'POST', path: '/api/resource', status: 201, body: { id: 1 } },
  { method: 'GET', path: '/api/resource/1', status: 200, body: { id: 1 } },
]);

// Use preset mocks
const github = createMockGitHubClient();
```

## Writing Tests

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import {
  getTestClient,
  getTestDbClient,
  resetDatabase,
  loadFixtures,
  createAuthHeaders,
  expectOK,
  expectCREATED,
  expectUNAUTHORIZED,
} from '@/test/helpers';
import { companyFactory } from '@/test/factories';

describe('Companies API', () => {
  let client = getTestClient();
  let db = getTestDbClient();

  beforeAll(async () => {
    client = getTestClient();
    db = getTestDbClient();
    await client.init();
    await resetDatabase();
    await loadFixtures();
  });

  it('should list companies', async () => {
    const response = await client.get('/api/public/v1/companies');
    const body = await expectOK(response);
    expect(Array.isArray(body as any[])).toBe(true);
  });

  it('should create company with auth', async () => {
    const company = companyFactory.create({ name: 'New Company' });
    const response = await client.post('/api/public/v1/companies', {
      headers: createAuthHeaders('admin'),
      body: { name: company.name },
    });
    const body = await expectCREATED(response);
  });

  it('should reject without auth', async () => {
    const response = await client.post('/api/public/v1/companies', {
      body: { name: 'Test' },
    });
    await expectUNAUTHORIZED(response);
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can view companies', async ({ request }) => {
  const response = await request.get('/api/public/v1/companies');
  expect(response.ok()).toBeTruthy();
});

test('protected route requires auth', async ({ request }) => {
  const response = await request.get('/api/v1/admin/operators');
  expect(response.status()).toBe(401);
});
```

## Mocking

### External Services
- **Redis**: Mocked via ioredis-mock
- **KubeRAG**: Mocked via custom mock module
- **OAuth**: Mocked at session level

### Mock Patterns

```typescript
// Mock Redis
vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  })),
}));

// Mock RAG client
vi.mock('@/clients/rag-client', () => ({
  createRAGClient: vi.fn().mockReturnValue({
    initializeCodeGen: vi.fn().mockResolvedValue({ jobId: 'test' }),
  }),
}));
```

## Debugging

### View test database
```bash
docker-compose -f docker-compose.test.yml exec postgres psql -U postgres -d kubegram_test
```

### Check container status
```bash
docker-compose -f docker-compose.test.yml ps
```

### View logs
```bash
docker-compose -f docker-compose.test.yml logs postgres
docker-compose -f docker-compose.test.yml logs redis
```

## CI Integration

See `.github/workflows/test.yml` for GitHub Actions configuration.

```yaml
- name: Run integration tests
  run: bun run test:ci
  
- name: Run E2E tests
  run: bun run test:e2e
```
