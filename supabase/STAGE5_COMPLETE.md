# Stage 5 — Data Migration: COMPLETE

Migrating off the Lovable-managed Supabase project (`erabfcnmgnrvzwjkrdry`) to
a self-owned project (`fsywsxifrvdtziiwhkjf`). This is a running log —
Stages 1-4 (schema rebuild + verification) were completed earlier (see git
history: `d2bfec3` "WIP: Supabase migration off Lovable — paused after Stage
4, before Stage 5"). This document covers Stage 5 (data + auth import),
now done.

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

## Smoke test

- Email/password login against NEW: **\<PASS/FAIL — fill in\>**
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

## Next: Stage 7 — Cutover (repoint the app at the NEW project)

Not started. Stage 6, if there is one distinct from this, isn't defined
here — pick this up as Stage 7 per the numbering already in use.

Before flipping the switch, resolve the parked Google OAuth issue above (or
explicitly accept email/password-only until it's fixed).

### 1. Configure the NEW project's auth providers
- [ ] Google provider: same OAuth client id, add/confirm the client secret,
      matching redirect + Site URL as the OLD project.
- [ ] Confirm Site URL / redirect URLs point at `app.vantage-fsm.com`.

### 2. Repoint environment variables
Per `CLAUDE.md`'s env var table, all of these need to move from the OLD
project's values to NEW's (`fsywsxifrvdtziiwhkjf`):

| Variable | Used by |
|---|---|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | client + server Supabase clients (`src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, billing routes, `api/chat.ts`, email routes) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | same |
| `SUPABASE_SERVICE_ROLE_KEY` | `client.server.ts` admin client, Stripe webhook |

- [ ] Update local `.env` (already noted as unchanged/pointing at OLD since
      the Stage 4 checkpoint).
- [ ] Update the same variables in the Vercel project's environment
      variables (Production + Preview, as applicable).

### 3. Stripe webhook
- [ ] `STRIPE_WEBHOOK_SECRET` / webhook endpoint config doesn't change (it's
      not Supabase-specific), but double check the Stripe webhook's target
      URL still resolves correctly post-cutover.

### 4. Redeploy + verify
- [ ] Redeploy on Vercel with the new env vars.
- [ ] Smoke test against production: email/password login, Google login
      (once secret is configured), one customer/job read, one write (e.g.
      create a test job) to confirm RLS + `company_id` scoping work
      end-to-end against NEW.

### 5. Decommission OLD (only after NEW is confirmed stable)
- [ ] Leave OLD (`erabfcnmgnrvzwjkrdry`) running untouched for a rollback
      window before considering deprovisioning it.
