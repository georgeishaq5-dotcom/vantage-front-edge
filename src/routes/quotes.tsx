import { createFileRoute } from "@tanstack/react-router";
import { Check, Star, Shield, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/fsm";

export const Route = createFileRoute("/quotes")({
  head: () => ({
    meta: [
      { title: "Your Quote — Vantage FSM" },
      {
        name: "description",
        content:
          "A clear three-tier service quote — Good, Better, and Best — so you can choose the option that fits your home and budget.",
      },
      { property: "og:title", content: "Your Quote — Vantage FSM" },
      {
        property: "og:description",
        content: "Compare Good, Better, and Best service packages side by side.",
      },
    ],
  }),
  component: QuotesPage,
});

interface Tier {
  key: "good" | "better" | "best";
  name: string;
  tagline: string;
  price: number;
  icon: typeof Shield;
  features: string[];
  recommended?: boolean;
}

const TIERS: Tier[] = [
  {
    key: "good",
    name: "Good",
    tagline: "Basic Service",
    price: 480,
    icon: Shield,
    features: [
      "Core repair & labor",
      "Standard-grade parts",
      "30-day workmanship warranty",
      "Single technician visit",
    ],
  },
  {
    key: "better",
    name: "Better",
    tagline: "Recommended",
    price: 740,
    icon: Star,
    recommended: true,
    features: [
      "Everything in Good",
      "Premium-grade parts",
      "1-year workmanship warranty",
      "Full system safety inspection",
      "Priority scheduling",
    ],
  },
  {
    key: "best",
    name: "Best",
    tagline: "Premium",
    price: 1120,
    icon: Sparkles,
    features: [
      "Everything in Better",
      "Top-tier parts & components",
      "3-year workmanship warranty",
      "Annual maintenance plan included",
      "24/7 emergency support",
      "Satisfaction guarantee",
    ],
  },
];

function QuotesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader
        title="Your Service Quote"
        description="Choose the package that's right for you. Every option is backed by our workmanship guarantee."
      />

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          return (
            <div
              key={tier.key}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all",
                tier.recommended
                  ? "border-revenue ring-2 ring-revenue/30 md:-mt-3 md:mb-3 shadow-md"
                  : "border-border",
              )}
            >
              {tier.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-revenue px-3 py-1 text-xs font-semibold text-revenue-foreground shadow">
                  Recommended
                </span>
              )}

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    tier.recommended
                      ? "bg-revenue-muted text-revenue"
                      : "bg-secondary text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {tier.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <span
                  className={cn(
                    "text-4xl font-extrabold tracking-tight",
                    tier.recommended ? "text-revenue" : "text-foreground",
                  )}
                >
                  {formatCurrency(tier.price)}
                </span>
                <span className="ml-1 text-sm text-muted-foreground">one-time</span>
              </div>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        tier.recommended ? "text-revenue" : "text-muted-foreground",
                      )}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6 w-full"
                variant={tier.recommended ? "default" : "outline"}
              >
                Approve {tier.name}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Prices include parts, labor, and applicable warranty. Final invoice may vary based on
        on-site conditions.
      </p>
    </div>
  );
}
