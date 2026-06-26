import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CloudRain,
  MapPin,
  CreditCard,
  Clock,
  Calendar,
  FileText,
  MessageSquare,
  BarChart3,
  ArrowRight,
} from "lucide-react";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Reveal } from "@/components/marketing/Reveal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Vantage" },
      {
        name: "description",
        content:
          "Quoting, dispatch, weather-triggered outreach, and radius marketing built for field service crews.",
      },
    ],
  }),
  component: FeaturesPage,
});

const SECTIONS = [
  {
    icon: CloudRain,
    eyebrow: "Outreach",
    title: "Texts go out the moment the weather clears",
    description:
      "Vantage watches the forecast over your service area. When rain stops or a heat warning lifts, it automatically texts nearby leads with an open slot — before they've even thought about booking someone else.",
    bullets: [
      "Set rules per job type (rain-out, heatwave, frost warning)",
      "Texts pull from real-time local forecasts, not a generic schedule",
      "Pause anytime — you stay in control of every send",
    ],
  },
  {
    icon: MapPin,
    eyebrow: "Growth",
    title: "Turn one finished job into five new leads",
    description:
      "Draw a radius around any completed job and Vantage quietly markets to the neighbors — the people most likely to say yes, because they just watched you work.",
    bullets: [
      "Geo-fence any address in seconds",
      "Auto-generated flyers and door-hanger copy",
      "Track which radius campaigns actually convert",
    ],
  },
  {
    icon: Calendar,
    eyebrow: "Operations",
    title: "Dispatch that doesn't live in a group chat",
    description:
      "See every job, every crew, and every customer on one calendar. Assign work in a tap, and everyone shows up knowing exactly where to be.",
    bullets: [
      "Drag-and-drop scheduling",
      "Crew assignment with conflict warnings",
      "Customer-facing job confirmations, sent automatically",
    ],
  },
  {
    icon: FileText,
    eyebrow: "Sales",
    title: "Quotes that turn into signed jobs faster",
    description:
      "Build a quote on-site in minutes, with AI-drafted line items based on the job type. Customers approve with a tap — no back-and-forth.",
    bullets: [
      "AI-assisted quote drafts from a few details",
      "Digital approval, no printing or signing in person",
      "Quotes convert straight into scheduled jobs",
    ],
  },
  {
    icon: CreditCard,
    eyebrow: "Payments",
    title: "Get paid before you leave the driveway",
    description:
      "Stripe is built in from day one. Take a deposit when the quote is approved, and collect the balance the moment the job is done.",
    bullets: [
      "Deposits, full payments, and invoicing in one flow",
      "Customers pay from a text link — no app required",
      "Every payment ties back to the job and customer automatically",
    ],
  },
  {
    icon: BarChart3,
    eyebrow: "Insight",
    title: "Know what's actually making you money",
    description:
      "A ledger built for a service business, not a generic accounting tool — revenue, outstanding invoices, and job profitability in one place.",
    bullets: [
      "Weekly revenue and pending invoices at a glance",
      "Job-level profitability, not just totals",
      "No spreadsheet required",
    ],
  },
];

function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />

      <main className="flex-1">
        <section className="border-b border-border/60 bg-secondary/20 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
            <Reveal>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-muted px-3 py-1 text-xs font-semibold text-brand">
                Features
              </span>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                Built around the way field crews actually work.
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Every tool you need to quote, dispatch, get paid, and grow —
                in one place, built for the work that happens outside.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-5xl space-y-20 px-4 md:px-6">
            {SECTIONS.map((section, i) => (
              <Reveal key={section.title}>
                <div
                  className={[
                    "grid items-center gap-10 md:grid-cols-2 md:gap-16",
                    i % 2 === 1 ? "md:[&>*:first-child]:order-2" : "",
                  ].join(" ")}
                >
                  <div>
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-muted">
                      <section.icon className="h-6 w-6 text-brand" />
                    </div>
                    <span className="mt-4 block text-xs font-bold uppercase tracking-wide text-revenue">
                      {section.eyebrow}
                    </span>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                      {section.title}
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                      {section.description}
                    </p>
                    <ul className="mt-5 space-y-2.5">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-start gap-2.5 text-sm text-foreground/90"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-border bg-card p-8">
                    <section.icon className="h-20 w-20 text-brand/15" strokeWidth={1.2} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60 bg-sidebar py-20 md:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
              <MessageSquare className="mx-auto h-9 w-9 text-revenue" />
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-sidebar-foreground md:text-4xl">
                See it running on your own jobs.
              </h2>
              <p className="mt-3 text-base text-sidebar-foreground/70">
                Start free — no card required until you've seen it work.
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
