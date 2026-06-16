import { useQuery } from "@tanstack/react-query";
import { fetchTeamMembers, type TeamMember } from "@/lib/fsm";

const SESSION_KEY = "van_actor_member_id";

/**
 * Resolves the "current user" for this browser tab. Placeholder for real auth:
 * each tab is randomly bound to one team member (persisted in sessionStorage),
 * so opening the app in two tabs simulates two different signed-in users — which
 * powers the multi-tech dispatch attribution and the edit-collision banner.
 */
export function useCurrentMember(): TeamMember | null {
  const { data: members = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: fetchTeamMembers,
  });

  if (members.length === 0) return null;

  const stored =
    typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : null;
  const existing = stored ? members.find((m) => m.id === stored) : null;
  if (existing) return existing;

  const picked = members[Math.floor(Math.random() * members.length)];
  if (typeof window !== "undefined") sessionStorage.setItem(SESSION_KEY, picked.id);
  return picked;
}
