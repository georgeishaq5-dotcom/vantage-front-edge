import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Hammer, CloudRain, Users } from "lucide-react";

import { HomeNav } from "@/components/marketing/home/HomeNav";
import { HomeFooter } from "@/components/marketing/home/HomeFooter";
import { GlitchReveal } from "@/components/marketing/home/GlitchReveal";
import { AppLink } from "@/components/marketing/AppLink";

// Note: app.vantage-fsm.com -> /dashboard redirect for this path is
// handled centrally in __root.tsx.
export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Vantage" },
      {
        name: "description",
        content:
          "Vantage is built for mobile detailers, pressure washers, and landscapers — the businesses that work outside, on the weather's schedule.",
      },
    ],
  }),
  component: AboutPage,
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

const VALUES: { icon: LucideIcon; num: string; title: string; description: string }[] = [
  {
    icon: CloudRain,
    num: "01",
    title: "Built around the forecast, not against it",
    description:
      "Most software ignores the fact that outdoor work depends entirely on the weather. We built Vantage around that fact instead of pretending it away.",
  },
  {
    icon: Hammer,
    num: "02",
    title: "Made for the truck, not the office",
    description:
      "Every screen is designed to be used one-handed, between jobs, with work gloves still on — not from behind a desk.",
  },
  {
    icon: Users,
    num: "03",
    title: "Small crews first",
    description:
      "We design for the one-truck operation before we design for the enterprise fleet. If it doesn't work for a crew of one, it doesn't ship.",
  },
];

function AboutPage() {
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
                  Who we build for
                </span>
                <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
              </div>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={90}>
              <h1
                className="mt-[26px] text-balance font-light uppercase leading-[1.18] tracking-[0.06em] text-[oklch(0.97_0.004_247)]"
                style={{ fontSize: "clamp(32px, 5vw, 58px)" }}
              >
                We build for the work
                <br />
                that happens outside.
              </h1>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={180}>
              <p className="mx-auto mt-6 max-w-[600px] text-base leading-[1.85] text-[oklch(0.67_0.02_257)]">
                Vantage started with one observation: a detailer's whole business rises and falls
                with the forecast. Most software never noticed.
              </p>
            </GlitchReveal>
          </div>
        </section>

        {/* ============ STORY ============ */}
        <section className="px-9 pb-10 pt-8">
          <div className="mx-auto max-w-[760px]">
            <GlitchReveal variant="soft">
              <div className="flex items-center gap-4">
                <span className="text-xs font-extrabold tracking-[0.2em] text-[var(--sig)]">
                  00
                </span>
                <span className="block h-px w-10 bg-[oklch(1_0_0/20%)]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--sig)]">
                  The story
                </span>
              </div>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={90}>
              <div className="mt-8 flex flex-col gap-6 text-[15px] leading-[1.9] text-[oklch(0.78_0.015_257)]">
                <p>
                  Mobile detailers, pressure washers, and landscapers run businesses that don't
                  pause for bad weather — they reroute around it. A rained-out morning isn't a day
                  off, it's a scramble: reschedule three jobs, call a half-dozen customers, and hope
                  tomorrow's slot fills back up.
                </p>
                <p>
                  Vantage exists to do that scrambling automatically. It watches the forecast over
                  your service area, and the moment conditions change, it reaches out to the
                  customers most likely to say yes — the ones who already live a few minutes from
                  your last job.
                </p>
                <p>
                  We're not trying to build software for every kind of business. We're building it
                  for crews who work with their hands, outdoors, on a schedule the weather sets —
                  and who deserve tools that understand that.
                </p>
              </div>
            </GlitchReveal>
          </div>
        </section>

        {/* ============ VALUES ============ */}
        <section className="px-9 pb-10 pt-[70px]">
          <div className="mx-auto max-w-[1180px]">
            <GlitchReveal variant="soft">
              <div className="flex items-center justify-center gap-4">
                <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-[var(--sig)]">
                  What we believe
                </h2>
                <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
              </div>
            </GlitchReveal>
            <div className="mt-12 grid gap-[18px] md:grid-cols-3">
              {VALUES.map((value, i) => (
                <GlitchReveal key={value.title} variant="soft" delay={i * 90}>
                  <div
                    className="flex h-full flex-col border border-[oklch(1_0_0/11%)] p-8"
                    style={{
                      background:
                        "linear-gradient(160deg, oklch(0.145 0.02 262), oklch(0.105 0.02 264))",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center border border-[color-mix(in_oklch,var(--sig)_40%,transparent)] text-[var(--sig)]">
                        <value.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[46px] font-extralight leading-none tracking-tighter text-[oklch(1_0_0/6%)]">
                        {value.num}
                      </span>
                    </div>
                    <h3 className="mt-6 text-base font-bold uppercase leading-[1.35] tracking-[0.04em] text-[oklch(0.95_0.006_247)]">
                      {value.title}
                    </h3>
                    <p className="mt-3 text-sm leading-[1.8] text-[oklch(0.67_0.02_257)]">
                      {value.description}
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
                Come see it for yourself.
              </h2>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={180}>
              <p className="mt-5 text-[15px] leading-[1.8] text-[oklch(0.67_0.02_257)]">
                Set up your account and your first weather trigger in under ten minutes.
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
