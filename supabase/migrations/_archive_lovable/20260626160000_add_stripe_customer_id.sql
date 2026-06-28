ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

COMMENT ON COLUMN public.companies.stripe_customer_id
  IS 'Stripe Customer object ID (cus_…). Populated when a web subscription is created. Used to generate billing portal sessions.';
