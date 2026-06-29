-- Stage 5 — INSERT-script generator (run in the OLD project: erabfcnmgnrvzwjkrdry)
--
-- WHAT THIS IS: a single query that generates a ready-to-run INSERT script for
--   all 10 data tables. Run it once in the OLD project's SQL editor; it returns
--   ONE row / ONE column (`import_script`) containing the whole script. Copy
--   that cell and paste it into the NEW project's (fsywsxifrvdtziiwhkjf) SQL
--   editor to import everything in one go.
--
-- HOW IT WORKS: per-column `format('%L', col)` quotes each value as a SQL
--   literal; the target column type drives the cast on import, so enums,
--   timestamps, numerics, booleans, and text[] arrays ('{}' / '{a,b}') all
--   come through correctly. Tables are emitted parents-first and wrapped in
--   BEGIN/COMMIT so the import is atomic.
--
-- ORPHAN FILTERS (from Step 0): neighbor_outreach and job_locks only emit rows
--   whose job_id matches an existing job (drops the 2 + 1 test-job debris rows).
--
-- NOT INCLUDED (decided in stage5_data_export.sql): trade_presets,
--   email_send_state, suppressed_emails, email_unsubscribe_tokens,
--   ai_chat_rate_limit, email_send_log.
--
-- !! BEFORE IMPORTING INTO THE NEW PROJECT !!
--   auth.users must already exist in the new project (profiles/user_roles/
--   team_members reference them). Import auth users FIRST. Critically, the
--   `on_auth_user_created` trigger (`handle_new_user`) auto-creates a company +
--   profile + user_role for each new auth user — if it fires during the auth
--   import it will collide with the INSERTs below (duplicate companies, PK
--   conflicts on profiles). Import auth users with that trigger disabled (or
--   otherwise not firing), THEN run this generated script.

