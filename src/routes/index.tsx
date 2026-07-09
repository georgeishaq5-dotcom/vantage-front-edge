import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CloudRain,
  MapPin,
  CreditCard,
  Clock,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  DollarSign,
  BadgeCheck,
} from "lucide-react";

import { HomeNav } from "@/components/marketing/home/HomeNav";
import { HomeFooter } from "@/components/marketing/home/HomeFooter";
import { WeatherHud, LiveHeader } from "@/components/marketing/home/WeatherHud";
import { FeatureCard } from "@/components/marketing/home/FeatureCard";
import { GlitchReveal } from "@/components/marketing/home/GlitchReveal";
import { CornerTicks } from "@/components/marketing/home/CornerTicks";
import { useWeatherStage } from "@/components/marketing/home/useWeatherStage";
import { AppLink } from "@/components/marketing/AppLink";

// Note: app.vantage-fsm.com -> marketing-page redirect is handled centrally
// in __root.tsx, since the same rule applies to every marketing path.
export const Route = createFileRoute("/")({
  component: HomePage,
});

const FEATURES = [
  {
    index: "01",
    icon: CloudRain,
    eyebrow: "Outreach",
    title: "Weather-triggered outreach",
    description:
      "The moment rain clears over a job site, Vantage texts nearby leads with an open slot. No spreadsheet, no manual check of the forecast.",
  },
  {
    index: "02",
    icon: MapPin,
    eyebrow: "Growth",
    title: "Radius marketing",
    description:
      "Draw a fence around any finished job and Vantage quietly markets to the neighbors — the easiest leads you'll ever close.",
  },
  {
    index: "03",
    icon: CreditCard,
    eyebrow: "Payments",
    title: "Get paid on the spot",
    description:
      "Stripe is built in. Send a quote, get a deposit, and collect the final invoice without leaving the job.",
  },
  {
    index: "04",
    icon: Clock,
    eyebrow: "Trial",
    title: "Try it free, pay when it pays off",
    description: "Start with a real trial that proves itself before you ever enter a card number.",
  },
];

const heroCtaClass =
  "inline-flex items-stretch bg-[oklch(0.97_0.004_247)] text-[oklch(0.14_0.02_260)] transition-transform active:scale-[0.97]";

function CtaButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <AppLink to={href} className={`${heroCtaClass} h-[58px]`}>
      <span className="block w-1.5 bg-[var(--sig)]" />
      <span className="flex items-center gap-3.5 px-[34px] text-xs font-extrabold uppercase tracking-[0.32em]">
        {children}
      </span>
    </AppLink>
  );
}

function WireframeFloor({ className, opacity = 0.13 }: { className?: string; opacity?: number }) {
  return (
    <div
      className={`pointer-events-none absolute -inset-x-[15%] ${className}`}
      style={{
        backgroundImage: `linear-gradient(oklch(0.62 0.22 256 / ${opacity}) 1px, transparent 1px), linear-gradient(90deg, oklch(0.62 0.22 256 / ${opacity}) 1px, transparent 1px)`,
        backgroundSize: "58px 58px",
        transform: "perspective(620px) rotateX(63deg)",
        transformOrigin: "top center",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 28%, black 72%, transparent)",
        maskImage: "linear-gradient(to bottom, transparent, black 28%, black 72%, transparent)",
      }}
    />
  );
}

function SectionKicker({ index, label }: { index: string; label: string }) {
  return (
    <GlitchReveal variant="soft">
      <div className="flex items-center gap-4">
        <span className="text-xs font-extrabold tracking-[0.2em] text-[var(--sig)]">{index}</span>
        <span className="block h-px w-12 bg-[oklch(1_0_0/20%)]" />
        <span className="text-[11px] font-bold uppercase tracking-[0.32em] text-[oklch(0.52_0.02_257)]">
          {label}
        </span>
      </div>
    </GlitchReveal>
  );
}

function StepNumber({ n }: { n: string }) {
  return (
    <span className="text-[15px] font-extrabold tracking-[0.18em] text-[var(--sig)]">{n}</span>
  );
}

