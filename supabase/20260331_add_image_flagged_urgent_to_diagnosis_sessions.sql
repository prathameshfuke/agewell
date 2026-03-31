-- Ensure diagnosis_sessions has image urgency tracking used during diagnosis flow.
ALTER TABLE IF EXISTS public.diagnosis_sessions
  ADD COLUMN IF NOT EXISTS image_flagged_urgent BOOLEAN DEFAULT FALSE;

-- Normalize legacy rows.
UPDATE public.diagnosis_sessions
SET image_flagged_urgent = FALSE
WHERE image_flagged_urgent IS NULL;

-- Refresh PostgREST schema cache so the new column is visible immediately.
NOTIFY pgrst, 'reload schema';
