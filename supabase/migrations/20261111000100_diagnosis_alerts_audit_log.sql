-- Production is missing these two tables, so diagnosis alerts and audit events fail to save.
-- Additive and idempotent. Rows are written by the backend with the service key;
-- patients and their linked caregivers can read them (can_access_user).

create table if not exists public.diagnosis_alerts (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references public.diagnosis_sessions(id) on delete cascade,
  patient_id        uuid references auth.users(id) on delete cascade,
  alert_type        text not null,
  channels_notified jsonb default '[]',
  recipients        jsonb default '[]',
  alert_message     text,
  sent_at           timestamptz default now(),
  acknowledged_at   timestamptz,
  acknowledged_by   uuid references auth.users(id)
);

create table if not exists public.symptom_audit_log (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid references auth.users(id) on delete cascade,
  session_id  uuid references public.diagnosis_sessions(id) on delete cascade,
  event_type  text not null,
  event_data  jsonb default '{}',
  created_at  timestamptz default now()
);

create index if not exists diagnosis_alerts_patient_idx on public.diagnosis_alerts (patient_id, sent_at desc);
create index if not exists symptom_audit_log_session_idx on public.symptom_audit_log (session_id, created_at);

alter table public.diagnosis_alerts enable row level security;
alter table public.symptom_audit_log enable row level security;

drop policy if exists "Diagnosis alerts access" on public.diagnosis_alerts;
create policy "Diagnosis alerts access" on public.diagnosis_alerts for select
  using (public.can_access_user(patient_id));

drop policy if exists "Symptom audit access" on public.symptom_audit_log;
create policy "Symptom audit access" on public.symptom_audit_log for select
  using (public.can_access_user(patient_id));
