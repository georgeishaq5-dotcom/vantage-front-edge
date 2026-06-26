import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Reveal } from "@/components/marketing/Reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Vantage" },
      {
        name: "description",
        content:
          "Simple, transparent pricing for field service crews. Start free, upgrade when Vantage starts paying for itself.",
      },
    ],
  }),
  component: PricingPage,
});

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "for your first 30 days",
    description: "Everything you need to try Vantage on real jobs.",
    features: [
      "Up to 25 active jobs",
      "Quoting & digital approval",
      "Basic dispatch calendar",
      "1 crew member",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$49",
    period: "per month",
    description: "For a one-truck operation ready to book more work.",
    features: [
      "Unlimited active jobs",
      "Weather-triggered outreach",
      "Radius marketing campaigns",
      "Stripe payments & deposits",
      "Up to 5 crew members",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Crew",
    price: "$99",
    period: "per month",
    description: "For growing teams managing multiple crews at once.",
    features: [
      "Everything in Growth",
      "Unlimited crew members",
      "Advanced financial reports",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
];

const FAQS = [
  {
    q: "Do I need a credit card to start?",
    a: "No. The 30-day trial starts with just an email — no card required. You'll only be asked to add payment details when you choose to upgrade.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There's no contract. Cancel from your account settings whenever you'd like, and you'll keep access through the end of your billing period.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "Nothing is deleted. If a plan limit applies, you'll be notified before anything is restricted, never without warning.",
  },
];

function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />

      <main className="flex-1">
        <section className="border-b border-border/60 bg-secondary/20 py-16 md:py-20">
          <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
            <Reveal>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                Simple pricing. No surprises.
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Start free. Upgrade only once Vantage is already booking you
                more work.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <div className="grid gap-6 md:grid-cols-3">
              {PLANS.map((plan, i) => (
                <Reveal key={plan.name} delay={i * 90}>
                  <div
                    className={cn(
                      "flex h-full flex-col rounded-2xl border p-7",
                      plan.highlighted
                        ? "border-brand bg-card shadow-xl ring-1 ring-brand/20"
                        : "border-border bg-card",
                    )}
                  >
                    {plan.highlighted && (
                      <span className="mb-3 inline-flex w-fit items-center rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-foreground">
                        Most popular
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-foreground">
                      {plan.name}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold tracking-tight text-foreground">
                        {plan.price}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.period}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {plan.description}
                    </p>

                    <ul className="mt-6 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2.5 text-sm text-foreground/90"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-revenue" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      size="lg"
                      variant={plan.highlighted ? "brand" : "outline"}
                      className="mt-7 h-11 w-full"
                    >
                      <Link to="/dashboard">{plan.cta}</Link>
                    </Button>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 py-16 md:py-20">
          <div className="mx-auto max-w-2xl px-4 md:px-6">
            <Reveal>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                Questions, answered
              </h2>
            </Reveal>
            <div className="mt-8 space-y-6">
              {FAQS.map((faq, i) => (
                <Reveal key={faq.q} delay={i * 80}>
                  <div className="border-b border-border/60 pb-6">
                    <h3 className="text-base font-semibold text-foreground">
                      {faq.q}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {faq.a}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 bg-sidebar py-20 md:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
              <h2 className="text-3xl font-extrabold tracking-tight text-sidebar-foreground md:text-4xl">
                Try it free for 30 days.
              </h2>
              <p className="mt-3 text-base text-sidebar-foreground/70">
                No card required to start.
              </p>
              <Button asChild size="lg" variant="revenue" className="mt-7 h-12 px-8 text-base">
                <Link to="/dashboard">
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
