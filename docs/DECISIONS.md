# DECISIONS.md
> Architecture Decision Records (ADRs) for StudyPulse.

---

## ADR-001: FastAPI for Backend and Real-time Telemetry

**Status**: Accepted  
**Date**: 2026-03-27

**Decision**: Use FastAPI as the core backend framework.

**Reasoning**:
- Native async/await support — critical for handling WebSocket connections for Real-Time Friction Detection and concurrent LLM API calls.
- High performance, easily supporting the telemetry throughput required per active student session.

---

## ADR-002: Next.js 14 with App Router

**Status**: Accepted

**Decision**: Use Next.js 14 App Router for the frontend.

**Reasoning**:
- Server Components provide fast initial loads for the dashboard.
- Extensive ecosystem for integrating WebRTC (audio coaching) and complex UI state management (modals, timers, study flow).

---

## ADR-003: LlamaIndex & LangChain for Agent Chains

**Status**: Accepted

**Decision**: Use LlamaIndex for module content ingestion/RAG, LangChain LCEL for orchestrating the "Proof of Learning" and "Reflection Engine" workflows.

**Reasoning**:
- LangChain's composable pipelines allow us to cleanly chain the evaluation steps (e.g., Audio Transcript -> Clarity Check -> Gap Identification -> Feedback Generation).
- Easy integrations with streaming responses.

---

## ADR-004: Vector DB (ChromaDB + Pinecone)

**Status**: Accepted

**Decision**: ChromaDB locally via Docker, Pinecone in production for storing course content and historical coaching contexts.

---

## ADR 003: ElevenLabs Client SDK Upgrade
**Context**: Initially used the basic web widget, but it lacked synchronization with a text-chat panel.
**Decision**: Switched to `@elevenlabs/client` to build a custom `VoiceCoach` component.
**Consequences**: Enabled dual voice/text interaction and more precise context "locking."

## ADR 004: Windows/Docker Volume Sync
**Context**: Changes on the host (Windows) weren't triggering HMR in the container.
**Decision**: Added `WATCHPACK_POLLING=true` to the frontend environment.
**Consequences**: Stable development experience for Windows users.

## ADR-005: Voice Architecture strategy

**Status**: Accepted

**Decision**: Rely heavily on OpenAI Realtime API (or WebRTC equivalents) for the AI voice interactions (Morning check-ins, micro-challenges).

**Reasoning**:
- To achieve the "alive" coach feel, latency needs to be ultra-low and the voice must understand interruptions.
- If real-time API is too complex for initial MVP, fallback to Text-to-Speech (ElevenLabs) + Speech-to-Text (Whisper).

---

## ADR-006: Celery + Redis for Nightly Reflections

**Status**: Accepted

**Decision**: Use Celery and Redis to process the "AI Reflection Engine" jobs nightly.

**Reasoning**:
- Requires crunching telemetry and session data for all active users daily, making predictions, and generating behavioral insights. Offloading this from the main API thread is mandatory.

---

---

## ADR-007: Consolidation of AI Logic into Backend

**Status**: Accepted
**Date**: 2026-03-28

**Decision**: Consolidate AI Agents logic (LangChain/OpenAI) directly into the main FastAPI backend service.

**Reasoning**:
- Resolves severe Docker build conflicts between `llama-index` and `langchain` dependency trees.
- Simplifies the architecture by removing a redundant microservice during the hackathon MVP phase.
- Reduces network overhead for internal calls between the business logic and AI evaluation.

---

## ADR-008: Tailwind CSS v4 Configuration in Next.js

**Status**: Accepted
**Date**: 2026-03-28

**Decision**: Use `postcss.config.mjs` and the `@source` directive in `globals.css`.

**Reasoning**:
- Tailwind v4 in Next.js requires the `@tailwindcss/postcss` plugin to correctly parse the `@import "tailwindcss"` directive.
- The `@source "../"` directive is necessary when `globals.css` is nested (e.g., in `src/app/`) to ensure the compiler scans component folders outside the immediate directory.

---

## ADR-009: Internal Networking for Server-Side Rendering (SSR)

**Status**: Accepted
**Date**: 2026-03-28

**Decision**: Use Docker service hostnames (e.g., `http://backend:8000`) for server-side `fetch` calls.

**Reasoning**:
- Next.js Server Components run inside the container. They cannot reach the backend via `localhost:8000` (which refers to the frontend container itself).
- Environment variables are tiered: `NEXT_PUBLIC_API_URL` for the browser (localhost) and `INTERNAL_API_URL` for the server (Docker bridge).
