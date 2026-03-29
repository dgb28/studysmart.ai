#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "==> StudySmart Vercel pre-deploy check"
echo "Root: $ROOT_DIR"

cd "$FRONTEND_DIR"

if [[ ! -f ".env.production.example" ]]; then
  echo "ERROR: frontend/.env.production.example not found"
  exit 1
fi

if [[ ! -f "vercel.json" ]]; then
  echo "ERROR: frontend/vercel.json not found"
  exit 1
fi

if [[ ! -d "node_modules" ]]; then
  echo "==> Installing frontend dependencies"
  npm ci
fi

echo "==> Running TypeScript check"
npx tsc --noEmit

echo "==> Running ESLint"
CI=true npm run lint

echo "==> Running tests"
npm run test -- --passWithNoTests

echo "==> Pre-deploy checks passed"
