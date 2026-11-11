# Review (branch overhaul/stabilize-redesign)

Read-only review of backend/, supabase/migrations/, frontend/src and docs/CI. Ordered by severity.

## High
1. **Diagnosis session endpoints skip ownership checks.** `auth.py:19-21,83` only checks `user_id/patient_id/elder_id/elderly_id/caregiver_id`. `/answer` (`backend/routes/diagnosis_routes.py:111`), `/upload-image` (:174), `/generate-report` (:217), `/export-pdf/<session_id>` (:303), `/share` (:369), `/audit/<session_id>` (:425) take only `session_id` and never compare `session['patient_id']` with `g.user_id`. Any signed-in user holding a session UUID can read the report/PDF/audit log or trigger alerts and emails to the patient's family. UUIDs are unguessable, which limits exposure, but history/share responses leak them to every linked caregiver. Fix: load the session, then `can_access(g.user_id, session['patient_id'])`.
2. **Legacy SQLite routes are reachable by any signed-in user.** `backend/routes/{ai,automation,health,medication,user,notification,prescription}_routes.py` use `<int:...>` ids, so `auth.py` never ownership-checks them (e.g. `notification_routes.py:214` `POST /api/alerts` writes for any `user_id`; `user_routes.py:103` lists all users). `app.py:35-57` still mounts them and `app.py:30-32` creates `agewell.db`. Delete them or unmount.
3. **`REQUIRE_AUTH=0` disables all auth** (`auth.py:91`). One wrong env var on Render opens the API. Consider honouring it only when `FLASK_DEBUG=1`.

## Medium
4. **Migrations are not a complete schema.** `supabase/migrations/*.sql` reference `profiles`, `diagnosis_sessions`, `caregiver_links`, `can_access_user()` (migration 2, lines 7,21,35) that exist only in loose files (`supabase/schema.sql:243`, `20260330_linking_settings_migration.sql:65,133`). A fresh project cannot be built from migrations. Also `supabase/` still holds admin-creation and debug scripts (`create_admin_user.sql`, `debug_disable_triggers.sql`, ...) that should not stay in a repo others can run.
5. **PIN reset bypasses lockout.** `reset_caregiver_pin` (`20261111000000_caregiver_pin.sql:106-134`) does not check `locked_until`; after five wrong tries, re-signing in (within 5 min, :122) lets anyone with the session set a new PIN. Consistent with "screen gate, not data boundary", but the 15-minute lock is then cosmetic. Also, the unlock flag is a plain sessionStorage value (`AuthContext.jsx:17-27`) that devtools can set.
6. **Open CORS and unauthenticated `/health/deps` makes outbound calls.** `app.py:12` `CORS(app)` allows any origin (bearer-token auth limits CSRF risk). `app.py:72-93` is public and pings Groq/Gemini on every hit (8 s timeouts): cheap abuse vector for quota use. Restrict origins to the Vercel domain; rate-limit or cache `/health/deps`.
7. **Link-code join has no rate limit.** `linking_routes.py:146+` accepts guesses of a 6-char code (32^6) for 24 h with no throttle, and the legacy `profiles.pairing_code` fallback (:176-190) never expires.
8. **Error text leaks on 4xx and non-JSON paths.** Routes return `str(e)` (e.g. `settings_routes.py:72,74`); `app.py:63-69` only rewrites 5xx JSON. `ValueError` messages from services reach clients.
9. **Sign-in/auth-state churn.** `AuthContext.jsx:233-257` re-runs `syncSession` and shows the loader on every `SIGNED_IN` event (Supabase emits it on tab refocus), re-fetching the profile; only `TOKEN_REFRESHED` is skipped.
10. **Stale default name on signup.** `AuthContext.jsx:303` sets `full_name: 'Admin User'` for every email signup.

