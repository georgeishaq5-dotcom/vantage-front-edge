-- =====================================================================
-- 10 · Seed / default configuration data
-- =====================================================================
-- Only real default config is seeded. The original Lovable migration's
-- demo customers/jobs are intentionally NOT recreated (they were sample
-- data on the pre-tenancy schema). The email_send_state singleton is
-- seeded in migration 08.

-- Default trade preset used by onboarding / quoting before a workspace
-- customises its own.
insert into public.trade_presets (profession, base_job_title, base_job_description, base_price, upgrades)
values (
  'General Field Service',
  'Base Job',
  'Core service & labor',
  480,
  '[
    {"key":"premium-parts","name":"Premium-grade parts","description":"Longer-lasting components with extended manufacturer coverage.","price":180,"recommended":true},
    {"key":"warranty","name":"Extended 3-year warranty","description":"Full workmanship coverage for three years instead of 30 days.","price":220,"recommended":false},
    {"key":"inspection","name":"Full system safety inspection","description":"Top-to-bottom check of the surrounding system while we are on site.","price":95,"recommended":true},
    {"key":"maintenance","name":"Annual maintenance plan","description":"One scheduled tune-up per year to prevent future breakdowns.","price":140,"recommended":false},
    {"key":"priority","name":"Priority scheduling & 24/7 support","description":"Front-of-line booking and emergency phone support.","price":75,"recommended":false}
  ]'::jsonb
);
