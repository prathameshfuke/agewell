-- Security review. Idempotent, no data is deleted.
--
-- 1. profiles.linked_elderly_id was writable by its owner with no check. can_access_user() and the backend
--    both trust that column, so any signed-in user could point it at any elder id and read that elder's
--    medications, vitals, diagnoses and alerts. A client may now only set it to an elder it has an active
--    caregiver_links row for (the backend, which runs as service_role, still sets it on join).
-- 2. voice_memos: "FOR ALL USING (from or to = me)" let anyone insert a memo addressed to any user.
-- 3. SECURITY DEFINER functions get a pinned search_path and are no longer executable by anon.
--
-- AUDIT after applying (these rows were linked without a link row: legacy, revoked or forged). Review by hand:
--   select p.id, p.linked_elderly_id from public.profiles p
--   where p.linked_elderly_id is not null and not exists (
--     select 1 from public.caregiver_links cl
--     where cl.caregiver_id = p.id and cl.elder_id = p.linked_elderly_id and cl.status = 'active');

create or replace function public.guard_profile_link()
returns trigger
language plpgsql set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated'
     and new.linked_elderly_id is not null
     and (tg_op = 'INSERT' or new.linked_elderly_id is distinct from old.linked_elderly_id)
     and not exists (
       select 1 from public.caregiver_links cl
       where cl.caregiver_id = auth.uid() and cl.elder_id = new.linked_elderly_id and cl.status = 'active')
  then
    raise exception 'linked_elderly_id must point to an elder you are linked to' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_link on public.profiles;
create trigger guard_profile_link
  before insert or update of linked_elderly_id on public.profiles
  for each row execute function public.guard_profile_link();

-- voice_memos: sender must be the caller and may only address someone they can access (or their own elder's caregivers).
drop policy if exists "Voice memo access" on public.voice_memos;
drop policy if exists voice_memos_select on public.voice_memos;
drop policy if exists voice_memos_insert on public.voice_memos;
drop policy if exists voice_memos_update on public.voice_memos;
drop policy if exists voice_memos_delete on public.voice_memos;

create policy voice_memos_select on public.voice_memos for select
  using (from_user_id = auth.uid() or to_user_id = auth.uid());
create policy voice_memos_insert on public.voice_memos for insert
  with check (
    from_user_id = auth.uid()
    and (public.can_access_user(to_user_id)
         or exists (select 1 from public.caregiver_links cl
                    where cl.elder_id = auth.uid() and cl.caregiver_id = to_user_id and cl.status = 'active')));
create policy voice_memos_update on public.voice_memos for update
  using (from_user_id = auth.uid() or to_user_id = auth.uid())
  with check (from_user_id = auth.uid() or to_user_id = auth.uid());
create policy voice_memos_delete on public.voice_memos for delete
  using (from_user_id = auth.uid());

-- SECURITY DEFINER hygiene
alter function public.handle_new_user() set search_path = public;
revoke execute on function public.can_access_user(uuid)          from public, anon;
revoke execute on function public.current_linked_elderly_id()    from public, anon;
grant  execute on function public.can_access_user(uuid)          to authenticated, service_role;
grant  execute on function public.current_linked_elderly_id()    to authenticated, service_role;
