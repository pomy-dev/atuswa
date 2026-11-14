insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', true)
on conflict (id) do update set public = true;

drop policy if exists "Internal users can upload project files" on storage.objects;
create policy "Internal users can upload project files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'project-files' and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.affiliate_id is null
      and p.role in ('sg','branch_admin','treasurer','project_coordinator','events_manager')
  )
);

drop policy if exists "Internal users can delete project files" on storage.objects;
create policy "Internal users can delete project files" on storage.objects
for delete to authenticated using (
  bucket_id = 'project-files' and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.affiliate_id is null
      and p.role in ('sg','branch_admin','treasurer','project_coordinator','events_manager')
  )
);
