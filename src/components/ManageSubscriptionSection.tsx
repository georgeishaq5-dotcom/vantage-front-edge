import { CreditCard, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Stripe Customer Portal URL. Set VITE_STRIPE_PORTAL_URL to your live portal
 * link (Billing → Customer portal in the Stripe dashboard). Falls back to the
 * generic Stripe-hosted login portal so the button always resolves.
 */
const PORTAL_URL =
  import.meta.env.VITE_STRIPE_PORTAL_URL ?? "https://billing.stripe.com/p/login";

/**
 * One-click subscription management. Links directly to the Stripe Customer
 * Portal so operators can update payment methods, pause, or cancel their plan
 * without contacting support — satisfying FTC "click-to-cancel" requirements.
 */
export function ManageSubscriptionSection() {
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
          Your subscription is billed at <span className="font-medium text-foreground">$99.00 / month</span> and
          auto-renews. Cancel any time — no need to contact support.
        </p>
        <Button asChild variant="revenue" className="shrink-0">
          <a href={PORTAL_URL} target="_blank" rel="noopener noreferrer">
            Manage Subscription
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
