import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useEntitlements } from "@/hooks/useEntitlements";
import { setCompanyPlan } from "@/lib/billing.functions";
import { PLAN_META, type Plan } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

const PLANS: Plan[] = ["free", "growth", "crew"];

type SwitchArgs = { plan: Plan; trial: "expire" | "reset" };

/**
 * Admin-only testing tool: flip the workspace plan directly (no payment).
 * Real upgrades go through Stripe Checkout via the paywall; this exists for
 * QA and manual operations. Hidden entirely for non-admins.
 *
 * Because the reverse trial grants Crew until it ends, picking a plan also
 * ends the trial so the *effective* plan actually changes. "Reset trial"
 * restores a fresh 30-day Crew trial.
 */
export function PlanSwitcherSection() {
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const { plan: effectivePlan, paidPlan, isTrial, trialDaysRemaining } = useEntitlements();
  const run = useServerFn(setCompanyPlan);

  const mutation = useMutation({
    mutationFn: ({ plan, trial }: SwitchArgs) => run({ data: { plan, trial } }),
    onSuccess: (_res, { plan, trial }) => {
      queryClient.invalidateQueries({ queryKey: ["company-tier"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-usage"] });
      toast.success(
        trial === "reset"
          ? "Started a fresh 30-day Crew trial"
          : `Plan set to ${PLAN_META[plan].name}`,
      );
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not change plan"),
  });

  if (!isAdmin) return null;

  return (
    <div className="rounded-xl border border-dashed border-amber-400/50 bg-amber-50/10 p-3 md:p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Plan (admin / testing)</h2>
          <p className="text-sm text-muted-foreground">
            Set this workspace's plan directly, bypassing Stripe. For QA and manual ops only.
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Current effective plan:{" "}
        <span className="font-semibold text-foreground">{PLAN_META[effectivePlan].name}</span>
        {isTrial ? (
          <span className="ml-1">
            · Crew trial, {trialDaysRemaining} day{trialDaysRemaining === 1 ? "" : "s"} left
            (falls back to {PLAN_META[paidPlan].name})
          </span>
        ) : (
          <span className="ml-1">· paid plan {PLAN_META[paidPlan].name}</span>
        )}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const active = !isTrial && plan === effectivePlan;
          return (
            <Button
              key={plan}
              variant={active ? "revenue" : "outline"}
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ plan, trial: "expire" })}
              className={cn("justify-between", active && "pointer-events-none")}
            >
              <span>
                {PLAN_META[plan].name}
                <span className="ml-1 text-xs opacity-70">{PLAN_META[plan].price}</span>
              </span>
              {active && <Check className="h-4 w-4" />}
            </Button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Picking a plan ends the trial so the change takes effect immediately.
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ plan: "free", trial: "reset" })}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset 30-day Crew trial
        </Button>
      </div>
    </div>
  );
}