function HomePage() {
  const weatherStage = useWeatherStage();

  return (
    <div
      className="vhome relative min-h-screen overflow-x-hidden bg-[oklch(0.128_0.02_262)] text-[oklch(0.95_0.006_247)]"
      style={{
        ["--sig" as string]: "oklch(0.72 0.16 158)",
        fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* CRT scanline ambience */}
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
        <section className="relative flex min-h-screen items-center overflow-hidden px-9 pb-[90px] pt-[150px]">
          <WireframeFloor className="bottom-[-14%] h-[58%]" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(46% 38% at 74% 18%, oklch(0.62 0.22 256 / 9%), transparent), radial-gradient(36% 30% at 18% 82%, oklch(0.72 0.16 158 / 7%), transparent)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent calc(50% - 0.5px), oklch(1 0 0 / 3.5%) calc(50% - 0.5px), oklch(1 0 0 / 3.5%) calc(50% + 0.5px), transparent calc(50% + 0.5px))",
            }}
          />

          <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-[72px] lg:grid-cols-2">
            <div className="flex flex-col items-start">
              <GlitchReveal variant="soft">
                <div className="flex items-center gap-3.5">
                  <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-[var(--sig)]">
                    Built for crews who work outside
                  </span>
                </div>
              </GlitchReveal>
              <GlitchReveal variant="text" delay={120}>
                <h1
                  className="mt-[30px] max-w-[15ch] text-balance font-light uppercase leading-[1.22] tracking-[0.085em] text-[oklch(0.97_0.004_247)]"
                  style={{ fontSize: "clamp(38px, 4.4vw, 62px)" }}
                >
                  Your next job starts the moment the rain stops.
                </h1>
              </GlitchReveal>
              <GlitchReveal variant="soft" delay={240}>
                <p className="mt-7 max-w-[480px] text-base leading-[1.85] text-[oklch(0.67_0.02_257)]">
                  Vantage quotes, dispatches, and markets for mobile detailers, pressure washers,
                  and landscapers — and it watches the forecast so you don't have to.
                </p>
              </GlitchReveal>
              <GlitchReveal variant="soft" delay={340}>
                <div className="mt-[42px] flex flex-wrap items-center gap-[18px]">
                  <CtaButton href="/dashboard">
                    Start free trial
                    <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2} />
                  </CtaButton>
                  <a
                    href="#how-it-works"
                    className="inline-flex h-14 items-center border border-[oklch(1_0_0/22%)] px-[30px] text-xs font-bold uppercase tracking-[0.32em] text-[oklch(0.85_0.01_257)] transition-[transform,border-color] active:scale-[0.97] hover:border-[oklch(1_0_0/50%)] hover:text-[oklch(0.97_0.004_247)]"
                  >
                    See how it works
                  </a>
                </div>
              </GlitchReveal>
              <GlitchReveal variant="soft" delay={420}>
                <p className="mt-[22px] text-xs font-medium tracking-wide text-[oklch(0.52_0.02_257)]">
                  No card required. See real results before you pay anything.
                </p>
              </GlitchReveal>
            </div>

            <div className="flex justify-center">
              <GlitchReveal variant="soft" delay={200} className="w-full max-w-[460px]">
                <WeatherHud stage={weatherStage} variant="hero" />
              </GlitchReveal>
            </div>
          </div>

          <div className="absolute bottom-[34px] left-9 flex items-center gap-4">
            <span className="text-[11px] font-extrabold tracking-[0.24em] text-[var(--sig)]">
              01
            </span>
            <span className="block h-px w-11 bg-[oklch(1_0_0/25%)]" />
            <span className="text-[11px] font-bold tracking-[0.24em] text-[oklch(0.45_0.02_257)]">
              05
            </span>
          </div>
          <div className="absolute bottom-[34px] right-9 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.34em] text-[oklch(0.45_0.02_257)]">
              Scroll
            </span>
            <span
              className="block h-[34px] w-px"
              style={{ background: "linear-gradient(to bottom, oklch(1 0 0 / 40%), transparent)" }}
            />
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section
          id="how-it-works"
          className="relative border-t border-[oklch(1_0_0/8%)] px-9 pb-[110px] pt-[120px]"
        >
          <div className="mx-auto max-w-[1280px]">
            <SectionKicker index="02" label="Process" />
            <GlitchReveal variant="text" delay={100}>
              <h2
                className="mt-[26px] font-light uppercase leading-[1.25] tracking-[0.1em] text-[oklch(0.97_0.004_247)]"
                style={{ fontSize: "clamp(30px, 3.2vw, 44px)" }}
              >
                Here's how it works
              </h2>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={180}>
              <p className="mt-4 text-[15px] leading-[1.8] text-[oklch(0.67_0.02_257)]">
                Three steps from forecast to first payment.
              </p>
            </GlitchReveal>

            <div className="mt-20 flex flex-col gap-24">
              {/* Step 1 */}
              <div className="grid items-center gap-16 lg:grid-cols-2">
                <GlitchReveal variant="soft">
                  <div className="flex items-baseline gap-[18px]">
                    <StepNumber n="01" />
                    <h3 className="text-xl font-semibold tracking-wide text-[oklch(0.96_0.005_247)]">
                      Rain stops — leads hear from you first
                    </h3>
                  </div>
                  <p className="mt-[18px] pl-11 text-[15px] leading-[1.85] text-[oklch(0.67_0.02_257)]">
                    Vantage monitors the forecast 24/7 for every job site on your calendar. The
                    moment the sky clears, it fires personalised texts to nearby prospects before
                    your competition even checks the weather app.
                  </p>
                </GlitchReveal>
                <GlitchReveal
                  variant="soft"
                  delay={140}
                  className="flex justify-center lg:justify-end"
                >
                  <div className="w-full max-w-[430px]">
                    <WeatherHud stage={weatherStage} variant="compact" />
                  </div>
                </GlitchReveal>
              </div>

              {/* Step 2 */}
              <div className="grid items-center gap-16 lg:grid-cols-2">
                <GlitchReveal
                  variant="soft"
                  delay={140}
                  className="order-last flex justify-center lg:order-first lg:justify-start"
                >
                  <div
                    className="home-lm-panel relative w-full max-w-[430px] border border-[oklch(1_0_0/12%)]"
                    style={{
                      background:
                        "linear-gradient(160deg, oklch(0.17 0.024 260), oklch(0.115 0.02 263))",
                      boxShadow: "0 26px 62px -38px oklch(0.62 0.22 256 / 45%)",
                    }}
                  >
                    <CornerTicks size={14} />
                    <LiveHeader label="Schedule · Thursday" value="Auto-routing" />
                    <div className="relative flex flex-col gap-2 overflow-hidden p-4">
                      <div className="home-lm-scan" style={{ opacity: 0.55 }} />
                      <div className="flex items-center gap-3">
                        <span className="w-[52px] text-[10px] font-bold tracking-[0.08em] text-[oklch(0.5_0.02_257)]">
                          2:00 PM
                        </span>
                        <span className="block h-[34px] flex-1 border border-dashed border-[oklch(1_0_0/10%)]" />
                      </div>
                      <div className="flex items-stretch gap-3">
                        <span className="w-[52px] pt-[9px] text-[10px] font-extrabold tracking-[0.08em] text-[var(--sig)]">
                          3:00 PM
                        </span>
                        <div
                          className="relative min-h-[56px] flex-1 border border-[oklch(1_0_0/10%)]"
                          style={{ animation: "home-lm-slot 5s ease-in-out infinite" }}
                        >
                          <div
                            className="flex items-center gap-[11px] px-3 py-[9px]"
                            style={{ animation: "home-lm-drop 5s ease-in-out infinite" }}
                          >
                            <div className="grid h-8 w-8 shrink-0 place-items-center bg-[var(--sig)] text-[oklch(0.13_0.02_260)]">
                              <CalendarCheck className="h-[15px] w-[15px]" strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-bold text-[oklch(0.95_0.006_247)]">
                                Mobile Detail — Marcus T.
                              </p>
                              <p className="mt-0.5 text-[10.5px] text-[oklch(0.55_0.02_257)]">
                                Auto-scheduled · 1.2 mi away
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-[52px] text-[10px] font-bold tracking-[0.08em] text-[oklch(0.5_0.02_257)]">
                          4:00 PM
                        </span>
                        <span className="block h-[34px] flex-1 border border-dashed border-[oklch(1_0_0/10%)]" />
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[oklch(0.55_0.02_257)]">
                        <CheckCircle2
                          className="h-[13px] w-[13px] text-[var(--sig)]"
                          strokeWidth={2}
                        />
                        Nearest tech assigned automatically
                      </div>
                    </div>
                  </div>
                </GlitchReveal>
                <GlitchReveal variant="soft">
                  <div className="flex items-baseline gap-[18px]">
                    <StepNumber n="02" />
                    <h3 className="text-xl font-semibold tracking-wide text-[oklch(0.96_0.005_247)]">
                      Booking lands on the calendar
                    </h3>
                  </div>
                  <p className="mt-[18px] pl-11 text-[15px] leading-[1.85] text-[oklch(0.67_0.02_257)]">
                    When a lead replies YES, Vantage drops the job on the schedule and routes it to
                    the nearest available tech — no phone tag, no back-and-forth.
                  </p>
                </GlitchReveal>
              </div>

              {/* Step 3 */}
              <div className="grid items-center gap-16 lg:grid-cols-2">
                <GlitchReveal variant="soft">
                  <div className="flex items-baseline gap-[18px]">
                    <StepNumber n="03" />
                    <h3 className="text-xl font-semibold tracking-wide text-[oklch(0.96_0.005_247)]">
                      Get paid before you leave the driveway
                    </h3>
                  </div>
                  <p className="mt-[18px] pl-11 text-[15px] leading-[1.85] text-[oklch(0.67_0.02_257)]">
                    Stripe is built right in. Send a quote, collect a deposit up-front, and fire the
                    final invoice from the job site the moment you're done — all in two taps.
                  </p>
                </GlitchReveal>
                <GlitchReveal
                  variant="soft"
                  delay={140}
                  className="flex justify-center lg:justify-end"
                >
                  <div
                    className="home-lm-panel relative w-full max-w-[430px] overflow-hidden border border-[oklch(1_0_0/12%)]"
                    style={{
                      background:
                        "linear-gradient(160deg, oklch(0.17 0.024 260), oklch(0.115 0.02 263))",
                      boxShadow: "0 26px 62px -38px oklch(0.72 0.16 158 / 45%)",
                    }}
                  >
                    <div className="home-lm-sweep" />
                    <div className="home-lm-scan" style={{ opacity: 0.6 }} />
                    <CornerTicks size={14} />
                    <LiveHeader label="Invoice · Stripe" value="Cleared" />
                    <div className="flex flex-col gap-[15px] p-[18px]">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[11px] text-[oklch(0.55_0.02_257)]">
                            Mobile Detail — Marcus T.
                          </p>
                          <p
                            className="mt-1 text-[34px] font-extrabold tracking-tight text-[oklch(0.97_0.004_247)]"
                            style={{ animation: "home-lm-glow 2.8s ease-in-out infinite" }}
                          >
                            $185
                            <span className="text-[18px] font-medium text-[oklch(0.55_0.02_257)]">
                              .00
                            </span>
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center gap-[7px] border-[1.5px] border-[var(--sig)] px-[13px] py-[6px] text-[var(--sig)]"
                          style={{
                            transformOrigin: "center",
                            animation: "home-lm-stamp 4.2s ease-in-out infinite",
                          }}
                        >
                          <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
                          <span className="text-[11px] font-extrabold uppercase tracking-[0.16em]">
                            Paid
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-col gap-[9px] border border-[oklch(1_0_0/9%)] bg-[oklch(0.128_0.02_262/70%)] px-[15px] py-[13px] text-[13px]">
                        <div className="flex justify-between text-[oklch(0.67_0.02_257)]">
                          <span>Interior + exterior detail</span>
                          <span>$165</span>
                        </div>
                        <div className="flex justify-between text-[oklch(0.67_0.02_257)]">
                          <span>Ceramic coating add-on</span>
                          <span>$20</span>
                        </div>
                      </div>
                      <div>
                        <div className="mb-[7px] flex items-center justify-between text-[11px] text-[oklch(0.55_0.02_257)]">
                          <span className="inline-flex items-center gap-[7px]">
                            <DollarSign
                              className="h-[13px] w-[13px] text-[var(--sig)]"
                              strokeWidth={2}
                            />
                            Payout to your account
                          </span>
                          <span>2 days</span>
                        </div>
                        <div className="h-1 overflow-hidden bg-[oklch(1_0_0/8%)]">
                          <div
                            className="h-full bg-[var(--sig)]"
                            style={{ animation: "home-lm-fill 4s ease-in-out infinite" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </GlitchReveal>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FEATURES / CAPABILITY ============ */}
        <section className="relative overflow-hidden border-t border-[oklch(1_0_0/8%)] bg-[oklch(0.113_0.02_263)] px-9 pb-[110px] pt-[120px]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(40% 34% at 85% 10%, oklch(0.62 0.22 256 / 6%), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-[1280px]">
            <SectionKicker index="03" label="Capability" />
            <GlitchReveal variant="text" delay={100}>
              <h2
                className="mt-[26px] max-w-[20ch] font-light uppercase leading-[1.3] tracking-[0.1em] text-[oklch(0.97_0.004_247)]"
                style={{ fontSize: "clamp(30px, 3.2vw, 44px)" }}
              >
                Everything a one-truck operation needs to grow.
              </h2>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={180}>
              <p className="mt-[18px] max-w-[560px] text-[15px] leading-[1.85] text-[oklch(0.67_0.02_257)]">
                Vantage replaces the sticky notes, the group texts, and the spreadsheet you've been
                meaning to clean up.
              </p>
            </GlitchReveal>

            <div
              className="mt-16 grid gap-[18px]"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 430px), 1fr))" }}
            >
              {FEATURES.map((feature, i) => (
                <GlitchReveal key={feature.title} variant="soft" delay={i * 90}>
                  <FeatureCard
                    icon={feature.icon}
                    index={feature.index}
                    eyebrow={feature.eyebrow}
                    title={feature.title}
                    description={feature.description}
                  />
                </GlitchReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TRUST STRIP ============ */}
        <section className="border-t border-[oklch(1_0_0/8%)] px-9 py-[88px]">
          <GlitchReveal
            variant="soft"
            className="mx-auto flex max-w-[1000px] flex-wrap justify-center gap-14"
          >
            {[
              "Set up in under 10 minutes",
              "No long-term contract",
              "Built with real trade crews",
            ].map((line) => (
              <div key={line} className="flex items-center gap-[11px]">
                <CheckCircle2 className="h-[15px] w-[15px] text-[var(--sig)]" strokeWidth={2} />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[oklch(0.85_0.01_257)]">
                  {line}
                </span>
              </div>
            ))}
          </GlitchReveal>
        </section>

        {/* ============ CTA ============ */}
        <section className="relative overflow-hidden border-t border-[oklch(1_0_0/8%)] bg-[oklch(0.1_0.022_263)] px-9 py-[140px]">
          <WireframeFloor className="bottom-[-18%] h-[70%]" opacity={0.11} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 45% at 50% 30%, oklch(0.62 0.22 256 / 8%), transparent)",
            }}
          />
          <div className="relative mx-auto flex max-w-[860px] flex-col items-center text-center">
            <SectionKicker index="05" label="Deploy" />
            <GlitchReveal variant="text" delay={100}>
              <h2
                className="mt-[30px] text-balance font-light uppercase leading-[1.28] tracking-[0.1em] text-[oklch(0.97_0.004_247)]"
                style={{ fontSize: "clamp(32px, 3.6vw, 50px)" }}
              >
                Stop missing jobs because of the forecast.
              </h2>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={180}>
              <p className="mt-5 text-[15px] leading-[1.8] text-[oklch(0.67_0.02_257)]">
                Set up your first weather trigger in the next ten minutes.
              </p>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={260} className="mt-11">
              <CtaButton href="/dashboard">
                Start free trial
                <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2} />
              </CtaButton>
            </GlitchReveal>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
