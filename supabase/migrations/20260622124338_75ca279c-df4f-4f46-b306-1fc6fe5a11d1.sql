ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS automated_jobs_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'free';

COMMENT ON COLUMN public.companies.automated_jobs_count IS 'Counts automated/Pro jobs used. First 3 are free-trial; beyond requires active subscription.';
COMMENT ON COLUMN public.companies.subscription_status IS 'Subscription tier: free | active | past_due | cancelled.';