-- One adherence log per medication per scheduled dose.
-- The app creates a pending log the first time a day's schedule is opened; two tabs or devices
-- (elder + caregiver) opening it together created duplicate rows. Idempotent.

-- Keep one row per dose, preferring one that already has a real outcome.
DELETE FROM adherence_logs a
USING adherence_logs b
WHERE a.medication_id = b.medication_id
  AND a.scheduled_time = b.scheduled_time
  AND a.id <> b.id
  AND (
    (CASE a.status WHEN 'taken' THEN 0 WHEN 'skipped' THEN 1 WHEN 'missed' THEN 2 ELSE 3 END,
     a.created_at, a.id)
    >
    (CASE b.status WHEN 'taken' THEN 0 WHEN 'skipped' THEN 1 WHEN 'missed' THEN 2 ELSE 3 END,
     b.created_at, b.id)
  );

CREATE UNIQUE INDEX IF NOT EXISTS adherence_logs_dose_unique
  ON adherence_logs (medication_id, scheduled_time);
