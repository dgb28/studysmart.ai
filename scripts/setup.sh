#!/usr/bin/env bash
# scripts/setup.sh — bootstrap developer environment from scratch

set -e

echo "🚀 Setting up Hackathon Project..."

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3.11+ required"; exit 1; }
command -v node    >/dev/null 2>&1 || { echo "❌ Node.js 20+ required";  exit 1; }
command -v docker  >/dev/null 2>&1 || { echo "❌ Docker required";       exit 1; }

# Environment file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example — please fill in your API keys!"
fi

# Backend
echo "📦 Installing backend dependencies..."
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --quiet -r requirements.txt
deactivate
cd ..

# Agents
echo "🤖 Installing agents dependencies..."
cd agents
python3 -m venv .venv
source .venv/bin/activate
pip install --quiet -r requirements.txt
deactivate
cd ..

# Frontend
echo "⚡ Installing frontend dependencies..."
cd frontend && npm install --silent && cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys and passwords"
echo "  2. Run: docker compose up --build"
echo "  3. Open: http://localhost:3000"
echo "  4. API docs: http://localhost:8000/docs"
echo ""
echo "If you are an AI agent, read AGENT_SETUP.md for full instructions."
