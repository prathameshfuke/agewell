# frontend/src

React 18 + Vite + Tailwind SPA (BrowserRouter, lazy pages). Hosted on Vercel; `../vercel.json` rewrites non-asset paths to `index.html`. Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (or `_PUBLISHABLE_KEY`), `VITE_API_URL` (must end in `/api`; production never falls back to localhost).

## Layout
- `App.jsx` - routes and the three inline guards (`AuthRoute`, `OnboardingRoute`, `ProtectedRoute`). `ProtectedRoute` renders `PinGate` when the active role is caregiver and not unlocked. `/caregiver/*` redirects to `/family/*`.
- `contexts/AuthContext.jsx` - session, profile, `roles`/`activeRole`, onboarding state. Dual-role accounts: `pinRequired`, `caregiverUnlocked` (30 min, stored client-side in sessionStorage key `caregiverUnlockUntil`), `linkedElderId` (profile.linked_elderly_id, else own id when elder). PIN RPCs: `verify/set/reset_caregiver_pin`, `has_caregiver_pin`.
- `lib/supabase.js` - Supabase client plus the `db` and `subscriptions` data layer (all tables, realtime `onHealthReading`). Implicit OAuth flow.
- `api/client.js` - fetch wrapper for the Flask API: adds the Supabase bearer token, 45 s timeout (Render cold start), always resolves to `{success:false,error}` on failure.
- `hooks/` - `useVitals` (latest `health_readings` row + realtime; "connected" = reading under 15 min old; BP/steps/sleep always null), `useMedications`, `useNotifications`, `useActivity`.
- `lib/notify.js` - non-blocking notices.
- `pages/` - Elder*, Family*, onboarding, auth, `Diagnosis/*` (QA flow with Bhashini audio), prescriptions, dispenser setup, voice memos.
- `components/` - `PinGate`, nav (`BottomNav` global; `ElderNav`/`FamilyNav` page shells), `ui/`, `dashboard/`, `layout/`, `AppErrorBoundary`.
- `index.css`, `../tailwind.config.js` - design system. `sage` = ink neutrals, `cream` = paper, `primary` = blue `#2F5BEA`; fonts Butler (serif) and Atkinson Hyperlegible.

## Gotchas
- No mock/demo data remains; empty states are real.
- The PIN gate is UI only (sessionStorage flag); it does not restrict Supabase queries.
- `?reset=true` on `/` clears local/session storage and cookies.
- Unused code: `components/guards/index.jsx`, `config/theme.js` (stale sage-green palette), and most of `components/ui` (only `Card`, `Button`, `CalendarHeatmap` are imported).
- No test script in `package.json`; CI runs `npm test --if-present` then `npm run build`.
