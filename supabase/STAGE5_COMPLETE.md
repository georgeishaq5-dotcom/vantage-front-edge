# Supabase Migration Status — Stages 5 & 7 COMPLETE

Migrating off the Lovable-managed Supabase project (`erabfcnmgnrvzwjkrdry`) to
a self-owned project (`fsywsxifrvdtziiwhkjf`). This is a running log —
Stages 1-4 (schema rebuild + verification) were completed earlier (see git
history: `d2bfec3` "WIP: Supabase migration off Lovable — paused after Stage
4, before Stage 5"). This document covers Stage 5 (data + auth import) and
Stage 7 (cutover), both now done. Stages 7b (email runtime) and 8 (full test
pass) are still open — see the bottom of this doc.

## What was fixed along the way

- **`stage5_generate_auth_inserts.sql`**: removed the
  `ALTER TABLE auth.users DISABLE/ENABLE TRIGGER` lines. Hosted Supabase
  rejects that ALTER regardless of role (`42501: must be owner of table
  users`), so `on_auth_user_created` fires per-row during the import — the
  app-data script (below) is written to expect and absorb that.
- **`stage5_generate_inserts.sql`**:
  - `profiles` INSERTs now use `ON CONFLICT (id) DO UPDATE`, so the real
    row overwrites the trigger's auto-created placeholder.
  - `user_roles` INSERTs now use `ON CONFLICT (user_id, role) DO NOTHING`,
    since the trigger's auto-assigned role (e.g. `admin` for the first
    migrated user) can collide with the real historical role under the
    table's `unique(user_id, role)` constraint.
- **`trg_prevent_profile_company_change`**: a second trigger
  (`prevent_profile_company_change()`, migration
  `20260628100400_triggers.sql`) silently overrode `profiles.company_id`
  back to the placeholder value on the `ON CONFLICT DO UPDATE`, because it
  blocks non-admin `company_id` changes. Worked around by disabling that
  trigger, running the 4 corrective `UPDATE public.profiles SET company_id
  = ...` statements by hand for the affected rows, then re-enabling the
  trigger. Confirmed all 4 profiles point at their correct real company
  afterward.
- **Leftover placeholder companies**: the 4 throwaway companies created by
  `handle_new_user()` (one per migrated user, name `'My Workspace'`) were
  confirmed orphaned (no profiles/customers/jobs/agent_rules referencing
  them) and deleted via the cleanup query documented in
  `stage5_generate_inserts.sql`'s header.

## Final verified counts (NEW project)

| Table | Count |
|---|---|
| `auth.users` | 4 |
| `auth.identities` | 5 |
| `public.profiles` | 4 (real data, correct `company_id`) |
| `public.companies` | 4 (placeholders cleaned up) |
| `public.user_roles` | 4 |
| `public.customers` | 4 |
| `public.jobs` | 1 |

## Smoke test (Stage 5, pre-cutover)

- Email/password login against NEW: pass (confirmed properly during cutover,
  see below).
- Google login against NEW: **fails** with "missing OAuth secret" — the
  Google provider's client id/secret haven't been configured on the NEW
  project yet (see `stage5_generate_auth_inserts.sql` step 1). Parked, not
  blocking — needs the OAuth client secret configured in the NEW project's
  Auth provider settings before Google sign-in will work there.

## Git / push status

All Stage 5 fixes are committed locally on
`claude/supabase-migration-status-5w885c` (commit `f924685` + this doc).
**Push to GitHub is currently blocked** — the Claude GitHub App integration
doesn't have write access to `georgeishaq5-dotcom/vantage-front-edge`
(`403: Resource not accessible by integration`, confirmed both via the git
remote and directly via the GitHub API). Nothing is lost — it's committed
locally — but it needs the GitHub App's permissions/installation fixed
before it can reach the remote branch.

## Stage 7 — Cutover: COMPLETE

The app (`vantagefsm` Vercel project, domains `vantage-fsm.com` /
`app.vantage-fsm.com`) is now pointed at the NEW Supabase project
(`fsywsxifrvdtziiwhkjf`) in production.

**What was done:**
- All five Supabase env vars (`VITE_SUPABASE_URL`, `SUPABASE_URL`,
  `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`) updated in Vercel Production to NEW's values,
  and local `.env` updated to match.
- Redeployed (`vantagefsm` production target, rebuilt `main`'s current
  commit fresh so the `VITE_`-prefixed vars — which are inlined into the
  client bundle at build time, not read at runtime — actually picked up the
  new values).

