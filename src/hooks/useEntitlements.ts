import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import {
  can,
  featureState,
  isInTrial,
  isSubscribed,
  limitFor,
  resolveEffectivePlan,
  trialDaysRemaining,
  type CompanyTier,
  type Plan,
  type PlanFeature,
  type PlanResource,
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
 * trial) plus the config-driven feature/limit helpers. Reads only the billing
 * tier; usage counts (seats/active jobs) live in {@link usePlan}.
 */
export function useEntitlements() {
  const query = useQuery({
    queryKey: ["company-tier"],
    queryFn: fetchCompanyTier,
    staleTime: 30_000,
  });

  const tier = query.data ?? null;
  /** Effective plan right now (accounts for the reverse trial). */
  const plan = resolveEffectivePlan(tier);
  /** The paid tier the workspace falls back to when the trial ends. */
  const paidPlan: Plan = isSubscribed(tier) ? (tier?.plan ?? "free") : "free";

  return {
    tier,
    isLoading: query.isLoading,
    plan,
    paidPlan,
    subscribed: isSubscribed(tier),
    isTrial: isInTrial(tier),
    trialDaysRemaining: trialDaysRemaining(tier),
    /** True when the effective plan may actually use the feature. */
    can: (feature: PlanFeature) => can(plan, feature),
    /** "available" | "locked" | "coming_soon" for the effective plan. */
    featureState: (feature: PlanFeature) => featureState(plan, feature),
    /** Numeric cap for a resource on the effective plan (Infinity = unlimited). */
    limit: (resource: PlanResource) => limitFor(plan, resource),
    /** @deprecated use {@link can}. Retained for back-compat. */
    canUseFeature: (feature: PlanFeature) => can(plan, feature),
    /** Crew seats included on the effective plan (Infinity = unlimited). */
    seatLimit: limitFor(plan, "seats"),
    /** Active-job cap on the effective plan (Infinity = unlimited). */
    activeJobCap: limitFor(plan, "activeJobs"),
  };
}
