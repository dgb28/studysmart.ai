# AGENT_SETUP.md
# ⚡ AI Agent Bootstrap Instructions for StudyPulse

> **THIS FILE IS FOR AI AGENTS (Cursor, Antigravity, GPT-4, Claude, Gemini, etc.)**  
> When you open this project, read this file first.  
> Then follow the steps below to set up the environment and claim your work.

---

## 🤖 Prompt to Use When Starting a New Session

Copy and paste this into your AI agent at the start of every session:

```
You are working on "StudyPulse: AI Accountability + Cognitive Learning System" at D:\hackathon-project.

MANDATORY FIRST STEPS:
1. Read AGENT_SETUP.md (this file) completely.
2. Run the onboarding workflow: `view_file .agents/workflows/onboard.md`.
3. Read the latest `walkthrough.md` to see the recently completed Interactive AI Coaching features.
4. Read `docs/ARCHITECTURE.md` to understand the ElevenLabs SDK integration and Context Locking.
5. Check the "Module Ownership" table in `PROJECT_CONTEXT.md`.
5. Pick one UNCLAIMED module (e.g., frontend/src/components/AudioModal). Write your name/model in the table and mark it [/].
6. Implement the module following existing patterns.
7. When done, mark your module [x] in PROJECT_CONTEXT.md and add any notes for the next agent.

CRITICAL RULES:
- Never work on a module already claimed by another developer.
- Audio/WebRTC components must rely on secure HTTPS/WSS when not on localhost. Support graceful degradation.
- AI Logic for grading should output strict Pydantic/JSON schemas for the Adaptive Study Plan Generator to consume.
- If you add an env variable for a new LLM provider, add it to .env.example AND docs/ENV_SETUP.md.
- Commit frequently with descriptive messages.
```

---

## 🛠️ Auto-Setup Steps (for any AI agent)

### Step 1 — Check Python and Node versions
```bash
python --version    # must be 3.11+
node --version      # must be 20+
```

### Step 2 — Install all dependencies
```bash
make setup
```

### Step 3 — Copy environment file
```bash
cp .env.example .env
# ⚠️ Open .env and ensure OPENAI_API_KEY and ELEVENLABS_API_KEY are set for Voice features.
```

### Step 4 — Start all services
```bash
docker compose up --build
```

---

## 📁 Important Files to Know

| File | What it does |
|---|---|
| `PROJECT_CONTEXT.md` | Shared project state — **read and update this** |
| `docs/ARCHITECTURE.md` | System design, data flows for audio and telemetry |
| `docs/DECISIONS.md` | Why we use FastAPI for WebSockets, Next.js for UI, etc. |
| `docs/COLLABORATION.md` | Module claiming rules (vital for hackathon speed) |
| `.env.example` | Template containing all required keys for Realtime Audio and DBs |

---

## 🏗️ Project Structure at a Glance

```
hackathon-project/
├── backend/          ← FastAPI API (Python 3.11)
│   └── app/
│       ├── api/v1/routes/   ← Telemetry WebSocket and Session ends point here
│       ├── models/          ← Study Plans, Progress tracking
│       └── workers/         ← Nightly Reflection Engine (Celery)
├── frontend/         ← Next.js 14 (TypeScript)
│   └── src/
│       ├── app/             ← Learning Dashboard routing
│       └── components/      ← Timer hooks, AudioModals, Charts
├── agents/           ← AI pipelines (LangChain/LlamaIndex)
│   ├── evaluators/          ← Proof of Learning micro-challenge grading logic
│   ├── reflection/          ← Behavioral insight generators
│   └── memory/              ← Shared Redis agent memory for continuous context
├── infra/            ← Multi-Cloud deployment (AWS + GCP)
└── docs/             ← Architecture, guides, ADRs
```

---

## 📞 If You're Stuck

1. Check `docs/TROUBLESHOOTING.md` for Audio and WebSocket limits.
2. Check `docs/KNOWN_ISSUES.md`.
3. Add the issue to `docs/KNOWN_ISSUES.md` for others.
