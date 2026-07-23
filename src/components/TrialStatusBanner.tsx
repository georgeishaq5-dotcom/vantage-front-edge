import { usePlan } from "@/hooks/usePlan";
import { UpgradeCallout } from "@/components/UpgradeCallout";
import { PLANS, type Plan } from "@/lib/entitlements";

/**
 * The reverse-trial → downgrade nudge.
 *
 * - Final ~7 days of the trial: a countdown framed as what the workspace will
 *   LOSE, referencing its actual usage (crew + active jobs).
 * - After the trial (dropped to Starter, unsubscribed): a concrete,
 *   behaviour-based prompt when current usage exceeds Starter's caps, e.g.
 *   "You added 3 crew members during your trial — Starter keeps 1."
 *
 * Nothing shows earlier in the trial or when comfortably within Starter limits.
 */
export function TrialStatusBanner({ className }: { className?: string }) {
  const { isTrial, trialDaysRemaining, subscribed, usage, usageLoading } = usePlan();

  if (usageLoading) return null;

  const seats = usage.seats.used;
  const jobs = usage.activeJobs.used;
  // If they'd exceed Starter, Crew (unlimited seats) may be the honest target.
  const requiredPlan: Plan = seats > PLANS.growth.limits.seats ? "crew" : "growth";

  if (isTrial) {
    if (trialDaysRemaining > 7) return null;
    return (
      <UpgradeCallout
        className={className}
        requiredPlan={requiredPlan}
        title={`Your Crew trial ends in ${trialDaysRemaining} day${
          trialDaysRemaining === 1 ? "" : "s"
        }`}
        description={`You're using ${seats} crew ${
          seats === 1 ? "seat" : "seats"
        } and have ${jobs} active ${
          jobs === 1 ? "job" : "jobs"
        }. When the trial ends you'll drop to Starter — 1 seat and 25 active jobs. Subscribe now to keep your team and unlimited jobs.`}
      />
    );
  }

  // Post-trial (or lapsed), no active subscription: only nudge when actually
  // over a Starter cap, with a usage-specific message.
  if (!subscribed) {
    const overSeats = !usage.seats.unlimited && seats > (usage.seats.limit ?? 0);
    const overJobs = !usage.activeJobs.unlimited && jobs > (usage.activeJobs.limit ?? 0);
    if (!overSeats && !overJobs) return null;

    const parts: string[] = [];
    if (overSeats) {
      parts.push(
        `You have ${seats} crew members but Starter keeps ${usage.seats.limit}`,
      );
    }
    if (overJobs) {
      parts.push(
        `you have ${jobs} active jobs but Starter allows ${usage.activeJobs.limit}`,
      );
    }
    return (
      <UpgradeCallout
        className={className}
        requiredPlan={requiredPlan}
        title="Upgrade to keep your team"
        description={`${parts.join(" and ")}. Upgrade to restore full access — your data is still here.`}
      />
    );
  }

  return null;
}
