import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import {
  ACTIVE_JOB_CAPS,
  CREW_SEAT_LIMITS,
  CUSTOMER_CAPS,
  isInTrial,
  isSubscribed,
  planAllows,
  resolveEffectivePlan,
  trialDaysRemaining,
  type CompanyTier,
  type Plan,
  type PremiumFeature,
} from "@/lib/entitlements";

const db = supabase as unknown as { from: (t: string) => any };

async function fetchCompanyTier(): Promise<CompanyTier | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;

  const { data: profile } = await db
    .from("profiles")
    .select("company_id")
    .eq("id", uid)
    .maybeSingle();
  const companyId = profile?.company_id;
  if (!companyId) return null;

  const { data, error } = await db
    .from("companies")
    .select("plan, subscription_status, trial_ends_at")
    .eq("id", companyId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    plan: (data.plan ?? "free") as Plan,
    subscription_status: data.subscription_status ?? "free",
    trial_ends_at: data.trial_ends_at ?? null,
  };
}

/**
 * Central hook for the three-plan entitlement model. Exposes the workspace's
 * *effective* plan (the higher of its paid tier and the Crew-level reverse
 * trial) along with the per-plan caps and a feature-access helper.
 */
export function useEntitlements() {
  const query = useQuery({
    queryKey: ["company-tier"],
    queryFn: fetchCompanyTier,
    staleTime: 30_000,
  });

  const tier = query.data ?? null;
  const plan = resolveEffectivePlan(tier);

  return {
    tier,
    isLoading: query.isLoading,
    /** Effective plan right now (accounts for the reverse trial). */
    plan,
    subscribed: isSubscribed(tier),
    isTrial: isInTrial(tier),
    trialDaysRemaining: trialDaysRemaining(tier),
    /** True when the current plan may use the given premium feature. */
    canUseFeature: (feature: PremiumFeature) => planAllows(plan, feature),
    /** Crew seats included on the current plan (Infinity = unlimited). */
    seatLimit: CREW_SEAT_LIMITS[plan],
    /** Customer storage cap on the current plan (Infinity = unlimited). */
    customerCap: CUSTOMER_CAPS[plan],
    /** Active-job cap on the current plan (Infinity = unlimited). */
    activeJobCap: ACTIVE_JOB_CAPS[plan],
  };
}
