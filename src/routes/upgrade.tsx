import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PLAN_META, PLAN_RANK, type Plan } from "@/lib/entitlements";

export const Route = createFileRoute("/upgrade")({
  head: () => ({
    meta: [
      { title: "Upgrade — Vantage FSM" },
      {
        name: "description",
        content:
          "Compare the Starter, Growth, and Crew plans and pick the one that fits your crew.",
      },
      { property: "og:title", content: "Upgrade — Vantage FSM" },
      {
        property: "og:description",
        content: "Compare Vantage plans — Starter, Growth, and Crew — and upgrade in a click.",
      },
      { property: "og:url", content: "https://vantage-front-edge.lovable.app/upgrade" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-front-edge.lovable.app/upgrade" }],
  }),
  component: UpgradePage,
});

type PlanCardData = {
  key: Plan;
  name: string;
  price: string;
  period: string;
  tagline: string;
  benefits: string[];
  popular?: boolean;
};

// Copy tracks the canonical App UI.dc.html Upgrade frame; prices/tiers stay in
// sync with src/lib/entitlements.ts (Starter free / Growth $49 / Crew $99).
const PLANS: PlanCardData[] = [
  {
    key: "free",
    name: "Starter",
    price: "Free",
    period: "For your first 30 days",
    tagline: "Run Vantage on real jobs before you pay a cent.",
    benefits: [
      "Up to 25 active jobs",
      "Quoting & digital approval",
      "Basic dispatch calendar",
      "1 crew member",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    price: "$49",
    period: "Per month",
    tagline: "Vantage books more work for your one-truck operation.",
    benefits: [
      "Unlimited active jobs",
      "Weather-triggered outreach",
      "Radius marketing campaigns",
      "Stripe payments & deposits",
      "Up to 5 crew members",
    ],
    popular: true,
  },
  {
    key: "crew",
    name: "Crew",
    price: "$99",
    period: "Per month",
    tagline: "Vantage runs the schedule across every crew at once.",
    benefits: [
      "Everything in Growth",
      "Unlimited crew members",
      "Advanced financial reports",
      "Priority support",
    ],
  },
];

function UpgradePage() {
  const { tier, subscribed, isTrial, trialDaysRemaining, isLoading } = useEntitlements();
  const [busy, setBusy] = useState<Plan | null>(null);

  // The plan the workspace is actually billed at (what it falls back to when the
  // reverse trial ends). During the trial the *effective* plan is Crew, but the
  // "current plan" shown here is the paid tier so the upgrade CTAs make sense.
  const currentPlan: Plan = subscribed ? (tier?.plan ?? "free") : "free";

  async function authHeader(): Promise<Record<string, string>> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }

  async function startCheckout(target: Plan) {
    setBusy(target);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ plan: target }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch {
      toast.error("Could not start checkout. Please try again.");
      setBusy(null);
    }
  }

  async function openPortal(target: Plan) {
    setBusy(target);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: await authHeader(),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch {
      toast.error("Could not open the billing portal. Please try again.");
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-5 md:px-8 md:py-8">
      <PageHeader
        title="Upgrade"
        description="Choose the plan that fits your crew — change or cancel anytime."
        action={
          isTrial ? (
            <span className="inline-flex items-center gap-1.5 border border-revenue/40 bg-revenue/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-revenue">
              Crew trial · {trialDaysRemaining} day{trialDaysRemaining === 1 ? "" : "s"} left
            </span>
          ) : null
        }
      />

      <p className="mt-3.5 text-[13px] text-muted-foreground">
        You're currently on the{" "}
        <b className="font-extrabold text-revenue">{PLAN_META[currentPlan].name}</b> plan.
      </p>

      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 md:mt-5 md:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = p.key === currentPlan;
          const isUpgrade = PLAN_RANK[p.key] > PLAN_RANK[currentPlan];

          let label: string;
          let onClick: (() => void) | undefined;
          let variant: "primary" | "outline" | "current";

          if (isCurrent) {
            label = "Current plan";
            onClick = undefined;
            variant = "current";
          } else if (isUpgrade) {
            label = `Upgrade to ${p.name}`;
            onClick = () => startCheckout(p.key);
            variant = p.popular ? "primary" : "outline";
          } else {
            label = `Switch to ${p.name}`;
            onClick = () => openPortal(p.key);
            variant = "outline";
          }

          return (
            <PlanCard
              key={p.key}
              data={p}
              current={isCurrent}
              label={label}
              onClick={onClick}
              variant={variant}
              loading={busy === p.key}
              disabled={busy !== null || isLoading}
            />
          );
        })}
      </div>
    </div>
  );
}

function PlanCard({
  data,
  current,
  label,
  onClick,
  variant,
  loading,
  disabled,
}: {
  data: PlanCardData;
  current: boolean;
  label: string;
  onClick?: () => void;
  variant: "primary" | "outline" | "current";
  loading: boolean;
  disabled: boolean;
}) {
  const btnBase =
    "mt-5 flex h-11 w-full items-center justify-center gap-2 text-[12.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
  const btnVariant =
    variant === "primary"
      ? "bg-revenue text-[oklch(0.16_0.04_158)] hover:brightness-[1.06]"
      : variant === "outline"
        ? "border border-border bg-card text-foreground hover:bg-muted"
        : "bg-muted text-muted-foreground";

  return (
    <div
      className={`flex flex-col bg-card p-6 ${
        data.popular ? "border-2 border-revenue" : "border border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-[11px] font-extrabold uppercase tracking-[0.14em] ${
            data.popular ? "text-revenue" : "text-muted-foreground"
          }`}
        >
          {data.name}
        </p>
        {current ? (
          <span className="bg-revenue/15 px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-wide text-revenue">
            Current plan
          </span>
        ) : data.popular ? (
          <span className="bg-revenue/15 px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-wide text-revenue">
            Most popular
          </span>
        ) : null}
      </div>

      <p className="mt-3.5 text-[34px] font-extrabold leading-none tracking-[-0.02em] text-foreground">
        {data.price}
      </p>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {data.period}
      </p>
      <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">{data.tagline}</p>

      <ul className="mt-4 flex flex-1 flex-col gap-2.5 border-t border-border pt-4">
        {data.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-[12.5px] text-foreground/80">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-revenue" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled || variant === "current"}
        className={`${btnBase} ${btnVariant}`}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {label}
      </button>
    </div>
  );
}
