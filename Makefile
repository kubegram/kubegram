# Kubegram Unified Docker Management

.PHONY: help up down logs clean rebuild status \
	docker-build-kuberag docker-build-kubegram restart-kuberag restart-kubegram rebuild-kuberag rebuild-kubegram \
	install \
	dev-kuberag build-kuberag test-kuberag lint-kuberag typecheck-kuberag \
	dev-server build-server test-server lint-server typecheck-server \
	dev-ui build-ui lint-ui typecheck-ui \
	dev-github-app build-github-app test-github-app lint-github-app typecheck-github-app \
	build-core test-core lint-core typecheck-core \
	build-auth lint-auth typecheck-auth \
	build-all test-all lint-all typecheck-all check-all \
	act-pr-validation act-common-release act-events-release \
	act-core-release act-auth-release act-cli-release-dry \
	act-operator-dry act-operator-live act-sidecar-dry act-sidecar-live \
	act-deploy-dry act-validate act-lint act-test act-list act-help \
	ci-install-events ci-verify-build-events

help:
	@echo ""
	@echo "Kubegram — Available Make Targets"
	@echo "=================================="
	@echo ""
	@echo "DOCKER (full stack via docker-compose)"
	@echo "  up                       Start all services"
	@echo "  down                     Stop all services"
	@echo "  rebuild                  Clean + restart all services"
	@echo "  status                   Show container status"
	@echo "  health-check             Check all service health endpoints"
	@echo "  logs                     Tail all logs"
	@echo "  logs-kuberag             Tail kuberag logs"
	@echo "  logs-kubegram            Tail kubegram-server logs"
	@echo "  logs-redis               Tail Redis logs"
	@echo "  logs-postgres            Tail PostgreSQL logs"
	@echo "  logs-dgraph              Tail Dgraph logs"
	@echo "  clean                    Remove all containers and volumes"
	@echo "  shell-kuberag            Shell into kuberag container"
	@echo "  shell-kubegram           Shell into kubegram-server container"
	@echo "  shell-redis              Shell into Redis container"
	@echo "  shell-postgres           Shell into PostgreSQL container"
	@echo "  docker-build-kuberag     Rebuild kuberag Docker image"
	@echo "  docker-build-kubegram    Rebuild kubegram-server Docker image"
	@echo "  restart-kuberag          Restart kuberag (no rebuild)"
	@echo "  restart-kubegram         Restart kubegram-server (no rebuild)"
	@echo "  rebuild-kuberag          Rebuild and restart kuberag"
	@echo "  rebuild-kubegram         Rebuild and restart kubegram-server"
	@echo ""
	@echo "DATABASE"
	@echo "  db-migrate               Run Drizzle migrations (drizzle-kit push)"
	@echo "  db-reset                 Drop and recreate kubegram database"
	@echo "  redis-cli                Open Redis CLI"
	@echo "  redis-flush              Flush all Redis data"
	@echo "  schema-status            Check KubeRAG schema loading status"
	@echo "  schema-reload            Reload KubeRAG schema"
	@echo ""
	@echo "LOCAL DEVELOPMENT"
	@echo "  install                  Install deps in all workspaces"
	@echo "  dev-ui                   Start kubegram-ui dev server (HMR)"
	@echo "  dev-server               Start kubegram-server dev server"
	@echo "  dev-kuberag              Start kuberag dev server"
	@echo "  dev-github-app           Start kubegram-github-app dev server"
	@echo "  build-all                Build all workspaces"
	@echo "  test-all                 Test all workspaces"
	@echo "  lint-all                 Lint all workspaces"
	@echo "  typecheck-all            Typecheck all workspaces"
	@echo "  check-all                Typecheck + lint + test all workspaces"
	@echo ""
	@echo "  Per-workspace (replace <ws> with: kuberag | server | ui | github-app | core | auth)"
	@echo "  build-<ws>               Build workspace"
	@echo "  test-<ws>                Test workspace  (not available for: ui, auth)"
	@echo "  lint-<ws>                Lint workspace"
	@echo "  typecheck-<ws>           Typecheck workspace"
	@echo ""
	@echo "CI"
	@echo "  ci-install               Install all workspace deps (frozen lockfile)"
	@echo "  ci-all-common            Run all common-ts CI steps"
	@echo "  ci-all-events            Run all events CI steps"
	@echo "  ci-all-kubegram-core     Run all kubegram-core CI steps"
	@echo "  ci-all-kubegram-auth     Run all kubegram-auth CI steps"
	@echo "  ci-publish-common        Publish @kubegram/common-ts"
	@echo "  ci-publish-events        Publish @kubegram/common-events"
	@echo "  ci-publish-kubegram-core Publish @kubegram/kubegram-core"
	@echo "  ci-publish-kubegram-auth Publish @kubegram/kubegram-auth"
	@echo "  build-cli                Build kubegram-cli"
	@echo "  release-cli              Cross-build and package kubegram-cli"
	@echo ""
	@echo "LOCAL CI (act)"
	@echo "  act-help                 Detailed guide for running workflows locally with act"
	@echo "  act-validate             Run all safe workflows + dry-runs (pre-push check)"
	@echo "  act-pr-validation        Simulate PR validation workflow (no secrets needed)"
	@echo "  act-common-release       Simulate common-ts release"
	@echo "  act-events-release       Simulate events release"
	@echo "  act-core-release         Simulate kubegram-core release (needs GH_TOKEN)"
	@echo "  act-auth-release         Simulate kubegram-auth release (needs GH_TOKEN)"
	@echo "  act-cli-release-dry      Dry-run CLI GoReleaser"
	@echo "  act-operator-dry         Dry-run operator Docker+Helm"
	@echo "  act-sidecar-dry          Dry-run sidecar Docker+Helm"
	@echo "  act-deploy-dry           Dry-run UI deploy"
	@echo "  act-list                 List all act-* targets"
	@echo ""
	@echo "OTHER"
	@echo "  dev-setup                Print required environment variables"
	@echo ""

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

