/**
 * Server-only helpers for resolving a caller's workspace + effective plan.
 *
 * Pure logic — it operates on whatever Supabase client it's handed (the
 * user-scoped client from the auth middleware), so it holds no secrets and can
 * be imported by *.functions.ts handlers. Service-role access (for cross-row
 * counts like seats) is loaded separately, inside the individual handlers.
 */
import {
  entitlementErrorToThrow,
  featureState,
  requiredPlanFor,
  resolveEffectivePlan,
  type CompanyTier,
  type Plan,
  type PlanFeature,
} from "@/lib/entitlements";

type AnySupabase = { from: (t: string) => any };

export interface WorkspaceContext {
  companyId: string;
  tier: CompanyTier;
  effectivePlan: Plan;
}

/**
 * Resolve the caller's company id, billing tier, and effective plan from a
 * user-scoped Supabase client. Reads `profiles` (own row) → `companies` (own
 * company via the "Members read own company" RLS policy). No service role.
 */
export async function resolveWorkspace(
  supabase: AnySupabase,
  userId: string,
): Promise<WorkspaceContext> {
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) throw new Error("Could not load your workspace");

  const companyId = profile?.company_id as string | undefined;
  if (!companyId) throw new Error("No company found for this account");

  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("plan, subscription_status, trial_ends_at")
    .eq("id", companyId)
    .maybeSingle();
  if (companyErr) throw new Error("Could not load your subscription");

  const tier: CompanyTier = {
    plan: (company?.plan ?? "free") as Plan,
    subscription_status: company?.subscription_status ?? "free",
    trial_ends_at: company?.trial_ends_at ?? null,
  };

  return { companyId, tier, effectivePlan: resolveEffectivePlan(tier) };
}

/**
 * Guard a feature endpoint on the server. Throws a typed entitlement error the
 * UI can turn into a contextual prompt:
 *   - coming-soon feature → FEATURE_COMING_SOON
 *   - built but plan too low → FEATURE_LOCKED (with the plan that unlocks it)
 * Returns normally when the plan may use the feature.
 */
export function assertFeature(effectivePlan: Plan, feature: PlanFeature): void {
  const state = featureState(effectivePlan, feature);
  if (state === "available") return;
  if (state === "coming_soon") {
    throw entitlementErrorToThrow({ type: "FEATURE_COMING_SOON", feature });
  }
  throw entitlementErrorToThrow({
    type: "FEATURE_LOCKED",
    feature,
    plan: effectivePlan,
    requiredPlan: requiredPlanFor(feature),
  });
}
