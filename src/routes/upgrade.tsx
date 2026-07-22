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
// Copy tracks the decided entitlements matrix (src/lib/entitlements.ts).
// Features that aren't built yet carry a "(coming soon)" suffix so a plan is
// described honestly without advertising un-built features as available.
const PLANS: PlanCardData[] = [
  {
    key: "free",
    name: "Starter",
    price: "Free",
    period: "Free forever for solo operators",
    tagline: "Everything you need to run Vantage on real jobs.",
    benefits: [
      "Up to 25 active jobs",
      "Quote → schedule → dispatch → track",
      "Send invoices & accept card payments",
      "1 crew seat",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    price: "$49",
    period: "Per month",
    tagline: "Book more work and add your first crew.",
    benefits: [
      "Unlimited active jobs",
      "Up to 5 crew seats",
      "Radius marketing campaigns",
      "Deposits & automated payment reminders (coming soon)",
      "Automated & two-way SMS reminders (coming soon)",
      "Online booking & client self-serve (coming soon)",
      "Recurring jobs & maintenance contracts (coming soon)",
      "Weather-triggered outreach (coming soon)",
    ],
    popular: true,
  },
  {
    key: "crew",
    name: "Crew",
    price: "$99",
    period: "Per month",
    tagline: "Run multiple crews with margins and reporting.",
    benefits: [
      "Everything in Growth",
      "Unlimited crew seats",
      "Job costing & profitability (coming soon)",
      "Advanced reports (coming soon)",
      "Priority support",
    ],
  },
];

function UpgradePage() {
  const { plan, paidPlan, subscribed, isTrial, trialDaysRemaining, isLoading } =
    useEntitlements();
  const [busy, setBusy] = useState<Plan | null>(null);

  // "Current plan" is the EFFECTIVE plan (reverse-trial aware) so this page can
  // never contradict the trial banner — a trialing workspace sees Crew-level.
  // CTAs are computed against the PAID plan (what billing falls back to) so a
  // trialing user can still subscribe to lock a plan in before the trial ends.
  const currentPlan: Plan = plan;

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
        <b className="font-extrabold text-revenue">{PLAN_META[currentPlan].name}</b> plan
        {isTrial ? " — included in your trial" : ""}.
      </p>

      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 md:mt-5 md:grid-cols-3">
        {PLANS.map((p) => {
          // Badge tracks the effective plan; CTA tracks the paid plan so a
          // trialing (paid=free) user can still subscribe.
          const isEffective = p.key === currentPlan;
          const isPaidCurrent = subscribed && p.key === paidPlan;
          const isUpgrade = PLAN_RANK[p.key] > PLAN_RANK[paidPlan];

          let label: string;
          let onClick: (() => void) | undefined;
          let variant: "primary" | "outline" | "current";

          if (isPaidCurrent) {
            label = "Current plan";
            onClick = undefined;
            variant = "current";
          } else if (isUpgrade) {
            label = isTrial ? `Subscribe to ${p.name}` : `Upgrade to ${p.name}`;
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
              current={isEffective}
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