**Bug found + fixed during cutover:** first redeploy failed with
`"Invalid path specified in request URL"` on email/password login — a Kong
gateway error, characteristic of a double-slash in the request path.
Root cause: both `VITE_SUPABASE_URL` and `SUPABASE_URL` had `/rest/v1`
appended (likely copied from the wrong field on Supabase's API settings
page, which shows several endpoint URLs close together). `supabase-js`
passes the URL straight through to build auth requests
(`${URL}/auth/v1/...`) with no trimming — confirmed by reading
`client.ts`/`client.server.ts`/`auth-middleware.ts`, none of which do any
URL string manipulation themselves. Fixed by correcting both vars to the
bare project URL (`https://fsywsxifrvdtziiwhkjf.supabase.co`, no path, no
trailing slash) and redeploying again.

**Confirmed working:** email/password login succeeds on the live app;
customer data loads correctly — RLS + `company_id` scoping resolve against
NEW end-to-end.

**Still parked, not blocking:** Google login fails with "missing OAuth
secret" — unaffected by the env var fix, same issue flagged back in Stage 5
(the Google provider's client secret was never configured on the NEW
project). Needs: Supabase dashboard → NEW project → Authentication →
Providers → Google → add the client secret (same client ID as OLD) before
Google sign-in will work.

**OLD project** (`erabfcnmgnrvzwjkrdry`) has been left running, untouched,
as a rollback option — not yet decommissioned.

---

## What's left

### Stage 7b — Email runtime setup on NEW
Full instructions already written: `supabase/setup/EMAIL_RUNTIME_SETUP.md`
+ `supabase/setup/email-runtime-setup.sql`. Not yet run against NEW. Needs:
- NEW project's `service_role` key (Dashboard → Project Settings → API) —
  same value now in `SUPABASE_SERVICE_ROLE_KEY` on Vercel.
- The deployed app URL, no trailing slash: `https://app.vantage-fsm.com`.

Before starting, check:
- [ ] Extensions present on NEW: `pg_cron`, `pg_net`, `supabase_vault`,
      `pgmq` (should already be there from the Stage 4 schema push — the
      queues themselves are created by migration
      `20260628100700_email_infra.sql`, confirm via
      `SELECT queue_name FROM pgmq.list_queues();` — expect 4).
- [ ] Whether OLD's Vault secret / cron job values (if you want to diff
      against them for reference) are still reachable — OLD's SQL editor
      only, no CLI access there.
- [ ] `net.http_post` vs `extensions.http_post` — check which schema NEW
      exposes it under before pasting the cron command (see "Gotchas" #1 in
      the setup doc).

Then follow the checklist in `EMAIL_RUNTIME_SETUP.md` steps 1-6 (steps 1-2
— schema/queues — should already be satisfied by Stage 4/5; start at step 3,
run `email-runtime-setup.sql` with the two placeholders filled in).

### Stage 8 — Full test pass against NEW in production
Not started. Before running this, make sure:
- [ ] Stage 7b (email) is done first if any of these flows send email
      (signup confirmation, invites) — otherwise those steps will look
      broken for an unrelated reason.
- [ ] You have a disposable/test email address and a Stripe test-mode card
      handy (`4242 4242 4242 4242` or whichever Stripe test card the
      project's Stripe account is configured for).
- [ ] Know which plan tier to exercise the paywall on (`Growth` $49/mo or
      `Crew` $99/mo — see `src/lib/entitlements.ts` for
      `FEATURE_MIN_PLAN`/caps) so you hit a real `requireFeature()` gate
      during the test, not just the reverse-trial's full access.

Test matrix to run:
- [ ] **Signup**: new account, email/password — confirms `handle_new_user()`
      trigger provisions company/profile/role correctly on NEW for a
      genuinely new (non-migrated) user, not just the imported ones.
- [ ] **Dashboard**: load jobs/customers/team as the migrated admin user —
      confirms RLS scoping (already spot-checked during cutover, but do a
      fuller pass: create/edit/delete a customer and a job).
- [ ] **Stripe checkout**: `PremiumPaywall` → `POST /api/billing/checkout`
      → completes a real Checkout session → confirm the webhook
      (`POST /api/billing/webhook`) writes `companies.plan` +
      `subscription_status` correctly via the service-role client (this is
      NEW's service role key now, so this indirectly re-verifies the Stage
      7 key rotation too).
- [ ] **Plan Switcher**: `PlanSwitcherSection` in Settings (admin QA path,
      no payment) — confirms `setCompanyPlan` writes succeed against NEW
      under the `prevent_company_billing_change` trigger's admin exception.

### After Stage 8 passes
- [ ] Configure Google OAuth secret (parked item above) if needed for real
      users, or confirm email/password-only is acceptable long-term.
- [ ] Decide on an OLD-project decommission date once NEW has run stable
      in production for a while.
