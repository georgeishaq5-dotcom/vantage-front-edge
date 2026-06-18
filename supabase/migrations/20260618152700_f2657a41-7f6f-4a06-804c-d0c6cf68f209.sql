-- Trigger/utility SECURITY DEFINER functions should never be callable via the
-- exposed API. They run automatically as part of triggers, so revoking EXECUTE
-- from anon/public does not affect normal operation.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_company_change() FROM anon, public;