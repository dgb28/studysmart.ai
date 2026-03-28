# TROUBLESHOOTING.md
> Common errors and how to fix them for the StudyPulse project.

---

## Audio / Voice Integration

### Microphone access denied on Localhost
- **Symptom:** Voice coaching modal pops up, but microphone icon is disabled
### Changes don't appear in browser
- **Cause**: Docker on Windows volume sync latency.
- **Fix**: Ensure `WATCHPACK_POLLING=true` is set in the frontend service environment in `docker-compose.yml`.

### "@elevenlabs/client not found" in Docker
- **Cause**: Host `node_modules` vs Container anonymous volume conflict.
- **Fix**: Run `docker compose exec frontend npm install @elevenlabs/client` inside the container.
ttp://localhost:3000` and not `http://127.0.0.1:3000` or a custom local domain without SSL.

### ElevenLabs API Quota Exceeded (429)
- **Symptom:** AI voice fallback to default browser TTS; server logs show 429 from ElevenLabs.
- **Fix:** Check API quota in ElevenLabs dashboard. Switch to a different key in `.env` or temporarily disable premium voice and rely on OpenAI text output.

---

## WebSockets & Friction Detection

### WebSocket disconnects instantly
- **Symptom:** Console shows `WebSocket connection to 'ws://localhost:8000/ws/session/...' failed`.
- **Fix:** Check the FastAPI backend logs. Often caused by an invalid/expired JWT token being passed in the connection parameters. Try logging out and restarting the session.

---

## Docker / Services

### Postgres container exits immediately
Check logs: `docker compose logs postgres`  
Common cause: bad `POSTGRES_PASSWORD` or data directory permission issue.  
Fix: `docker compose down -v` (removes volumes) then `docker compose up`.

---

## UI / Styling (Tailwind v4)

### Styling / Padding is missing on some components
- **Symptom:** UI looks "flat", buttons have no padding, glassmorphism cards look squashed.
- **Fix:** Ensure `postcss.config.mjs` is present in the frontend root and `globals.css` includes the `@source` directive. Tailwind v4 needs to be explicitly told where to look for classes if the CSS file is nested.

---

## Networking / API

### "Fetch failed" on Dashboard / Server Components
- **Symptom:** Runtime error in browser: `Error: fetch failed` at `src/app/dashboard/page.tsx`.
- **Fix:** Server Components run *inside* the Docker container. They cannot use `localhost` to reach the backend. Ensure server-side fetches use `http://backend:8000` (internal Docker DNS) or the `INTERNAL_API_URL` environment variable.
