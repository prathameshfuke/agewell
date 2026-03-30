---
name: agewell-quality
description: "Use when working on AgeWell auth restore, onboarding gates, dual-role switching, mobile bottom-nav spacing, Supabase RLS-safe schema work, and secret-safe API key handling."
---

# AgeWell Quality Skill

## Use When
- Fixing login reload loops or onboarding redirect races.
- Updating role switching (`elderly` / `caregiver` / compatibility aliases).
- Changing mobile navigation or page-bottom spacing behavior.
- Adding Supabase schema and policy migrations.
- Touching per-user API key settings and backend AI provider wiring.

## Workflow
1. Validate auth initialization contract first.
2. Keep route guarding in one place and avoid per-page auth redirects.
3. For schema changes: add idempotent migration SQL and RLS policy updates together.
4. For backend key usage: prefer per-user settings lookup, then header override, then env fallback.
5. For mobile nav updates: confirm no content overlap on pages with and without shared layouts.
6. Run frontend build and backend compile checks before finalizing.

## Guardrails
- Never commit secrets or literal API keys.
- Preserve compatibility for existing `elderly` role rows during transitions.
- Keep `/family/*` routes stable; add aliases rather than hard renames.
- Prefer additive migrations over destructive changes.

## Verification Checklist
- Auth reload remains on dashboard for signed-in users.
- Onboarding completes once and does not loop after refresh.
- `/settings` saves and reads masked key status.
- Diagnosis requests work when keys come from DB, headers, or env fallback.
- Mobile bottom nav does not cover action buttons/content.
