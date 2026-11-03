-- User profiles used by lib/auth-context.tsx.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'branch_admin'
    check (role in ('sg', 'branch_admin', 'treasurer', 'project_coordinator', 'events_manager')),
  branch_id text,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

grant select on table public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email, '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_profile_for_auth_user();

-- Populate profiles for Auth users that existed before this migration.
insert into public.profiles (id, full_name)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', email, '')
from auth.users
on conflict (id) do nothing;

-- Make PostgREST notice the newly-created table immediately.
notify pgrst, 'reload schema';