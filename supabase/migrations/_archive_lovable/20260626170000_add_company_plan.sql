-- Three-plan entitlement model (free / growth / crew) + 30-day reverse trial.
--
-- `plan` stores the company's *paid* subscription tier. The *effective* plan is
-- derived at read time (see src/lib/entitlements.ts): during the 30-day reverse
-- trial every workspace gets Crew-level access, then falls back to `plan` (which
-- defaults to 'free' / Starter) once `trial_ends_at` passes — never locked out.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '30 days');

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_plan_check;
ALTER TABLE public.companies
  ADD CONSTRAINT companies_plan_check CHECK (plan IN ('free', 'growth', 'crew'));

COMMENT ON COLUMN public.companies.plan
  IS 'Paid subscription tier: free (Starter) | growth ($49) | crew ($99). Effective access is the higher of this and the reverse-trial (Crew) while trial_ends_at is in the future.';
COMMENT ON COLUMN public.companies.trial_ends_at
  IS 'End of the 30-day reverse trial. Until this passes the workspace gets Crew-level access regardless of `plan`.';

-- Backfill: existing $99 "Pro" subscribers map to Crew; anchor every existing
-- workspace's trial window to its real signup date instead of the ADD COLUMN default.
UPDATE public.companies SET plan = 'crew' WHERE subscription_status = 'active';
UPDATE public.companies SET trial_ends_at = created_at + interval '30 days';

-- Extend the billing guard so non-admins cannot self-upgrade by writing `plan`
-- or extending their own `trial_ends_at` (keeps the existing freezes intact).
CREATE OR REPLACE FUNCTION public.prevent_company_billing_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.subscription_status := OLD.subscription_status;
    NEW.automated_jobs_count := OLD.automated_jobs_count;
    NEW.plan := OLD.plan;
    NEW.trial_ends_at := OLD.trial_ends_at;
  END IF;
  RETURN NEW;
END;
$$;
