# Kubegram Unified Docker Management

.PHONY: up down logs clean rebuild status \
	build-kuberag build-kubegram restart-kuberag restart-kubegram rebuild-kuberag rebuild-kubegram

# Start all services
up:
	docker-compose up -d
	@echo "🚀 Services starting..."
	@echo "📊 Kubegram Server: http://localhost:8090"
	@echo "🔍 KubeRAG GraphQL: http://localhost:8665/graphql"
	@echo "🗄️  PostgreSQL: localhost:5432"
	@echo "📦 Redis: localhost:6379"
	@echo "🔍 Dgraph: http://localhost:8080"

# Stop all services
down:
	docker-compose down
	@echo "🛑 Services stopped"

# View logs
logs:
	docker-compose logs -f

# View logs for specific service
logs-kuberag:
	docker-compose logs -f kuberag

logs-kubegram:
	docker-compose logs -f kubegram-server

logs-redis:
	docker-compose logs -f redis

logs-postgres:
	docker-compose logs -f postgres

logs-dgraph:
	docker-compose logs -f dgraph

# Clean up volumes and containers
clean:
	docker-compose down -v
	docker system prune -f
	@echo "🧹 Cleaned up all containers and volumes"

# Rebuild and start all services
rebuild: clean up
	@echo "🔨 Rebuilt and restarted all services"

# Check service status
status:
	docker-compose ps

# Access service shells
shell-kuberag:
	docker-compose exec kuberag /bin/sh

shell-kubegram:
	docker-compose exec kubegram-server /bin/sh

shell-redis:
	docker-compose exec redis /bin/sh

shell-postgres:
	docker-compose exec postgres /bin/sh

# Database operations
db-migrate:
	docker-compose exec kubegram-server bun x drizzle-kit push --force

db-reset:
	docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS kubegram; CREATE DATABASE kubegram;"
	@echo "🗄️  Database reset"

# Redis operations
redis-cli:
	docker-compose exec redis redis-cli

redis-flush:
	docker-compose exec redis redis-cli FLUSHALL
	@echo "📦 Redis flushed"

# Schema loading commands
schema-status:
	@echo "📝 Checking KubeRAG schema loading status..."
	@docker-compose exec kuberag bun scripts/load-schema.ts 2>/dev/null || echo "Schema loading script not accessible"

schema-reload:
	@echo "🔄 Reloading KubeRAG schema..."
	@docker-compose exec kuberag bun scripts/load-schema.ts

# Development helpers
dev-setup:
	@echo "🔧 Setting up development environment..."
	@echo "Make sure you have the following environment variables set:"
	@echo "- NODE_AUTH_TOKEN (for private packages)"
	@echo "- OAuth provider credentials in kubegram-server/.env.docker"
	@echo "- LLM API keys in kuberag/.env.docker"
	@echo ""
	@echo "Optional Schema Loading Control (KubeRAG):"
	@echo "- SKIP_SCHEMA_LOAD=true (skip schema loading for faster startup)"
	@echo "- SCHEMA_LOAD_INTERVAL=30 (retry interval in seconds)"
	@echo "- SCHEMA_LOAD_MAX_ATTEMPTS=5 (max retry attempts, 0=infinite)"

# Build individual services
build-kuberag:
	docker-compose build kuberag
	@echo "Built kuberag"

build-kubegram:
	docker-compose build kubegram-server
	@echo "Built kubegram-server"

# Restart individual services (no rebuild)
restart-kuberag:
	docker-compose restart kuberag
	@echo "Restarted kuberag"

restart-kubegram:
	docker-compose restart kubegram-server
	@echo "Restarted kubegram-server"

# Rebuild and restart individual services
rebuild-kuberag:
	docker-compose up -d --no-deps --build kuberag
	@echo "Rebuilt and restarted kuberag"

rebuild-kubegram:
	docker-compose up -d --no-deps --build kubegram-server
	@echo "Rebuilt and restarted kubegram-server"

# ============================================================================
# Monorepo & CI Management
# ============================================================================

# Clean install dependencies
ci-install:
	bun install --frozen-lockfile

# common-ts CI steps
ci-typecheck-common:
	bun run typecheck:common-ts

ci-lint-common:
	bun run lint:common-ts

ci-test-common:
	bun run test:common-ts

ci-build-common:
	bun run build:common-ts

ci-codegen-common:
	bun run codegen:common-ts

ci-publish-common:
	cd common-ts && bun publish

# Run all common-ts CI steps
ci-all-common: ci-install ci-codegen-common ci-typecheck-common ci-lint-common ci-test-common ci-build-common
	@echo "✅ All common-ts CI checks passed"

# common-events CI steps
ci-typecheck-common-events:
	bun run typecheck:common-events

ci-lint-common-events:
	bun run lint:common-events

ci-test-common-events:
	bun run test:common-events

ci-build-common-events:
	bun run build:common-events

ci-publish-common-events:
	cd common-events && bun publish

# Run all common-events CI steps
ci-all-common-events: ci-install ci-typecheck-common-events ci-lint-common-events ci-test-common-events ci-build-common-events
	@echo "✅ All common-events CI checks passed"

# kubegram-core CI steps
ci-typecheck-kubegram-core:
	bun run typecheck:kubegram-core

ci-lint-kubegram-core:
	bun run lint:kubegram-core

ci-test-kubegram-core:
	bun run test:kubegram-core

ci-build-kubegram-core:
	bun run build:kubegram-core

ci-publish-kubegram-core:
	cd kubegram-core && bun publish

# Run all kubegram-core CI steps
ci-all-kubegram-core: ci-install ci-typecheck-kubegram-core ci-lint-kubegram-core ci-test-kubegram-core ci-build-kubegram-core
	@echo "✅ All kubegram-core CI checks passed"

# kubegram-auth CI steps
ci-typecheck-kubegram-auth:
	cd kubegram-auth && bun run type-check

ci-lint-kubegram-auth:
	cd kubegram-auth && bun run lint

ci-build-kubegram-auth:
	cd kubegram-auth && bun run build

ci-publish-kubegram-auth:
	cd kubegram-auth && bun publish

# Run all kubegram-auth CI steps
ci-all-kubegram-auth: ci-install ci-typecheck-kubegram-auth ci-lint-kubegram-auth ci-build-kubegram-auth
	@echo "✅ All kubegram-auth CI checks passed"

## CLI build targets
build-cli:
	cd kubegram-cli && make build

release-cli:
	cd kubegram-cli && make cross-build package

health-check:
	@echo "🏥 Checking service health..."
	@curl -s http://localhost:8090/api/public/v1/healthz/live | jq '.' 2>/dev/null || echo "❌ Kubegram Server unhealthy"
	@curl -s http://localhost:8665/health | jq '.service' 2>/dev/null || echo "❌ KubeRAG unhealthy"
	@docker-compose exec redis redis-cli ping | grep -q PONG && echo "✅ Redis healthy" || echo "❌ Redis unhealthy"
	@docker-compose exec postgres pg_isready -U postgres | grep -q "accepting connections" && echo "✅ PostgreSQL healthy" || echo "❌ PostgreSQL unhealthy"