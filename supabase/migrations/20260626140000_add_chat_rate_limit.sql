-- Per-user AI chat rate-limit buckets (1-minute windows).
-- Only accessed through the security-definer function below — no direct client access.
create table if not exists public.ai_chat_rate_limit (
  user_id       uuid        not null,
  window_start  timestamptz not null,
  request_count integer     not null default 1,
  primary key (user_id, window_start)
);

alter table public.ai_chat_rate_limit disable row level security;

-- Atomically increments the request counter for the current minute window
-- and returns the new count.  Runs as the table owner so it bypasses RLS.
create or replace function public.increment_chat_rate_limit(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz := date_trunc('minute', now());
  v_count  integer;
begin
  insert into public.ai_chat_rate_limit (user_id, window_start, request_count)
  values (p_user_id, v_window, 1)
  on conflict (user_id, window_start)
  do update set request_count = ai_chat_rate_limit.request_count + 1
  returning request_count into v_count;

  return v_count;
end;
$$;

grant execute on function public.increment_chat_rate_limit(uuid) to anon;

-- Purge buckets older than 2 hours to keep the table small.
-- (Run via pg_cron or a Supabase scheduled job in production.)
create index if not exists ai_chat_rate_limit_window_idx
  on public.ai_chat_rate_limit (window_start);
