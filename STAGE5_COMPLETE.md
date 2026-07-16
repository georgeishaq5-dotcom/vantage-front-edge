# Supabase Migration Status — off Lovable Cloud onto self-owned project

> Tracks the migration from the Lovable-managed Supabase project
> (`erabfcnmgnrvzwjkrdry`, referred to below as **OLD**) to a self-owned
> Supabase project (referred to below as **NEW**).

## Completed

**Stage 4 — Schema snapshot.** Full read-only inventory of OLD
(`supabase/SCHEMA_SNAPSHOT.md`), reconciling migration files, generated
types, and a live REST probe. Flagged pre-existing issues to carry
forward or fix: anon grant drift on newer tables, cascade-dropped FKs
never re-added (`neighbor_outreach.job_id`, `job_assignments.job_id`,
`job_locks.job_id`, `jobs.scheduled_by_id`), dynamically-applied objects
not in static SQL (pg_cron job, Vault secret, pgmq queues), and the
`team_members.company_id` `text`-vs-`uuid` quirk.

**Stage 5 — Data migration tooling.** Orphan-row check
(`supabase/stage5_step0_orphan_check.sql`), data export queries
(`supabase/stage5_data_export.sql`), and INSERT-script generators for
both regular tables and `auth.users`/identities
(`supabase/stage5_generate_inserts.sql`,
`supabase/stage5_generate_auth_inserts.sql`). Apple sign-in dropped from
migration scope (never configured); auth-import runbook and smoke test
scoped to email/password + Google only.

**Stage 6 — Auth flow hardening.** Forgot/reset password flow, resend
confirmation email, password strength meter, show/hide password toggle,
friendly mapped error messages, remembered last sign-in email, post-login
redirect back to the originally-requested page, resilient error
extraction for non-standard Supabase Auth error shapes.

**Stage 7 — Cutover to NEW, confirmed working end-to-end.**
- Email/password login and dashboard data load correctly against NEW.
- **Bug found and fixed during cutover:** `VITE_SUPABASE_URL` and
  `SUPABASE_URL` in Vercel had `/rest/v1` appended (copied from the
  wrong field in the Supabase dashboard), causing "Invalid path" errors
  on login. Corrected to the plain project URL and redeployed.
- **Google OAuth "missing OAuth secret" bug resolved.** Root cause: the
  OAuth consent screen was in "Testing" status with no test users added.
  Added a test user and confirmed Google login works for that account.
  App is currently under Google's branding re-verification (domain
  ownership + app name mismatch, both fixed, resubmitted) to open Google
  login to all users — pending Google's review, not blocking anything
  else.

**Stage 7b — Email runtime setup, investigated.**
- Confirmed `LOVABLE_API_KEY` / `sendLovableEmail` / the
  `/lovable/email/queue` pipeline is dead code — nothing in the app calls
  into it. Unscheduled the `process-email-queue` cron job on NEW rather
  than chasing a working key for unused infrastructure. Vault secret and
  pgmq tables left in place as harmless dormant infra.
- Set up real transactional email instead: Supabase Auth SMTP on NEW
  configured with Resend. Resend domain verification in progress
  (DKIM/SPF/DMARC DNS records added in Namecheap) — **not yet confirmed
  verified**.

**Stage 8 — Full test pass. ✅ Complete.**
- ✅ Login and dashboard data load — confirmed working (during cutover
  testing).
- ✅ Signup + email confirmation — confirmed working (Resend domain
  verification finished).
- ✅ Stripe checkout.
- ✅ Plan Switcher.

**Change-password entry point.** ✅ Complete — added to the
login/account screens (previously flagged as a UI gap during Stage 7
testing).

## In progress

- **Google branding re-verification** — resubmitted (domain ownership +
  app name mismatch both fixed); still pending Google's review to open
  Google login to all users. Not blocking anything else.
- **GitHub App write access** — still lacks write access to this repo
  (403 as of the Stage 5 commits, worked around with a one-time PAT).
  Needs a real fix — check `github.com/settings/installations`.

## Decommissioning OLD (`erabfcnmgnrvzwjkrdry`)

Now that Stage 8 is fully complete, OLD is no longer needed by the live
app — nothing in the codebase talks to it directly (the only
`LOVABLE_API_KEY` references are the unrelated Lovable AI Gateway used
by Van's chat, not this Supabase project). Decision: keep OLD **untouched
as a cold fallback** rather than deleting it immediately, in case some
untested edge case still depends on it.

- **Fallback window:** ~1-2 weeks from today (2026-07-16), i.e. revisit
  around **2026-07-30**.
- **If nothing surfaces by then:** proceed to decommission — revoke/
  rotate lingering keys, cancel or downgrade the Lovable project, strip
  any remaining OLD references from docs.
- **Risk of leaving it:** none beyond whatever Lovable/Supabase charges
  for an idle project.
- **Risk of deleting now:** low based on current code, but irreversible
  if an untested path (report, export, cache) still points at OLD —
  hence the wait.

## Open items for next session

- Check whether Google branding re-verification has been approved yet.
- Fix GitHub App write access so future commits push without a PAT
  workaround.
- Revisit OLD decommissioning around 2026-07-30 (see above).
