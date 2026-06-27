import process from "node:process";

import type { Plan } from "@/lib/entitlements";

// Server-only Stripe config. The .server.ts suffix keeps these reads out of the
// client bundle. Env binds per-request on some runtimes, so read inside the
// function (never at module scope). See src/lib/config.server.ts for the rationale.

/** Paid plans that map to a Stripe Price. Starter (free) has no price. */
export type PaidPlan = Exclude<Plan, "free">;

export function getStripeConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    /** Stripe Price IDs per paid plan. Configure these in env. */
    prices: {
      growth: process.env.STRIPE_PRICE_GROWTH,
      crew: process.env.STRIPE_PRICE_CREW,
    } as Record<PaidPlan, string | undefined>,
  };
}

/** The Stripe Price ID a paid plan checks out against (undefined if unconfigured). */
export function priceIdForPlan(plan: PaidPlan): string | undefined {
  return getStripeConfig().prices[plan];
}

/** Reverse lookup: which plan a Stripe Price ID belongs to (null if unknown). */
export function planForPriceId(priceId: string | null | undefined): PaidPlan | null {
  if (!priceId) return null;
  const { prices } = getStripeConfig();
  return (Object.keys(prices) as PaidPlan[]).find((p) => prices[p] === priceId) ?? null;
}
