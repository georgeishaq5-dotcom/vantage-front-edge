-- =====================================================================
-- 10 · Financials Phase 1: job costs, labor rate / overhead settings,
--      gross margin calculation
-- =====================================================================
-- Direct job costs (labor + materials) are captured per job in
-- job_costs. Labor is a single company-wide loaded rate (no per-tech
-- rates yet). Overhead (insurance, trucks, subscriptions, ...) is never
-- allocated per job automatically -- it's an optional flat % applied
-- only in the separate "overhead-adjusted" view via job_gross_margin().
-- Default view is always true gross margin (direct costs only).

-- ---- companies: labor rate + overhead settings -----------------------
alter table public.companies
  add column loaded_labor_rate numeric not null default 0,
  add column overhead_pct      numeric not null default 0,
  add column overhead_enabled  boolean not null default false;

comment on column public.companies.loaded_labor_rate is 'Owner-set $/hour loaded labor rate used to cost jobs (labor_hours * rate). Single company-wide rate for MVP; no per-technician rates yet.';
comment on column public.companies.overhead_pct is 'Flat overhead percent of job revenue, applied only when overhead_enabled is true. Never blended into the default gross margin view.';
comment on column public.companies.overhead_enabled is 'Toggles the optional overhead-adjusted margin view. Default margin view (direct costs only) is unaffected by this flag.';

-- ---- job_costs --------------------------------------------------------
create table public.job_costs (
  job_id            uuid primary key references public.jobs(id) on delete cascade,
  company_id        uuid not null references public.companies(id) on delete cascade,
  labor_hours       numeric not null default 0,
  materials_cost    numeric not null default 0,
  drive_time_hours  numeric not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.job_costs is 'Direct cost inputs per job (labor + materials). One row per job. Manual entry for MVP -- no time-tracking or materials integrations yet.';
comment on column public.job_costs.labor_hours is 'Manually entered hours on the job. Labor cost = labor_hours * companies.loaded_labor_rate.';
comment on column public.job_costs.materials_cost is 'Manually entered materials cost for the job.';
comment on column public.job_costs.drive_time_hours is 'Manually entered drive/setup time. Not used in Phase 1 margin math; reserved for the Phase 4 effective-hourly-rate calculation (revenue / (labor_hours + drive_time_hours)).';

create trigger update_job_costs_updated_at
  before update on public.job_costs
  for each row execute function public.update_updated_at_column();

alter table public.job_costs enable row level security;

-- Restricted to managers (admin/dispatcher) only, both read and write --
-- margin data is owner-facing, not exposed to field techs the way jobs are.
create policy "Managers read job_costs" on public.job_costs
  for select to authenticated
  using (public.can_manage() and company_id = public.current_company_id());
create policy "Managers insert job_costs" on public.job_costs
  for insert to authenticated
  with check (public.can_manage() and company_id = public.current_company_id());
create policy "Managers update job_costs" on public.job_costs
  for update to authenticated
  using (public.can_manage() and company_id = public.current_company_id())
  with check (public.can_manage() and company_id = public.current_company_id());
create policy "Managers delete job_costs" on public.job_costs
  for delete to authenticated
  using (public.can_manage() and company_id = public.current_company_id());

revoke all on public.job_costs from anon, public;
grant select, insert, update, delete on public.job_costs to authenticated;
grant all on public.job_costs to service_role;

-- ---- job_gross_margin(job_id) ------------------------------------------
-- Single source of truth for the margin calculation. Always returns true
-- gross margin (direct costs only); overhead_cost/net_margin are null
-- unless the company has opted into the overhead-adjusted view.
create or replace function public.job_gross_margin(_job_id uuid)
returns table (
  revenue        numeric,
  labor_cost     numeric,
  materials_cost numeric,
  direct_cost    numeric,
  gross_margin   numeric,
  overhead_cost  numeric,
  net_margin     numeric
)
language sql stable security invoker set search_path = public
as $$
  select
    j.total_amount                                                     as revenue,
    coalesce(jc.labor_hours, 0) * c.loaded_labor_rate                  as labor_cost,
    coalesce(jc.materials_cost, 0)                                     as materials_cost,
    (coalesce(jc.labor_hours, 0) * c.loaded_labor_rate)
      + coalesce(jc.materials_cost, 0)                                 as direct_cost,
    j.total_amount
      - (coalesce(jc.labor_hours, 0) * c.loaded_labor_rate)
      - coalesce(jc.materials_cost, 0)                                 as gross_margin,
    case when c.overhead_enabled
      then j.total_amount * (c.overhead_pct / 100)
      else null end                                                    as overhead_cost,
    case when c.overhead_enabled
      then j.total_amount
        - (coalesce(jc.labor_hours, 0) * c.loaded_labor_rate)
        - coalesce(jc.materials_cost, 0)
        - (j.total_amount * (c.overhead_pct / 100))
      else null end                                                    as net_margin
  from public.jobs j
  join public.companies c on c.id = j.company_id
  left join public.job_costs jc on jc.job_id = j.id
  where j.id = _job_id
    and j.company_id = public.current_company_id();
$$;

comment on function public.job_gross_margin(uuid) is 'Phase 1 margin calculation: revenue - labor - materials = gross_margin (direct costs only, always shown). overhead_cost/net_margin are null unless companies.overhead_enabled is true; never blended into gross_margin.';

revoke execute on function public.job_gross_margin(uuid) from anon, public;
grant execute on function public.job_gross_margin(uuid) to authenticated, service_role;
