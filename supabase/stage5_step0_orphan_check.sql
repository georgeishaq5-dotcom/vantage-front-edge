-- Stage 5 · Step 0 — orphan check (run BEFORE exporting data)
--
-- WHERE TO RUN: the OLD project's SQL editor
--   Supabase dashboard for `erabfcnmgnrvzwjkrdry` -> SQL Editor.
--   Must run here (not via the anon REST key): every at-risk table is
--   RLS-protected, and the dashboard SQL editor runs as `postgres`, which
--   bypasses RLS and can read `auth.users`.
--
-- WHY: On the old DB several FK columns are unconstrained `uuid` — the
--   `DROP TABLE ... CASCADE` in migration 20260618142846 silently dropped
--   their FKs and they were never re-added (SCHEMA_SNAPSHOT.md finding #2).
--   The new project (Stage 4) re-adds those FKs, so any orphan that exists
--   now will make the data import fail. This finds them first.
--
-- READING THE RESULT (only non-zero rows are problems):
--   * All zeros            -> clean; proceed to the export step.
--   * Non-zero in group (A) -> expected-possible per finding #2; per row,
--                              delete the orphan child or null the column
--                              before export (won't import otherwise).
--   * Non-zero in group (B) -> unexpected (these FKs are still enforced on
--                              the old DB); investigate before trusting the dump.
--   * Non-zero profiles.id -> auth.users -> a profile with no auth user;
--                              can't be re-linked, will likely fail import.
--
-- NULL FK values are legal (nullable columns) and are excluded — only
-- non-null values pointing at a missing parent count as orphans.
--
-- Deliberate omissions:
--   * team_members.company_id is `text` (default 'vantage-co'), not a uuid FK
--     (finding #4); the new schema carries it over as unconstrained text, so
--     it can't block the import — not checked here.

-- (A) Columns that LOST their FK on the old DB (finding #2) — highest risk,
--     because the new schema re-adds these constraints.
SELECT 'neighbor_outreach.job_id -> jobs' AS relationship, count(*) AS orphans
FROM neighbor_outreach n
WHERE n.job_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM jobs j WHERE j.id = n.job_id)
UNION ALL
SELECT 'job_assignments.job_id -> jobs', count(*)
FROM job_assignments a
WHERE a.job_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM jobs j WHERE j.id = a.job_id)
UNION ALL
SELECT 'job_locks.job_id -> jobs', count(*)
FROM job_locks l
WHERE NOT EXISTS (SELECT 1 FROM jobs j WHERE j.id = l.job_id)
UNION ALL
SELECT 'jobs.scheduled_by_id -> team_members', count(*)
FROM jobs j
WHERE j.scheduled_by_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM team_members t WHERE t.id = j.scheduled_by_id)
UNION ALL
SELECT 'jobs.assigned_tech_id -> team_members', count(*)
FROM jobs j
WHERE j.assigned_tech_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM team_members t WHERE t.id = j.assigned_tech_id)
UNION ALL
SELECT 'agent_rules.company_id -> companies', count(*)
FROM agent_rules r
WHERE r.company_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.id = r.company_id)

-- (B) FKs that are still intact on the old DB — should be 0, but cheap to
--     confirm nothing drifted, and they gate the import too.
UNION ALL
SELECT 'jobs.company_id -> companies', count(*)
FROM jobs j
WHERE NOT EXISTS (SELECT 1 FROM companies c WHERE c.id = j.company_id)
UNION ALL
SELECT 'jobs.customer_id -> customers', count(*)
FROM jobs j
WHERE j.customer_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM customers cu WHERE cu.id = j.customer_id)
UNION ALL
SELECT 'customers.company_id -> companies', count(*)
FROM customers cu
WHERE NOT EXISTS (SELECT 1 FROM companies c WHERE c.id = cu.company_id)
UNION ALL
SELECT 'job_assignments.team_member_id -> team_members', count(*)
FROM job_assignments a
WHERE a.team_member_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM team_members t WHERE t.id = a.team_member_id)

-- (C) Links to auth.users — no DB-level FK on profiles.id (trigger-populated),
--     but the new schema/import expects these to resolve.
UNION ALL
SELECT 'profiles.id -> auth.users', count(*)
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id)
UNION ALL
SELECT 'profiles.company_id -> companies', count(*)
FROM profiles p
WHERE p.company_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.id = p.company_id)
UNION ALL
SELECT 'user_roles.user_id -> auth.users', count(*)
FROM user_roles ur
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ur.user_id)
UNION ALL
SELECT 'team_members.user_id -> auth.users', count(*)
FROM team_members t
WHERE t.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = t.user_id)

ORDER BY orphans DESC, relationship;
