-- Affiliate Secretaries may manage data scoped to their linked affiliate.
-- Secretary General access remains governed by the internal policies and UI is view-only.
alter table public.projects add column if not exists progress integer not null default 0;
alter table public.projects add column if not exists archived boolean not null default false;
alter table public.events add column if not exists event_kind text not null default 'Event';
alter table public.events add column if not exists archived boolean not null default false;

drop policy if exists "Affiliate Secretary can update own affiliate" on public.affiliates;
create policy "Affiliate Secretary can update own affiliate" on public.affiliates
for update to authenticated using (
  id = (select p.affiliate_id from public.profiles p
        where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary')
) with check (
  id = (select p.affiliate_id from public.profiles p
        where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary')
);

drop policy if exists "Affiliate Secretary can manage own leadership" on public.affiliate_leadership;
create policy "Affiliate Secretary can manage own leadership" on public.affiliate_leadership
for all to authenticated using (
  affiliate_id = (select p.affiliate_id from public.profiles p
                  where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary')
) with check (
  affiliate_id = (select p.affiliate_id from public.profiles p
                  where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary')
);

drop policy if exists "Affiliate Secretary can add own status history" on public.affiliate_status_history;
create policy "Affiliate Secretary can add own status history" on public.affiliate_status_history
for insert to authenticated with check (
  affiliate_id = (select p.affiliate_id from public.profiles p
                  where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary')
);

drop policy if exists "Affiliate Secretary can manage own documents" on public.affiliate_documents;
create policy "Affiliate Secretary can manage own documents" on public.affiliate_documents
for all to authenticated using (
  affiliate_id = (select p.affiliate_id from public.profiles p
                  where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary')
) with check (
  affiliate_id = (select p.affiliate_id from public.profiles p
                  where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary')
);

drop policy if exists "Affiliate Secretary can add own payments" on public.affiliate_payments;
create policy "Affiliate Secretary can add own payments" on public.affiliate_payments
for insert to authenticated with check (
  affiliate_id = (select p.affiliate_id from public.profiles p
                  where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary')
);

drop policy if exists "Affiliate Secretary can manage own projects" on public.projects;
create policy "Affiliate Secretary can manage own projects" on public.projects
for all to authenticated using (
  affiliate_id = (select p.affiliate_id from public.profiles p
                  where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary')
) with check (
  affiliate_id = (select p.affiliate_id from public.profiles p
                  where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary')
);

drop policy if exists "Affiliate Secretary can manage own events" on public.events;
create policy "Affiliate Secretary can manage own events" on public.events
for all to authenticated using (
  affiliate_id = (select p.affiliate_id from public.profiles p
                  where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary')
) with check (
  affiliate_id = (select p.affiliate_id from public.profiles p
                  where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary')
);

grant select, insert, update, delete on public.affiliate_leadership to authenticated;
grant select, insert, update, delete on public.affiliate_documents to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert on public.affiliate_payments to authenticated;

insert into storage.buckets (id, name, public)
values ('affiliate-documents', 'affiliate-documents', true)
on conflict (id) do update set public = true;

drop policy if exists "Affiliate Secretary can upload own affiliate documents" on storage.objects;
create policy "Affiliate Secretary can upload own affiliate documents" on storage.objects
for insert to authenticated with check (
  bucket_id = 'affiliate-documents'
  and (storage.foldername(name))[1] = (
    select p.affiliate_id from public.profiles p
    where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary'
  )
);

drop policy if exists "Affiliate Secretary can delete own affiliate documents" on storage.objects;
create policy "Affiliate Secretary can delete own affiliate documents" on storage.objects
for delete to authenticated using (
  bucket_id = 'affiliate-documents'
  and (storage.foldername(name))[1] = (
    select p.affiliate_id from public.profiles p
    where p.id = auth.uid() and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary'
  )
);
