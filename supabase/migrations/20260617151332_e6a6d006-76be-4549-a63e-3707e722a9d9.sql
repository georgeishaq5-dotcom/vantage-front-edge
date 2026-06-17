-- Trigger-only functions: never call directly, revoke from everyone but owner/service_role
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Helper functions used inside RLS policies: must stay callable by authenticated, but never anon
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_assigned_to_job(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_assigned_to_job(uuid) TO authenticated;