import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { AdaptyPaywallProduct } from "@adapty/capacitor";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  isAdaptyAvailable,
  loadPaywall,
  purchaseProduct,
  restorePurchases,
} from "@/lib/adapty";

export const Route = createFileRoute("/upgrade")({
  head: () => ({
    meta: [
      { title: "Upgrade — Vantage" },
      {
        name: "description",
        content: "Upgrade your Vantage plan to unlock premium field service features.",
      },
      { property: "og:title", content: "Upgrade — Vantage" },
      {
        property: "og:description",
        content: "Unlock premium Vantage features with a subscription.",
      },
      { property: "og:url", content: "https://vantage-front-edge.lovable.app/upgrade" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-front-edge.lovable.app/upgrade" }],
  }),
  component: UpgradePage,
});

type DisplayTier = {
  id: string;
  title: string;
  price: string;
  description: string;
  features: string[];
  product?: AdaptyPaywallProduct;
};

const FALLBACK_TIERS: DisplayTier[] = [
  {
    id: "pro-monthly",
    title: "Vantage Pro",
    price: "$49 / mo",
    description: "For growing crews that want automation.",
    features: ["Unlimited jobs & estimates", "Van AI operator", "Radius marketing campaigns"],
  },
  {
    id: "pro-annual",
    title: "Vantage Pro (Annual)",
    price: "$490 / yr",
    description: "Two months free vs monthly billing.",
    features: ["Everything in Pro", "Priority support", "Advanced financial reports"],
  },
];

function UpgradePage() {
  const native = isAdaptyAvailable();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["adapty-paywall"],
    queryFn: loadPaywall,
    enabled: native,
  });

  const tiers: DisplayTier[] = native && data
    ? data.products.map((p) => ({
        id: p.adaptyId,
        title: p.localizedTitle,
        price: p.price?.localizedString ?? "",
        description: p.localizedDescription,
        features: [],
        product: p,
      }))
    : FALLBACK_TIERS;

  async function handlePurchase(tier: DisplayTier) {
    if (!native || !tier.product) {
      toast.info("Purchases are available in the installed iOS/Android app.");
      return;
    }
    setPurchasingId(tier.id);
    try {
      await purchaseProduct(tier.product);
      toast.success("Purchase successful!");
    } catch {
      toast.error("Purchase could not be completed.");
    } finally {
      setPurchasingId(null);
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
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-5 md:px-8 md:py-8">
      <PageHeader
        title="Upgrade"
        description="Unlock premium Vantage features with a subscription."
      />

      {!native && (
        <div className="mb-4 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
          You're viewing a preview of the subscription options. In-app purchases activate inside the
          installed iOS/Android app.
        </div>
      )}

      <div className="mt-2 flex-1">
        {native && isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : native && isError ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Could not load subscription options. Please try again later.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-revenue/10">
                  <Sparkles className="h-5 w-5 text-revenue" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{tier.title}</h3>
                <p className="mt-1 text-2xl font-bold text-foreground">{tier.price}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
                {tier.features.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-revenue" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  variant="revenue"
                  className="mt-4 w-full"
                  disabled={purchasingId === tier.id}
                  onClick={() => handlePurchase(tier)}
                >
                  {purchasingId === tier.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  Subscribe
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apple requirement: highly visible Restore Purchases button at the absolute bottom. */}
      <div className="mt-8 border-t border-border pt-5 text-center">
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
