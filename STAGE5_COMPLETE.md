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

## In progress

**Stage 8 — Full test pass.** Started, not finished.
- ✅ Login and dashboard data load — confirmed working (during cutover
  testing).
- ⬜ Signup + email confirmation — blocked on Resend domain verification
  finishing.
- ⬜ Stripe checkout.
- ⬜ Plan Switcher.

## Open items for next session

- Finish Resend domain verification, then complete Stage 8: signup/email
  confirmation, Stripe checkout, Plan Switcher.
- Check whether Google branding re-verification has been approved yet.
- GitHub App still lacks write access to this repo (403). A one-time PAT
  workaround was used for the Stage 5 commits; needs a real fix — check
  `github.com/settings/installations` — so future commits push normally.
- UI gap noticed during Stage 7 testing: no change-password entry point
  on the login/account screens. Flagged for the upcoming broader UI
  pass; not urgent.
- OLD (`erabfcnmgnrvzwjkrdry`) — still fine to leave alone until NEW is
  fully verified across all of Stage 8.
