# Email runtime objects — what they do & how to recreate them

This covers the three "dynamically-applied" objects flagged in
`supabase/SCHEMA_SNAPSHOT.md` that are **not** created by a standard
`supabase db push`: the **pgmq queues**, the **Vault secret**, and the
**pg_cron job**. All three are part of one feature: the **outbound email
pipeline**.

---

## What the email pipeline actually does

```
              app code / auth                         pg_cron (every 5s)
                    │                                        │
                    ▼                                        ▼
   POST /lovable/email/transactional/send          gate: cooldown clear?
   (renders React Email template, checks            queue non-empty?
    suppression list, makes unsub token,                    │ yes
    logs 'pending')                                         ▼
                    │                          net.http_post  ──Bearer──▶
                    ▼                          POST /lovable/email/queue/process
        enqueue_email('transactional_emails', payload)        │
                    │                                         ▼
                    ▼                          reads batch from pgmq, sends via
        ┌───────────────────────────┐         Lovable email API, then per message:
        │ pgmq queues               │           • success → log 'sent', delete from queue
        │  • auth_emails (priority) │           • 429     → set retry_after_until, stop
        │  • transactional_emails   │           • 403     → move_to_dlq
        │  • *_dlq (dead letter)    │           • other   → log 'failed', leave for retry
        └───────────────────────────┘           • >5 fails / TTL exceeded → move_to_dlq
```

**The three objects' roles:**

| Object | What it is | What it does here |
|--------|-----------|-------------------|
| **pgmq queues** `auth_emails`, `transactional_emails`, `auth_emails_dlq`, `transactional_emails_dlq` | Postgres-backed message queues (the `pgmq` extension) | Durable buffer between "an email was requested" and "it was actually sent". Decouples request latency from the email provider, enables retries with visibility-timeout, rate-limit backoff, and dead-lettering. `auth_emails` is drained first (higher priority). |
| **Vault secret** `email_queue_service_role_key` | An encrypted secret in `supabase_vault` | Holds the project's `service_role` key so the cron job can authenticate to the processor endpoint **without** the key sitting in plaintext in the `cron.job` catalog. The endpoint (`/lovable/email/queue/process`) compares the Bearer token against `SUPABASE_SERVICE_ROLE_KEY`. |
| **pg_cron job** `process-email-queue` | A scheduled job (`pg_cron`, 5-second cadence) | The pump. Every 5s it checks (a) we're not in a rate-limit cooldown and (b) a queue has messages; if so it `net.http_post`s the processor endpoint with the Vault key as a Bearer token. Without it, queued emails never get sent. |

Supporting tables (these **are** in the migration, listed for context):
`email_send_log` (audit trail / dedup / retry counter), `email_send_state`
(singleton row: rate-limit cooldown + batch/delay/TTL config),
`suppressed_emails` (bounces/complaints/unsubscribes — fail-closed),
`email_unsubscribe_tokens` (one-click unsubscribe links).

---

## Can these be expressed as SQL? — Yes, all three

On Supabase every one of these has a SQL API:

- **pgmq queues** → `SELECT pgmq.create('queue_name');`
- **Vault secret** → `SELECT vault.create_secret(value, name, description);`
- **pg_cron job** → `SELECT cron.schedule(name, schedule, command);` (pg_cron ≥ 1.5 supports the sub-minute `'5 seconds'` syntax that Supabase ships)

### So why weren't they just committed as a migration?

- The **queues** *are* already expressed as SQL — they're created idempotently
  inside `supabase/migrations/20260627145917_email_infra.sql` (the
  `PERFORM pgmq.create(...)` `DO` blocks). **They transfer automatically** when
  you run the migrations against the new project. ✅ Nothing extra to do.
- The **Vault secret** embeds the project's `service_role` key — a secret that
  must never be committed to git, and which differs per project.
- The **cron job** embeds (a) the deployed **app URL** to POST to and (b) a
  read of that Vault secret — both environment-specific.

That's why those two are a **parameterized one-time setup** rather than a
checked-in migration. The runnable script is
[`email-runtime-setup.sql`](./email-runtime-setup.sql).

