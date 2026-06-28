-- =====================================================================
-- 06 · Row-Level Security: enable + policies (non-email tables)
-- =====================================================================
-- Email-module tables enable RLS and define their own policies in
-- migration 08. ai_chat_rate_limit keeps RLS disabled (migration 02).

alter table public.companies         enable row level security;
alter table public.profiles          enable row level security;
alter table public.user_roles        enable row level security;
alter table public.team_members      enable row level security;
alter table public.customers         enable row level security;
alter table public.jobs              enable row level security;
alter table public.job_assignments   enable row level security;
alter table public.job_locks         enable row level security;
alter table public.agent_rules       enable row level security;
alter table public.neighbor_outreach enable row level security;
alter table public.trade_presets     enable row level security;

-- ---- companies ------------------------------------------------------
-- (no INSERT/DELETE policy: workspaces are provisioned by handle_new_user)
create policy "Members read own company" on public.companies
  for select to authenticated using (id = public.current_company_id());
create policy "Admins update own company" on public.companies
  for update to authenticated
  using (id = public.current_company_id() and public.has_role(auth.uid(), 'admin'))
  with check (id = public.current_company_id() and public.has_role(auth.uid(), 'admin'));

-- ---- profiles (own row only) ---------------------------------------
create policy "Users can view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can delete own profile" on public.profiles
  for delete to authenticated using (auth.uid() = id);

-- ---- user_roles -----------------------------------------------------
create policy "Users can view their own roles" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---- team_members (company_id is text) -----------------------------
create policy "Members read own company team_members" on public.team_members
  for select to authenticated using (company_id = public.current_company_id()::text);
create policy "Admins write team_members" on public.team_members
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') and company_id = public.current_company_id()::text);
create policy "Admins update team_members" on public.team_members
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin') and company_id = public.current_company_id()::text)
  with check (public.has_role(auth.uid(), 'admin') and company_id = public.current_company_id()::text);
create policy "Admins delete team_members" on public.team_members
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin') and company_id = public.current_company_id()::text);

-- ---- customers (tenant scoped) -------------------------------------
create policy "Tenant select customers" on public.customers
  for select to authenticated using (company_id = public.current_company_id());
create policy "Tenant insert customers" on public.customers
  for insert to authenticated with check (company_id = public.current_company_id());
create policy "Tenant update customers" on public.customers
  for update to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
create policy "Tenant delete customers" on public.customers
  for delete to authenticated using (company_id = public.current_company_id());

-- ---- jobs (tenant scoped) ------------------------------------------
create policy "Tenant select jobs" on public.jobs
  for select to authenticated using (company_id = public.current_company_id());
create policy "Tenant insert jobs" on public.jobs
  for insert to authenticated with check (company_id = public.current_company_id());
create policy "Tenant update jobs" on public.jobs
  for update to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
create policy "Tenant delete jobs" on public.jobs
  for delete to authenticated using (company_id = public.current_company_id());

-- ---- job_assignments (scoped via parent job's company) -------------
create policy "Members read own company job_assignments" on public.job_assignments
  for select to authenticated using (public.job_in_current_company(job_id));
create policy "Managers write job_assignments" on public.job_assignments
  for insert to authenticated with check (public.can_manage() and public.job_in_current_company(job_id));
create policy "Managers update job_assignments" on public.job_assignments
  for update to authenticated
  using (public.can_manage() and public.job_in_current_company(job_id))
  with check (public.can_manage() and public.job_in_current_company(job_id));
create policy "Managers delete job_assignments" on public.job_assignments
  for delete to authenticated using (public.can_manage() and public.job_in_current_company(job_id));

-- ---- job_locks (scoped via parent job's company; own lock only) ----
create policy "Members read own company job_locks" on public.job_locks
  for select to authenticated using (public.job_in_current_company(job_id));
create policy "Users can create their own job_locks" on public.job_locks
  for insert to authenticated
  with check (locked_by_id = (auth.uid())::text and public.job_in_current_company(job_id));
create policy "Users can update their own job_locks" on public.job_locks
  for update to authenticated
  using (locked_by_id = (auth.uid())::text and public.job_in_current_company(job_id))
  with check (locked_by_id = (auth.uid())::text and public.job_in_current_company(job_id));
create policy "Users can delete their own job_locks" on public.job_locks
  for delete to authenticated
  using (locked_by_id = (auth.uid())::text and public.job_in_current_company(job_id));

-- ---- agent_rules (company scoped; admin writes) --------------------
create policy "Members read own company agent_rules" on public.agent_rules
  for select to authenticated using (company_id = public.current_company_id());
create policy "Admins write agent_rules" on public.agent_rules
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') and company_id = public.current_company_id());
create policy "Admins update agent_rules" on public.agent_rules
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin') and company_id = public.current_company_id())
  with check (public.has_role(auth.uid(), 'admin') and company_id = public.current_company_id());
create policy "Admins delete agent_rules" on public.agent_rules
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin') and company_id = public.current_company_id());

-- ---- neighbor_outreach (scoped via parent job's company) -----------
create policy "Members read own company neighbor_outreach" on public.neighbor_outreach
  for select to authenticated using (public.job_in_current_company(job_id));
create policy "Managers write neighbor_outreach" on public.neighbor_outreach
  for insert to authenticated with check (public.can_manage() and public.job_in_current_company(job_id));
create policy "Managers update neighbor_outreach" on public.neighbor_outreach
  for update to authenticated
  using (public.can_manage() and public.job_in_current_company(job_id))
  with check (public.can_manage() and public.job_in_current_company(job_id));
create policy "Managers delete neighbor_outreach" on public.neighbor_outreach
  for delete to authenticated using (public.can_manage() and public.job_in_current_company(job_id));

-- ---- trade_presets (all signed-in read; managers write) ------------
create policy "Signed-in users can view trade presets" on public.trade_presets
  for select to authenticated using (true);
create policy "Managers can insert trade presets" on public.trade_presets
  for insert to authenticated with check (public.can_manage());
create policy "Managers can update trade presets" on public.trade_presets
  for update to authenticated using (public.can_manage()) with check (public.can_manage());
create policy "Managers can delete trade presets" on public.trade_presets
  for delete to authenticated using (public.can_manage());
