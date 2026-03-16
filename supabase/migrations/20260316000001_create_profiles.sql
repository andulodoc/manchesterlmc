-- ── Migration: create profiles table ────────────────────────
-- Stores member profile data linked to Supabase auth.users.
-- RLS ensures users can only read/edit their own row;
-- lmc_admin role can read and update all rows.

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  gmc_number    text,                          -- locum/portfolio GPs only
  role_type     text not null,                 -- locum_gp | portfolio_gp | practice_staff | gp_partner | salaried_gp | other
  practice_name text,                          -- nullable
  status        text not null default 'pending',  -- pending | active | suspended
  role          text not null default 'member',   -- member | practice_admin | lmc_admin
  lockout_until timestamptz,                   -- null = not locked out
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Constrain allowed values
alter table public.profiles
  add constraint profiles_status_check
    check (status in ('pending', 'active', 'suspended')),
  add constraint profiles_role_check
    check (role in ('member', 'practice_admin', 'lmc_admin')),
  add constraint profiles_role_type_check
    check (role_type in ('locum_gp', 'portfolio_gp', 'practice_staff', 'gp_partner', 'salaried_gp', 'other'));

-- Auto-update updated_at on any row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────
alter table public.profiles enable row level security;

-- Members can read their own profile
create policy "members_read_own_profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Members can update their own profile (but not status or role)
create policy "members_update_own_profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and status = (select status from public.profiles where id = auth.uid())
    and role   = (select role   from public.profiles where id = auth.uid())
  );

-- Admins can read all profiles
create policy "admins_read_all_profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'lmc_admin'
    )
  );

-- Admins can update any profile (including status and role)
create policy "admins_update_all_profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'lmc_admin'
    )
  );

-- Service role (used by Netlify Functions) bypasses RLS automatically.
-- No insert policy needed for members — the auth-register function
-- uses the service role key to insert after supabase.auth.signUp().
