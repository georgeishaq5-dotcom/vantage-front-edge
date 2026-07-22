import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { ComingSoonNotice } from "@/components/UpgradeCallout";
import { formatCurrency } from "@/lib/fsm";

export const Route = createFileRoute("/financials")({
  head: () => ({
    meta: [
      { title: "Financials — Vantage FSM" },
      {
        name: "description",
        content: "Job costing and profitability — see true margin on every job.",
      },
    ],
  }),
  component: FinancialsPage,
});

// Illustrative sample rows shown grayed-out behind the coming-soon notice, so
// the value of the feature is visible without implying it's live.
const SAMPLE_ROWS = [
  { job: "Delgado — HVAC tune-up", revenue: 640, cost: 275 },
  { job: "Okafor — Fence install", revenue: 3200, cost: 1850 },
  { job: "Reyes — Drain repair", revenue: 480, cost: 190 },
  { job: "Chen — Lawn contract", revenue: 240, cost: 95 },
];

function FinancialsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 md:py-8">
      <PageHeader
        title="Financials"
        description="Job costing & profitability — true margin on every job."
      />

      <ComingSoonNotice feature="financials" className="mt-4 md:mt-6" />

      {/* Sample data, grayed out — a teaser, never presented as real. */}
      <div
        className="mt-4 overflow-hidden rounded-xl border border-border bg-card opacity-50 grayscale"
        aria-hidden
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-semibold">Job</th>
                <th className="px-6 py-3 font-semibold">Revenue</th>
                <th className="px-6 py-3 font-semibold">Cost</th>
                <th className="px-6 py-3 font-semibold">Margin</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ROWS.map((r) => {
                const margin = r.revenue - r.cost;
                const pct = Math.round((margin / r.revenue) * 100);
                return (
                  <tr key={r.job} className="border-b border-border last:border-0">
                    <td className="px-6 py-3.5 font-medium text-foreground">{r.job}</td>
                    <td className="px-6 py-3.5 text-foreground">{formatCurrency(r.revenue)}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">{formatCurrency(r.cost)}</td>
                    <td className="px-6 py-3.5 font-semibold text-revenue">
                      {formatCurrency(margin)} · {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
