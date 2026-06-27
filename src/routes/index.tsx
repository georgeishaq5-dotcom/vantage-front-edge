import { createFileRoute } from "@tanstack/react-router";
import {
  CloudRain,
  MapPin,
  CreditCard,
  Clock,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  User,
  DollarSign,
  BadgeCheck,
} from "lucide-react";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { WeatherTriggerDemo } from "@/components/marketing/WeatherTriggerDemo";
import { Reveal } from "@/components/marketing/Reveal";
import { AppLink } from "@/components/marketing/AppLink";
import { Button } from "@/components/ui/button";

// Note: app.vantage-fsm.com -> marketing-page redirect is handled centrally
// in __root.tsx, since the same rule applies to every marketing path.
export const Route = createFileRoute("/")({
  component: HomePage,
});

const FEATURES = [
  {
    icon: CloudRain,
    title: "Weather-triggered outreach",
    description:
      "The moment rain clears over a job site, Vantage texts nearby leads with an open slot. No spreadsheet, no manual check of the forecast.",
  },
  {
    icon: MapPin,
    title: "Radius marketing",
    description:
      "Draw a fence around any finished job and Vantage quietly markets to the neighbors — the easiest leads you'll ever close.",
  },
  {
    icon: CreditCard,
    title: "Get paid on the spot",
    description:
      "Stripe is built in. Send a quote, get a deposit, and collect the final invoice without leaving the job.",
  },
  {
    icon: Clock,
    title: "Try it free, pay when it pays off",
    description:
      "Start with a real trial that proves itself before you ever enter a card number.",
  },
];

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, var(--brand) 0%, transparent 45%), radial-gradient(circle at 85% 0%, var(--revenue) 0%, transparent 40%)",
            }}
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:px-6 md:py-28">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-muted px-3 py-1 text-xs font-semibold text-brand">
                Built for crews who work outside
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground md:text-5xl">
                Your next job starts the moment the rain stops.
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
                Vantage quotes, dispatches, and markets for mobile detailers,
                pressure washers, and landscapers — and it watches the
                forecast so you don't have to.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" variant="brand" className="h-12 px-7 text-base">
                  <AppLink to="/dashboard">
                    Start free trial
                    <ArrowRight className="h-4 w-4" />
                  </AppLink>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No card required. See real results before you pay anything.
              </p>
            </div>

            <div className="flex justify-center md:justify-end">
              <WeatherTriggerDemo />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-t border-border/60 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal>
              <div className="text-center">
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                  Here's how it works
                </h2>
                <p className="mt-3 text-base text-muted-foreground">
                  Three steps from forecast to first payment.
                </p>
              </div>
            </Reveal>

            <div className="mt-16 flex flex-col gap-0">
              {/* Step 1 */}
              <Reveal delay={80}>
                <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground shadow">
                        01
                      </div>
                      <div className="mt-3 w-px flex-1 border-l-2 border-dashed border-border" />
                    </div>
                    <div className="pb-14">
                      <h3 className="text-xl font-bold text-foreground">
                        Rain stops — leads hear from you first
                      </h3>
                      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                        Vantage monitors the forecast 24/7 for every job site
                        on your calendar. The moment the sky clears, it fires
                        personalised texts to nearby prospects before your
                        competition even checks the weather app.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center md:justify-end">
                    <WeatherTriggerDemo />
                  </div>
                </div>
              </Reveal>

              {/* Step 2 */}
              <Reveal delay={160}>
                <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                  {/* Visual first on desktop (order-first) — text second */}
                  <div className="order-last flex justify-center md:order-first md:justify-start">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                      <div className="border-b border-border/60 bg-secondary/40 px-5 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          New job booked
                        </p>
                      </div>
                      <div className="space-y-4 p-5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-revenue/15">
                            <CalendarCheck className="h-5 w-5 text-revenue" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Mobile Detail — Thursday 3:00 PM
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Auto-scheduled from SMS reply
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            Marcus T. — 1.2 mi away
                          </span>
                          <span className="ml-auto rounded-full bg-revenue/15 px-2 py-0.5 text-[11px] font-semibold text-revenue">
                            Confirmed
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-revenue" />
                          Nearest tech assigned automatically
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground shadow">
                        02
                      </div>
                      <div className="mt-3 w-px flex-1 border-l-2 border-dashed border-border" />
                    </div>
                    <div className="pb-14">
                      <h3 className="text-xl font-bold text-foreground">
                        Booking lands on the calendar
                      </h3>
                      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                        When a lead replies YES, Vantage drops the job on the
                        schedule and routes it to the nearest available
                        tech — no phone tag, no back-and-forth.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Step 3 */}
              <Reveal delay={240}>
                <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                  <div className="flex gap-5">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground shadow">
                      03
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        Get paid before you leave the driveway
                      </h3>
                      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                        Stripe is built right in. Send a quote, collect a
                        deposit up-front, and fire the final invoice from the
                        job site the moment you're done — all in two taps.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center md:justify-end">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                      <div className="border-b border-border/60 bg-secondary/40 px-5 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Invoice · Stripe
                        </p>
                      </div>
                      <div className="space-y-4 p-5">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Mobile Detail — Marcus T.
                            </p>
                            <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-foreground">
                              $185<span className="text-lg font-medium text-muted-foreground">.00</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 rounded-full bg-revenue/15 px-3 py-1">
                            <BadgeCheck className="h-4 w-4 text-revenue" />
                            <span className="text-sm font-semibold text-revenue">
                              Paid
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 rounded-xl bg-secondary/50 p-3 text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Interior + exterior detail</span>
                            <span>$165</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Ceramic coating add-on</span>
                            <span>$20</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <DollarSign className="h-3.5 w-3.5 text-revenue" />
                          Payout arrives in your account in 2 days
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/60 bg-secondary/20 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal>
              <div className="max-w-xl">
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                  Everything a one-truck operation needs to grow.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  Vantage replaces the sticky notes, the group texts, and the
                  spreadsheet you've been meaning to clean up.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 80}>
                  <div className="h-full rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-muted">
                      <feature.icon className="h-5 w-5 text-brand" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
            <Reveal>
              <div className="mx-auto flex max-w-xs flex-col gap-3 text-left sm:max-w-none sm:flex-row sm:justify-center sm:gap-10">
                {[
                  "Set up in under 10 minutes",
                  "No long-term contract",
                  "Built with real trade crews",
                ].map((line) => (
                  <div key={line} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-revenue" />
                    <span className="text-sm font-medium text-foreground">
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/60 bg-sidebar py-20 md:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
              <h2 className="text-3xl font-extrabold tracking-tight text-sidebar-foreground md:text-4xl">
                Stop missing jobs because of the forecast.
              </h2>
              <p className="mt-3 text-base text-sidebar-foreground/70">
                Set up your first weather trigger in the next ten minutes.
              </p>
              <Button asChild size="lg" variant="revenue" className="mt-7 h-12 px-8 text-base">
                <AppLink to="/dashboard">
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </AppLink>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
