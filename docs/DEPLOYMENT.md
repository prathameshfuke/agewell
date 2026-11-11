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

## Phone sign-in

The app already has the SMS code screen on `/auth`. Until the provider is on, it shows "Phone sign-in isn't turned on yet. Use Google for now."

1. Supabase Dashboard, Authentication, Sign In / Providers, Phone: enable it and choose Twilio.
2. Enter the Twilio Account SID, Auth Token and a Messaging Service SID (or use Twilio Verify). Set OTP length to 6 and expiry to 600 seconds.
3. Twilio trial accounts can only text numbers verified in the Twilio console. SMS to India numbers needs a registered DLT sender and template, so test with a verified number first.
4. For emergency SMS alerts, add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_PHONE_NUMBER` to Render. Never commit these values.

Phone-only accounts have no email. The app shows the masked number (`+91 ******1234`) where an email would appear, and onboarding asks for the name.

## Local development

```bash
cd frontend && cp .env.example .env && npm install && npm run dev
cd backend && pip install -r requirements.txt && FLASK_DEBUG=1 REQUIRE_AUTH=0 python app.py
```

`REQUIRE_AUTH=0` turns the backend login check off only when `FLASK_DEBUG=1` is also set, so a stray variable in production cannot open the API.

## Known limits

- Render's free tier sleeps; the first request can take about 25 seconds.
- Free Supabase projects pause after a week of inactivity. Resume the project from the dashboard if sign-in suddenly fails.
- The backend still ships legacy SQLite routes (`/api/ai`, `/api/health`, `/api/medications`, `/api/users`, ...) that the app does not use. They require login but hold no real data.
