# PROJECT_CONTEXT.md
> This file is read by AI agents at session start to load project context for StudyPulse.

## Project Name
StudyPulse: AI Accountability + Cognitive Learning System

## Stack
| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python 3.11, Async WebSockets) |
| Frontend | Next.js 14 (TypeScript, WebRTC, Tailwind CSS v4) |
| AI/Agents | LangChain + LlamaIndex (Evaluations, Reflections) |
| Database | PostgreSQL 16 (primary), Redis 7 (cache + queue) |
| Vector DB | ChromaDB (local dev), Pinecone (prod) |
| Audio/Voice | OpenAI Realtime API / ElevenLabs TTS |
| Video/WebRTC| LiveKit (Rooms & Hovering PiP) |
| Infra | AWS (EKS, RDS, S3) + GCP (GKE, Cloud SQL, GCS) |
| IaC | Terraform 1.7+ |
| CI/CD | GitHub Actions |

## Ports (Local Dev)
| Service | Port |
|---|---|
| Frontend (Dashboard) | 3000 |
| Backend API | 8000 |
| Agents API | 8001 |
| ChromaDB | 8100 |

## Module Ownership (AI Agent Context)
When multiple developers/agents work in parallel, each should claim ownership of a module here and update `docs/COLLABORATION.md`.

| Module | Owner | Status |
|---|---|---|
| backend/app/api/sessions/ | Unassigned | [ ] |
| backend/app/api/telemetry/ (Friction Detection Websockets) | Unassigned | [ ] |
| backend/app/api/v1/routes/webrtc.py (LiveKit Tokens) | Antigravity | [x] |
| frontend/src/app/dashboard/ | Unassigned | [ ] |
| frontend/src/app/rooms/ (Study Lounge & PiP) | Antigravity | [x] |
| frontend/src/components/AudioModal/ | Unassigned | [ ] |
| agents/evaluators/ (Proof of Learning Logic) | Unassigned | [ ] |
| agents/reflection/ (Nightly Reflection Engine) | Unassigned | [ ] |

## What Is Next
> Updated by the team throughout the hackathon. Pick the next unclaimed item.

- [x] Create basic Postgres models for Users, Subjects, Modules, Topics, Sessions
- [x] Implement the full-screen "Proof of Learning" Voice Modal component (ElevenLabs integration)
- [x] Design 'Live Study Rooms' with WebRTC (LiveKit API & Next.js Hovering PiP)
- [ ] Scaffold FastAPI WebSocket route for real-time Friction Detection telemetry
- [ ] Build the Next.js Learning Dashboard Subject/Module selection UI
- [ ] Wire LangChain to process "Proof of Learning" transcripts and return JSON Gap Analysis
- [ ] Deploy MVP to AWS EKS

## Key Decisions
See `docs/DECISIONS.md`

## Architecture
See `docs/ARCHITECTURE.md`
