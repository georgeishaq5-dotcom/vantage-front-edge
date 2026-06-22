/**
 * "Profit-First" trial + Pro-tier entitlement model.
 *
 * Every workspace (company) gets full Pro access for its first 3 automated
 * jobs. After that the Pro modules are locked behind an active subscription.
 */

/** Number of automated jobs included in the free trial. */
export const FREE_TRIAL_AUTOMATED_JOBS = 3;

/** Free-tier hard caps. */
export const FREE_PHOTO_QUOTE_CAP = 3;
export const FREE_CUSTOMER_CAP = 200;

/** Pro plan pricing shown on the paywall. */
export const PRO_PLAN_PRICE = "$99/month";
export const PRO_PLAN_NAME = "Pro Operator";

/** Identifiers for every gated premium module. */
export type PremiumFeature =
  | "weather_marketing"
  | "route_density"
  | "voice_to_crm"
  | "photo_quoting"
  | "auto_collections"
  | "customer_storage"
  | "tiered_quoting"
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
  tiered_quoting: "Good / Better / Best Quoting",
  kanban_dispatch: "Visual Kanban Dispatch Board",
  direct_mail: "Automated Direct Mail Engine",
  roi_audit: "ROI Audit Dashboard",
};

/** Marketing bullets shown on the upgrade paywall. */
export const PRO_BENEFITS: string[] = [
  "Unlimited customers, jobs & estimate photos",
  "Weather-triggered marketing automations",
  "Dirty Hands voice-to-CRM parsing",
  "Good / Better / Best tiered quoting engine",
  "ROI Audit dashboard & financial tracking",
  "Automated direct mail & collections engine",
];

export type CompanyTier = {
  automated_jobs_count: number;
  subscription_status: string;
};

/** True when the workspace has an active paid subscription. */
export function isSubscribed(tier: CompanyTier | null | undefined): boolean {
  return tier?.subscription_status === "active";
}

/** True when the workspace still has Pro access (trial remaining or subscribed). */
export function hasProAccess(tier: CompanyTier | null | undefined): boolean {
  if (!tier) return false;
  if (isSubscribed(tier)) return true;
  return tier.automated_jobs_count <= FREE_TRIAL_AUTOMATED_JOBS;
}

/** Remaining free-trial automated jobs (never negative). */
export function trialJobsRemaining(tier: CompanyTier | null | undefined): number {
  if (!tier || isSubscribed(tier)) return 0;
  return Math.max(0, FREE_TRIAL_AUTOMATED_JOBS - tier.automated_jobs_count);
}
