-- ── Migration: rate_limits table + check_rate_limit function ─
-- Used by Netlify Functions to enforce per-IP and per-key limits
-- on auth endpoints. All access is via service role only.

create table if not exists public.rate_limits (
  key          text primary key,
  count        int not null default 1,
  window_start timestamptz not null default now()
);

-- Index for periodic cleanup of expired rows
create index rate_limits_window_idx on public.rate_limits (window_start);

-- No RLS needed — accessed exclusively via service role key in Functions.
-- Enabling RLS with no policies effectively blocks all non-service-role access.
alter table public.rate_limits enable row level security;

-- ── Atomic rate limit check + increment ─────────────────────
-- Returns TRUE if the key is OVER the limit (caller should reject),
-- FALSE if still within limit (caller should allow).
create or replace function public.check_rate_limit(
  p_key            text,
  p_max_count      int,
  p_window_seconds int
) returns boolean language plpgsql security definer as $$
declare
  v_count        int;
  v_window_start timestamptz;
begin
  select count, window_start
    into v_count, v_window_start
    from public.rate_limits
   where key = p_key
     for update;               -- lock row for atomic read-modify-write

  if not found then
    -- First request — insert with count 1
    insert into public.rate_limits (key, count, window_start)
    values (p_key, 1, now());
    return false;              -- not over limit
  end if;

  if v_window_start < now() - (p_window_seconds || ' seconds')::interval then
    -- Window has expired — reset counter
    update public.rate_limits
       set count = 1, window_start = now()
     where key = p_key;
    return false;              -- not over limit
  end if;

  -- Within window — increment and check
  update public.rate_limits
     set count = count + 1
   where key = p_key;

  return (v_count + 1) > p_max_count;
end;
$$;

-- ── Cleanup function (call periodically / via cron) ─────────
-- Deletes entries whose window expired more than 1 hour ago.
create or replace function public.cleanup_rate_limits()
returns void language sql security definer as $$
  delete from public.rate_limits
   where window_start < now() - interval '1 hour';
$$;
