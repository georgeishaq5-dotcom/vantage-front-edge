-- Allow the Stripe webhook (which writes via the service-role key) to update
-- billing columns. The billing guard freezes plan / subscription_status /
-- trial_ends_at for ordinary authenticated users, but service-role callers
-- have no auth.uid() so the previous admin-only check would silently revert
-- their writes. `auth.role()` reads the JWT role claim and stays correct even
-- inside this SECURITY DEFINER function, so it's the reliable bypass test.

CREATE OR REPLACE FUNCTION public.prevent_company_billing_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.subscription_status := OLD.subscription_status;
    NEW.automated_jobs_count := OLD.automated_jobs_count;
    NEW.plan := OLD.plan;
    NEW.trial_ends_at := OLD.trial_ends_at;
  END IF;
  RETURN NEW;
END;
$$;
