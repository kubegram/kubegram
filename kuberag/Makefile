SHELL := /bin/sh

COMPOSE ?= docker compose

.PHONY: help up down rebuild restart logs logs-app logs-redis logs-dgraph

help:
	@echo "Make targets:"
	@echo "  up           Start all services"
	@echo "  down         Stop and remove containers"
	@echo "  rebuild      Rebuild images without cache"
	@echo "  restart      Restart running services"
	@echo "  logs         Tail logs for all services"
	@echo "  logs-app     Tail logs for app service"
	@echo "  logs-redis   Tail logs for redis service"
	@echo "  logs-dgraph  Tail logs for dgraph service"

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

rebuild:
	$(COMPOSE) build --no-cache

restart:
	$(COMPOSE) restart

logs:
	$(COMPOSE) logs -f

logs-app:
	$(COMPOSE) logs -f app

logs-redis:
	$(COMPOSE) logs -f redis

logs-dgraph:
	$(COMPOSE) logs -f dgraph
