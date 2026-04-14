.PHONY: up down build logs restart clean clear-db restore-db backup-db db-status db-shell

# Docker Compose Commands
compose-up:
	docker compose up -d

compose-down:
	docker compose down

compose-build:
	docker compose build

compose-logs:
	docker compose logs -f

compose-restart: down up

compose-clean:
	docker compose down -v

# Database Management Commands
clear-db:
	@./scripts/clear-database.sh

clear-db-interactive: clear-db

restore-db:
	@./scripts/restore-database.sh

backup-db:
	@./scripts/clear-database.sh --backup-only

db-status:
	@./scripts/clear-database.sh --status-only

db-shell:
	@docker exec -it kubegram-server-postgres-1 psql -U postgres -d kubegram

# Quick Actions
reset-db: down
	@echo "Removing PostgreSQL volume..."
	@docker volume rm kubegram-server_postgres_data || true
	@echo "Restarting containers..."
	@$(MAKE) up

db-backup: backup-db

db-restore: restore-db

# ============================================
# Test Infrastructure Commands
# ============================================

.PHONY: test-up test-down test-clean test-setup test-reset test-status test-shell

test-up:
	docker compose -f docker-compose.test.yml up -d
	@echo "Waiting for services to be ready..."
	@sleep 5
	@$(MAKE) test-setup

test-down:
	docker compose -f docker-compose.test.yml down

test-clean:
	docker compose -f docker-compose.test.yml down -v

test-setup:
	@echo "Setting up test database..."
	@docker compose -f docker-compose.test.yml exec -T postgres psql -U postgres -d kubegram_test -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" 2>/dev/null || true
	@docker compose -f docker-compose.test.yml exec -T postgres psql -U postgres -d kubegram_test -f /docker-entrypoint-initdb.d/test/fixtures/schema.sql 2>/dev/null || true
	@for fixture in test/fixtures/*.sql; do \
		docker compose -f docker-compose.test.yml exec -T postgres psql -U postgres -d kubegram_test -f "$$fixture" 2>/dev/null || true; \
	done
	@echo "Test database setup complete!"

test-reset:
	@echo "Resetting test database..."
	@docker compose -f docker-compose.test.yml exec -T postgres psql -U postgres -d kubegram_test -c "DO \$\$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'DELETE FROM ' || quote_ident(r.tablename); END LOOP; END \$\$;"
	@$(MAKE) test-setup

test-status:
	@echo "Test services status:"
	@docker compose -f docker-compose.test.yml ps
	@echo ""
	@echo "PostgreSQL health:"
	@docker compose -f docker-compose.test.yml exec -T postgres pg_isready -U postgres -d kubegram_test || echo "PostgreSQL not ready"
	@echo ""
	@echo "Redis health:"
	@docker compose -f docker-compose.test.yml exec -T redis redis-cli ping || echo "Redis not ready"

test-shell:
	@docker compose -f docker-compose.test.yml exec postgres psql -U postgres -d kubegram_test

# ============================================
# Test Running Commands
# ============================================

.PHONY: test test-watch test-coverage test-integration test-integration-watch test-e2e test-e2e-ui test-ci test-all

# Run unit/integration tests (requires test services running)
test:
	@$(MAKE) test-up
	@bun test src/__tests__
	@$(MAKE) test-down

# Run tests in watch mode
test-watch:
	@$(MAKE) test-up
	@bun test --watch src/__tests__

# Run tests with coverage
test-coverage:
	@$(MAKE) test-up
	@bun test --coverage src/__tests__
	@$(MAKE) test-down

# Run integration tests only
test-integration:
	@$(MAKE) test-up
	@bun test --run src/__tests__
	@$(MAKE) test-down

# Run integration tests in watch mode
test-integration-watch:
	@$(MAKE) test-up
	@bun test --watch src/__tests__

# Run E2E tests
test-e2e:
	@$(MAKE) test-up
	@bun run dev &
	@sleep 10
	@bunx playwright test
	@$(MAKE) test-down

# Run E2E tests with UI
test-e2e-ui:
	@$(MAKE) test-up
	@bun run dev &
	@sleep 10
	@bunx playwright test --ui
	@$(MAKE) test-down

# Run tests in CI mode (for GitHub Actions)
test-ci:
	@$(MAKE) test-up
	@bun test --run --reporter=junit src/__tests__ > test-results.xml
	@$(MAKE) test-down

# Run all tests (integration + E2E)
test-all:
	@$(MAKE) test-up
	@bun test --run src/__tests__
	@bun run dev &
	@sleep 10
	@bunx playwright test
	@$(MAKE) test-down

# ============================================
# Code Quality Commands
# ============================================

.PHONY: lint lint-fix typecheck check check-all

lint:
	bunx eslint src

lint-fix:
	bunx eslint src --fix

typecheck:
	bunx tsc --noEmit

check: lint typecheck
	@echo "Code quality checks passed!"

check-all: lint typecheck test
	@echo "All checks passed!"
