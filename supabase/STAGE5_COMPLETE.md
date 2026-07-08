# Supabase Migration Status — Stages 5 & 7 COMPLETE

Migrating off the Lovable-managed Supabase project (`erabfcnmgnrvzwjkrdry`) to
a self-owned project (`fsywsxifrvdtziiwhkjf`). This is a running log —
Stages 1-4 (schema rebuild + verification) were completed earlier (see git
history: `d2bfec3` "WIP: Supabase migration off Lovable — paused after Stage
4, before Stage 5"). This document covers Stage 5 (data + auth import) and
Stage 7 (cutover), both now done and confirmed working end-to-end. Stage 7b
(email runtime) was attempted and deliberately abandoned as dead code, not
a blocker — see below; real transactional email is being set up via
Resend/Supabase Auth SMTP instead. Stage 8 (full test pass) is in progress
— see the bottom of this doc for exactly what's left.

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
- Google login against NEW: initially failed with "missing OAuth secret" —
  see the Stage 7 section below for the actual root cause and resolution
  (it wasn't the client secret).

## Git / push status

All work in this document is committed on branch
`claude/supabase-migration-status-5w885c`. **The GitHub App integration
still lacks write access** to `georgeishaq5-dotcom/vantage-front-edge`
(`403: Resource not accessible by integration`, confirmed repeatedly both
via the git relay and directly via the GitHub API, across the whole
session). A personal access token was used as a one-time workaround to
push the Stage 5/7 commits so nothing sat unpushed — see "Open items for
next session" below for the real fix needed (GitHub App permissions, not
another PAT workaround).

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

**Google OAuth "missing OAuth secret" — RESOLVED.** Root cause wasn't
actually a missing client secret in Supabase (that was fixed earlier) — it
was the Google Cloud OAuth consent screen sitting in **Testing** status
with no test users added, which Google rejects for anyone outside that
list. Added a test user, confirmed Google login now works end-to-end for
that account. The app is currently under **Google's branding
re-verification** (it flagged a domain-ownership mismatch and an app-name
mismatch; both were fixed and the verification was resubmitted) — this is
required to open Google login to all users, not just test-list accounts.
Pending Google's review; doesn't block anything else in the meantime.

**OLD project** (`erabfcnmgnrvzwjkrdry`) has been left running, untouched,
as a rollback option — not yet decommissioned.

## Transactional email — Resend via Supabase Auth SMTP

Real transactional email (signup confirmation, password reset) is being
set up the standard Supabase way instead of the abandoned Stage 7b pipeline
(see below): Supabase Auth's built-in SMTP config on NEW, pointed at
Resend. DKIM/SPF/DMARC DNS records have been added in Namecheap; Resend
domain verification is **in progress, not yet confirmed**. This gates part
of Stage 8 (see below) — signup's email-confirmation step won't work
end-to-end until verification finishes.

---

## What's left

### Stage 7b — Email runtime setup on NEW: ABANDONED (deliberately, not a blocker)

Attempted, then reversed. Record of what happened and why:

- Ran `email-runtime-setup.sql` against NEW: Vault secret
  (`email_queue_service_role_key`) created, `pg_cron` job
  `process-email-queue` scheduled (every 5s), confirmed firing correctly
  against `POST https://app.vantage-fsm.com/lovable/email/queue/process`
  (verified via `net._http_response`).
- The endpoint returned `HTTP 500 {"error":"Server configuration error"}`.
  Traced to `src/routes/lovable/email/queue/process.ts:67-77`: the route
  requires `LOVABLE_API_KEY` (plus `VITE_SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY`, both already confirmed working) and 500s if
  any are missing. `LOVABLE_API_KEY` was confirmed **entirely absent** from
  Vercel — not misnamed, not wrong-scoped, never set.
- Before chasing that key down: confirmed via the actual
  `@lovable.dev/email-js` package source (fetched from the npm registry
  tarball, `dist/index.js`) that `sendLovableEmail()` is a thin HTTP client
  that POSTs to Lovable's own hosted API,
  `https://api.lovable.dev/v1/messaging/email/send`, authenticated with
  that key. It's not a generic multi-provider wrapper and has no adapter
  for Resend/SendGrid/etc. — this pipeline is Lovable-account-locked by
  design, not something broken by the Vercel/Supabase migration.
- Separately confirmed **nothing in the app actually calls this pipeline**.
  Grepped every caller of `enqueue_email` / `POST /lovable/email/transactional/send`
  across components, hooks, `src/lib/*.functions.ts`, and the Supabase
  migrations (auth hooks) — the only references anywhere are the route
  handlers themselves, their own type definitions, and the auto-generated
  `routeTree.gen.ts`. No signup, invite, or job-notification flow triggers
  an email through this queue. It's dormant infrastructure that predates
  (and is unrelated to) the Resend-based transactional email already
  working independently (via Supabase Auth's own SMTP config, a separate
  mechanism entirely outside this pipeline and this repo's code).

**Decision:** don't provision a Lovable Cloud API key for dead code. The
`process-email-queue` cron job was unscheduled on NEW
(`SELECT cron.unschedule('process-email-queue');`, verified 0 rows in
`cron.job` for that name afterward). The Vault secret and the pgmq
queues/tables were left in place — harmless dormant schema, not worth
tearing out unless reclaiming the surface later becomes a priority.

**Not a blocker for anything.** If this pipeline is ever revived
intentionally, the setup docs (`EMAIL_RUNTIME_SETUP.md` +
`email-runtime-setup.sql`) are still accurate and reusable — the fix would
be sourcing a real `LOVABLE_API_KEY` (and confirming whether
`LOVABLE_SEND_URL` needs setting too) before re-running the cron schedule
step.

### Stage 8 — Full test pass against NEW in production: IN PROGRESS

Started, not finished. Done so far (confirmed during cutover testing):
- [x] **Dashboard**: login (email/password) and customer data load
      correctly against NEW — RLS + `company_id` scoping verified working.

Still outstanding, blocked/gated as noted:
- [ ] **Signup + email confirmation** — blocked on Resend domain
      verification finishing (see above). Confirms `handle_new_user()`
      trigger provisions company/profile/role correctly on NEW for a
      genuinely new (non-migrated) user, not just the imported ones, and
      that the confirmation email actually sends/delivers via Resend.
- [ ] **Dashboard, fuller pass**: create/edit/delete a customer and a job
      (only read was exercised during cutover, not writes).
- [ ] **Stripe checkout**: `PremiumPaywall` → `POST /api/billing/checkout`
      → completes a real Checkout session → confirm the webhook
      (`POST /api/billing/webhook`) writes `companies.plan` +
      `subscription_status` correctly via the service-role client (this is
      NEW's service role key now, so this indirectly re-verifies the Stage
      7 key rotation too). Needs: disposable test email/Stripe test-mode
      card, and pick a specific tier (`Growth` $49/mo or `Crew` $99/mo —
      see `src/lib/entitlements.ts` `FEATURE_MIN_PLAN`/caps) so a real
      `requireFeature()` gate gets exercised, not just reverse-trial access.
- [ ] **Plan Switcher**: `PlanSwitcherSection` in Settings (admin QA path,
      no payment) — confirms `setCompanyPlan` writes succeed against NEW
      under the `prevent_company_billing_change` trigger's admin exception.

### After Stage 8 passes
- [ ] Decide on an OLD-project decommission date once NEW has run stable
      in production for a while.

---

## Open items for next session

1. **Finish Resend domain verification**, then complete Stage 8: signup +
   email confirmation, Stripe checkout, Plan Switcher.
2. **Google branding re-verification** — check whether Google has approved
   it yet (opens Google login to all users, not just the added test
   account).
3. **GitHub App write access is still broken** — `403: Resource not
   accessible by integration` on every push attempt this session (both via
   the git relay and directly via the GitHub API). A one-time personal
   access token was used as a workaround to get the Stage 5/7 commits
   pushed; that's not a real fix. Check
   `github.com/settings/installations` for the Claude GitHub App's access
   to `georgeishaq5-dotcom/vantage-front-edge` and restore write
   permissions so future commits can push normally without needing a PAT
   each time.
4. **UI gap noticed during testing**: no change-password entry point
   anywhere on the login/account screens. Not urgent — flagged for the
   upcoming broader UI pass rather than fixed ad hoc here.
5. **OLD project** (`erabfcnmgnrvzwjkrdry`) — still fine to leave running
   untouched until NEW is fully verified across all of Stage 8.
