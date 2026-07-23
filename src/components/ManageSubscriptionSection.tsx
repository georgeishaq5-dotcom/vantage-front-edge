import { useState } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PLAN_META } from "@/lib/entitlements";

const PORTAL_FALLBACK = "https://billing.stripe.com/p/login";

export function ManageSubscriptionSection() {
  const [loading, setLoading] = useState(false);
  const { plan, paidPlan, subscribed, isTrial, trialDaysRemaining } = useEntitlements();

  async function handleManage() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      const url = res.ok ? (await res.json() as { url: string }).url : PORTAL_FALLBACK;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(PORTAL_FALLBACK, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 md:p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Manage Subscription</h2>
          <p className="text-sm text-muted-foreground">
            Update your payment method, pause, or cancel your plan at any time.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {isTrial ? (
            <>
              You're on a{" "}
              <span className="font-medium text-foreground">Crew trial</span> —{" "}
              {trialDaysRemaining} day{trialDaysRemaining === 1 ? "" : "s"} left. It falls back
              to the <span className="font-medium text-foreground">{PLAN_META[paidPlan].name}</span>{" "}
              plan when the trial ends.
            </>
          ) : subscribed ? (
            <>
              You're on the{" "}
              <span className="font-medium text-foreground">{PLAN_META[plan].name}</span> plan,
              billed at{" "}
              <span className="font-medium text-foreground">{PLAN_META[plan].price}</span> and
              auto-renews. Cancel any time — no need to contact support.
            </>
          ) : (
            <>
              You're on the{" "}
              <span className="font-medium text-foreground">{PLAN_META[plan].name}</span> (free)
              plan. Upgrade any time from the Upgrade page.
            </>
          )}
        </p>
        <Button
          variant="revenue"
          className="shrink-0"
          disabled={loading}
          onClick={handleManage}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4" />
          )}
          Manage Subscription
        </Button>
      </div>
    </div>
  );
}
