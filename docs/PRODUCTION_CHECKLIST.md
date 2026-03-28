# PRODUCTION_CHECKLIST.md
> Complete before every StudyPulse production deployment.

---

## Security
- [ ] All secrets (`OPENAI_API_KEY`, `ELEVENLABS_API_KEY`) in AWS/GCP Secret Manager (none in .env or code)
- [ ] JWT secret is 32+ chars, randomly generated
- [ ] CORS origins locked down (no `*`), specifically for WebSocket (WS/WSS) endpoints
- [ ] HTTPS enforced on all endpoints (mandatory for WebRTC audio)
- [ ] S3/GCS buckets for storing audio voice logs are private

## Performance
- [ ] Database connection pooling configured (pool_size=10+)
- [ ] Redis caching in place for active Study Plans and session telemetry
- [ ] Next.js optimized chunks for faster dashboard loading

## Reliability
- [ ] Celery worker retry logic in place for nightly Reflection Engine (max_retries=3)
- [ ] Fallback mechanism if ElevenLabs/OpenAI Audio API goes down (switch to text-only mode)

## Observability
- [ ] Sentry DSN configured for frontend tracking of Audio/WebRTC failures
- [ ] Logging for "Proof of Learning" token usage to track LLM costs

## Infrastructure
- [ ] Terraform state in remote backend (S3 or GCS)
- [ ] VPN tunnel between AWS and GCP is active

## Post-Deploy
- [ ] Smoke test the Friction Detection WebSocket endpoint
- [ ] Complete a dummy "Micro-Challenge" to ensure Audio is recording and evaluating correctly
