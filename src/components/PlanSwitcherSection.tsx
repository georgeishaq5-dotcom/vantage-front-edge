import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useEntitlements } from "@/hooks/useEntitlements";
import { setCompanyPlan } from "@/lib/billing.functions";
import { PLAN_META, type Plan } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

const PLANS: Plan[] = ["free", "growth", "crew"];

/**
 * Admin-only testing tool: flip the workspace plan directly (no payment).
 * Real upgrades go through Stripe Checkout via the paywall; this exists for
 * QA and manual operations. Hidden entirely for non-admins.
 */
export function PlanSwitcherSection() {
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const { plan: currentPlan, isTrial, trialDaysRemaining } = useEntitlements();
  const run = useServerFn(setCompanyPlan);

  const mutation = useMutation({
    mutationFn: (plan: Plan) => run({ data: { plan } }),
    onSuccess: (_res, plan) => {
      queryClient.invalidateQueries({ queryKey: ["company-tier"] });
      toast.success(`Plan set to ${PLAN_META[plan].name}`);
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
        <span className="font-semibold text-foreground">{PLAN_META[currentPlan].name}</span>
        {isTrial && (
          <span className="ml-1">
            · trial ends in {trialDaysRemaining} day{trialDaysRemaining === 1 ? "" : "s"}
          </span>
        )}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const active = plan === currentPlan;
          return (
            <Button
              key={plan}
              variant={active ? "revenue" : "outline"}
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(plan)}
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
    </div>
  );
}
