import { ArrowRight, Loader2, Lock, Sparkles } from "lucide-react";

import { useCheckout } from "@/hooks/useCheckout";
import {
  PLANS,
  type LimitReachedError,
  type Plan,
  type PlanFeature,
  FEATURES,
} from "@/lib/entitlements";

/**
 * A compact, contextual upgrade card shown at the exact blocked action (not a
 * generic banner elsewhere). Reused for both resource caps (seats/active jobs)
 * and locked features. The CTA goes straight to Stripe Checkout for the plan
 * that unlocks the action.
 */
export function UpgradeCallout({
  title,
  description,
  requiredPlan,
  className,
}: {
  title: string;
  description: string;
  requiredPlan: Plan;
  className?: string;
}) {
  const { startCheckout, busyPlan } = useCheckout();
  const plan = PLANS[requiredPlan];

  return (
    <div
      className={`rounded-xl border border-revenue/40 bg-revenue/10 p-4 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-revenue text-revenue-foreground">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          <button
            type="button"
            onClick={() => startCheckout(requiredPlan)}
            disabled={busyPlan !== null}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-revenue px-3 py-1.5 text-xs font-bold text-revenue-foreground transition-[filter] hover:brightness-[1.06] disabled:opacity-60"
          >
            {busyPlan === requiredPlan ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            Upgrade to {plan.name} — {plan.price}
            {plan.priceMonthly ? "/mo" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Human copy for a resource cap being hit. */
export function limitReachedCopy(err: LimitReachedError): {
  title: string;
  description: string;
} {
  const target = PLANS[err.requiredPlan];
  const targetSeats = target.limits.seats;
  const seatsText = Number.isFinite(targetSeats) ? `up to ${targetSeats} crew` : "unlimited crew";

  if (err.limit === "seats") {
    return {
      title: "You've reached your crew limit",
      description: `Your plan includes ${err.limitValue} crew ${
        err.limitValue === 1 ? "seat" : "seats"
      }. ${target.name} includes ${seatsText} — upgrade to add your team.`,
    };
  }
  return {
    title: "You've reached your active-job limit",
    description: `Your plan caps you at ${err.limitValue} active jobs. ${target.name} includes unlimited jobs — upgrade to keep booking work.`,
  };
}

/** A contextual callout driven directly by a typed LIMIT_REACHED error. */
export function LimitReachedCallout({
  error,
  className,
}: {
  error: LimitReachedError;
  className?: string;
}) {
  const copy = limitReachedCopy(error);
  return (
    <UpgradeCallout
      title={copy.title}
      description={copy.description}
      requiredPlan={error.requiredPlan}
      className={className}
    />
  );
}

/** A callout for a locked (built-but-gated) feature. */
export function FeatureLockedCallout({
  feature,
  requiredPlan,
  className,
}: {
  feature: PlanFeature;
  requiredPlan: Plan;
  className?: string;
}) {
  return (
    <UpgradeCallout
      title={`${FEATURES[feature].label} is a ${PLANS[requiredPlan].name} feature`}
      description={FEATURES[feature].blurb}
      requiredPlan={requiredPlan}
      className={className}
    />
  );
}

/** A neutral "coming soon" notice (never a broken lock). */
export function ComingSoonNotice({
  feature,
  className,
}: {
  feature: PlanFeature;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-muted/40 p-4 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Lock className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">
            {FEATURES[feature].label}{" "}
            <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
              Coming soon
            </span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {FEATURES[feature].blurb} We're building this — it isn't available yet.
          </p>
        </div>
      </div>
    </div>
  );
}