# Build individual services (docker)
docker-build-kuberag:
	docker-compose build kuberag
	@echo "Built kuberag"

docker-build-kubegram:
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

# Install all workspace dependencies
ci-install:
	cd common-ts && bun install --frozen-lockfile
	cd events && bun install --frozen-lockfile
	cd kubegram-core && bun install --frozen-lockfile
	cd kubegram-auth && bun install --frozen-lockfile
	cd kuberag && bun install --frozen-lockfile
	cd kubegram-server && bun install --frozen-lockfile
	cd kubegram-ui && bun install --frozen-lockfile
	cd kubegram-github-app && bun install --frozen-lockfile

# Install events workspace dependencies only
ci-install-events:
	cd events && bun install --frozen-lockfile

# common-ts CI steps
ci-typecheck-common:
	cd common-ts && bun run type-check

ci-lint-common:
	cd common-ts && bun run lint

ci-test-common:
	cd common-ts && bun run test:ci-no-coverage

ci-build-common:
	cd common-ts && bun run build

ci-codegen-common:
	cd common-ts && bun run codegen

ci-publish-common:
	cd common-ts && bun publish

# Run all common-ts CI steps
ci-all-common: ci-codegen-common ci-typecheck-common ci-lint-common ci-test-common ci-build-common
	@echo "✅ All common-ts CI checks passed"

# events CI steps
ci-typecheck-events:
	cd events && bun run type-check

ci-lint-events:
	cd events && bun run lint

ci-test-events:
	cd events && bun run test:ci

ci-build-events:
	cd events && bun run build

ci-verify-build-events:
	@if [ ! -d "events/dist" ]; then \
	  echo "Build failed - dist directory not found"; \
	  exit 1; \
	fi
	@echo "Build successful - dist directory created"

ci-publish-events:
	cd events && bun publish

# Run all events CI steps
ci-all-events: ci-typecheck-events ci-lint-events ci-test-events ci-build-events ci-verify-build-events
	@echo "✅ All events CI checks passed"

# kubegram-core CI steps
ci-typecheck-kubegram-core:
	cd kubegram-core && bun run type-check

ci-lint-kubegram-core:
	cd kubegram-core && bun run lint

ci-test-kubegram-core:
	cd kubegram-core && bun run test:ci

ci-build-kubegram-core:
	cd kubegram-core && bun run build

ci-publish-kubegram-core:
	cd kubegram-core && bun publish

ci-install-kubegram-core:
	cd kubegram-core && bun install --frozen-lockfile

# Run all kubegram-core CI steps
ci-all-kubegram-core: ci-install-kubegram-core ci-typecheck-kubegram-core ci-lint-kubegram-core ci-test-kubegram-core ci-build-kubegram-core
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
ci-all-kubegram-auth: ci-typecheck-kubegram-auth ci-lint-kubegram-auth ci-build-kubegram-auth
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

