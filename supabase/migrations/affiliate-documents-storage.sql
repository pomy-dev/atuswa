insert into storage.buckets (id, name, public)
values ('affiliate-documents', 'affiliate-documents', true)
on conflict (id) do update set public = true;

drop policy if exists "Internal users can upload affiliate documents" on storage.objects;
create policy "Internal users can upload affiliate documents" on storage.objects
for insert to authenticated with check (
  bucket_id = 'affiliate-documents' and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.affiliate_id is null
      and p.role in ('sg','branch_admin')
  )
);

drop policy if exists "Internal users can delete affiliate documents" on storage.objects;
create policy "Internal users can delete affiliate documents" on storage.objects
for delete to authenticated using (
  bucket_id = 'affiliate-documents' and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.affiliate_id is null
      and p.role in ('sg','branch_admin')
  )
);