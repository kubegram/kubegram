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
