-- Ensure diagnosis_sessions has acknowledged tracking columns used by backend history APIs.
ALTER TABLE IF EXISTS public.diagnosis_sessions
  ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT FALSE;

ALTER TABLE IF EXISTS public.diagnosis_sessions
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

-- Ensure legacy rows are normalized.
UPDATE public.diagnosis_sessions
SET acknowledged = FALSE
WHERE acknowledged IS NULL;

-- Ask PostgREST to refresh schema cache so new columns are queryable immediately.
NOTIFY pgrst, 'reload schema';
