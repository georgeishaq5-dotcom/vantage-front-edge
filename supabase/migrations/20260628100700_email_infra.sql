-- =====================================================================
-- 08 · Email infrastructure (queues, tables, RPC wrappers)
-- =====================================================================
-- Self-contained email module: its own tables, RLS, policies, grants,
-- indexes, and pgmq RPC wrappers. Extensions are created in migration 01.
-- These tables are service_role-only by design; anon/authenticated are
-- explicitly revoked (fixes snapshot finding #1 for the email tables too).
--
-- The Vault secret and pg_cron job that DRIVE this pipeline are NOT in a
-- migration (they embed the project's service_role key + deployed URL).
-- Apply them per project via supabase/setup/email-runtime-setup.sql.

-- ---- pgmq queues ----------------------------------------------------
do $$ begin perform pgmq.create('auth_emails');              exception when others then null; end $$;
do $$ begin perform pgmq.create('transactional_emails');     exception when others then null; end $$;
do $$ begin perform pgmq.create('auth_emails_dlq');          exception when others then null; end $$;
do $$ begin perform pgmq.create('transactional_emails_dlq'); exception when others then null; end $$;

-- ---- email_send_log -------------------------------------------------
create table public.email_send_log (
  id              uuid primary key default gen_random_uuid(),
  message_id      text,
  template_name   text not null,
  recipient_email text not null,
  status          text not null check (status in ('pending','sent','suppressed','failed','bounced','complained','dlq')),
  error_message   text,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);
revoke all on public.email_send_log from anon, authenticated, public;
grant all on public.email_send_log to service_role;
alter table public.email_send_log enable row level security;
create policy "Service role can read send log"   on public.email_send_log for select using (auth.role() = 'service_role');
create policy "Service role can insert send log" on public.email_send_log for insert with check (auth.role() = 'service_role');
create policy "Service role can update send log" on public.email_send_log for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create index idx_email_send_log_created   on public.email_send_log (created_at desc);
create index idx_email_send_log_recipient on public.email_send_log (recipient_email);
create index idx_email_send_log_message   on public.email_send_log (message_id);
-- One 'sent' row per message_id (dedup safety net against VT-expiry races).
create unique index idx_email_send_log_message_sent_unique on public.email_send_log (message_id) where status = 'sent';

-- ---- email_send_state (singleton config + rate-limit cooldown) ------
create table public.email_send_state (
  id                              int primary key default 1 check (id = 1),
  retry_after_until               timestamptz,
  batch_size                      integer not null default 10,
  send_delay_ms                   integer not null default 200,
  auth_email_ttl_minutes          integer not null default 15,
  transactional_email_ttl_minutes integer not null default 60,
  updated_at                      timestamptz not null default now()
);
revoke all on public.email_send_state from anon, authenticated, public;
grant all on public.email_send_state to service_role;
alter table public.email_send_state enable row level security;
create policy "Service role can manage send state" on public.email_send_state
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
insert into public.email_send_state (id) values (1) on conflict do nothing;

-- ---- suppressed_emails (append-only: no update/delete policy) -------
create table public.suppressed_emails (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  reason     text not null check (reason in ('unsubscribe','bounce','complaint')),
  metadata   jsonb,
  created_at timestamptz not null default now(),
  unique (email)
);
revoke all on public.suppressed_emails from anon, authenticated, public;
grant all on public.suppressed_emails to service_role;
alter table public.suppressed_emails enable row level security;
create policy "Service role can read suppressed emails"   on public.suppressed_emails for select using (auth.role() = 'service_role');
create policy "Service role can insert suppressed emails" on public.suppressed_emails for insert with check (auth.role() = 'service_role');
create index idx_suppressed_emails_email on public.suppressed_emails (email);

-- ---- email_unsubscribe_tokens (no delete policy) -------------------
create table public.email_unsubscribe_tokens (
  id         uuid primary key default gen_random_uuid(),
  token      text not null unique,
  email      text not null unique,
  created_at timestamptz not null default now(),
  used_at    timestamptz
);
revoke all on public.email_unsubscribe_tokens from anon, authenticated, public;
grant all on public.email_unsubscribe_tokens to service_role;
alter table public.email_unsubscribe_tokens enable row level security;
create policy "Service role can read tokens"         on public.email_unsubscribe_tokens for select using (auth.role() = 'service_role');
create policy "Service role can insert tokens"       on public.email_unsubscribe_tokens for insert with check (auth.role() = 'service_role');
create policy "Service role can mark tokens as used" on public.email_unsubscribe_tokens for update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create index idx_unsubscribe_tokens_token on public.email_unsubscribe_tokens (token);

-- ---- pgmq RPC wrappers (PostgREST only exposes public-schema fns) ---
-- Each auto-creates its queue on undefined_table so messages are never lost.
create or replace function public.enqueue_email(queue_name text, payload jsonb)
returns bigint language plpgsql security definer as $$
begin
  return pgmq.send(queue_name, payload);
exception when undefined_table then
  perform pgmq.create(queue_name);
  return pgmq.send(queue_name, payload);
end;
$$;

create or replace function public.read_email_batch(queue_name text, batch_size int, vt int)
returns table(msg_id bigint, read_ct int, message jsonb)
language plpgsql security definer as $$
begin
  return query select r.msg_id, r.read_ct, r.message from pgmq.read(queue_name, vt, batch_size) r;
exception when undefined_table then
  perform pgmq.create(queue_name);
  return;
end;
$$;

create or replace function public.delete_email(queue_name text, message_id bigint)
returns boolean language plpgsql security definer as $$
begin
  return pgmq.delete(queue_name, message_id);
exception when undefined_table then
  return false;
end;
$$;

create or replace function public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
returns bigint language plpgsql security definer as $$
declare new_id bigint;
begin
  select pgmq.send(dlq_name, payload) into new_id;
  perform pgmq.delete(source_queue, message_id);
  return new_id;
exception when undefined_table then
  begin perform pgmq.create(dlq_name); exception when others then null; end;
  select pgmq.send(dlq_name, payload) into new_id;
  begin perform pgmq.delete(source_queue, message_id); exception when undefined_table then null; end;
  return new_id;
end;
$$;

-- Queue wrappers run as owner; restrict to service_role only.
revoke execute on function public.enqueue_email(text, jsonb)        from public, anon, authenticated;
revoke execute on function public.read_email_batch(text, int, int)  from public, anon, authenticated;
revoke execute on function public.delete_email(text, bigint)        from public, anon, authenticated;
revoke execute on function public.move_to_dlq(text, text, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.enqueue_email(text, jsonb)         to service_role;
grant execute on function public.read_email_batch(text, int, int)   to service_role;
grant execute on function public.delete_email(text, bigint)         to service_role;
grant execute on function public.move_to_dlq(text, text, bigint, jsonb) to service_role;