WITH
companies_b AS (
  SELECT string_agg(format(
    'INSERT INTO public.companies (id, name, created_at, updated_at, automated_jobs_count, subscription_status, stripe_customer_id, plan, trial_ends_at) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L);',
    id, name, created_at, updated_at, automated_jobs_count, subscription_status, stripe_customer_id, plan, trial_ends_at
  ), E'\n' ORDER BY created_at) AS s
  FROM companies
),
profiles_b AS (
  SELECT string_agg(format(
    'INSERT INTO public.profiles (id, full_name, email, created_at, profession, onboarded, company_name, team_size, yearly_revenue, years_in_business, company_id, ai_consent_granted, terms_accepted_version) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L);',
    id, full_name, email, created_at, profession, onboarded, company_name, team_size, yearly_revenue, years_in_business, company_id, ai_consent_granted, terms_accepted_version
  ), E'\n' ORDER BY created_at) AS s
  FROM profiles
),
team_members_b AS (
  SELECT string_agg(format(
    'INSERT INTO public.team_members (id, company_id, full_name, role, status, skills, email, created_at, updated_at, user_id) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L);',
    id, company_id, full_name, role, status, skills, email, created_at, updated_at, user_id
  ), E'\n' ORDER BY created_at) AS s
  FROM team_members
),
user_roles_b AS (
  SELECT string_agg(format(
    'INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES (%L, %L, %L, %L);',
    id, user_id, role, created_at
  ), E'\n' ORDER BY created_at) AS s
  FROM user_roles
),
customers_b AS (
  SELECT string_agg(format(
    'INSERT INTO public.customers (id, company_id, first_name, last_name, full_name, phone, email, address, service_address, customer_type, site_notes, created_at) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L);',
    id, company_id, first_name, last_name, full_name, phone, email, address, service_address, customer_type, site_notes, created_at
  ), E'\n' ORDER BY created_at) AS s
  FROM customers
),
agent_rules_b AS (
  SELECT string_agg(format(
    'INSERT INTO public.agent_rules (id, target_zip_codes, min_profit_margin, voice_tone, veto_level, created_at, updated_at, outreach_start_hour, outreach_end_hour, max_autonomous_discount, follow_up_trigger, auto_approve_limit, handoff_keyword, weather_rain, weather_heat, weather_freeze, lead_strictness, company_id) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L);',
    id, target_zip_codes, min_profit_margin, voice_tone, veto_level, created_at, updated_at, outreach_start_hour, outreach_end_hour, max_autonomous_discount, follow_up_trigger, auto_approve_limit, handoff_keyword, weather_rain, weather_heat, weather_freeze, lead_strictness, company_id
  ), E'\n' ORDER BY created_at) AS s
  FROM agent_rules
),
jobs_b AS (
  SELECT string_agg(format(
    'INSERT INTO public.jobs (id, company_id, customer_id, assigned_tech_id, job_phase, skill_tag, status, title, description, scheduled_date, service_date, total_amount, quote_amount, scheduled_by_id, created_at) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L);',
    id, company_id, customer_id, assigned_tech_id, job_phase, skill_tag, status, title, description, scheduled_date, service_date, total_amount, quote_amount, scheduled_by_id, created_at
  ), E'\n' ORDER BY created_at) AS s
  FROM jobs
),
job_assignments_b AS (
  SELECT string_agg(format(
    'INSERT INTO public.job_assignments (id, job_id, team_member_id, is_lead, created_at) VALUES (%L, %L, %L, %L, %L);',
    id, job_id, team_member_id, is_lead, created_at
  ), E'\n' ORDER BY created_at) AS s
  FROM job_assignments
),
neighbor_outreach_b AS (
  SELECT string_agg(format(
    'INSERT INTO public.neighbor_outreach (id, job_id, neighbor_addresses, cost, status, created_at, updated_at) VALUES (%L, %L, %L, %L, %L, %L, %L);',
    n.id, n.job_id, n.neighbor_addresses, n.cost, n.status, n.created_at, n.updated_at
  ), E'\n' ORDER BY n.created_at) AS s
  FROM neighbor_outreach n
  WHERE EXISTS (SELECT 1 FROM jobs j WHERE j.id = n.job_id)
),
job_locks_b AS (
  SELECT string_agg(format(
    'INSERT INTO public.job_locks (job_id, locked_by_id, locked_by_name, locked_at) VALUES (%L, %L, %L, %L);',
    l.job_id, l.locked_by_id, l.locked_by_name, l.locked_at
  ), E'\n' ORDER BY l.locked_at) AS s
  FROM job_locks l
  WHERE EXISTS (SELECT 1 FROM jobs j WHERE j.id = l.job_id)
)
SELECT
     E'BEGIN;\n\n'
  || E'-- companies\n'         || COALESCE((SELECT s FROM companies_b),         '-- (no rows)') || E'\n\n'
  || E'-- profiles\n'          || COALESCE((SELECT s FROM profiles_b),          '-- (no rows)') || E'\n\n'
  || E'-- team_members\n'      || COALESCE((SELECT s FROM team_members_b),      '-- (no rows)') || E'\n\n'
  || E'-- user_roles\n'        || COALESCE((SELECT s FROM user_roles_b),        '-- (no rows)') || E'\n\n'
  || E'-- customers\n'         || COALESCE((SELECT s FROM customers_b),         '-- (no rows)') || E'\n\n'
  || E'-- agent_rules\n'       || COALESCE((SELECT s FROM agent_rules_b),       '-- (no rows)') || E'\n\n'
  || E'-- jobs\n'              || COALESCE((SELECT s FROM jobs_b),              '-- (no rows)') || E'\n\n'
  || E'-- job_assignments\n'   || COALESCE((SELECT s FROM job_assignments_b),   '-- (no rows)') || E'\n\n'
  || E'-- neighbor_outreach\n' || COALESCE((SELECT s FROM neighbor_outreach_b), '-- (no rows)') || E'\n\n'
  || E'-- job_locks\n'         || COALESCE((SELECT s FROM job_locks_b),         '-- (no rows)') || E'\n\n'
  || E'COMMIT;\n'
  AS import_script;
