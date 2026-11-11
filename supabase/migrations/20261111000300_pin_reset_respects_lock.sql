-- Review finding: reset_caregiver_pin ignored locked_until, so a fresh sign-in
-- skipped the 15-minute lockout after five wrong PINs. A lock now blocks the reset too.

create or replace function public.reset_caregiver_pin(new_pin text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  last_in timestamptz;
  locked timestamptz;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if new_pin is null or new_pin !~ '^[0-9]{4}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  select locked_until into locked from public.caregiver_pins where user_id = uid;
  if locked is not null and locked > now() then
    return jsonb_build_object('ok', false, 'error', 'locked', 'locked_until', locked);
  end if;

  select last_sign_in_at into last_in from auth.users where id = uid;
  if last_in is null or last_in < now() - interval '5 minutes' then
    return jsonb_build_object('ok', false, 'error', 'recent_sign_in_required');
  end if;

  insert into public.caregiver_pins (user_id, pin_hash)
  values (uid, crypt(new_pin, gen_salt('bf')))
  on conflict (user_id) do update
    set pin_hash = excluded.pin_hash, failed_attempts = 0, locked_until = null, updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;
