SHELL := /bin/sh

PYTHON ?= python3
VENV := backend/.venv
FRONTEND_DEPS := node_modules/.package-lock.json
BACKEND_DEPS := $(VENV)/.dependencies-installed

-include deploy/host.env

VPS_DIR := /opt/apps/optimus-ui-design
IMAGE_TAG := $(shell git rev-parse HEAD)

.DEFAULT_GOAL := help

.PHONY: help setup frontend api dev test test-frontend test-backend build deploy

help: ## List the available local-development commands.
	@awk 'BEGIN {FS = ":.*##"}; /^[a-zA-Z0-9_-]+:.*##/ {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: $(FRONTEND_DEPS) $(BACKEND_DEPS) ## Install frontend and backend dependencies.

$(FRONTEND_DEPS): package-lock.json
	npm install

$(BACKEND_DEPS): backend/requirements.txt
	$(PYTHON) -m venv $(VENV)
	$(VENV)/bin/pip install -r backend/requirements.txt
	touch $(BACKEND_DEPS)

frontend: $(FRONTEND_DEPS) ## Run the Angular app at http://localhost:4200.
	npm start

api: $(BACKEND_DEPS) ## Run the FastAPI marketplace API at http://localhost:8000.
	cd backend && DEV_LOGIN_ENABLED=true .venv/bin/uvicorn app.main:app --reload

dev: $(FRONTEND_DEPS) $(BACKEND_DEPS) ## Run the frontend and API together; Ctrl-C stops both.
	@$(MAKE) --no-print-directory frontend & frontend_pid=$$!; \
	$(MAKE) --no-print-directory api & api_pid=$$!; \
	trap 'kill $$frontend_pid $$api_pid 2>/dev/null' EXIT INT TERM; \
	wait $$frontend_pid $$api_pid

test: test-frontend test-backend ## Run the complete frontend and backend test suites.

test-frontend: $(FRONTEND_DEPS) ## Run Angular/Vitest tests once.
	npm test -- --watch=false

test-backend: $(BACKEND_DEPS) ## Run FastAPI tests.
	cd backend && .venv/bin/pytest

build: $(FRONTEND_DEPS) ## Build the production frontend bundle.
	npm run build

deploy: ## Build the image and release it to the VPS (see deploy/README.md).
	@test -n "$(VPS_HOST)" || { echo "Set VPS_HOST in deploy/host.env (see deploy/host.env.example)"; exit 1; }
	docker build -t optimus-ui-design:$(IMAGE_TAG) .
	docker save optimus-ui-design:$(IMAGE_TAG) | gzip -c \
		| ssh $(VPS_HOST) 'gzip -d | docker load'
	scp deploy/vps/docker-compose.yml $(VPS_HOST):$(VPS_DIR)/docker-compose.yml
	ssh $(VPS_HOST) "cd $(VPS_DIR) \
		&& sed -i 's|^OPTIMUS_IMAGE_TAG=.*|OPTIMUS_IMAGE_TAG=$(IMAGE_TAG)|' .env \
		&& docker compose up -d --remove-orphans && docker compose ps"
