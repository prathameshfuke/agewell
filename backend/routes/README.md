# backend/routes

One Flask blueprint per file. Auth is applied globally in `../auth.py`, not per route.

## Live (used by the web app)
| File | Prefix | Purpose |
|---|---|---|
| `diagnosis_routes.py` | `/api/diagnosis` | start, answer, upload-image, generate-report, export-pdf, history, share, audit. Sessions persist in Supabase `diagnosis_sessions` via `services/session_store.py`. |
| `linking_routes.py` | `/api/link` | generate-code, join (6-char code, 24 h pending window, legacy `profiles.pairing_code` fallback), my-elders, my-caregivers. |
| `settings_routes.py` | `/api/settings` | save/list per-user Groq/Gemini keys in `app_settings` (values returned masked). |

| `prescription_routes.py` | `/api/prescriptions` | `POST /upload`: OCR a photo and return parsed medicines. Stateless; the review screen saves them to Supabase. Needs the tesseract binary on the host. |

The SQLite-era routes (ai, automation, health, medication, user, notification) were deleted: nothing in the frontend called them and their integer ids could not be ownership-checked. `models.py`, `database.py`, `seed_data.py` are now unused.

## Gotchas
- Handlers return `str(e)` on failure; `app.py` rewrites 5xx bodies. Keep 4xx messages static.
- Link-code `join` is rate limited in-process (10 wrong codes per 15 min per caregiver).
- Routes must read user ids from `user_id/patient_id/elder_id/elderly_id/caregiver_id` for the central check to apply. A new id key needs adding to `auth.py`.
