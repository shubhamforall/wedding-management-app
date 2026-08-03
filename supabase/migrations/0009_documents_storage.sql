-- =========================================================================
-- 0009_documents_storage.sql
-- 📁 Documents sheet: private Storage bucket, objects keyed as
-- `${wedding_id}/${uuid}-${filename}` so RLS can scope by the first path
-- segment the same way every other table scopes by wedding_id column.
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents bucket: select as member" on storage.objects
  for select using (
    bucket_id = 'documents'
    and public.is_wedding_member((storage.foldername(name))[1]::uuid, 'viewer')
  );

create policy "documents bucket: insert as member+" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and public.is_wedding_member((storage.foldername(name))[1]::uuid, 'member')
  );

create policy "documents bucket: delete as member+" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and public.is_wedding_member((storage.foldername(name))[1]::uuid, 'member')
  );
