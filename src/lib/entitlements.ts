/**
 * Single source of truth for the three-plan model: Starter (free) → Growth
 * ($49) → Crew ($99).
 *
 * Every workspace starts on a 30-day **reverse trial** with full Crew-level
 * access. When the trial ends the workspace falls back to its paid `plan`
 * (defaulting to free / Starter) — premium modules re-lock, but the user is
 * never locked out of the core product.
 *
 * Nothing outside this module hard-codes plan rules. Gates read `can()`,
 * `limitFor()` and `resolveEffectivePlan()`; UI copy reads `PLANS` / `FEATURES`
 * / `PLAN_META`. There are no scattered `plan === "crew"` checks.
 */

/** Subscription tiers, lowest to highest. */
export type Plan = "free" | "growth" | "crew";

/** Plans in ascending order of capability. */
export const PLAN_ORDER: Plan[] = ["free", "growth", "crew"];

/** Ordering used for "requires at least plan X" comparisons. */
export const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  growth: 1,
  crew: 2,
};

/** Length of the reverse trial granted to every new workspace. */
export const TRIAL_DAYS = 30;

// ---------------------------------------------------------------------------
// Resource caps (the numeric limits — seats & active jobs)
// ---------------------------------------------------------------------------

/** Metered resources with a per-plan numeric cap. */
export type PlanResource = "seats" | "activeJobs";

export interface PlanDef {
  key: Plan;
  /** Display name shown in the UI (Starter / Growth / Crew). */
  name: string;
  /** Display price (e.g. "Free", "$49"). */
  price: string;
  /** Monthly price in dollars (0 for free), or null if not billable directly. */
  priceMonthly: number;
  tagline: string;
  /** Numeric caps. `Infinity` = unlimited. */
  limits: Record<PlanResource, number>;
}

/**
 * Per-plan caps, matching the decided entitlements matrix:
 *   seats:      Starter 1  · Growth 5  · Crew ∞
 *   activeJobs: Starter 25 · Growth ∞  · Crew ∞
 *
 * "Active jobs" = jobs whose status is open/scheduled (Quoted or Scheduled) —
 * NOT completed, paid, or archived. See ACTIVE_JOB_STATUSES.
 */
export const PLANS: Record<Plan, PlanDef> = {
  free: {
    key: "free",
    name: "Starter",
    price: "Free",
    priceMonthly: 0,
    tagline: "Everything you need to run Vantage on real jobs — free forever for a solo operator.",
    limits: { seats: 1, activeJobs: 25 },
  },
  growth: {
    key: "growth",
    name: "Growth",
    price: "$49",
    priceMonthly: 49,
    tagline: "For a one-truck operation ready to book more work and add its first crew.",
    limits: { seats: 5, activeJobs: Infinity },
  },
  crew: {
    key: "crew",
    name: "Crew",
    price: "$99",
    priceMonthly: 99,
    tagline: "For growing teams running multiple crews — unlimited seats, margins, and reporting.",
    limits: { seats: Infinity, activeJobs: Infinity },
  },
};

/**
 * Job statuses that count as "active" for the active-jobs cap. Mirrors the
 * `jobs.status` text column values (see src/lib/fsm.ts JobStatus). Completed
 * and Paid are terminal and do NOT count.
 */
export const ACTIVE_JOB_STATUSES = ["Quoted", "Scheduled"] as const;

/** The cap for a resource on a given plan (`Infinity` = unlimited). */
export function limitFor(plan: Plan, resource: PlanResource): number {
  return PLANS[plan].limits[resource];
}

/**
 * The next plan up that actually raises the cap on `resource` (for upgrade
 * prompts). Falls back to the highest plan.
 */
export function nextPlanForResource(plan: Plan, resource: PlanResource): Plan {
  const current = limitFor(plan, resource);
  for (const p of PLAN_ORDER) {
    if (PLAN_RANK[p] > PLAN_RANK[plan] && limitFor(p, resource) > current) return p;
  }
  return "crew";
}

// ---------------------------------------------------------------------------
// Gateable features
// ---------------------------------------------------------------------------

