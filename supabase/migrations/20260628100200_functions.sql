-- =====================================================================
-- 03 · Security-definer helpers, RLS guard functions, rate limiter
-- =====================================================================
-- All reference tables that now exist (migration 02). EXECUTE grants are
-- centralised in migration 07. Trigger wiring is in migration 05.

-- Caller's company id (no RLS recursion).
create or replace function public.current_company_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- Role check.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

-- Manager = admin or dispatcher.
create or replace function public.can_manage()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'dispatcher');
$$;

-- Is the current user a field tech assigned to this job?
create or replace function public.is_assigned_to_job(_job_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.job_assignments ja
    join public.team_members tm on tm.id = ja.team_member_id
    where ja.job_id = _job_id and tm.user_id = auth.uid()
  );
$$;

-- Does a job belong to the caller's company?
create or replace function public.job_in_current_company(_job_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.jobs
    where jobs.id = _job_id and jobs.company_id = public.current_company_id()
  );
$$;

-- Block non-admins from reassigning their profile to another company.
create or replace function public.prevent_profile_company_change()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
begin
  if old.company_id is not null
     and new.company_id is distinct from old.company_id
     and not public.has_role(auth.uid(), 'admin') then
    new.company_id := old.company_id;
  end if;
  return new;
end;
$$;

-- Freeze billing columns for everyone except admins and the service role
-- (the Stripe webhook writes via service_role and has no auth.uid()).
create or replace function public.prevent_company_billing_change()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and not public.has_role(auth.uid(), 'admin') then
    new.subscription_status := old.subscription_status;
    new.automated_jobs_count := old.automated_jobs_count;
    new.plan := old.plan;
    new.trial_ends_at := old.trial_ends_at;
  end if;
  return new;
end;
$$;

-- Atomically increment the per-minute AI chat counter; bypasses RLS.
create or replace function public.increment_chat_rate_limit(p_user_id uuid)
returns integer
language plpgsql security definer set search_path = public
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
