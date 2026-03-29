# ARCHITECTURE.md

> System architecture reference for StudyPulse: AI Accountability + Cognitive Learning System.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                     │
│  Learning Dashboard · Live Study Rooms (PiP) · Voice Chat UI  │
└──────────────────────────────┬───────────────────────────────┘
                               │  HTTPS / WebSockets / WebRTC (LiveKit)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI)                         │
│  Auth · Session Metrics · Study Plan Engine · Friction Svc    │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────┐         ┌─────────────────────────────┐
│  PostgreSQL (primary) │         │  Redis (cache + task queue)  │
└──────────────────────┘         └──────────────┬──────────────┘
                                                │
                                                ▼
                                 ┌──────────────────────────────┐
                                 │   Celery Workers              │
                                 │   Nightly Reflection Engine   │
                                 └──────────────────────────────┘
   ┌───────────────────┐   ┌─────────────────┐
   │  ChromaDB (local) │   │  Pinecone (prod) │
   │  Topic Knowledge  │   │  Topic Knowledge │
   └───────────────────┘   └─────────────────┘

┌──────────────────────────────────────────────────────────────┐
│               Multi-Cloud Infrastructure                      │
│                                                              │
│   AWS                        GCP                            │
│   ┌──────────────┐           ┌──────────────────┐           │
│   │  EKS (K8s)   │◄─VPN─────►│  GKE (K8s)       │           │
│   │  RDS Postgres│           │  Cloud SQL       │           │
│   │  S3 (audio)  │           │  GCS Bucket      │           │
│   │  ALB         │           │  Cloud Run       │           │
│   │  Secrets Mgr │           │  Secret Manager  │           │
│   └──────────────┘           └──────────────────┘           │
│          │                          │                        │
│          └─────────IPSec VPN────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Service Port Map (Local Dev)

| Service            | Port | URL                        |
| ------------------ | ---- | -------------------------- |
| Frontend (Next.js) | 3000 | http://localhost:3000      |
| Backend API        | 8000 | http://localhost:8000      |
| API Docs (Swagger) | 8000 | http://localhost:8000/docs |
| PostgreSQL         | 5432 | —                          |
| Redis              | 6379 | —                          |
| ChromaDB           | 8100 | http://localhost:8100      |
| RedisInsight       | 8002 | http://localhost:8002      |

---

## Data Flow: Real-Time Friction Detection

```
Learning Dashboard (Client)
     │ 1. Collects mouse movement, typing speed, time-on-page
     ▼
WebSocket Connection (or periodic POST)
     │ 2. Streams telemetry
     ▼
Friction Detection Service (FastAPI backend)
     │ 3. Analyzes rolling window. If inactivity > threshold:
- **Coach Hub**: Built with `@elevenlabs/client`. Uses a custom React hook `useVoiceConversation` to synchronize conversational AI state with a floating chat drawer.
- **Context Injection**: Uses ElevenLabs Dynamic Variables to inject `topic_title` and `topic_content` into the agent's system prompt in real-time.

## Data Flow: Live Study Rooms
```
User navigates to /rooms 
     │ 1. Clicks "Join Study Room"
     ▼
FastAPI Backend (/api/v1/rooms/webrtc)
     │ 2. Validates user, generates LiveKit JWT (audio: false, video: true)
     ▼
LiveKit Server
     │ 3. Establishes WebRTC mesh/SFU connection over WSS
     ▼
Next.js Global Context (StudyRoomProvider)
     │ 4. User navigates to /dashboard
     ▼
Floating PiP Video Overlay activates automatically.
```

## Data Flow: Proof of Learning (Micro-Challenge)

```
User completes 3 topics
     │ 1. Triggers Micro-Challenge Modal
     ▼
User records audio / types summary ("Explain what you learned in 30 sec")
     │ 2. Payload sent to Agents API
     ▼
Proof of Learning Evaluator (LLM)
     │ 3. Grades response (Clarity, Correctness, Gaps)
     ▼
Study Plan Generator
     │ 4. Updates user's learning state with identified gaps
     ▼
User receives structured feedback (text/audio prompt)
```

---

## Multi-Cloud Design

| Concern        | AWS                 | GCP                  |
| -------------- | ------------------- | -------------------- |
| Compute (K8s)  | EKS                 | GKE                  |
| Database       | RDS PostgreSQL      | Cloud SQL PostgreSQL |
| Object Store   | S3 (for audio logs) | GCS                  |
| Serverless     | Lambda              | Cloud Run            |
| Secrets        | Secrets Manager     | Secret Manager       |
| Load Balancing | ALB                 | GKE Ingress          |
| Cross-cloud    | AWS VPN             | GCP HA VPN           |

Cross-cloud traffic flows through an IPSec VPN tunnel (AWS VPN Connection ↔ GCP HA VPN Gateway).
