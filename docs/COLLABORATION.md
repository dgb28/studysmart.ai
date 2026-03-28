# COLLABORATION.md
> How to work in parallel with AI agents on StudyPulse.

---

## 1. How to Work in Parallel (Multiple People + Agents)

### Module Ownership
Every developer / AI agent MUST **claim ownership** of a module in `PROJECT_CONTEXT.md` before writing code to prevent merge conflicts.  
Update the "Module Ownership" table immediately when you pick something up.

| Module | Claim with |
|---|---|
| `backend/app/api/` | Add your name/agent + mark `[/]` in PROJECT_CONTEXT.md |
| `frontend/src/app/` | Same |
| `frontend/src/components/` | Same |
| `agents/evaluators/` | Same (Proof of Learning logic) |
| `agents/reflection/` | Same (Nightly reflection logic) |
| `infra/terraform/` | Same |

### Git Strategy
```
main          ← stable, tested StudyPulse features
dev           ← integration branch for new UI/AI features
feat/<name>   ← your branch (e.g., feat/friction-detection)
```
Follow standard PR workflows.

---

## 2. Context Sharing Between AI Agents

### The Context Contract
Every AI agent (Antigravity, Cursor, etc.) MUST:

1. **Read `PROJECT_CONTEXT.md` AND `AGENT_SETUP.md` at session start**.
2. **Read `docs/ARCHITECTURE.md`** to understand how the Friction Detection and Proof of Learning components connect.
3. **Check the "Module Ownership" table** to avoid duplicate work.
4. **Update `PROJECT_CONTEXT.md`** after completing a module.

---

## 3. API Contract First

When building complex features like "Adaptive Study Plan":
1. Define the API contract in `docs/api/` (OpenAPI Swagger) first.
2. Frontend builds the dashboard modals based on the mock schema.
3. Backend writes the FastAPI routes.
4. Agents service builds the LangChain evaluator.
5. Connect them once all interfaces match.

---

## 4. Environment Variables

- Add new keys (e.g., `ELEVENLABS_API_KEY`, `OPENAI_API_KEY`) to `.env.example`.
- Update `backend/app/core/config.py`.
- Document new keys in `docs/ENV_SETUP.md`.

---

## 5. Testing Conventions

| Layer | Focus | Run command |
|---|---|---|
| Backend | API logic, telemtry ingestion | `make test-backend` |
| Agents | Prompt evaluations, JSON output parsing | `make test-agents` |
| Frontend | Dashboard rendering, Voice UI | `npm run test` |

---

## 6. Hackathon Rules for StudyPulse
- Focus on the **Core Mechanics**: Proof of Learning, Friction Detection, Adaptive Plans, and Voice Coaching.
- Stub out basic features (like Auth) to prioritize unique UX interactions (e.g., the Full-Screen Voice Prompt).
