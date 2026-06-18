import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Shield, Plus, Satellite, Ruler, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency, fetchTradePresets, DEFAULT_PRESET, type PresetUpgrade } from "@/lib/fsm";
import { useNotifications } from "@/lib/notifications";
import { toast } from "sonner";
import { SatelliteMeasure, type MeasureResult } from "@/components/SatelliteMeasure";

export const Route = createFileRoute("/quotes")({
  head: () => ({
    meta: [
      { title: "Your Quote — Vantage FSM" },
      {
        name: "description",
        content:
          "Review your base service price and add optional upgrades. Your total updates instantly as you customize the job.",
      },
      { property: "og:title", content: "Your Quote — Vantage FSM" },
      {
        property: "og:description",
        content: "Build your service estimate with optional upgrades and live pricing.",
      },
      { property: "og:url", content: "https://vantage-front-edge.lovable.app/quotes" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-front-edge.lovable.app/quotes" }],
  }),
  component: QuotesPage,
});

/** Internal pricing rate applied to satellite-measured footage. */
const RATE_PER_SQFT = 0.85;
const RATE_PER_LINEAR_FT = 3.5;

function QuotesPage() {
  const { data: preset } = useQuery({
    queryKey: ["trade_presets"],
    queryFn: fetchTradePresets,
  });

  const base = preset ?? DEFAULT_PRESET;
  const basePrice = Number(base.base_price) || 0;
  const upgrades: PresetUpgrade[] = base.upgrades?.length ? base.upgrades : DEFAULT_PRESET.upgrades;

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [measureOpen, setMeasureOpen] = useState(false);
  const [measure, setMeasure] = useState<MeasureResult | null>(null);

  // Default-select recommended upgrades whenever the preset loads/changes.
  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const u of upgrades) if (u.recommended) next[u.key] = true;
    setSelected(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.profession, upgrades.length]);

  const { notify } = useNotifications();
  const toggle = (key: string) => setSelected((s) => ({ ...s, [key]: !s[key] }));

  function approveQuote() {
    notify(
      "quote_approved",
      "Quote approved & signed",
      `A customer checked out and signed a ${formatCurrency(total)} estimate.`,
    );
    toast.success("Quote approved — the customer has been notified.");
  }

  const measuredCharge = useMemo(() => {
    if (!measure) return 0;
    return Math.round(
      measure.feet * (measure.mode === "area" ? RATE_PER_SQFT : RATE_PER_LINEAR_FT),
    );
  }, [measure]);

  const baseTotal = basePrice + measuredCharge;

  const upgradesTotal = useMemo(
    () => upgrades.filter((u) => selected[u.key]).reduce((sum, u) => sum + Number(u.price), 0),
    [selected, upgrades],
  );

  const total = baseTotal + upgradesTotal;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <PageHeader
        title="Your Service Quote"
        description={`Tailored for ${base.profession}. Add any optional upgrades — your total updates in real time.`}
        action={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMeasureOpen(true)}>
            <Satellite className="h-4 w-4" />
            Satellite Measure
          </Button>
        }
      />

      <div className="mt-5 md:mt-8 space-y-6">
        {/* Base job */}
        <section className="rounded-2xl border border-border bg-card p-3 md:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">{base.base_job_title}</h2>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {base.base_job_description}
                </p>
              </div>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-foreground">
              {formatCurrency(baseTotal)}
            </span>
          </div>

          {measure && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <Ruler className="h-4 w-4 text-revenue" />
                Satellite measured: {measure.feet.toLocaleString()}{" "}
                {measure.mode === "area" ? "sq ft" : "linear ft"}
              </span>
              <span className="font-semibold text-revenue">+{formatCurrency(measuredCharge)}</span>
            </div>
          )}
        </section>

        {/* Optional upgrades */}
        <section className="rounded-2xl border border-border bg-card p-3 md:p-6 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-revenue" />
            <h2 className="text-lg font-bold text-foreground">Optional Upgrades</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Tap any upgrade to add it. Your total updates instantly.
          </p>

          <ul className="space-y-2.5">
            {upgrades.map((u) => {
              const isOn = !!selected[u.key];
              return (
                <li key={u.key}>
                  <button
                    type="button"
                    onClick={() => toggle(u.key)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                      isOn
                        ? "border-revenue/60 bg-revenue-muted/40 ring-1 ring-revenue/30"
                        : "border-border hover:border-revenue/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-colors",
                        isOn
                          ? "border-revenue bg-revenue text-revenue-foreground"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {isOn ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{u.name}</span>
                        {u.recommended && (
                          <span className="rounded-full bg-revenue-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-revenue">
                            Recommended
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {u.description}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold text-foreground">
                      +{formatCurrency(Number(u.price))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Live total */}
        <section className="sticky bottom-4 rounded-2xl border border-revenue/40 bg-card p-3 md:p-6 shadow-md ring-1 ring-revenue/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your Total
              </p>
              <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-revenue">
                {formatCurrency(total)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Base {formatCurrency(baseTotal)} + upgrades {formatCurrency(upgradesTotal)}
              </p>
            </div>
            <Button variant="revenue" size="lg" className="h-12" onClick={approveQuote}>
              Approve Quote
            </Button>
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          Prices include parts, labor, and applicable warranty. Final invoice may vary based on
          on-site conditions.
        </p>
      </div>

      <SatelliteMeasure
        open={measureOpen}
        onOpenChange={setMeasureOpen}
        onApply={setMeasure}
      />
    </div>
  );
}
