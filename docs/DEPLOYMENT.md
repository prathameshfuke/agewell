# Deployment

| Part | Host | Source |
|---|---|---|
| Web app (React + Vite) | Vercel project `agewell` (Root Directory `frontend`) | `frontend/` |
| API (Flask) | Render web service | `backend/` |
| Database, auth, realtime | Supabase project `AgeWell` | `supabase/migrations/` |

Deploys run from GitHub Actions (`.github/workflows/ci.yml`): every push and pull request builds the app, compiles the backend and runs `backend/test_auth.py`. Pull requests get a Vercel preview, and `main` goes to production.

## Environment variables

**Vercel** (Production, Preview, Development)

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable (anon) key |
| `VITE_API_URL` | Render service URL ending in `/api`. Required: production builds never fall back to localhost. |

**Render**

| Name | Purpose |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Verify logins and read links. Without them every `/api` call returns 503. |
| `GROQ_API_KEY` | Symptom questions and reports |
| `GEMINI_API_KEY` | Image analysis |
| `BHASHINI_API_KEY` | Voice questions (Bhashini inference key) |
| `SECRET_KEY` | Flask secret |

Check the providers after a deploy: `GET <render-url>/health/deps` returns `configured` and `reachable` flags (no secrets).

**GitHub Actions secrets**: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (from `.vercel/project.json`), `RENDER_DEPLOY_HOOK_URL`. A deploy step skips itself when its secret is missing.

## Database migrations

Files in `supabase/migrations/` are additive and safe to re-run. Apply them in order from the Supabase SQL editor (Dashboard, SQL Editor) or with the Supabase CLI. The older scripts in `supabase/` are history; do not run them on production.

## One email, two modes

An account can hold both roles. Caregiver mode then needs a 4-digit PIN, stored hashed in `caregiver_pins` and checked by `verify_caregiver_pin()`; five wrong tries lock it for 15 minutes. The PIN protects the screen on a shared device. It is not a data boundary: the same signed-in user can read both modes' data, so use separate accounts when the elder and the caregiver are different people.

## Local development

```bash
cd frontend && cp .env.example .env && npm install && npm run dev
cd backend && pip install -r requirements.txt && REQUIRE_AUTH=0 python app.py
```

`REQUIRE_AUTH=0` turns the backend login check off for local work only.

## Known limits

- Render's free tier sleeps; the first request can take about 25 seconds.
- Free Supabase projects pause after a week of inactivity. Resume the project from the dashboard if sign-in suddenly fails.
- The backend still ships legacy SQLite routes (`/api/ai`, `/api/health`, `/api/medications`, `/api/users`, ...) that the app does not use. They require login but hold no real data.
