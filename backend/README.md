# backend

Flask API deployed on Render (gunicorn). The app uses it only for AI symptom diagnosis, caregiver linking, API-key settings, and TTS. Everything else (meds, vitals, profiles) goes from the browser straight to Supabase.

## Key files
- `app.py` - creates the app, `CORS(app)` (all origins), registers `authenticate` as `before_request`, mounts all blueprints, `/health`, `/health/deps`, `/`. An `after_request` hook replaces any JSON 5xx body with a generic message (the real one is logged).
- `auth.py` - the single auth gate. Every `/api` request needs `Authorization: Bearer <Supabase access token>`; the token is checked against `{SUPABASE_URL}/auth/v1/user`. Any UUID found under keys `user_id, patient_id, elder_id, elderly_id` (URL, query or JSON body) must be the caller or a linked elder (active `caregiver_links` row, or `profiles.linked_elderly_id`); `caregiver_id` must be the caller. Results are cached 60 s in process memory.
- `test_auth.py` - offline check of the gate (Supabase stubbed). Run `python test_auth.py` from `backend/`; CI does too.
- `routes/`, `services/` - see their READMEs.
- `models.py`, `database.py`, `seed_data.py` - legacy SQLite layer (see Gotchas).

## Run
```
pip install -r requirements.txt
cp .env.example .env   # SUPABASE_URL, SUPABASE_SERVICE_KEY, GROQ_API_KEY, GEMINI_API_KEY, BHASHINI_API_KEY ...
python app.py          # port 5001
```
`GET /health/deps` reports configured/reachable per provider (no secrets). `REQUIRE_AUTH=0` disables auth for local dev only.

## Gotchas
- Without `SUPABASE_URL` + service key every `/api` call returns 503.
- The ownership check only covers the four elder keys and `caregiver_id`. Routes keyed by `session_id` (diagnosis answer/upload/report/export/share/audit) are not ownership-checked; see `docs/REVIEW.md`.
- Legacy SQLite routes (`ai`, `automation`, `health`, `medications`, `users`, `notifications`, `prescriptions`) are unused by the app. `app.py` still creates `agewell.db` and `uploads/prescriptions/` at import.
- Caches are per-process; fine for one gunicorn worker only.
- There is no Procfile/render.yaml; the Render start command lives in the Render dashboard.
