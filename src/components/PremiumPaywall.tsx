import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Sparkles, X, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  FEATURE_LABELS,
  PRO_BENEFITS,
  PRO_PLAN_NAME,
  PRO_PLAN_PRICE,
  type PremiumFeature,
} from "@/lib/entitlements";
import {
  isAdaptyAvailable,
  loadPaywall,
  purchaseProduct,
  restorePurchases,
} from "@/lib/adapty";

type PremiumPaywallProps = {
  /** Which locked feature triggered the paywall (tailors the headline). */
  feature?: PremiumFeature;
  /** When provided, renders a close button (modal usage). */
  onClose?: () => void;
};

/**
 * The "Unlock Your Autonomous Digital Employee" upgrade screen. Reused both as
 * the standalone /upgrade route and inside the feature-gate modal.
 */
export function PremiumPaywall({ feature, onClose }: PremiumPaywallProps) {
  const native = isAdaptyAvailable();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [consented, setConsented] = useState(false);

  const { data } = useQuery({
    queryKey: ["adapty-paywall"],
    queryFn: loadPaywall,
    enabled: native,
  });

  const firstProduct = data?.products?.[0];

  async function handleSubscribe() {
    if (!native || !firstProduct) {
      toast.info("Subscriptions activate inside the installed iOS/Android app.");
      return;
    }
    setPurchasing(true);
    try {
      await purchaseProduct(firstProduct);
      toast.success("Welcome to Pro! Your subscription is active.");
      onClose?.();
    } catch {
      toast.error("Purchase could not be completed.");
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    if (!native) {
      toast.info("Restore is available in the installed iOS/Android app.");
      return;
    }
    setRestoring(true);
    try {
      await restorePurchases();
      toast.success("Purchases restored.");
    } catch {
      toast.error("Nothing to restore or restore failed.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
      {onClose && (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Animated gradient hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand via-revenue to-brand px-6 py-10 text-center">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 animate-pulse rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 animate-pulse rounded-full bg-white/10 blur-3xl [animation-delay:700ms]" />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          {PRO_PLAN_NAME} · {PRO_PLAN_PRICE}
        </span>
        <h2 className="relative mt-4 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
          Unlock Your Autonomous
          <br />
          Digital Employee
        </h2>
        {feature && (
          <p className="relative mt-3 text-sm font-medium text-white/90">
            {FEATURE_LABELS[feature]} is a Pro feature. Upgrade to keep your
            operation running on autopilot.
          </p>
        )}
      </div>

      {/* Benefits */}
      <div className="px-6 py-6">
        <ul className="space-y-3">
          {PRO_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-sm text-foreground">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-revenue/15 text-revenue">
                <Check className="h-3.5 w-3.5" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        {/* Auto-renewal disclosure */}
        <div className="mt-7 rounded-lg border border-amber-200/40 bg-amber-50/10 px-4 py-3 text-xs leading-relaxed text-foreground/80">
          <p className="font-semibold text-foreground">Subscription Terms</p>
          <p className="mt-1">
            You are subscribing to <span className="font-medium">Vantage {PRO_PLAN_NAME}</span> at{" "}
            <span className="font-medium">$99.00/month</span>. Your subscription renews
            automatically each month until you cancel. To cancel at any time, go to{" "}
            <span className="font-medium">Settings → Manage Subscription</span> — no need to
            contact support.
          </p>
        </div>

        {/* Explicit consent checkbox */}
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-xs text-foreground/80">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-revenue"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
          />
          <span>
            I understand this subscription auto-renews at <span className="font-medium">$99.00/month</span> until
            I cancel.
          </span>
        </label>

        <Button
          variant="revenue"
          className="mt-3 h-12 w-full text-base font-bold"
          disabled={purchasing || !consented}
          onClick={handleSubscribe}
        >
          {purchasing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Zap className="h-5 w-5" />
          )}
          Subscribe Now — {PRO_PLAN_PRICE}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Cancel anytime. Billed through your app store account.
        </p>
      </div>

      {/* Apple requirement: Restore Purchases at the absolute bottom. */}
      <div className="mt-auto border-t border-border px-6 py-4 text-center">
        <button
          type="button"
          onClick={handleRestore}
          disabled={restoring}
          className="text-sm font-semibold text-brand underline underline-offset-4 transition-colors hover:text-brand/80 disabled:opacity-60"
        >
          {restoring ? "Restoring…" : "Restore Purchases"}
        </button>
      </div>
    </div>
  );
}
