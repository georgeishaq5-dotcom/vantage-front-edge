import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";

import { HomeNav } from "@/components/marketing/home/HomeNav";
import { HomeFooter } from "@/components/marketing/home/HomeFooter";
import { GlitchReveal } from "@/components/marketing/home/GlitchReveal";
import { CornerTicks } from "@/components/marketing/home/CornerTicks";
import { AppLink } from "@/components/marketing/AppLink";

// Note: app.vantage-fsm.com -> /dashboard redirect for this path is
// handled centrally in __root.tsx.
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

const heroCtaClass =
  "inline-flex items-stretch bg-[oklch(0.97_0.004_247)] text-[oklch(0.14_0.02_260)] transition-transform active:scale-[0.97]";

function CtaButton({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AppLink to={href} className={`${heroCtaClass} h-[58px] ${className ?? ""}`}>
      <span className="block w-1.5 bg-[var(--sig)]" />
      <span className="flex items-center gap-3.5 px-[34px] text-xs font-extrabold uppercase tracking-[0.32em]">
        {children}
      </span>
    </AppLink>
  );
}

/** Perspective wireframe floor used behind the hero and CTA sections. */
function WireframeFloor({
  className,
  opacity = 0.12,
  rotate = 63,
  mask,
}: {
  className?: string;
  opacity?: number;
  rotate?: number;
  mask: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute -inset-x-[15%] ${className}`}
      style={{
        backgroundImage: `linear-gradient(oklch(0.62 0.22 256 / ${opacity}) 1px, transparent 1px), linear-gradient(90deg, oklch(0.62 0.22 256 / ${opacity}) 1px, transparent 1px)`,
        backgroundSize: "58px 58px",
        transform: `perspective(620px) rotateX(${rotate}deg)`,
        transformOrigin: "top center",
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
}

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

function PlanCard({ plan, index }: { plan: (typeof PLANS)[number]; index: string }) {
  return (
    <div
      className="relative flex h-full flex-col border p-8"
      style={{
        borderColor: plan.highlighted
          ? "color-mix(in oklch, var(--sig) 55%, transparent)"
          : "oklch(1 0 0 / 11%)",
        background: plan.highlighted
          ? "linear-gradient(160deg, oklch(0.16 0.024 262), oklch(0.108 0.02 264))"
          : "linear-gradient(160deg, oklch(0.145 0.02 262), oklch(0.105 0.02 264))",
      }}
    >
      {plan.highlighted && (
        <>
          <span className="absolute left-0 top-0 h-full w-1 bg-[var(--sig)]" />
          <CornerTicks size={15} />
        </>
      )}

      <div className="flex items-center gap-3">
        <span className="text-xs font-extrabold tracking-[0.2em] text-[var(--sig)]">{index}</span>
        <span className="block h-px w-8 bg-[oklch(1_0_0/20%)]" />
        <span className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--sig)]">
          {plan.name}
        </span>
      </div>

      {plan.highlighted && (
        <span className="mt-5 inline-flex w-fit items-center gap-[6px] border-[1.5px] border-[var(--sig)] px-[11px] py-[5px] text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--sig)]">
          Most popular
        </span>
      )}

      <div className={`flex items-baseline gap-2 ${plan.highlighted ? "mt-5" : "mt-6"}`}>
        <span className="text-[46px] font-extrabold leading-none tracking-tight text-[oklch(0.97_0.004_247)]">
          {plan.price}
        </span>
      </div>
      <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-[oklch(0.55_0.02_257)]">
        {plan.period}
      </p>
      <p className="mt-5 text-sm leading-[1.8] text-[oklch(0.67_0.02_257)]">{plan.description}</p>

      <ul className="mt-7 flex flex-1 flex-col gap-3.5">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-sm leading-[1.5] text-[oklch(0.82_0.012_257)]"
          >
            <Check className="mt-[3px] h-4 w-4 shrink-0 text-[var(--sig)]" />
            {feature}
          </li>
        ))}
      </ul>

      {plan.highlighted ? (
        <CtaButton href="/dashboard" className="mt-8 w-full justify-center">
          {plan.cta}
        </CtaButton>
      ) : (
        <AppLink
          to="/dashboard"
          className="mt-8 inline-flex h-[58px] items-center justify-center border border-[oklch(1_0_0/22%)] px-[30px] text-xs font-bold uppercase tracking-[0.32em] text-[oklch(0.85_0.01_257)] transition-[transform,border-color] active:scale-[0.97] hover:border-[oklch(1_0_0/50%)] hover:text-[oklch(0.97_0.004_247)]"
        >
          {plan.cta}
        </AppLink>
      )}
    </div>
  );
}

function PricingPage() {
  return (
    <div
      className="vhome relative min-h-screen overflow-x-hidden bg-[oklch(0.128_0.02_262)] text-[oklch(0.95_0.006_247)]"
      style={{
        ["--sig" as string]: "oklch(0.72 0.16 158)",
        fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-[70]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.014) 0px, rgba(255,255,255,0.014) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <HomeNav />

      <main>
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden px-9 pb-[80px] pt-[170px]">
          <WireframeFloor
            className="bottom-[-20%] h-[60%]"
            opacity={0.1}
            rotate={64}
            mask="linear-gradient(to bottom, transparent, black 34%, transparent)"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(46% 40% at 50% 22%, oklch(0.72 0.16 158 / 8%), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-[1000px] text-center">
            <GlitchReveal variant="soft">
              <div className="inline-flex items-center gap-3.5">
                <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-[var(--sig)]">
                  Simple pricing
                </span>
                <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
              </div>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={90}>
              <h1
                className="mt-[26px] text-balance font-light uppercase leading-[1.18] tracking-[0.06em] text-[oklch(0.97_0.004_247)]"
                style={{ fontSize: "clamp(34px, 5.4vw, 62px)" }}
              >
                No surprises.
                <br />
                Just results.
              </h1>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={180}>
              <p className="mx-auto mt-6 max-w-[560px] text-base leading-[1.85] text-[oklch(0.67_0.02_257)]">
                Start free. Upgrade only once Vantage is already booking you more work than you can
                handle.
              </p>
            </GlitchReveal>
          </div>
        </section>

        {/* ============ PLANS ============ */}
        <section className="px-9 pb-10 pt-5">
          <div className="mx-auto grid max-w-[1180px] gap-[18px] md:grid-cols-3">
            {PLANS.map((plan, i) => (
              <GlitchReveal key={plan.name} variant="soft" delay={i * 90}>
                <PlanCard plan={plan} index={`0${i + 1}`} />
              </GlitchReveal>
            ))}
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="px-9 pb-10 pt-[70px]">
          <div className="mx-auto max-w-[820px]">
            <GlitchReveal variant="soft">
              <div className="flex items-center gap-4">
                <span className="text-xs font-extrabold tracking-[0.2em] text-[var(--sig)]">
                  FAQ
                </span>
                <span className="block h-px w-10 bg-[oklch(1_0_0/20%)]" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--sig)]">
                  Questions, answered
                </h2>
              </div>
            </GlitchReveal>
            <div className="mt-9 flex flex-col">
              {FAQS.map((faq, i) => (
                <GlitchReveal key={faq.q} variant="soft" delay={i * 80}>
                  <div className="border-t border-[oklch(1_0_0/10%)] py-7">
                    <h3 className="text-base font-bold uppercase tracking-[0.04em] text-[oklch(0.95_0.006_247)]">
                      {faq.q}
                    </h3>
                    <p className="mt-3 text-sm leading-[1.85] text-[oklch(0.67_0.02_257)]">
                      {faq.a}
                    </p>
                  </div>
                </GlitchReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="relative mt-[60px] overflow-hidden border-t border-[oklch(1_0_0/8%)] bg-[oklch(0.1_0.022_263)] px-9 py-[130px]">
          <WireframeFloor
            className="bottom-[-18%] h-[70%]"
            opacity={0.11}
            mask="linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 45% at 50% 30%, oklch(0.62 0.22 256 / 8%), transparent)",
            }}
          />
          <div className="relative mx-auto flex max-w-[860px] flex-col items-center text-center">
            <GlitchReveal variant="soft">
              <h2
                className="text-balance font-light uppercase leading-[1.28] tracking-[0.1em] text-[oklch(0.97_0.004_247)]"
                style={{ fontSize: "clamp(32px, 3.6vw, 50px)" }}
              >
                Try it free for 30 days.
              </h2>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={180}>
              <p className="mt-5 text-[15px] leading-[1.8] text-[oklch(0.67_0.02_257)]">
                No card required to start.
              </p>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={260} className="mt-11">
              <CtaButton href="/dashboard">
                Start free trial
                <ArrowRight className="h-[15px] w-[15px]" />
              </CtaButton>
            </GlitchReveal>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
