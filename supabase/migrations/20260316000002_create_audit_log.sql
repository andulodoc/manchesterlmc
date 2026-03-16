-- ── Migration: create audit_log table ───────────────────────
-- Append-only security event log.
-- Members can read only their own entries.
-- Admins can read all entries.
-- Nobody can update or delete rows (enforced by RLS + no policies).

create table if not exists public.audit_log (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete set null,
  action      text not null,
  ip_hash     text,   -- HMAC-SHA256 of IP address; never store raw IP
  metadata    jsonb,  -- minimal context; never store passwords or tokens
  created_at  timestamptz not null default now()
);

-- Constrain allowed action values
alter table public.audit_log
  add constraint audit_log_action_check check (
    action in (
      'login',
      'logout',
      'login_failed',
      'login_locked',
      'password_reset_request',
      'password_reset_complete',
      'profile_update',
      'password_change',
      'role_change',
      'account_approved',
      'account_suspended',
      'account_deleted',
      'token_refresh'
    )
  );

-- Index for common queries (by user, by action, by time)
create index audit_log_user_id_idx  on public.audit_log (user_id);
create index audit_log_action_idx   on public.audit_log (action);
create index audit_log_created_idx  on public.audit_log (created_at desc);

-- ── Row Level Security ───────────────────────────────────────
alter table public.audit_log enable row level security;

-- Members can read their own log entries
create policy "members_read_own_audit_log"
  on public.audit_log for select
  using (auth.uid() = user_id);

-- Admins can read all log entries
create policy "admins_read_all_audit_log"
  on public.audit_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'lmc_admin'
    )
  );

-- No update or delete policies — log is append-only.
-- Inserts are performed only by Netlify Functions using the service role key.
