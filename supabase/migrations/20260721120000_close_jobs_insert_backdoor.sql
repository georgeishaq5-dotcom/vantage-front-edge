-- =====================================================================
-- Close the direct-insert back door on public.jobs
-- =====================================================================
-- The active-jobs cap is enforced in the createJob TanStack server function
-- (src/lib/jobs.functions.ts), which resolves the effective plan, counts open
-- jobs, and rejects at the plan limit. That check only means anything if a
-- client can no longer write jobs directly and skip it.
--
-- This drops the tenant INSERT policy so `authenticated` clients can no longer
-- insert jobs at all. The createJob server function writes through the
-- service-role client, which bypasses RLS, so it remains the SOLE writer of
-- jobs. SELECT / UPDATE / DELETE stay tenant-scoped exactly as before (the
-- dispatch board still reads and moves jobs client-side).
--
-- ⚠️ REVIEW BEFORE APPLYING. Not yet run against the live database. Apply with
--    `supabase db push` (or the Supabase dashboard) once approved.

drop policy if exists "Tenant insert jobs" on public.jobs;

-- Note: no INSERT policy is recreated. With RLS enabled and no INSERT policy,
-- inserts by `authenticated` (and `anon`) are denied; the service role bypasses
-- RLS and remains able to insert via the createJob server function.
