import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { MousePointerClick, Send, Radar } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildPromoTexts,
  CAMPAIGN_FUNNEL,
  CAMPAIGN_STATUS_STYLES,
  fetchCustomers,
  formatRelativeTime,
  nextCampaignStatus,
  type CampaignStatus,
  type PromoText,
} from "@/lib/fsm";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaign Analytics — Vantage FSM" },
      {
        name: "description",
        content:
          "Micro-analytics for automated promo texts: a conversion funnel and live status tracking from Sent to Job Booked.",
      },
      { property: "og:title", content: "Campaign Analytics — Vantage FSM" },
      {
        property: "og:description",
        content: "Track promo text performance from Sent through Job Booked.",
      },
    ],
  }),
  component: CampaignsPage,
});

const FUNNEL_ACCENT: Record<CampaignStatus, string> = {
  Sent: "bg-slate-400",
  Delivered: "bg-sky-500",
  "Link Clicked": "bg-amber-400",
  "Job Booked": "bg-revenue",
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        CAMPAIGN_STATUS_STYLES[status],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", FUNNEL_ACCENT[status])} />
      {status}
    </span>
  );
}

function CampaignsPage() {
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });
  const seedAddresses = useMemo(
    () => customers.map((c) => c.service_address).filter((a): a is string => !!a),
    [customers],
  );

  const [texts, setTexts] = useState<PromoText[]>([]);
  const initialized = useRef(false);

  // Seed once from customer addresses (or fallbacks before they load).
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setTexts(buildPromoTexts(seedAddresses));
  }, [seedAddresses]);

  // Simulate the delivery → click → booked timeline advancing over time.
  useEffect(() => {
    const timer = setInterval(() => {
      setTexts((prev) => {
        const candidates = prev
          .map((t, i) => ({ t, i }))
          .filter(({ t }) => nextCampaignStatus(t.status) !== null);
        if (candidates.length === 0) return prev;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const next = nextCampaignStatus(pick.t.status);
        if (!next) return prev;
        const copy = [...prev];
        copy[pick.i] = { ...pick.t, status: next };
        if (next === "Job Booked") {
          toast.success("Job booked from promo", {
            description: `${pick.t.recipient} converted via "${pick.t.campaign}".`,
          });
        }
        return copy;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const counts = useMemo(() => {
    const order = CAMPAIGN_FUNNEL;
    return order.map((stage, idx) => {
      // Funnel is cumulative: anyone at a later stage also passed this one.
      const reached = texts.filter((t) => order.indexOf(t.status) >= idx).length;
      return { stage, reached };
    });
  }, [texts]);

  const total = texts.length || 1;

  function advance(id: string) {
    setTexts((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = nextCampaignStatus(t.status);
        return next ? { ...t, status: next } : t;
      }),
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
      <PageHeader
        title="Campaign Analytics"
        description="Live conversion funnel and status tracking for automated Neighbor Hook promo texts."
        action={
          <Button
            variant="revenue"
            onClick={() => {
              initialized.current = true;
              setTexts(buildPromoTexts(seedAddresses));
              toast.success("New promo batch deployed", {
                description: "Outgoing texts queued to adjacent addresses.",
              });
            }}
          >
            <Radar className="h-4 w-4" />
            Deploy New Batch
          </Button>
        }
      />

      <div className="mt-4 md:mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(({ stage, reached }) => {
          const pct = Math.round((reached / total) * 100);
          return (
            <div
              key={stage}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stage}
                </span>
                <span className={cn("h-2 w-2 rounded-full", FUNNEL_ACCENT[stage])} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{reached}</span>
                <span className="text-sm text-muted-foreground">{pct}%</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", FUNNEL_ACCENT[stage])}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 md:mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-6 py-3">
          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Recent Outgoing Promo Texts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-semibold">Recipient</th>
                <th className="px-6 py-3 font-semibold">Target Address</th>
                <th className="px-6 py-3 font-semibold">Campaign</th>
                <th className="px-6 py-3 font-semibold">Sent</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {texts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No promo texts yet.
                  </td>
                </tr>
              ) : (
                texts.map((t, i) => {
                  const canAdvance = nextCampaignStatus(t.status) !== null;
                  return (
                    <tr key={t.id} className={i % 2 === 1 ? "bg-secondary/30" : "bg-card"}>
                      <td className="px-6 py-3.5 font-medium text-foreground">{t.recipient}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{t.address}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{t.campaign}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{formatRelativeTime(t.sentAt)}</td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canAdvance}
                          onClick={() => advance(t.id)}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {canAdvance ? "Advance" : "Converted"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
