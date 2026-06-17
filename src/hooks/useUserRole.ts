import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "dispatcher" | "field_tech";

/** Fetches the roles assigned to the currently signed-in user. */
export function useUserRoles() {
  return useQuery({
    queryKey: ["user_roles", "me"],
    queryFn: async (): Promise<AppRole[]> => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
}

export function useIsAdmin(): boolean {
  const { data: roles = [] } = useUserRoles();
  return roles.includes("admin");
}
