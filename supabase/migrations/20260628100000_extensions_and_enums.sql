-- =====================================================================
-- 01 · Extensions, enum types, and the generic updated_at trigger fn
-- =====================================================================
-- Clean rebuild of the Vantage schema. This ordered migration set is the
-- single source of truth and recreates the entire database on an empty
-- Supabase project. (Lovable's original migrations are archived under
-- supabase/migrations/_archive_lovable/ for reference only.)
--
-- NOTE: creating pg_cron / pg_net / pgmq / supabase_vault requires the
-- privileged role used by `supabase db push` (or the dashboard SQL editor).

-- ---- Extensions -----------------------------------------------------
create extension if not exists pgcrypto with schema extensions;   -- gen_random_uuid (also in core on PG14+)
create extension if not exists pg_net   with schema extensions;   -- net.http_post for the email cron
create extension if not exists pg_cron;                           -- scheduled email pump
create extension if not exists supabase_vault;                    -- encrypted secret store
create extension if not exists pgmq;                              -- durable email queues

-- ---- Enum types -----------------------------------------------------
create type public.app_role       as enum ('admin', 'dispatcher', 'field_tech');
create type public.customer_type  as enum ('Residential', 'Commercial', 'HOA');
create type public.job_status     as enum ('Quoted', 'Scheduled', 'Completed', 'Paid');
create type public.member_status  as enum ('Active', 'Busy', 'Offline');
create type public.outreach_status as enum ('Pending', 'Approved', 'Vetoed');
create type public.team_role      as enum ('Owner/Admin', 'Dispatcher', 'Field Tech');
create type public.veto_level     as enum ('Full Manual Review', 'Semi-Autonomous');
create type public.voice_tone     as enum ('Enthusiastic', 'Professional', 'Direct');

-- ---- Generic updated_at trigger function ---------------------------
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
