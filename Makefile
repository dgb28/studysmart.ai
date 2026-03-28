# Makefile — Hackathon Project
# Run `make help` for available commands.

.PHONY: help setup dev test build clean tf-init tf-plan tf-apply lint format

# ── Colors ────────────────────────────────────────────────────────────────────
CYAN  := \033[0;36m
RESET := \033[0m

help:
	@echo "$(CYAN)Hackathon Project — Available Commands$(RESET)"
	@echo ""
	@echo "  make setup        Install all dependencies (backend + frontend)"
	@echo "  make dev          Start all local services via Docker Compose"
	@echo "  make test         Run backend + frontend tests"
	@echo "  make build        Build all Docker images"
	@echo "  make lint         Run linters (ruff + eslint)"
	@echo "  make format       Auto-format code (ruff + prettier)"
	@echo "  make tf-init      Terraform init (AWS + GCP)"
	@echo "  make tf-plan      Terraform plan"
	@echo "  make tf-apply     Terraform apply"
	@echo "  make clean        Tear down all local Docker containers"
	@echo ""

# ── Setup ─────────────────────────────────────────────────────────────────────
setup:
	@echo "$(CYAN)Installing backend dependencies...$(RESET)"
	cd backend && python -m pip install -r requirements.txt
	@echo "$(CYAN)Installing frontend dependencies...$(RESET)"
	cd frontend && npm install
	@echo "$(CYAN)Installing agents dependencies...$(RESET)"
	cd agents && python -m pip install -r requirements.txt
	cp -n .env.example .env || true
	@echo "$(CYAN)Setup complete. Edit .env before starting dev.$(RESET)"

# ── Dev ───────────────────────────────────────────────────────────────────────
dev:
	docker compose up --build

dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

dev-agents:
	cd agents && python -m uvicorn main:app --reload --port 8001

# ── Test ──────────────────────────────────────────────────────────────────────
test:
	cd backend && python -m pytest tests/ -v
	cd frontend && npm run test

test-backend:
	cd backend && python -m pytest tests/ -v --cov=app --cov-report=term-missing

test-agents:
	cd agents && python -m pytest tests/ -v

# ── Build ─────────────────────────────────────────────────────────────────────
build:
	docker compose build

# ── Lint & Format ─────────────────────────────────────────────────────────────
lint:
	cd backend && ruff check .
	cd agents  && ruff check .
	cd frontend && npm run lint

format:
	cd backend && ruff format .
	cd agents  && ruff format .
	cd frontend && npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css}"

# ── Terraform ─────────────────────────────────────────────────────────────────
tf-init:
	cd infra/terraform/aws    && terraform init
	cd infra/terraform/gcp    && terraform init
	cd infra/terraform/shared && terraform init

tf-plan:
	cd infra/terraform/aws    && terraform plan -var-file=terraform.tfvars
	cd infra/terraform/gcp    && terraform plan -var-file=terraform.tfvars
	cd infra/terraform/shared && terraform plan -var-file=terraform.tfvars

tf-apply:
	cd infra/terraform/aws    && terraform apply -var-file=terraform.tfvars -auto-approve
	cd infra/terraform/gcp    && terraform apply -var-file=terraform.tfvars -auto-approve
	cd infra/terraform/shared && terraform apply -var-file=terraform.tfvars -auto-approve

tf-destroy:
	cd infra/terraform/shared && terraform destroy -var-file=terraform.tfvars -auto-approve
	cd infra/terraform/aws    && terraform destroy -var-file=terraform.tfvars -auto-approve
	cd infra/terraform/gcp    && terraform destroy -var-file=terraform.tfvars -auto-approve

# ── Clean ─────────────────────────────────────────────────────────────────────
clean:
	docker compose down -v --remove-orphans
