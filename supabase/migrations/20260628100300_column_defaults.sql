-- =====================================================================
-- 04 · Tenant-scoping column defaults
-- =====================================================================
-- Attach DEFAULT public.current_company_id() now that the function exists
-- (migration 03). Client inserts omit company_id and let RLS + this default
-- bind the row to the caller's workspace.

alter table public.customers   alter column company_id set default public.current_company_id();
alter table public.jobs        alter column company_id set default public.current_company_id();
alter table public.agent_rules alter column company_id set default public.current_company_id();
