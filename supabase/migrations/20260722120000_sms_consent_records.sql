-- =====================================================================
-- SMS consent records — proof-of-consent for customer-provided numbers
-- =====================================================================
-- Immutable record of the exact consent a customer agreed to when they gave a
-- trades business their phone number for appointment / quote / job-status SMS
-- (quote requests, appointment booking, job status opt-in). Written by the
-- recordSmsConsent server function so consented_at + ip_address are captured
-- server-side and `consent_text_shown` stores the exact string shown.
--
-- Not related to the Radius blastNeighbors flow (separate compliance path).
--
-- Approved for apply. Run with `supabase db push` (or the Supabase dashboard)
-- against the live database — not applied automatically here.

create table public.sms_consent_records (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies(id) on delete cascade,
  customer_id        uuid references public.customers(id) on delete set null,
  phone_number       text not null,                    -- E.164
  consent_text_shown text not null,                    -- exact string agreed to (immutable proof)
  source             text not null,                    -- 'add_customer' | 'edit_customer' | 'booking' | …
  consented_at       timestamptz not null default now(),
  ip_address         text,                             -- captured server-side
  withdrawn_at       timestamptz,                      -- set on STOP (service role only)
  created_at         timestamptz not null default now()
);

comment on table public.sms_consent_records is
  'Immutable proof-of-consent for customer SMS opt-in (appointment/quote/job-status). withdrawn_at is set by the STOP handler via the service role.';
comment on column public.sms_consent_records.consent_text_shown is
  'The exact consent language shown to and agreed by the customer — stored verbatim, not a boolean.';

create index idx_sms_consent_company on public.sms_consent_records (company_id);
create index idx_sms_consent_customer on public.sms_consent_records (customer_id);
create index idx_sms_consent_phone on public.sms_consent_records (phone_number);

-- ---- RLS ------------------------------------------------------------
-- Tenant members may read and insert their own company's records. Records are
-- IMMUTABLE to clients: no UPDATE/DELETE policy. withdrawn_at is written only
-- by the service role (the future STOP webhook), which bypasses RLS.
alter table public.sms_consent_records enable row level security;

create policy "Tenant read sms_consent_records" on public.sms_consent_records
  for select to authenticated using (company_id = public.current_company_id());

create policy "Tenant insert sms_consent_records" on public.sms_consent_records
  for insert to authenticated with check (company_id = public.current_company_id());

-- ---- Grants (RLS still applies on top) ------------------------------
grant select, insert on public.sms_consent_records to authenticated;
grant all on public.sms_consent_records to service_role;
