-- =====================================================================
-- SMS suppression list — honor STOP opt-outs across all outbound sends
-- =====================================================================
-- When a customer replies STOP to the shared Twilio sender number, the inbound
-- webhook (/api/sms/inbound) records the opt-out here so every outbound SMS
-- path can skip suppressed numbers. Because all tenants share one sender
-- number, opt-out is GLOBAL by phone (we can't attribute a STOP to one tenant).
--
-- Written and read only by the service role (the webhook and the send guards);
-- Twilio also enforces STOP at the account level as a backstop.
--
-- Apply with `supabase db push`.

create table public.sms_suppressions (
  id           uuid primary key default gen_random_uuid(),
  phone_number text not null unique,        -- E.164
  reason       text not null default 'STOP',
  created_at   timestamptz not null default now()
);

comment on table public.sms_suppressions is
  'Global SMS opt-out list keyed by phone number. Populated by the STOP handler; checked before every outbound send.';

alter table public.sms_suppressions enable row level security;
-- No authenticated policies: server-only. The service role bypasses RLS.
grant all on public.sms_suppressions to service_role;