# ============================================================================
# Local Development Commands
# ============================================================================

# Install all workspace dependencies
install:
	cd common-ts && bun install
	cd events && bun install
	cd kubegram-core && bun install
	cd kubegram-auth && bun install
	cd kuberag && bun install
	cd kubegram-server && bun install
	cd kubegram-ui && bun install
	cd kubegram-github-app && bun install

# kuberag
dev-kuberag:
	cd kuberag && bun run dev

build-kuberag:
	cd kuberag && bun run build

test-kuberag:
	cd kuberag && bun run test

lint-kuberag:
	cd kuberag && bun run lint

typecheck-kuberag:
	cd kuberag && bun run typecheck

# kubegram-server
dev-server:
	cd kubegram-server && bun run dev

build-server:
	cd kubegram-server && bun run build

test-server:
	cd kubegram-server && bun run test

lint-server:
	cd kubegram-server && bun run lint

typecheck-server:
	cd kubegram-server && bun run typecheck

# kubegram-ui
dev-ui:
	cd kubegram-ui && bun run dev

build-ui:
	cd kubegram-ui && bun run build

lint-ui:
	cd kubegram-ui && bun run lint

typecheck-ui:
	cd kubegram-ui && bun run typecheck

# kubegram-github-app
dev-github-app:
	cd kubegram-github-app && bun run dev

build-github-app:
	cd kubegram-github-app && bun run build

test-github-app:
	cd kubegram-github-app && bun run test

lint-github-app:
	cd kubegram-github-app && bun run lint

typecheck-github-app:
	cd kubegram-github-app && bun run type-check

# kubegram-core
build-core:
	cd kubegram-core && bun run build

test-core:
	cd kubegram-core && bun run test:ci

lint-core:
	cd kubegram-core && bun run lint

typecheck-core:
	cd kubegram-core && bun run type-check

# kubegram-auth
build-auth:
	cd kubegram-auth && bun run build

lint-auth:
	cd kubegram-auth && bun run lint

typecheck-auth:
	cd kubegram-auth && bun run type-check

# Aggregate targets
build-all: build-core build-auth build-kuberag build-server build-ui build-github-app

test-all: test-core test-kuberag test-server test-github-app

lint-all: lint-core lint-auth lint-kuberag lint-server lint-ui lint-github-app

typecheck-all: typecheck-core typecheck-auth typecheck-kuberag typecheck-server typecheck-ui typecheck-github-app

check-all: typecheck-all lint-all test-all

# ============================================================================
# act / Local CI Testing
# ============================================================================
# Prerequisites:
#   brew install act
#   docker pull catthehacker/ubuntu:act-22.04
#   cp .secrets.example .secrets   # fill in values
#   cp .vars.example .vars         # fill in values
#
# Testability tiers:
#   Tier 1 — Fully testable:    act-pr-validation
#   Tier 2 — Partially testable (build/test run; publish gate skipped with dummy token):
#             act-common-release, act-events-release,
#             act-core-release (*), act-auth-release (*)
#             (*) requires real GH_TOKEN with read:packages for bun install of @kubegram/* packages
#   Tier 3 — Dry-run only (external services, registry push, AWS):
#             act-cli-release-dry, act-operator-dry, act-sidecar-dry, act-deploy-dry
# ============================================================================

ACT      := act
ACT_DIR  := .github/act
ACT_BASE := $(ACT) --secret-file .secrets --env-file .vars --pull=false

## Tier 1 — Full end-to-end (typecheck, lint, test, build, codegen). No secrets needed.
act-pr-validation:
	$(ACT_BASE) pull_request \
	  --eventpath $(ACT_DIR)/pull_request.json \
	  --workflows .github/workflows/common-pr-validation.yml

## Tier 2 — Runs all steps up to the publish/release gate.
##          With a dummy GH_TOKEN, npm view fails → should-publish stays false → publish steps skipped.
act-common-release:
	$(ACT_BASE) push \
	  --eventpath $(ACT_DIR)/push_main.json \
	  --workflows .github/workflows/common-release.yml

act-events-release:
	$(ACT_BASE) push \
	  --eventpath $(ACT_DIR)/push_main.json \
	  --workflows .github/workflows/events-release.yml

## NOTE: kubegram-core and kubegram-auth pull private @kubegram/* packages in ci-install.
##       A real GH_TOKEN with read:packages is required in .secrets.
act-core-release:
	$(ACT_BASE) push \
	  --eventpath $(ACT_DIR)/push_main.json \
	  --workflows .github/workflows/kubegram-core-release.yml

