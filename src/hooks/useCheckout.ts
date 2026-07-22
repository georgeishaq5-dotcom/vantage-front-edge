import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { type Plan } from "@/lib/entitlements";

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

/**
 * Starts Stripe Checkout for the given plan. Shared by every upgrade CTA
 * (paywall, contextual callouts, the Upgrade page) so there is one checkout
 * path. The client never sets `plan` directly — the webhook does on success.
 */
export function useCheckout() {
  const [busyPlan, setBusyPlan] = useState<Plan | null>(null);

  async function startCheckout(plan: Plan) {
    setBusyPlan(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch {
      toast.error("Could not start checkout. Please try again.");
      setBusyPlan(null);
    }
  }

  return { startCheckout, busyPlan, isBusy: busyPlan !== null };
}
