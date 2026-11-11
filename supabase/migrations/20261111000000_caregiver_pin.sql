-- Caregiver PIN: lets one account use both elder and caregiver modes.
-- The caregiver dashboard of a dual-role account is gated by a 4-digit PIN.
-- The hash lives in a table clients cannot read; only the functions below touch it.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.caregiver_pins (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  pin_hash        text not null,
  failed_attempts int  not null default 0,
  locked_until    timestamptz,
  updated_at      timestamptz not null default now()
);

alter table public.caregiver_pins enable row level security;
-- Intentionally no policies: direct access is denied for anon and authenticated.
revoke all on public.caregiver_pins from anon, authenticated;

create or replace function public.has_caregiver_pin()
returns boolean
language sql security definer set search_path = public
as $$
  select exists (select 1 from public.caregiver_pins where user_id = auth.uid());
$$;

-- Verifies a PIN. Five wrong attempts lock the PIN for 15 minutes.
create or replace function public.verify_caregiver_pin(pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  r   public.caregiver_pins%rowtype;
  failed int;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select * into r from public.caregiver_pins where user_id = uid for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_pin');
  end if;

  if r.locked_until is not null and r.locked_until > now() then
    return jsonb_build_object('ok', false, 'error', 'locked', 'locked_until', r.locked_until);
  end if;

  if pin is not null and r.pin_hash = crypt(pin, r.pin_hash) then
    update public.caregiver_pins
       set failed_attempts = 0, locked_until = null
     where user_id = uid;
    return jsonb_build_object('ok', true);
  end if;

  failed := r.failed_attempts + 1;
  if failed >= 5 then
    update public.caregiver_pins
       set failed_attempts = 0, locked_until = now() + interval '15 minutes'
     where user_id = uid;
    return jsonb_build_object('ok', false, 'error', 'locked',
                              'locked_until', now() + interval '15 minutes');
  end if;

  update public.caregiver_pins set failed_attempts = failed where user_id = uid;
  return jsonb_build_object('ok', false, 'error', 'wrong_pin', 'attempts_left', 5 - failed);
end;
$$;

-- Creates the PIN, or changes it when the current PIN is supplied.
create or replace function public.set_caregiver_pin(new_pin text, current_pin text default null)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  existing boolean;
  check_result jsonb;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if new_pin is null or new_pin !~ '^[0-9]{4}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  select exists (select 1 from public.caregiver_pins where user_id = uid) into existing;
  if existing then
    check_result := public.verify_caregiver_pin(current_pin);
    if not coalesce((check_result->>'ok')::boolean, false) then
      return check_result;
    end if;
  end if;

  insert into public.caregiver_pins (user_id, pin_hash)
  values (uid, crypt(new_pin, gen_salt('bf')))
  on conflict (user_id) do update
    set pin_hash = excluded.pin_hash, failed_attempts = 0,
        locked_until = null, updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

-- Forgot PIN: allowed only within 5 minutes of a fresh sign-in.
create or replace function public.reset_caregiver_pin(new_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  last_in timestamptz;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if new_pin is null or new_pin !~ '^[0-9]{4}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  select last_sign_in_at into last_in from auth.users where id = uid;
  if last_in is null or last_in < now() - interval '5 minutes' then
    return jsonb_build_object('ok', false, 'error', 'recent_sign_in_required');
  end if;

  insert into public.caregiver_pins (user_id, pin_hash)
  values (uid, crypt(new_pin, gen_salt('bf')))
  on conflict (user_id) do update
    set pin_hash = excluded.pin_hash, failed_attempts = 0,
        locked_until = null, updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.has_caregiver_pin()                   from public, anon;
revoke execute on function public.verify_caregiver_pin(text)            from public, anon;
revoke execute on function public.set_caregiver_pin(text, text)         from public, anon;
revoke execute on function public.reset_caregiver_pin(text)             from public, anon;
grant  execute on function public.has_caregiver_pin()                   to authenticated;
grant  execute on function public.verify_caregiver_pin(text)            to authenticated;
grant  execute on function public.set_caregiver_pin(text, text)         to authenticated;
grant  execute on function public.reset_caregiver_pin(text)             to authenticated;