## Low / stale
11. **Dead frontend code:** `components/guards/index.jsx` (duplicate of the guards in `App.jsx:121-190`, never imported), `config/theme.js` (old sage palette, `primary.main '#2F5BEA'` next to sage comments), most of `components/ui/*` (only `Card`, `Button`, `CalendarHeatmap` imported), `frontend/vite.config.js.timestamp-*.mjs` (tracked build artifact).
12. **Doc/code mismatches:** `docs/DESIGN.md` (sage-green `#5C7A6E` palette, "no harsh blues"), `docs/FRONTEND.md:64` (`/demo` page), `docs/ARCHITECTURE.md:89-90` (generic RBAC), `docs/API.md:9` ("handled by frontend") and SQLite-era routes in `docs/API.md`/`BACKEND.md`. `PinGate.jsx` uses raw `slate-*` classes (22 occurrences across files) instead of sage/cream tokens. `supabase.js` comment mentions HashRouter but the app uses BrowserRouter.
13. **`app.py:111`** binds `0.0.0.0:5001` and `app.py:18` sets a default `SECRET_KEY`; `app.py:96-108` index lists legacy endpoints. `emergency_alert_service`, `session_store`, `audit_service`, `settings_service` each duplicate service-key lookup and accept `SUPABASE_SERVICE_ROLE_KEY`, which `auth.py:15` ignores, so auth returns 503 while other services work.
14. **Logging:** Groq/notification services use `print` (`groq_service.py:17-417`, `notification_service.py:98`), so Render logs are unstructured and may include model output.
15. **CI:** `ci.yml` deploy steps exit 0 when secrets are missing (silent green); no frontend tests exist; `backend` job only runs `test_auth.py` (no coverage of the session-id gap in #1).
16. **PDF export:** `patient_name` is taken from the query string (`diagnosis_routes.py:309`) and rendered unvalidated into the PDF.
17. **Dead weight:** `prescription/`, `project/`, `stitch_elder_dashboard/`, `frontend/font`, `frontend/assets` pending deletion.

## Security review (pre-production)

OWASP-style pass over backend, Supabase RLS/storage, frontend headers and dependencies. Fixed items are in the working tree (uncommitted); migrations are written, **not applied**.

**Critical / High**
1. **Elder data readable by any signed-in user (RLS).** `profiles.linked_elderly_id` was writable by its owner with no check, and `can_access_user()` plus `backend/auth.py:can_access` both trust it (`schema.sql:402-403`). Fix: `migrations/20261111000500_rls_hardening.sql` adds a trigger so a client may only point it at an elder it has an active `caregiver_links` row for. Run the audit query in that file for rows that already point at an elder without a link (legacy, revoked or forged). Revoking a link still leaves the pointer, so a revoked caregiver keeps access until the pointer is cleared: no revoke UI exists yet.
2. **Voice memos in a public bucket with guessable names** (`pages/VoiceMemos.jsx:105-112`, `voice-memo-<Date.now()>.webm` via `getPublicUrl`). Fix: `migrations/20261111000600_voice_memos_private_storage.sql` (private bucket, object policies tied to `voice_memos`), and `lib/supabase.js` now stores the object name and signs URLs on read. Deploy the frontend first or together with the migration.
3. **Ownership check bypass in `auth.py`.** Ids were only checked when they were a bare UUID, but routes `strip()` them: `" <victim uuid>"` skipped the check and then hit the service-key query. `session_id` and `user_id` sent as multipart form fields (`/upload-image`, `/prescriptions/upload`) were never inspected. Fix: form fields are inspected, and any id key whose value is not a plain UUID string is a 400 (`fullmatch`, so a trailing newline fails too).
4. **Caregiver could mint link codes for the elder** and so invite anyone into the elder's data (`linking_routes.py` `generate-code`). Now elder-only. Same for replacing provider keys in `/api/settings/keys`.
5. **Legacy `profiles.pairing_code` join** never expired, was `Math.random()`-generated client-side and never shown to the elder. Removed from `/api/link/join`. Wrong-code counter is now also per client IP and case-insensitive on the caregiver id.

**Medium**
6. No per-user rate limit on Groq/Gemini/TTS/upload/share/link routes: added in `auth.py` (`RATE_LIMITS`, 429 with `Retry-After` and a plain-language message; in-process, `ponytail:` comment).
7. Uploads: prescription photos only checked the filename extension and `/diagnosis/upload-image` nothing. New `services/uploads.py`: 8 MB cap, Pillow magic-byte sniff (JPEG/PNG/WEBP only), pixel cap against decompression bombs, filenames never used. JSON bodies over 64 KB are refused (413). Free-text inputs sent to the LLM are length-capped; `patient_name` is normalised once for SMS, email and PDF.
8. Logs: WhatsApp/push placeholders printed phone numbers and message bodies (PHI); exception text from Supabase/Groq/Gemini (can echo row data) now logs the exception type only.
9. Vulnerable dependencies. Backend bumped: Flask 3.1.3, Werkzeug 3.1.9, Flask-CORS 6.0.0, requests 2.33.0, python-dotenv 1.2.2 (`pip-audit`: 0 known). Frontend `npm audit fix`: react-router 7.18.5 and ws 8.22.2; production audit is clean.
10. `handle_new_user` lacked `set search_path`; helper functions were executable by `anon`; `voice_memos` allowed inserting a memo addressed to any user: all in migration `...000500`.

**Headers / transport**: `frontend/vercel.json` now sends CSP (default-src 'self', script-src 'self', no inline scripts in `dist/index.html`), HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy (microphone=(self)). The Supabase origin is also in `media-src` for signed voice-memo URLs. The API sends nosniff, `Cache-Control: no-store` on `/api`, `frame-ancestors 'none'`, HSTS. `app.run` never binds beyond localhost in debug.

**Verified OK**: all `/api` routes go through `before_request`; no committed secrets (`git log -G` for gsk_, AIza, sb_secret, JWTs, sk-, Twilio: none; `.env*` ignored); only `VITE_` vars reach the bundle; no `dangerouslySetInnerHTML`, no `target=_blank`, no open redirect (`redirectTo` is `window.location.origin`); PostgREST filters use params dicts or supabase-py builders; PDF/email text is escaped; the PIN RPCs are `security definer` with pinned `search_path`, lock after 5 tries for 15 minutes (verify, change and reset all honour it) and have no direct table access.

**Still needs the owner**
- Apply `20261111000400`, `000500`, `000600` in order (000500/000600 are new here), then run the audit query.
- Supabase Auth: set Site URL and the redirect allow-list to the Vercel domain only; enable leaked-password protection, email confirmation and a captcha/rate limits on sign-up and sign-in; consider `flowType: 'pkce'` in `lib/supabase.js` (needs a check of `AuthCallback.jsx`).
- Render: `CORS_ORIGINS` for any extra origin, `SECRET_KEY` set, `REQUIRE_AUTH` and `FLASK_DEBUG` unset, start command `gunicorn`. Provider keys saved in `app_settings` are plaintext; prefer server-side env keys only.
- Remaining dev-only npm advisories (vite/esbuild, @babel/core, browserslist) need a vite major bump.
- Pages (not touched in this pass): `VoiceMemos.jsx:105-112` should upload to `<user id>/<uuid>.webm` and stop calling `getPublicUrl`; `ElderlyOnboarding.jsx:89` generates a `Math.random()` pairing code that is now unused; `CaregiverOnboarding.jsx:118` writes `linked_elderly_id` from the client (now trigger-guarded, redundant with the backend join).
- The caregiver PIN stays a screen gate (sessionStorage flag), not a data boundary.
