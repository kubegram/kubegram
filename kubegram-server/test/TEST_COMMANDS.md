# Test Commands Reference

## Quick Start

```bash
# 1. Start test infrastructure
make test-up

# 2. Run integration tests
make test

# 3. Run E2E tests
make test-e2e

# 4. Clean up
make test-down
```

---

## Make Commands

### Test Infrastructure

| Command | Description |
|---------|-------------|
| `make test-up` | Start PostgreSQL + Redis for tests |
| `make test-down` | Stop test services |
| `make test-clean` | Stop and remove test volumes |
| `make test-setup` | Initialize test database schema + fixtures |
| `make test-reset` | Reset test database (clean + reload fixtures) |
| `make test-status` | Check test services health |
| `make test-shell` | Open psql shell to test database |

### Running Tests

| Command | Description |
|---------|-------------|
| `make test` | Run integration tests (auto-manages services) |
| `make test-watch` | Run tests in watch mode |
| `make test-coverage` | Run with coverage report |
| `make test-integration` | Run integration tests only |
| `make test-integration-watch` | Run integration tests in watch mode |
| `make test-e2e` | Run E2E tests with Playwright |
| `make test-e2e-ui` | Run E2E tests with Playwright UI |
| `make test-ci` | Run for CI (generates JUnit XML) |
| `make test-all` | Run all tests (integration + E2E) |

### Code Quality

| Command | Description |
|---------|-------------|
| `make lint` | Run ESLint |
| `make lint-fix` | Run ESLint with auto-fix |
| `make typecheck` | Run TypeScript check |
| `make check` | Run lint + typecheck |
| `make check-all` | Run check + all tests |

---

## NPM Commands

### Test Commands

```bash
bun test                    # Run all tests
bun test:watch            # Watch mode
bun test:coverage         # With coverage
bun test:unit            # Unit tests only
bun test:integration     # Integration tests
bun test:integration:watch # Integration watch mode
bun test:e2e             # E2E tests
bun test:e2e:ui          # E2E with UI
bun test:e2e:debug        # E2E debug mode
bun test:ci              # CI mode (JUnit output)
bun test:quick           # Quick run (no service management)
bun test:all             # All tests
```

### Setup Commands

```bash
bun run test:setup        # Setup test DB
bun run test:reset        # Reset test DB
bun run test:teardown     # Teardown test services
```

### Code Quality Commands

```bash
bun run lint              # ESLint
bun run lint:fix          # ESLint fix
bun run typecheck         # TypeScript check
bun run check             # Lint + typecheck
```

---

## Common Workflows

### Development TDD

```bash
# Start test infrastructure (do once)
make test-up

# Run tests in watch mode
make test-watch

# When done
make test-down
```

### Before Commit

```bash
# Run all checks
make check-all

# Or individually
make lint
make typecheck
make test
```

### CI/CD

```bash
# Run in CI mode (generates test-results.xml)
make test-ci

# Or use npm
bun run test:ci
```

### Debug E2E Tests

```bash
# Start with UI
make test-e2e-ui

# Or debug mode
bun run test:e2e:debug
```

---

## Environment

Tests use `.env.test`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5435/kubegram_test
REDIS_HOST=localhost
REDIS_PORT=6380
```

---

## Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5435 | Test database |
| Redis | 6380 | Test cache |
