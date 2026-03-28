# ENV_SETUP.md
> Step-by-step environment setup for StudyPulse developers and AI agents.

---

## 1. Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | 3.11+ | https://python.org |
| Node.js | 20+ | https://nodejs.org |
| Docker | 24+ | https://docker.com |
| Docker Compose | 2.20+ | bundled with Docker Desktop |
| AWS CLI | v2 | https://aws.amazon.com/cli/ |
| gcloud CLI | latest | https://cloud.google.com/sdk |
| Terraform | 1.7+ | https://terraform.io |
| kubectl | 1.31+ | https://kubernetes.io/docs/tasks/tools/ |
| git | 2.40+ | https://git-scm.com |

---

## 2. Clone & Configure

```bash
git clone <repo-url> hackathon-project
cd hackathon-project
cp .env.example .env
# Edit .env with your values (API keys, DB passwords, etc.)
```

---

## 3. Python Environment (Backend + Agents)

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Note: AI logic (LangChain/OpenAI) is now part of the main backend service.
```

---

## 4. Node.js Environment (Frontend)

```bash
cd frontend
npm install
```

---

## 5. Docker — Start All Services

```bash
# From root of project
docker compose up --build
# Services: postgres, redis, chroma, backend, frontend, celery worker
```

---

## 6. Cloud & Infrastructure setup (AWS/GCP/Terraform)

Please refer to standard AWS/gcloud/Terraform setup guides. The Terraform definitions are located in `infra/terraform/aws` and `infra/terraform/gcp`. Both clouds are connected via an IPSec VPN.

---

## 7. AI Agent API Keys (CRITICAL for StudyPulse)

Add to `.env`:
```bash
# Needed for Proof of Learning Evaluation & Friction Detection Prompts
OPENAI_API_KEY=sk-...          # Get from platform.openai.com
# OR for Gemini fallback
GOOGLE_API_KEY=AIza...         # Get from console.cloud.google.com

# Needed for High-Quality Voice Coaching interactions
ELEVENLABS_API_KEY=...         # Get from elevenlabs.io (optional, fallback to browser TTS)
```

### Frontend Variables (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL`: `http://localhost:8000` (for browser-side calls)
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`: Your ElevenLabs Conversational AI Agent ID.

---

## 8. Verify Everything Works

```bash
# Health checks
curl http://localhost:8000/health   # Backend
curl http://localhost:8001/health   # Agents API
open http://localhost:3000          # Frontend (Learning Dashboard)
```
