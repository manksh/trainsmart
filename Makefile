.PHONY: help install dev build up down logs migrate seed test clean

# Default target
help:
	@echo "TrainSmart Development Commands"
	@echo "================================"
	@echo ""
	@echo "Setup:"
	@echo "  make install     - Install all dependencies"
	@echo "  make dev         - Start development servers"
	@echo ""
	@echo "Docker:"
	@echo "  make up          - Start all services with Docker"
	@echo "  make down        - Stop all services"
	@echo "  make logs        - View logs from all services"
	@echo "  make logs-backend - View backend logs"
	@echo "  make logs-frontend - View frontend logs"
	@echo ""
	@echo "Database:"
	@echo "  make migrate     - Run database migrations"
	@echo "  make migrate-new - Create a new migration"
	@echo "  make seed        - Seed the database"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run all tests"
	@echo "  make test-backend - Run backend tests"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean       - Remove all containers and volumes"

# Install dependencies
install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

# Development (without Docker)
dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

# Docker commands
up:
	docker-compose up -d

up-build:
	docker-compose up -d --build

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f db

# Database commands
migrate:
	cd backend && alembic upgrade head

migrate-new:
	@read -p "Migration message: " msg; \
	cd backend && alembic revision --autogenerate -m "$$msg"

migrate-down:
	cd backend && alembic downgrade -1

# Seed database (run after migrations)
seed:
	cd backend && python -m app.seeds.seed_all

seed-assessment:
	cd backend && python -m app.seeds.assessment_seed

# Testing
test:
	cd backend && pytest

test-backend:
	cd backend && pytest -v

# Cleanup
clean:
	docker-compose down -v
	rm -rf backend/__pycache__
	rm -rf backend/app/__pycache__
	rm -rf frontend/.next
	rm -rf frontend/node_modules

# Quick start for development
start: up
	@echo "Services starting..."
	@echo "Backend API: http://localhost:8000"
	@echo "Backend Docs: http://localhost:8000/docs"
	@echo "Frontend: http://localhost:3000"
