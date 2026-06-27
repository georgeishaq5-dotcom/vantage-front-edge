/**
 * Three-plan entitlement model: Starter (free) → Growth ($49) → Crew ($99).
 *
 * Every workspace starts on a 30-day **reverse trial** with full Crew-level
 * access. When the trial ends the workspace falls back to its paid `plan`
 * (defaulting to free / Starter) — premium modules re-lock, but the user is
 * never locked out of the core product. See the companies table for the
 * `plan` / `trial_ends_at` columns this model reads.
 */

/** Subscription tiers, lowest to highest. */
export type Plan = "free" | "growth" | "crew";

/** Ordering used for "feature requires at least plan X" comparisons. */
export const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  growth: 1,
  crew: 2,
};

/** Length of the reverse trial granted to every new workspace. */
export const TRIAL_DAYS = 30;

/**
 * Free (Starter) hard caps. Growth and Crew lift these to unlimited — see
 * CUSTOMER_CAPS / ACTIVE_JOB_CAPS / CREW_SEAT_LIMITS below.
 */
export const FREE_CUSTOMER_CAP = 200;
export const FREE_ACTIVE_JOB_CAP = 25;

/** Crew seats included per plan (Infinity = unlimited). */
export const CREW_SEAT_LIMITS: Record<Plan, number> = {
  free: 1,
  growth: 5,
  crew: Infinity,
};

/** Customer storage cap per plan (Infinity = unlimited). */
export const CUSTOMER_CAPS: Record<Plan, number> = {
  free: FREE_CUSTOMER_CAP,
  growth: Infinity,
  crew: Infinity,
};

/** Active-job cap per plan (Infinity = unlimited). */
export const ACTIVE_JOB_CAPS: Record<Plan, number> = {
  free: FREE_ACTIVE_JOB_CAP,
  growth: Infinity,
  crew: Infinity,
};

/** Identifiers for every gated premium module. */
export type PremiumFeature =
  | "weather_marketing"
  | "route_density"
  | "voice_to_crm"
  | "photo_quoting"
  | "auto_collections"
  | "customer_storage"
  | "unlimited_jobs"
  | "tiered_quoting"
  | "stripe_payments"
  | "kanban_dispatch"
  | "direct_mail"
  | "roi_audit";

export const FEATURE_LABELS: Record<PremiumFeature, string> = {
  weather_marketing: "Weather-Triggered Marketing",
  route_density: "Route Density Geo-Fencing",
  voice_to_crm: "Dirty Hands Voice-to-CRM",
  photo_quoting: "AI Photo Quoting Engine",
  auto_collections: "Automated Collections",
  customer_storage: "Unlimited Customer Storage",
  unlimited_jobs: "Unlimited Active Jobs",
  tiered_quoting: "Good / Better / Best Quoting",
  stripe_payments: "Stripe Payments & Deposits",
  kanban_dispatch: "Visual Kanban Dispatch Board",
  direct_mail: "Automated Direct Mail Engine",
  roi_audit: "ROI Audit Dashboard",
};

/** Minimum plan required to use each premium feature. */
export const FEATURE_MIN_PLAN: Record<PremiumFeature, Plan> = {
  // Growth tier
  weather_marketing: "growth",
  route_density: "growth",
  voice_to_crm: "growth",
  photo_quoting: "growth",
  customer_storage: "growth",
  unlimited_jobs: "growth",
  tiered_quoting: "growth",
  stripe_payments: "growth",
  // Crew tier
  auto_collections: "crew",
  kanban_dispatch: "crew",
  direct_mail: "crew",
  roi_audit: "crew",
};

/** Marketing copy for each plan, used to render the upgrade paywall. */
export const PLAN_META: Record<
  Plan,
  { name: string; price: string; tagline: string; benefits: string[] }
> = {
  free: {
    name: "Starter",
    price: "Free",
    tagline: "Everything you need to try Vantage on real jobs.",
    benefits: [
      "Up to 25 active jobs",
      "Quoting & digital approval",
      "Basic dispatch calendar",
      "1 crew seat",
      "Up to 200 customers",
    ],
  },
  growth: {
    name: "Growth",
    price: "$49/month",
    tagline: "For a one-truck operation ready to book more work.",
    benefits: [
      "Everything in Starter, plus:",
      "Unlimited jobs & customers",
      "Weather-triggered & radius marketing",
      "Good / Better / Best tiered quoting",
      "Dirty Hands voice-to-CRM",
      "Stripe payments & deposits",
      "Up to 5 crew seats",
    ],
  },
  crew: {
    name: "Crew",
    price: "$99/month",
    tagline: "For growing teams running multiple crews at once.",
    benefits: [
      "Everything in Growth, plus:",
      "Unlimited crew seats",
      "ROI Audit & advanced financial reports",
      "Automated collections",
      "Automated direct mail engine",
      "Visual Kanban dispatch board",
      "Priority support",
    ],
  },
};

export type CompanyTier = {
  plan: Plan;
  subscription_status: string;
  /** ISO timestamp; null is treated as "no trial / already ended". */
  trial_ends_at: string | null;
};

/** True when the workspace has an active paid subscription. */
export function isSubscribed(tier: CompanyTier | null | undefined): boolean {
  return tier?.subscription_status === "active";
}

/** True while the 30-day reverse trial is still running. */
export function isInTrial(tier: CompanyTier | null | undefined): boolean {
  if (!tier?.trial_ends_at) return false;
  return new Date(tier.trial_ends_at).getTime() > Date.now();
}

/** Whole days left in the reverse trial (never negative). */
export function trialDaysRemaining(tier: CompanyTier | null | undefined): number {
  if (!tier?.trial_ends_at) return 0;
  const ms = new Date(tier.trial_ends_at).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

/**
 * The plan a workspace effectively has right now: the higher of its paid tier
 * (when subscribed) and the Crew-level reverse trial (while it lasts).
 */
export function resolveEffectivePlan(tier: CompanyTier | null | undefined): Plan {
  if (!tier) return "free";
  const paidRank = isSubscribed(tier) ? PLAN_RANK[tier.plan] : PLAN_RANK.free;
  const trialRank = isInTrial(tier) ? PLAN_RANK.crew : PLAN_RANK.free;
  const rank = Math.max(paidRank, trialRank);
  return (Object.keys(PLAN_RANK) as Plan[]).find((p) => PLAN_RANK[p] === rank) ?? "free";
}

/** True when `plan` is high enough to use `feature`. */
export function planAllows(plan: Plan, feature: PremiumFeature): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

/** The minimum plan a feature is sold under (drives the paywall copy). */
export function requiredPlanFor(feature: PremiumFeature | undefined): Plan {
  return feature ? FEATURE_MIN_PLAN[feature] : "crew";
}