act-auth-release:
	$(ACT_BASE) push \
	  --eventpath $(ACT_DIR)/push_main.json \
	  --workflows .github/workflows/kubegram-auth-release.yml

## Tier 3 — GoReleaser pushes real git tags and calls the GitHub API. Dry-run only.
act-cli-release-dry:
	$(ACT_BASE) push \
	  --eventpath $(ACT_DIR)/push_main_cli.json \
	  --workflows .github/workflows/kubegram-cli-release.yml \
	  --dry-run

## Tier 3 — Docker multi-arch + QEMU + Helm OCI push. Dry-run for structure validation.
act-operator-dry:
	$(ACT_BASE) release \
	  --eventpath $(ACT_DIR)/release_operator.json \
	  --workflows .github/workflows/kubegram-operator-release.yml \
	  --dry-run

## Live operator Docker build (no push). Requires GITHUB_TOKEN in .secrets.
## --privileged is needed for QEMU binfmt_misc registration (multi-arch cross-compilation).
## WARNING: slow on Apple Silicon (nested emulation: host arm64 → x86 container → QEMU).
act-operator-live:
	$(ACT_BASE) release \
	  --eventpath $(ACT_DIR)/release_operator.json \
	  --workflows .github/workflows/kubegram-operator-release.yml \
	  --privileged \
	  --job build-and-push

act-sidecar-dry:
	$(ACT_BASE) release \
	  --eventpath $(ACT_DIR)/release_sidecar.json \
	  --workflows .github/workflows/kubegram-sidecar-release.yml \
	  --dry-run

act-sidecar-live:
	$(ACT_BASE) release \
	  --eventpath $(ACT_DIR)/release_sidecar.json \
	  --workflows .github/workflows/kubegram-sidecar-release.yml \
	  --privileged \
	  --job build-and-push

## Tier 3 — Pulumi + AWS not testable locally. Use `make build-ui` to test the Vite build.
act-deploy-dry:
	$(ACT_BASE) push \
	  --eventpath $(ACT_DIR)/push_main_ui.json \
	  --workflows .github/workflows/deploy.yml \
	  --dry-run

## Aggregate targets
act-lint: act-pr-validation act-common-release act-events-release

act-test: act-pr-validation act-events-release act-core-release

## Run all non-destructive workflows end-to-end plus dry-runs for the rest.
## Safe to run before any push to main.
act-validate: act-pr-validation \
              act-common-release \
              act-events-release \
              act-cli-release-dry \
              act-operator-dry \
              act-sidecar-dry \
              act-deploy-dry

act-list:
	@grep -E '^act-[a-zA-Z_-]+:' $(MAKEFILE_LIST) | sed 's/:.*//' | sort

act-help:
	@echo ""
	@echo "act / Local CI Testing"
	@echo "======================"
	@echo ""
	@echo "Setup:"
	@echo "  brew install act"
	@echo "  docker pull catthehacker/ubuntu:act-22.04"
	@echo "  cp .secrets.example .secrets  && fill in values"
	@echo "  cp .vars.example .vars        && fill in values"
	@echo ""
	@echo "Quick start:"
	@echo "  make act-pr-validation       # Tier 1: full PR check (no secrets needed)"
	@echo "  make act-validate            # All safe workflows + dry-runs for destructive ones"
	@echo "  make act-test                # Workflows with test suites"
	@echo "  make act-lint                # Workflows with linting"
	@echo ""
	@echo "Individual workflows:"
	@echo "  make act-common-release          # common-ts (build/test; publish skipped)"
	@echo "  make act-events-release          # events (build/test; publish skipped)"
	@echo "  make act-core-release            # kubegram-core (needs real GH_TOKEN read:packages)"
	@echo "  make act-auth-release            # kubegram-auth (needs real GH_TOKEN read:packages)"
	@echo "  make act-cli-release-dry         # kubegram-cli GoReleaser (dry-run)"
	@echo "  make act-operator-dry            # operator Docker+Helm (dry-run)"
	@echo "  make act-operator-live           # operator Docker build only (--privileged, slow)"
	@echo "  make act-sidecar-dry             # sidecar Docker+Helm (dry-run)"
	@echo "  make act-sidecar-live            # sidecar Docker build only (--privileged, slow)"
	@echo "  make act-deploy-dry              # UI deploy (dry-run; use 'make build-ui' for Vite)"
	@echo ""