/** Identifiers for every plan-gated feature in the decided matrix. */
export type PlanFeature =
  | "card_payments"
  | "deposits_reminders"
  | "sms_reminders"
  | "online_booking"
  | "recurring_jobs"
  | "weather_outreach"
  | "radius_campaigns"
  | "financials"
  | "advanced_reports";

export interface FeatureDef {
  label: string;
  /** Minimum plan that includes the feature. */
  minPlan: Plan;
  /**
   * True when the feature is not actually built yet. Coming-soon features are
   * never "available" on any plan and are never advertised as available — the
   * UI renders a "coming soon" state instead of a broken lock.
   */
  comingSoon: boolean;
  blurb: string;
}

/**
 * The decided feature matrix. `comingSoon` reflects the Step-1 build audit:
 * only radius marketing campaigns are actually built today, so everything else
 * that isn't part of the free core loop is marked coming-soon and is never
 * gated as if it were live.
 */
export const FEATURES: Record<PlanFeature, FeatureDef> = {
  card_payments: {
    label: "Accept card payments",
    minPlan: "free",
    comingSoon: true,
    blurb: "Send an invoice and collect payment by card on any plan.",
  },
  deposits_reminders: {
    label: "Deposits & automated payment reminders",
    minPlan: "growth",
    comingSoon: true,
    blurb: "Collect deposits up front and let Vantage chase overdue invoices for you.",
  },
  sms_reminders: {
    label: "Automated & two-way SMS reminders",
    minPlan: "growth",
    comingSoon: true,
    blurb: "Automatic appointment reminders and two-way texting with customers.",
  },
  online_booking: {
    label: "Online booking & client self-serve",
    minPlan: "growth",
    comingSoon: true,
    blurb: "Let customers request and book jobs themselves from a public page.",
  },
  recurring_jobs: {
    label: "Recurring jobs & maintenance contracts",
    minPlan: "growth",
    comingSoon: true,
    blurb: "Set up repeating visits and maintenance contracts that schedule themselves.",
  },
  weather_outreach: {
    label: "Weather-triggered outreach",
    minPlan: "growth",
    comingSoon: true,
    blurb: "Reach out to customers automatically when the weather creates demand.",
  },
  radius_campaigns: {
    label: "Radius marketing campaigns",
    minPlan: "growth",
    comingSoon: false,
    blurb: "While your crew is on a job, win the whole street — scan a 5-mile radius and text nearby past customers.",
  },
  financials: {
    label: "Job costing & profitability",
    minPlan: "crew",
    comingSoon: true,
    blurb: "See true margin per job with labor, materials, and overhead costing.",
  },
  advanced_reports: {
    label: "Advanced reports",
    minPlan: "crew",
    comingSoon: true,
    blurb: "Deep operational and financial reporting across your whole business.",
  },
};

/** All feature keys (for iterating in UIs). */
export const ALL_FEATURES = Object.keys(FEATURES) as PlanFeature[];

export type FeatureState = "available" | "locked" | "coming_soon";

/**
 * Resolves how a feature presents for a plan:
 *  - "coming_soon" — not built yet (never available anywhere)
 *  - "available"   — built AND the plan includes it
 *  - "locked"      — built but the plan is too low (upsell)
 */
export function featureState(plan: Plan, feature: PlanFeature): FeatureState {
  const def = FEATURES[feature];
  if (def.comingSoon) return "coming_soon";
  return PLAN_RANK[plan] >= PLAN_RANK[def.minPlan] ? "available" : "locked";
}

/** True when `plan` may actually use `feature` right now. */
export function can(plan: Plan, feature: PlanFeature): boolean {
  return featureState(plan, feature) === "available";
}

/** The minimum plan a feature is sold under (drives paywall copy). */
export function requiredPlanFor(feature: PlanFeature | undefined): Plan {
  return feature ? FEATURES[feature].minPlan : "growth";
}

// ---------------------------------------------------------------------------
// Company tier + effective-plan resolution (reverse trial)
// ---------------------------------------------------------------------------

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
 * (when subscribed) and the Crew-level reverse trial (while it lasts). EVERY
 * gate — server, UI, and the Upgrade page's "current plan" — reads from this,
 * never from `companies.plan` directly.
 */
