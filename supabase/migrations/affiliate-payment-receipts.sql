alter table public.affiliate_payments
  add column if not exists status text not null default 'Received',
  add column if not exists receipt_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'affiliate_payments_status_check'
      and conrelid = 'public.affiliate_payments'::regclass
  ) then
    alter table public.affiliate_payments
      add constraint affiliate_payments_status_check
      check (status in ('Received', 'Pending', 'Queried'));
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('affiliate-payment-receipts', 'affiliate-payment-receipts', false)
on conflict (id) do update set public = false;

drop policy if exists "Affiliate users can read own payment receipts" on storage.objects;
create policy "Affiliate users can read own payment receipts" on storage.objects
for select to authenticated using (
  bucket_id = 'affiliate-payment-receipts'
  and (
    (storage.foldername(name))[1] = (
      select p.affiliate_id from public.profiles p
      where p.id = auth.uid()
        and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary'
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.affiliate_id is null
        and (p.role in ('sg', 'branch_admin')
          or lower(replace(coalesce(p.role, ''), '_', ' ')) in ('secretary general', 'branch admin'))
    )
  )
);

drop policy if exists "Affiliate Secretaries can upload own payment receipts" on storage.objects;
create policy "Affiliate Secretaries can upload own payment receipts" on storage.objects
for insert to authenticated with check (
  bucket_id = 'affiliate-payment-receipts'
  and (storage.foldername(name))[1] = (
    select p.affiliate_id from public.profiles p
    where p.id = auth.uid()
      and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary'
  )
);

drop policy if exists "Affiliate Secretaries can delete own payment receipts" on storage.objects;
create policy "Affiliate Secretaries can delete own payment receipts" on storage.objects
for delete to authenticated using (
  bucket_id = 'affiliate-payment-receipts'
  and (storage.foldername(name))[1] = (
    select p.affiliate_id from public.profiles p
    where p.id = auth.uid()
      and lower(replace(coalesce(p.role, ''), '_', ' ')) = 'affiliate secretary'
  )
);
