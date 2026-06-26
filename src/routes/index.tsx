import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  CloudRain,
  MapPin,
  CreditCard,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { WeatherTriggerDemo } from "@/components/marketing/WeatherTriggerDemo";
import { Reveal } from "@/components/marketing/Reveal";
import { AppLink } from "@/components/marketing/AppLink";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { resolveHostContext, toAppUrl } from "@/lib/site-host";

// Note: app.vantage-fsm.com -> marketing-page redirect is handled centrally
// in __root.tsx, since the same rule applies to every marketing path.
export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // A logged-in visitor on the marketing domain should land in the
    // product, not see the marketing homepage again.
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;

    const ctx = await resolveHostContext();
    if (ctx) {
      throw redirect({ href: toAppUrl("/dashboard", ctx) });
    }
  },
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
                  <Link to="/features">See how it works</Link>
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
