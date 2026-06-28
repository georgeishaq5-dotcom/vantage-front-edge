-- =====================================================================
-- Email runtime setup — Vault secret + pg_cron job
-- =====================================================================
-- Run this ONCE per Supabase project, AFTER the schema migrations have
-- been applied (extensions, pgmq queues, public.email_* tables and the
-- enqueue/read/delete/move_to_dlq RPC wrappers all come from
-- supabase/migrations/20260627145917_email_infra.sql).
--
-- These two objects are NOT in a migration because they embed
-- project-specific values:
--   1. the new project's service_role key (a secret — never commit it)
--   2. the deployed app URL the cron posts to
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor, paste, replace the two placeholders
--   below, and execute. (Or psql against the project's connection string.)
--
-- REPLACE BEFORE RUNNING:
--   __SERVICE_ROLE_KEY__   the NEW project's service_role key (Settings -> API)
--   __APP_URL__            deployed app origin, NO trailing slash,
--                          e.g. https://app.vantage-fsm.com
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Sanity: required extensions must already exist (created by the
--    email_infra migration). This block only verifies — it does not
--    create anything.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE EXCEPTION 'pg_cron not installed — run the schema migrations first';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE EXCEPTION 'pg_net not installed — run the schema migrations first';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'supabase_vault') THEN
    RAISE EXCEPTION 'supabase_vault not installed — run the schema migrations first';
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- 1. VAULT SECRET: email_queue_service_role_key
--    The cron job reads this at runtime to authenticate to the
--    processor endpoint. Stored encrypted in Vault so the key is never
--    written in plaintext into the cron command or pg_cron catalog.
--
--    Idempotent: rotates the value if the secret already exists.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM vault.secrets
   WHERE name = 'email_queue_service_role_key';

  IF v_id IS NULL THEN
    PERFORM vault.create_secret(
      '__SERVICE_ROLE_KEY__',
      'email_queue_service_role_key',
      'Service role key used by the process-email-queue cron to call the processor endpoint'
    );
  ELSE
    PERFORM vault.update_secret(
      v_id,
      '__SERVICE_ROLE_KEY__',
      'email_queue_service_role_key',
      'Service role key used by the process-email-queue cron to call the processor endpoint'
    );
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- 2. CRON JOB: process-email-queue (every 5 seconds)
--    Wakes the processor endpoint only when there is work to do:
--      a) not currently in a rate-limit cooldown
--         (public.email_send_state.retry_after_until), and
--      b) at least one of the two live queues has messages.
--    The endpoint itself re-checks the cooldown and is safe to call
--    when empty, so the gate is purely a cost/noise optimisation.
--
--    Auth: sends the vault-stored service_role key as a Bearer token,
--    which the endpoint compares against SUPABASE_SERVICE_ROLE_KEY.
--
--    Idempotent: unschedule first if it already exists.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('process-email-queue')
   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-email-queue');
END $$;

SELECT cron.schedule(
  'process-email-queue',
  '5 seconds',
  $cron$
  DO $job$
  BEGIN
    IF coalesce(
         (SELECT retry_after_until FROM public.email_send_state WHERE id = 1),
         to_timestamp(0)
       ) < now()
       AND (
         coalesce((SELECT queue_length FROM pgmq.metrics('auth_emails')), 0) > 0
         OR
         coalesce((SELECT queue_length FROM pgmq.metrics('transactional_emails')), 0) > 0
       )
    THEN
      PERFORM net.http_post(
        url     := '__APP_URL__/lovable/email/queue/process',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (
            SELECT decrypted_secret FROM vault.decrypted_secrets
             WHERE name = 'email_queue_service_role_key'
          )
        ),
        body    := '{}'::jsonb
      );
    END IF;
  END $job$;
  $cron$
);


-- ---------------------------------------------------------------------
-- 3. VERIFY
-- ---------------------------------------------------------------------
-- Cron job registered?
SELECT jobid, schedule, jobname, active FROM cron.job WHERE jobname = 'process-email-queue';
-- Secret present (value stays encrypted)?
SELECT name, created_at FROM vault.secrets WHERE name = 'email_queue_service_role_key';
-- After a minute, recent run results:
-- SELECT status, return_message, start_time
--   FROM cron.job_run_details
--  WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue')
--  ORDER BY start_time DESC LIMIT 5;
