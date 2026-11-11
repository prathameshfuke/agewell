# backend/routes

One Flask blueprint per file. Auth is applied globally in `../auth.py`, not per route.

## Live (used by the web app)
| File | Prefix | Purpose |
|---|---|---|
| `diagnosis_routes.py` | `/api/diagnosis` | start, answer, upload-image, generate-report, export-pdf, history, share, audit. Sessions persist in Supabase `diagnosis_sessions` via `services/session_store.py`. |
| `linking_routes.py` | `/api/link` | generate-code, join (6-char code, 24 h pending window, legacy `profiles.pairing_code` fallback), my-elders, my-caregivers. |
| `settings_routes.py` | `/api/settings` | save/list per-user Groq/Gemini keys in `app_settings` (values returned masked). |

## Legacy (SQLite via `models.py`, integer ids, not called by the frontend)
`ai_routes.py`, `automation_routes.py`, `health_routes.py`, `medication_routes.py`, `user_routes.py`, `notification_routes.py`, `prescription_routes.py`. Because their ids are integers, `auth.py` cannot ownership-check them: any signed-in user can call them. Safe only while the SQLite DB holds no real data. Candidates for deletion.

## Gotchas
- Handlers return `str(e)` on failure; `app.py` rewrites 5xx bodies, but 4xx `ValueError` messages still reach the client.
- Routes must read user ids from `user_id/patient_id/elder_id/elderly_id/caregiver_id` for the central check to apply. A new id key needs adding to `auth.py`.
