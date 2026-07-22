import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { useEntitlements } from "@/hooks/useEntitlements";
import { fetchWorkspaceUsage } from "@/lib/workspace.functions";
import { type Plan } from "@/lib/entitlements";

export interface ResourceUsage {
  used: number;
  /** null = unlimited. */
  limit: number | null;
  /** Fraction 0..1 of the cap in use (0 when unlimited). */
  ratio: number;
  /** True when usage is at/over the cap. */
  atLimit: boolean;
  /** True from ~80% of the cap up to the limit. */
  nearLimit: boolean;
  /** null when unlimited. */
  unlimited: boolean;
}

function toUsage(used: number, limit: number | null): ResourceUsage {
  if (limit === null || !Number.isFinite(limit)) {
    return { used, limit: null, ratio: 0, atLimit: false, nearLimit: false, unlimited: true };
  }
  const ratio = limit === 0 ? 1 : used / limit;
  return {
    used,
    limit,
    ratio,
    atLimit: used >= limit,
    nearLimit: ratio >= 0.8,
    unlimited: false,
  };
}

/**
 * The upgrade-driving plan hook: everything from {@link useEntitlements} plus
 * authoritative live usage for the two metered resources (seats, active jobs),
 * loaded from the server so the meters can't be spoofed or fall out of sync.
 */
export function usePlan() {
  const entitlements = useEntitlements();
  const getUsage = useServerFn(fetchWorkspaceUsage);

  const usageQuery = useQuery({
    queryKey: ["workspace-usage"],
    queryFn: () => getUsage(),
    staleTime: 15_000,
  });

  const data = usageQuery.data;
  const seats = toUsage(data?.seats.used ?? 0, data?.seats.limit ?? null);
  const activeJobs = toUsage(data?.activeJobs.used ?? 0, data?.activeJobs.limit ?? null);

  return {
    ...entitlements,
    /** Effective plan (re-exported for clarity). */
    effectivePlan: entitlements.plan as Plan,
    usage: { seats, activeJobs },
    usageLoading: usageQuery.isLoading,
    refetchUsage: usageQuery.refetch,
  };
}