---

## Setup checklist for the NEW project

> Order matters: schema first (creates extensions + queues + tables + RPCs),
> then the two runtime objects.

- [ ] **1. Apply all schema migrations** to the new project
      (`supabase link` to the new ref, then `supabase db push`).
      This installs the `pg_cron`, `pg_net`, `supabase_vault`, `pgmq`
      extensions, **creates the four pgmq queues**, the `public.email_*`
      tables, and the `enqueue_email` / `read_email_batch` / `delete_email` /
      `move_to_dlq` RPC wrappers.

- [ ] **2. Confirm the extensions + queues actually landed:**
      ```sql
      SELECT extname FROM pg_extension
       WHERE extname IN ('pg_cron','pg_net','supabase_vault','pgmq');
      SELECT queue_name FROM pgmq.list_queues();   -- expect the 4 queues
      ```
      If queues are missing (e.g. `pgmq` installed after the DO block ran):
      ```sql
      SELECT pgmq.create('auth_emails');
      SELECT pgmq.create('transactional_emails');
      SELECT pgmq.create('auth_emails_dlq');
      SELECT pgmq.create('transactional_emails_dlq');
      ```

- [ ] **3. Run `email-runtime-setup.sql`** in the SQL Editor after replacing:
      - `__SERVICE_ROLE_KEY__` → the **new** project's `service_role` key
        (Dashboard → Project Settings → API). This is the key the cron sends;
        it must equal the `SUPABASE_SERVICE_ROLE_KEY` env var your deployed
        app reads.
      - `__APP_URL__` → the deployed origin, **no trailing slash**
        (e.g. `https://app.vantage-fsm.com`). Must be publicly reachable from
        Supabase's network — a localhost/preview URL won't work for the real cron.

- [ ] **4. Verify the cron + secret registered** (the script prints these):
      ```sql
      SELECT jobid, schedule, jobname, active FROM cron.job
       WHERE jobname = 'process-email-queue';
      SELECT name, created_at FROM vault.secrets
       WHERE name = 'email_queue_service_role_key';
      ```

- [ ] **5. End-to-end test:** enqueue a test row and watch it drain:
      ```sql
      SELECT public.enqueue_email('transactional_emails',
        '{"message_id":"test-1","to":"you@example.com","subject":"ping","queued_at":"2026-06-28T00:00:00Z"}'::jsonb);
      -- within ~5-10s:
      SELECT status, error_message, created_at FROM public.email_send_log
       ORDER BY created_at DESC LIMIT 5;
      SELECT * FROM cron.job_run_details
       WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname='process-email-queue')
       ORDER BY start_time DESC LIMIT 5;
      ```

- [ ] **6. App env vars** (not DB, but required for the loop to work):
      `SUPABASE_SERVICE_ROLE_KEY` (must match the Vault secret),
      `LOVABLE_API_KEY`, and `LOVABLE_SEND_URL` if used, on the new deployment.

---

## Gotchas / things to verify manually

1. **`net.http_post` schema.** The migration runs
   `CREATE EXTENSION pg_net SCHEMA extensions`. On Supabase the callable is
   normally `net.http_post`, but if your project exposes it as
   `extensions.http_post`, adjust the call in the cron command. Check with:
   ```sql
   SELECT n.nspname, p.proname FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'http_post';
   ```
2. **Sub-minute cron.** `'5 seconds'` requires pg_cron ≥ 1.5 (Supabase has it).
   If your project rejects it, fall back to `'* * * * *'` (every minute) — the
   endpoint still drains a full batch each run; only latency increases.
3. **Rotating the key.** Re-run the Vault block in the script with the new key
   value (it updates in place by name); the cron picks it up on its next tick.
4. **Cooldown stuck.** If sends stall, check
   `SELECT retry_after_until FROM public.email_send_state WHERE id = 1;` — a
   future timestamp means the pipeline is in provider-rate-limit backoff.
5. **pg_cron runs in the `postgres` database only.** If you query `cron.job`
   from another database and see nothing, connect to `postgres`.
