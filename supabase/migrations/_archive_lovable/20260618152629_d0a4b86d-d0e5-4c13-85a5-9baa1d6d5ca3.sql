-- 1. Remove unrestricted company creation (privilege escalation vector).
-- Companies are provisioned automatically via the handle_new_user trigger
-- (SECURITY DEFINER), so no client-side INSERT policy is required.
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

-- 2. Prevent users from reassigning their own profile to a different company.
-- Allows the initial null -> value assignment (new signups) and admin changes,
-- but blocks switching an existing company_id to another company's UUID.
CREATE OR REPLACE FUNCTION public.prevent_profile_company_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.company_id IS NOT NULL
     AND NEW.company_id IS DISTINCT FROM OLD.company_id
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.company_id := OLD.company_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_company_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_company_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_company_change();

-- 3. Restrict SECURITY DEFINER helper functions so anonymous (unauthenticated)
-- callers cannot execute them via the exposed API. Keep access for authenticated
-- users and the service role.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_manage() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_company_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_assigned_to_job(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_assigned_to_job(uuid) TO authenticated, service_role;