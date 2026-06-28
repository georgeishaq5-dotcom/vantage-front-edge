-- =====================================================================
-- 05 · Triggers on public tables
-- =====================================================================
-- (The auth.users -> handle_new_user trigger lives in migration 09.)

-- updated_at maintenance
create trigger update_companies_updated_at
  before update on public.companies
  for each row execute function public.update_updated_at_column();

create trigger update_agent_rules_updated_at
  before update on public.agent_rules
  for each row execute function public.update_updated_at_column();

create trigger update_neighbor_outreach_updated_at
  before update on public.neighbor_outreach
  for each row execute function public.update_updated_at_column();

create trigger trg_team_members_updated
  before update on public.team_members
  for each row execute function public.update_updated_at_column();

create trigger update_trade_presets_updated_at
  before update on public.trade_presets
  for each row execute function public.update_updated_at_column();

-- Guards
create trigger trg_prevent_profile_company_change
  before update on public.profiles
  for each row execute function public.prevent_profile_company_change();

create trigger prevent_company_billing_change
  before update on public.companies
  for each row execute function public.prevent_company_billing_change();
