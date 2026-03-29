# Deploy on Vercel (Frontend) + Hosted Backend

This project has two deploy targets:

- `frontend` (Next.js): deploy to **Vercel**
- `backend` (FastAPI + Postgres + Redis + worker): deploy to a Python host (Render/Railway/Fly)

## 1) Deploy backend first

Set backend env vars:

- `APP_ENV=production`
- `DEBUG=false`
- `SECRET_KEY=<strong-random-secret>`
- `JWT_SECRET=<strong-random-secret>`
- `DATABASE_URL=<managed-postgres-url>`
- `REDIS_URL=<managed-redis-url>`
- `CORS_ORIGINS=["https://your-app.vercel.app"]`
- `OPENAI_API_KEY=<if used>`
- `ELEVENLABS_API_KEY=<if used>`

Verify:

- `GET https://your-backend-domain.com/health` -> 200

## 2) Deploy frontend on Vercel

In Vercel:

1. Import GitHub repo
2. Set **Root Directory** to `frontend`
3. Framework: Next.js

Add Vercel env vars:

- `NEXT_PUBLIC_API_URL=https://your-backend-domain.com`
- `NEXT_PUBLIC_APP_NAME=StudyPulse`
- `NEXT_PUBLIC_ELEVENLABS_API_KEY=<if used>`
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID=<if used>`

## 3) CLI deployment (optional)

```bash
./scripts/vercel-predeploy-check.sh
cd frontend
npx vercel link
npx vercel --prod
```

## 4) Update CORS with real Vercel URL

After first deploy, add exact domain(s):

- `https://<project>.vercel.app`
- custom domain if used

Redeploy backend.

## 5) Smoke test production

1. Signup
2. Login
3. Open module
4. Start/pause focus
5. Analytics loads
