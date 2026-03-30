# AgeWell Copilot Instructions

## Core Priorities
- Reliability first: auth/session and onboarding flow must stay deterministic.
- Compatibility first: preserve existing route and role behavior unless explicitly migrated.
- Mobile safety first: all production pages must account for fixed bottom navigation spacing.

## Auth and Roles
- Treat auth context as the single source of truth for session + role state.
- Keep role compatibility (`elderly` remains supported) while supporting role aliases in routing.
- Avoid duplicate logout state resets outside auth context listeners.

## Backend and Schema
- Use idempotent SQL changes for Supabase (`IF NOT EXISTS`, safe `DROP POLICY IF EXISTS`).
- Update RLS policies whenever new tables/relations are introduced.
- For AI keys: resolve in order: user setting -> request header override -> environment variable fallback.

## Frontend
- Use one global mobile BottomNav mount.
- Do not mount per-page bottom nav components in production paths.
- Keep touch targets at least 44px and input font size at least 16px.

## Validation
- Run frontend production build after significant UI/routing changes.
- Run backend Python compile checks after route/service edits.
- Summarize key validation outputs in PR or delivery notes.
