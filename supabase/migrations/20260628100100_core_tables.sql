-- =====================================================================
-- 02 · Core application tables
-- =====================================================================
-- Tables are ordered so every foreign key resolves at creation time.
-- Columns whose default is public.current_company_id() are created here
-- WITHOUT that default and have it attached in migration 04 (after the
-- function exists). NOT NULL is safe meanwhile because no rows exist yet.

-- ---- companies (tenant / workspace) --------------------------------
create table public.companies (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  automated_jobs_count integer not null default 0,
  subscription_status  text not null default 'free',
  stripe_customer_id   text,
  plan                 text not null default 'free',
  trial_ends_at        timestamptz not null default (now() + interval '30 days'),
  constraint companies_plan_check check (plan in ('free', 'growth', 'crew'))
);
comment on column public.companies.automated_jobs_count is 'Counts automated/Pro jobs used. First 3 are free-trial; beyond requires active subscription.';
comment on column public.companies.subscription_status is 'Subscription tier: free | active | past_due | cancelled.';
comment on column public.companies.stripe_customer_id is 'Stripe Customer object ID (cus_…). Populated when a web subscription is created. Used to generate billing portal sessions.';
comment on column public.companies.plan is 'Paid subscription tier: free (Starter) | growth ($49) | crew ($99). Effective access is the higher of this and the reverse-trial (Crew) while trial_ends_at is in the future.';
comment on column public.companies.trial_ends_at is 'End of the 30-day reverse trial. Until this passes the workspace gets Crew-level access regardless of `plan`.';

-- ---- profiles (one per auth user) ----------------------------------
create table public.profiles (
  id                     uuid primary key default gen_random_uuid(),  -- = auth.users.id (set by handle_new_user)
  full_name              text,
  email                  text,
  created_at             timestamptz not null default now(),
  profession             text,
  onboarded              boolean not null default false,
  company_name           text,
  team_size              text,
  yearly_revenue         text,
  years_in_business      text,
  company_id             uuid references public.companies(id) on delete set null,
  ai_consent_granted     boolean not null default false,
  terms_accepted_version text
);

-- ---- user_roles -----------------------------------------------------
create table public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- ---- team_members ---------------------------------------------------
-- NOTE: company_id is text (legacy default 'vantage-co'); RLS compares
-- against current_company_id()::text. Kept as-is to match current data.
create table public.team_members (
  id         uuid primary key default gen_random_uuid(),
  company_id text not null default 'vantage-co',
  full_name  text not null,
  role       public.team_role not null default 'Field Tech',
  status     public.member_status not null default 'Offline',
  skills     text[] not null default '{}',
  email      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id    uuid references auth.users(id) on delete set null
);

-- ---- customers ------------------------------------------------------
create table public.customers (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  first_name      text,
  last_name       text,
  full_name       text,
  phone           text,
  email           text,
  address         text,
  service_address text,
  customer_type   text,   -- plain text (the customer_type enum is unused by this column)
  site_notes      text,
  created_at      timestamptz not null default now()
);

-- ---- jobs -----------------------------------------------------------
create table public.jobs (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  customer_id     uuid references public.customers(id) on delete set null,
  assigned_tech_id uuid references public.team_members(id) on delete set null,
  job_phase       text,
  skill_tag       text,
  status          text not null default 'Quoted',   -- plain text (job_status enum unused here)
  title           text not null default 'New Job',
  description     text,
  scheduled_date  timestamptz,
  service_date    date,
  total_amount    numeric not null default 0,
  quote_amount    numeric not null default 0,
  scheduled_by_id uuid references public.team_members(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ---- job_assignments ------------------------------------------------
-- FK on job_id RESTORED (was lost to the jobs CASCADE-drop; see snapshot finding #2)
create table public.job_assignments (
  id             uuid primary key default gen_random_uuid(),
  job_id         uuid references public.jobs(id) on delete cascade,
  team_member_id uuid references public.team_members(id) on delete cascade,
  is_lead        boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (job_id, team_member_id)
);

-- ---- job_locks ------------------------------------------------------
-- FK on job_id RESTORED (was lost to the jobs CASCADE-drop; see snapshot finding #2)
create table public.job_locks (
  job_id         uuid primary key references public.jobs(id) on delete cascade,
  locked_by_id   text not null,
  locked_by_name text not null,
  locked_at      timestamptz not null default now()
);

-- ---- agent_rules ----------------------------------------------------
create table public.agent_rules (
  id                     uuid primary key default gen_random_uuid(),
  target_zip_codes       text[] not null default '{}',
  min_profit_margin      numeric not null default 0,
  voice_tone             public.voice_tone not null default 'Professional',
  veto_level             public.veto_level not null default 'Full Manual Review',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  outreach_start_hour    integer not null default 8,
  outreach_end_hour      integer not null default 19,
  max_autonomous_discount numeric not null default 10,
  follow_up_trigger      text not null default 'Every 3 Days',
  auto_approve_limit     numeric not null default 250,
  handoff_keyword        text not null default 'HUMAN',
  weather_rain           boolean not null default false,
  weather_heat           boolean not null default false,
  weather_freeze         boolean not null default false,
  lead_strictness        integer not null default 50,
  company_id             uuid     -- nullable; default current_company_id() attached in migration 04
);

-- ---- neighbor_outreach ----------------------------------------------
-- FK on job_id RESTORED (was lost to the jobs CASCADE-drop; see snapshot finding #2)
create table public.neighbor_outreach (
  id                 uuid primary key default gen_random_uuid(),
  job_id             uuid references public.jobs(id) on delete cascade,
  neighbor_addresses text[] not null default '{}',
  cost               numeric not null default 10,
  status             public.outreach_status not null default 'Pending',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---- trade_presets --------------------------------------------------
create table public.trade_presets (
  id                   uuid primary key default gen_random_uuid(),
  profession           text not null default 'General Field Service',
  base_job_title       text not null default 'Base Job',
  base_job_description text not null default 'Core service & labor',
  base_price           numeric not null default 480,
  upgrades             jsonb not null default '[]'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---- ai_chat_rate_limit --------------------------------------------
-- RLS intentionally DISABLED; reached only via the SECURITY DEFINER
-- function increment_chat_rate_limit(). Not exposed through PostgREST.
create table public.ai_chat_rate_limit (
  user_id       uuid not null,
  window_start  timestamptz not null,
  request_count integer not null default 1,
  primary key (user_id, window_start)
);
alter table public.ai_chat_rate_limit disable row level security;
create index ai_chat_rate_limit_window_idx on public.ai_chat_rate_limit (window_start);
