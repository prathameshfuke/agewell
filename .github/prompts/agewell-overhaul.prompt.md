---
description: "Structured prompt for AgeWell auth, linking, settings, and mobile UI overhauls with validation checklist."
---

# AgeWell Overhaul Prompt

Use this prompt to run a full-stack AgeWell upgrade safely and consistently.

## Goal
Implement or refine: auth/session restore, onboarding gating, dual-role support, caregiver linking, per-user AI key settings, mobile navigation safety, and UI consistency.

## Constraints
- Keep backward compatibility with existing `elderly` role values.
- Keep `/family/*` routes as canonical; aliases may be added.
- Use additive SQL migrations and include RLS updates.
- Never store plaintext secrets in repo files.

## Required Output Order
1. Discovery summary (files + assumptions)
2. Change plan in dependency order
3. Backend + schema implementation
4. Frontend implementation
5. Validation results (frontend build + backend compile + API smoke)
6. Residual risks and follow-up recommendations

## Mandatory Checks
- Signed-in refresh stays on protected route.
- Signed-out protected access redirects to `/auth`.
- Onboarding does not repeat after completion.
- Linking code generate/join/list endpoints succeed.
- `/settings` key save/get works with masked responses.
- Mobile bottom nav does not overlap page content on small screens.
