-- Ensure diagnosis_sessions has alert tracking used by diagnosis history APIs.
ALTER TABLE IF EXISTS public.diagnosis_sessions
  ADD COLUMN IF NOT EXISTS alert_sent BOOLEAN DEFAULT FALSE;

-- Normalize legacy rows.
UPDATE public.diagnosis_sessions
SET alert_sent = FALSE
WHERE alert_sent IS NULL;

-- Refresh PostgREST schema cache so the new column is visible immediately.
NOTIFY pgrst, 'reload schema';
