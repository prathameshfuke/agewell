-- Voice memos are family health context. The app used getPublicUrl() on a guessable name
-- (voice-memo-<Date.now()>.webm), so anyone could download them. Make the bucket private and let only the
-- uploader, the memo's sender and its recipient read an object; the client now reads via signed URLs.
-- Apply together with (or after) the frontend that signs URLs, or existing public links stop working.
-- Idempotent; no objects are deleted.

insert into storage.buckets (id, name, public, file_size_limit)
values ('voice-memos', 'voice-memos', false, 5242880)
on conflict (id) do update set public = false, file_size_limit = 5242880;

drop policy if exists voice_memos_objects_insert on storage.objects;
drop policy if exists voice_memos_objects_select on storage.objects;
drop policy if exists voice_memos_objects_delete on storage.objects;

create policy voice_memos_objects_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'voice-memos');

-- audio_url holds either the bare object name (new) or an old public URL ending in /<name>
create policy voice_memos_objects_select on storage.objects for select to authenticated
  using (
    bucket_id = 'voice-memos'
    and (owner_id = (select auth.uid())::text
         or exists (select 1 from public.voice_memos vm
                    where (vm.to_user_id = (select auth.uid()) or vm.from_user_id = (select auth.uid()))
                      and (vm.audio_url = storage.objects.name or vm.audio_url like '%/' || storage.objects.name))));

create policy voice_memos_objects_delete on storage.objects for delete to authenticated
  using (bucket_id = 'voice-memos' and owner_id = (select auth.uid())::text);