export function resolveEffectivePlan(tier: CompanyTier | null | undefined): Plan {
  if (!tier) return "free";
  const paidRank = isSubscribed(tier) ? PLAN_RANK[tier.plan] : PLAN_RANK.free;
  const trialRank = isInTrial(tier) ? PLAN_RANK.crew : PLAN_RANK.free;
  const rank = Math.max(paidRank, trialRank);
  return PLAN_ORDER.find((p) => PLAN_RANK[p] === rank) ?? "free";
}

// ---------------------------------------------------------------------------
// Typed entitlement errors (server → UI)
// ---------------------------------------------------------------------------
//
// Server functions that reject a mutation encode one of these into the thrown
// Error's message. The client parses it back with `parseEntitlementError` and
// renders a specific, contextual upgrade prompt — never a generic toast.

export interface LimitReachedError {
  type: "LIMIT_REACHED";
  /** Which cap was hit. */
  limit: PlanResource;
  /** The caller's current effective plan. */
  plan: Plan;
  /** The plan that raises this cap (target of the upgrade CTA). */
  requiredPlan: Plan;
  /** The cap value on the current plan. */
  limitValue: number;
  /** Usage at the time of rejection. */
  usage: number;
}

export interface FeatureLockedError {
  type: "FEATURE_LOCKED";
  feature: PlanFeature;
  plan: Plan;
  requiredPlan: Plan;
}

export interface FeatureComingSoonError {
  type: "FEATURE_COMING_SOON";
  feature: PlanFeature;
}

export type EntitlementError =
  | LimitReachedError
  | FeatureLockedError
  | FeatureComingSoonError;

const ENTITLEMENT_ERROR_PREFIX = "ENTITLEMENT::";

/** Serialise a typed entitlement error into an Error message string. */
export function encodeEntitlementError(err: EntitlementError): string {
  return ENTITLEMENT_ERROR_PREFIX + JSON.stringify(err);
}

/** Build a throwable Error carrying a typed entitlement payload. */
export function entitlementErrorToThrow(err: EntitlementError): Error {
  return new Error(encodeEntitlementError(err));
}

/**
 * Parse a typed entitlement error out of an Error message (or any string).
 * Returns null when the message isn't one of ours.
 */
export function parseEntitlementError(
  input: unknown,
): EntitlementError | null {
  const message =
    input instanceof Error
      ? input.message
      : typeof input === "string"
        ? input
        : null;
  if (!message) return null;
  const idx = message.indexOf(ENTITLEMENT_ERROR_PREFIX);
  if (idx < 0) return null;
  try {
    return JSON.parse(message.slice(idx + ENTITLEMENT_ERROR_PREFIX.length)) as EntitlementError;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Plan marketing copy (paywall / upgrade cards)
// ---------------------------------------------------------------------------
//
// Feature bullets that aren't built yet carry a "(coming soon)" suffix so a
// plan is described honestly without advertising un-built features as live.

export const PLAN_META: Record<
  Plan,
  { name: string; price: string; period: string; tagline: string; benefits: string[] }
> = {
  free: {
    name: "Starter",
    price: "Free",
    period: "Free forever for solo operators",
    tagline: "Everything you need to run Vantage on real jobs.",
    benefits: [
      "Up to 25 active jobs",
      "Quote → schedule → dispatch → track",
      "Send invoices & accept card payments",
      "1 crew seat",
    ],
  },
  growth: {
    name: "Growth",
    price: "$49/month",
    period: "Per month",
    tagline: "Book more work and add your first crew.",
    benefits: [
      "Everything in Starter, plus:",
      "Unlimited active jobs",
      "Up to 5 crew seats",
      "Radius marketing campaigns",
      "Deposits & automated payment reminders (coming soon)",
      "Automated & two-way SMS reminders (coming soon)",
      "Online booking & client self-serve (coming soon)",
      "Recurring jobs & maintenance contracts (coming soon)",
      "Weather-triggered outreach (coming soon)",
    ],
  },
  crew: {
    name: "Crew",
    price: "$99/month",
    period: "Per month",
    tagline: "Run multiple crews with margins and reporting.",
    benefits: [
      "Everything in Growth, plus:",
      "Unlimited crew seats",
      "Job costing & profitability (coming soon)",
      "Advanced reports (coming soon)",
      "Priority support",
    ],
  },
};
