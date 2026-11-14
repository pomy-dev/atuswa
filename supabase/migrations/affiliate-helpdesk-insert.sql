-- Allow linked affiliate portal users to submit cases for their own affiliate.
drop policy if exists "Affiliate can submit own helpdesk cases" on public.helpdesk_cases;
create policy "Affiliate can submit own helpdesk cases" on public.helpdesk_cases
  for insert to authenticated with check (
    affiliate_id = (select p.affiliate_id from public.profiles p where p.id = auth.uid())
    and created_by = auth.uid()
  );
