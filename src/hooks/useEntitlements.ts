import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import {
  hasProAccess,
  isSubscribed,
  trialJobsRemaining,
  type CompanyTier,
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
    .select("automated_jobs_count, subscription_status")
    .eq("id", companyId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    automated_jobs_count: data.automated_jobs_count ?? 0,
    subscription_status: data.subscription_status ?? "free",
  };
}

/**
 * Central hook for the "Profit-First" entitlement model. Exposes whether the
 * current workspace still has Pro access (trial remaining or active sub).
 */
export function useEntitlements() {
  const query = useQuery({
    queryKey: ["company-tier"],
    queryFn: fetchCompanyTier,
    staleTime: 30_000,
  });

  const tier = query.data ?? null;

  return {
    tier,
    isLoading: query.isLoading,
    pro: hasProAccess(tier),
    subscribed: isSubscribed(tier),
    trialRemaining: trialJobsRemaining(tier),
  };
}
