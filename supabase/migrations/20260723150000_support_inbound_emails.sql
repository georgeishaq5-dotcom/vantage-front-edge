-- =====================================================================
-- support_inbound_emails — record of mail received at support@ (Resend inbound)
-- =====================================================================
-- The Resend inbound webhook (/api/email/inbound) logs every received message
-- here before forwarding a notification to the team inbox, so there's a durable
-- record even if the forward email fails. Server-only (service role); NOT
-- tenant-scoped — this is a platform support mailbox, not customer data.
-- Follows the email-module convention (email_send_log, etc.).
--
-- Apply with `supabase db push`.

create table public.support_inbound_emails (
  id              uuid primary key default gen_random_uuid(),
  resend_email_id text,                       -- Resend received-email id (fetch/dedupe)
  from_address    text,
  to_address      text,
  subject         text,
  body            text,
  forwarded       boolean not null default false,
  received_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

comment on table public.support_inbound_emails is
  'Inbound support@ mail received via the Resend webhook. Server-only; forwarded to the team inbox.';

alter table public.support_inbound_emails enable row level security;

-- Server-only: written and read by the inbound webhook via the service role.
create policy "service_role manages support_inbound_emails"
  on public.support_inbound_emails for all to service_role
  using (true) with check (true);

grant all on public.support_inbound_emails to service_role;

create index idx_support_inbound_received on public.support_inbound_emails (received_at desc);
