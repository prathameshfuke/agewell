# backend/services

Provider and persistence helpers called by the routes. Supabase access uses the service key (bypasses RLS), so callers must have already passed `auth.py`.

| File | Role |
|---|---|
| `groq_service.py` | Symptom extraction, next question, final report (Groq). Key from user settings or `GROQ_API_KEY`. |
| `gemini_service.py` | Image observation for symptom photos (Gemini, `GEMINI_API_KEY`). |
| `tts.py` | Bhashini TTS (`BHASHINI_API_KEY`, legacy alias `BHASHINI_INFERNCE`). Returns base64 WAV or `None`; `generate_question_with_audio` always returns text. Timeout `BHASHINI_TIMEOUT_SECONDS` (8 s). |
| `session_store.py` | CRUD on `diagnosis_sessions`; tolerates missing optional columns (PGRST204). |
| `audit_service.py` | Writes `symptom_audit_log`. |
| `emergency_alert_service.py` | On urgent reports: in-app alerts, email (SMTP `EMAIL_USER/EMAIL_PASSWORD`), SMS (Twilio). |
| `settings_service.py` | `app_settings` table; only `GROQ_API_KEY`, `GEMINI_API_KEY` allowed. Also hosts the shared `get_supabase_client()`. |
| `pdf_service.py` | ReportLab PDF of a diagnosis report. |
| `ai_assistant.py`, `automation_service.py`, `notification_service.py`, `ocr_service.py` | Legacy, serve only the unused SQLite routes. `notification_service` just prints. |

## Gotchas
- Each file re-implements the service-key lookup (`SUPABASE_SERVICE_KEY` / `_SECRET_KEY` / `_SERVICE_ROLE_KEY`); `auth.py` only reads the first two.
- Groq/Gemini services log with `print`, not `logging`.
