import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Hammer, CloudRain, Users } from "lucide-react";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Reveal } from "@/components/marketing/Reveal";
import { AppLink } from "@/components/marketing/AppLink";
import { Button } from "@/components/ui/button";

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

const VALUES = [
  {
    icon: CloudRain,
    title: "Built around the forecast, not against it",
    description:
      "Most software ignores the fact that outdoor work depends entirely on the weather. We built Vantage around that fact instead of pretending it away.",
  },
  {
    icon: Hammer,
    title: "Made for the truck, not the office",
    description:
      "Every screen is designed to be used one-handed, between jobs, with work gloves still on — not from behind a desk.",
  },
  {
    icon: Users,
    title: "Small crews first",
    description:
      "We design for the one-truck operation before we design for the enterprise fleet. If it doesn't work for a crew of one, it doesn't ship.",
  },
];

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />

      <main className="flex-1">
        <section className="border-b border-border/60 bg-secondary/20 py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
            <Reveal>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                We build for the work that happens outside.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Vantage started with one observation: a detailer's whole
                business rises and falls with the forecast. Most software
                never noticed.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <Reveal>
              <div className="space-y-5 text-base leading-relaxed text-foreground/90">
                <p>
                  Mobile detailers, pressure washers, and landscapers run
                  businesses that don't pause for bad weather — they reroute
                  around it. A rained-out morning isn't a day off, it's a
                  scramble: reschedule three jobs, call a half-dozen
                  customers, and hope tomorrow's slot fills back up.
                </p>
                <p>
                  Vantage exists to do that scrambling automatically. It
                  watches the forecast over your service area, and the moment
                  conditions change, it reaches out to the customers most
                  likely to say yes — the ones who already live a few minutes
                  from your last job.
                </p>
                <p>
                  We're not trying to build software for every kind of
                  business. We're building it for crews who work with their
                  hands, outdoors, on a schedule the weather sets — and who
                  deserve tools that understand that.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-border/60 bg-secondary/20 py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <Reveal>
              <h2 className="text-center text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                What we believe
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {VALUES.map((value, i) => (
                <Reveal key={value.title} delay={i * 90}>
                  <div className="h-full rounded-2xl border border-border bg-card p-6">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-muted">
                      <value.icon className="h-5 w-5 text-brand" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-foreground">
                      {value.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {value.description}
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
                Come see it for yourself.
              </h2>
              <p className="mt-3 text-base text-sidebar-foreground/70">
                Set up your account and your first weather trigger in under
                ten minutes.
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
