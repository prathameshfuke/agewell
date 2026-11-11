# supabase/migrations

Timestamped SQL for the Supabase project `AgeWell`. Apply in order (SQL editor or `supabase db push`). All are idempotent.

| File | What it does |
|---|---|
| `20261111000000_caregiver_pin.sql` | `caregiver_pins` (RLS on, no policies, grants revoked) plus security-definer functions `has_/verify_/set_/reset_caregiver_pin`. bcrypt via pgcrypto; 5 wrong tries lock 15 min; reset needs a sign-in within 5 min. Granted to `authenticated` only. |
| `20261111000100_diagnosis_alerts_audit_log.sql` | `diagnosis_alerts`, `symptom_audit_log`; select policy via `can_access_user()`. Backend writes with the service key. |
| `20261111000200_harden_grants.sql` | Revokes all table privileges from `anon`, and TRUNCATE/REFERENCES/TRIGGER from `authenticated`; same for future tables. |

## Gotchas
- These are not a full schema. They depend on `profiles`, `diagnosis_sessions`, `caregiver_links`, `can_access_user()` etc., which are only defined in the older loose files in `supabase/` (`schema.sql`, `20260330_*.sql`, ...). Those are history; do not re-run the fix/debug/admin scripts.
- The PIN is a screen gate, not a data boundary: the same signed-in user can read both roles' rows.
- `harden_grants` revokes everything from `anon`; any future anonymous-access table needs an explicit grant.
