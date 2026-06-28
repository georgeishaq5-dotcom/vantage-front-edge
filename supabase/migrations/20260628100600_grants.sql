-- =====================================================================
-- 07 · Privilege grants (non-email tables + functions)
-- =====================================================================
-- Enforces the INTENDED posture explicitly rather than relying on the
-- absence of default privileges:
--   * anon/public get NO table access (fixes snapshot finding #1, where
--     newer tables had silently inherited anon SELECT via default privs).
--   * authenticated gets CRUD; RLS (migration 06) governs row visibility.
--   * service_role gets ALL.

do $$
declare t text;
begin
  foreach t in array array[
    'companies','profiles','user_roles','team_members','customers','jobs',
    'job_assignments','job_locks','agent_rules','neighbor_outreach','trade_presets'
  ]
  loop
    execute format('revoke all on public.%I from anon, public', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- Internal-only table: no direct client access (reached via increment_chat_rate_limit).
revoke all on public.ai_chat_rate_limit from anon, authenticated, public;
grant all on public.ai_chat_rate_limit to service_role;

-- ---- Function EXECUTE -----------------------------------------------
-- RLS helper functions: callable by authenticated + service_role, never anon.
-- NOTE: job_in_current_company is granted to authenticated here (its sibling
-- helpers are). The archived Lovable migrations revoked it from authenticated
-- even though authenticated RLS policies call it — normalized to match the
-- other helpers so those policies evaluate reliably.
revoke execute on function public.has_role(uuid, public.app_role)   from anon, public;
revoke execute on function public.can_manage()                      from anon, public;
revoke execute on function public.current_company_id()              from anon, public;
revoke execute on function public.is_assigned_to_job(uuid)          from anon, public;
revoke execute on function public.job_in_current_company(uuid)      from anon, public;

grant execute on function public.has_role(uuid, public.app_role)    to authenticated, service_role;
grant execute on function public.can_manage()                       to authenticated, service_role;
grant execute on function public.current_company_id()               to authenticated, service_role;
grant execute on function public.is_assigned_to_job(uuid)           to authenticated, service_role;
grant execute on function public.job_in_current_company(uuid)       to authenticated, service_role;

-- Trigger / utility functions: never invokable through the API.
revoke execute on function public.update_updated_at_column()         from anon, public, authenticated;
revoke execute on function public.prevent_profile_company_change()   from anon, public, authenticated;
revoke execute on function public.prevent_company_billing_change()   from anon, public, authenticated;
-- (handle_new_user EXECUTE is revoked in migration 09, where it is defined.)

-- Rate limiter: the chat endpoint calls it for anon and authenticated callers.
grant execute on function public.increment_chat_rate_limit(uuid)     to anon, authenticated, service_role;
