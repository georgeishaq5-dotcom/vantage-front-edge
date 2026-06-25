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
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_company_billing_change ON public.companies;
CREATE TRIGGER prevent_company_billing_change
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_company_billing_change();