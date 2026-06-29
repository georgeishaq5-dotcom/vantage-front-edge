-- Stage 5 — data export (run in the OLD project: erabfcnmgnrvzwjkrdry)
--
-- WHERE TO RUN: OLD project's SQL editor (runs as `postgres`, bypasses RLS),
--   or via psql against the old DB. Export each result to CSV (dashboard
--   "Download CSV" button) or wrap a query in `\copy (...) TO 'file.csv' CSV
--   HEADER` from psql.
--
-- ORDER: tables are listed parents-first so the CSVs can be re-imported into
--   the new project (fsywsxifrvdtziiwhkjf) in this same order without
--   tripping FK constraints.
--
-- ORPHAN HANDLING (from Step 0, stage5_step0_orphan_check.sql):
--   Step 0 found 2 orphans in neighbor_outreach.job_id and 1 in
--   job_locks.job_id — leftover debris from test jobs deleted during this
--   week's testing, not real data. Those two exports filter to rows whose
--   job_id matches an existing job, so only clean, valid rows are exported.
--   All other relationships were clean (0 orphans), so the rest are `SELECT *`.
--
-- NOT EXPORTED (decided — see notes at bottom):
--   * trade_presets, email_send_state — singleton/seed rows; keep the new
--     project's seeded versions as-is.
--   * suppressed_emails, email_unsubscribe_tokens — 0 rows, nothing to export.
--   * ai_chat_rate_limit, email_send_log — ephemeral/operational.

-- ============= Parents =============

-- companies
SELECT * FROM companies;

-- profiles (refs auth.users by id, companies by company_id)
SELECT * FROM profiles;

-- team_members (refs auth.users by user_id; company_id is text 'vantage-co')
SELECT * FROM team_members;

-- user_roles (refs auth.users)
SELECT * FROM user_roles;

-- customers (refs companies)
SELECT * FROM customers;

-- agent_rules (refs companies)
SELECT * FROM agent_rules;

-- ============= Children of the above =============

-- jobs (refs companies, customers, team_members)
SELECT * FROM jobs;

-- job_assignments (refs jobs, team_members) — orphan check was clean
SELECT * FROM job_assignments;

-- neighbor_outreach (refs jobs) — EXCLUDE orphaned job_id (2 debris rows)
SELECT n.*
FROM neighbor_outreach n
WHERE EXISTS (SELECT 1 FROM jobs j WHERE j.id = n.job_id);

-- job_locks (refs jobs) — EXCLUDE orphaned job_id (1 debris row)
SELECT l.*
FROM job_locks l
WHERE EXISTS (SELECT 1 FROM jobs j WHERE j.id = l.job_id);

-- ============= Notes =============
-- trade_presets: old project had only the 1 default seed row ('General Field
--   Service'), not a custom preset. The new schema seeds the same row on
--   creation, so we keep the new project's seed and export nothing here.
--
-- email_send_state: singleton config row (id=1) seeded by the new schema —
--   keep the new project's seeded version rather than overwriting it.
--
-- suppressed_emails / email_unsubscribe_tokens: 0 rows on the old project
--   (confirmed by yesterday's count check) — nothing to export.
