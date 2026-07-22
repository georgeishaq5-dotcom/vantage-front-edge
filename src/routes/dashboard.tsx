import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign,
  FileClock,
  CalendarClock,
  Info,
  Sparkles,
  TrendingUp,
  MessageSquare,
  CloudRain,
  Sun,
  Snowflake,
  Megaphone,
  Truck,
} from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { PlanUsageCard } from "@/components/PlanUsageCard";
import { TrialStatusBanner } from "@/components/TrialStatusBanner";
import { RadiusCampaignModal } from "@/components/RadiusCampaignModal";
import { StatusBadge } from "@/components/StatusBadge";
import { PendingActionsCard } from "@/components/PendingActionsCard";
import { AiQuoteDrafts } from "@/components/AiQuoteDrafts";
import { useVanChat } from "@/components/VanChat";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  fetchJobsWithCustomers,
  formatCurrency,
  formatDate,
  type JobWithCustomer,
} from "@/lib/fsm";

// Note: domain-based redirect (app.vantage-fsm.com vs marketing domain) for
// this route is handled centrally in __root.tsx, since the same rule
// applies to every app route, not just /dashboard.
export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vantage FSM" },
      {
        name: "description",
        content:
          "Track weekly revenue, pending invoices, and today's scheduled field service jobs.",
      },
      { property: "og:title", content: "Dashboard — Vantage FSM" },
      {
        property: "og:description",
        content: "Track weekly revenue, pending invoices, and today's scheduled jobs.",
      },
      { property: "og:url", content: "https://vantage-front-edge.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-front-edge.lovable.app/" }],
  }),
  component: Dashboard,
});

function isToday(date: string | null): boolean {
  if (!date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return date.slice(0, 10) === today;
}

function withinDays(date: string | null, days: number): boolean {
  if (!date) return false;
  const d = new Date(date.slice(0, 10) + "T00:00:00").getTime();
  const now = Date.now();
  return d <= now && d >= now - days * 86_400_000;
}

/** Buckets paid job revenue into the last 12 trailing weeks, oldest first. */
function weeklyRevenueSeries(jobs: JobWithCustomer[]): number[] {
  const weeks = Array.from({ length: 12 }, () => 0);
  const now = Date.now();
  for (const job of jobs) {
    if (job.status !== "Paid" || !job.service_date) continue;
    const d = new Date(job.service_date.slice(0, 10) + "T00:00:00").getTime();
    const weeksAgo = Math.floor((now - d) / (7 * 86_400_000));
    if (weeksAgo < 0 || weeksAgo >= 12) continue;
    weeks[11 - weeksAgo] += Number(job.quote_amount);
  }
  return weeks;
}

/** Card shell matching the canonical design: sharp corners, hairline border. */
function DashCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`border border-border bg-card ${className ?? ""}`}>{children}</div>;
}

function CardSectionHeader({
  icon,
  iconEmerald,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode;
  iconEmerald?: boolean;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start gap-[11px] border-b border-border px-[18px] py-3.5">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center ${
          iconEmerald ? "bg-revenue/15 text-revenue" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground">
          {title}
        </p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">{description}</p>
      </div>
      {badge && (
        <span className="inline-flex h-5 shrink-0 items-center bg-muted px-[9px] text-[9.5px] font-extrabold uppercase tracking-wide text-muted-foreground">
          {badge}
        </span>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  emerald,
  tooltip,
  askVanPrompt,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  emerald?: boolean;
  tooltip?: string;
  askVanPrompt?: string;
}) {
  const van = useVanChat();
  return (
    <DashCard className="px-[18px] py-4">
      <div className="flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1">
          <span className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </span>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`What is ${label}?`}
                  className="shrink-0 text-muted-foreground/60 transition-colors hover:text-foreground"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px]">{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div
          className={
            emerald
              ? "flex h-6 w-6 shrink-0 items-center justify-center bg-revenue/15 text-revenue"
              : "flex h-6 w-6 shrink-0 items-center justify-center bg-muted text-muted-foreground"
          }
        >
          {icon}
        </div>
      </div>
      <div className="mt-3 text-[27px] font-extrabold tracking-[-0.02em] text-foreground">
        {value}
      </div>
      <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">{hint}</p>
      {askVanPrompt && (
        <button
          type="button"
          onClick={() => van.open(askVanPrompt)}
          className="mt-2.5 inline-flex items-center gap-1.5 text-[10.5px] font-bold text-revenue transition-colors hover:text-revenue/80"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask Van for Max Profit Recommendations
        </button>
      )}
    </DashCard>
  );
}

function AskVanBanner() {
  const van = useVanChat();
  return (
    <button
      type="button"
      onClick={() => van.open()}
      className="flex w-full items-center gap-[13px] border border-revenue/35 bg-revenue/[0.08] p-3.5 text-left transition-colors hover:bg-revenue/[0.12] active:scale-[0.99] md:p-4"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center bg-revenue text-[oklch(0.16_0.04_158)]">
        <Truck className="h-[17px] w-[17px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-extrabold text-foreground">
          Talk or type — Van will handle it
        </p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          No need to click around the app. Tell Van what you need — a quote, a reschedule, a
          reminder — and it gets done.
        </p>
      </div>
      <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-revenue">
        Ask Van →
      </span>
    </button>
  );
}

const WEEK_LABELS = ["12 wks ago", "9 wks ago", "6 wks ago", "This wk"];

function RevenueChartCard({ series }: { series: number[] }) {
  const max = Math.max(...series, 1);
  const avg = series.reduce((sum, v) => sum + v, 0) / series.length;

  return (
    <DashCard className="px-5 py-[18px]">
      <div className="flex flex-wrap items-baseline justify-between gap-1.5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
          Revenue · last 12 weeks
        </p>
        <p className="text-[11px] font-bold text-muted-foreground">
          Avg <span className="text-revenue">{formatCurrency(avg)}</span> / wk
        </p>
      </div>
      <div className="mt-4 flex h-[120px] items-end gap-1.5 border-b border-border">
        {series.map((value, i) => {
          const isLast = i === series.length - 1;
          const heightPct = Math.max((value / max) * 100, 3);
          return (
            <div
              key={i}
              className={
                isLast
                  ? "min-w-0 flex-1 bg-revenue shadow-[0_0_18px_oklch(0.6_0.15_158/35%)]"
                  : "min-w-0 flex-1 bg-revenue/25"
              }
              style={{ height: `${heightPct}%` }}
              title={formatCurrency(value)}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70">
        {WEEK_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </DashCard>
  );
}

function Dashboard() {
  const [radiusOpen, setRadiusOpen] = useState(false);
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsWithCustomers,
  });
  // Debug: verify the Customers/Jobs relational ledger plumbing is wired up.
  useEffect(() => {
    const verifyLedgerTables = async () => {
      const [customersRes, jobsRes] = await Promise.all([
        supabase.from("customers").select("*"),
        supabase.from("jobs").select("*, customers(full_name)"),
      ]);

      if (customersRes.error || jobsRes.error) {
        console.error("❌ Supabase Fetch Error:", customersRes.error ?? jobsRes.error);
        return;
      }

      console.log("✅ Supabase Data Successfully Pulled:", {
        customers: customersRes.data,
        jobs: jobsRes.data,
      });
    };

    verifyLedgerTables();
  }, []);

  const weeklyRevenue = jobs
    .filter((j) => j.status === "Paid" && withinDays(j.service_date, 7))
    .reduce((sum, j) => sum + Number(j.quote_amount), 0);

  const pendingInvoices = jobs.filter((j) => j.status === "Completed");
  const pendingTotal = pendingInvoices.reduce((sum, j) => sum + Number(j.quote_amount), 0);

  const todaysJobs = jobs.filter((j) => j.status === "Scheduled" && isToday(j.service_date));
  const revenueSeries = weeklyRevenueSeries(jobs);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto max-w-[1440px] px-4 py-5 md:px-8 md:py-7">
        <PageHeader
          title="Dashboard"
          description="A snapshot of revenue, invoicing, and today's field work."
        />

        <div className="mt-4 md:mt-4">
          <AskVanBanner />
        </div>

        <TrialStatusBanner className="mt-3.5" />

        <PlanUsageCard className="mt-3.5" />

        <div className="mt-3.5 md:mt-3.5">
          <RevenueChartCard series={revenueSeries} />
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <MetricCard
            emerald
            label="Weekly Revenue"
            value={formatCurrency(weeklyRevenue)}
            hint="Paid jobs in the last 7 days"
            icon={<DollarSign className="h-3 w-3" />}
            tooltip="Total value of jobs marked Paid with a service date in the last 7 days."
            askVanPrompt="Analyze my weekly revenue and recommend the highest-margin jobs to prioritize for maximum profit."
          />
          <MetricCard
            label="Pending Invoices"
            value={String(pendingInvoices.length)}
            hint={`${formatCurrency(pendingTotal)} awaiting payment`}
            icon={<FileClock className="h-3 w-3" />}
            tooltip="Completed jobs that have not yet been paid — revenue waiting to be collected."
            askVanPrompt="Which pending invoices should I chase first to maximize collected profit this week?"
          />
          <MetricCard
            label="Scheduled Today"
            value={String(todaysJobs.length)}
            hint="Jobs on today's route"
            icon={<CalendarClock className="h-3 w-3" />}
            tooltip="Jobs with a Scheduled status set for today's date."
            askVanPrompt="Optimize today's schedule and routing to maximize profit across my scheduled jobs."
          />
          <MetricCard
            emerald
            label="Vantage View"
            value={formatCurrency(pendingTotal * 0.6 + weeklyRevenue * 0.18)}
            hint="Value generated this month"
            icon={<TrendingUp className="h-3 w-3" />}
            tooltip="Estimated value Vantage generated: recovered invoices and upsell lift."
          />
        </div>

        <button
          type="button"
          onClick={() => setRadiusOpen(true)}
          className="mt-3.5 flex h-11 w-full items-stretch self-start bg-foreground text-background transition-transform active:scale-[0.97] md:mt-4 md:h-[38px] md:w-auto"
        >
          <span className="block w-1 bg-revenue" />
          <span className="flex flex-1 items-center justify-center gap-2 px-4 text-[10.5px] font-extrabold uppercase tracking-[0.18em] md:flex-initial">
            <Megaphone className="h-[13px] w-[13px]" />
            Launch Radius Campaign
          </span>
        </button>
        <RadiusCampaignModal open={radiusOpen} onOpenChange={setRadiusOpen} />

        <div className="mt-3.5 grid grid-cols-1 items-start gap-3.5 md:mt-4 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3.5">
            <PendingActionsCard />

            <DashCard>
              <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground">
                  Today's Jobs
                </p>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Scheduled · {todaysJobs.length}
                </span>
              </div>
              <JobsTable jobs={todaysJobs} loading={isLoading} />
            </DashCard>
          </div>

          <div className="flex min-w-0 flex-col gap-3.5">
            <AiQuoteDrafts />
            <RoiAuditCard pendingTotal={pendingTotal} weeklyRevenue={weeklyRevenue} />
            <MarketingActivityCard />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function RoiAuditCard({
  pendingTotal,
  weeklyRevenue,
}: {
  pendingTotal: number;
  weeklyRevenue: number;
}) {
  // Vantage's generated value: recovered invoices + estimated upsell lift.
  const recoveredValue = pendingTotal * 0.6;
  const upsellLift = weeklyRevenue * 0.18;
  const generatedValue = recoveredValue + upsellLift;
  const rows = [
    { label: "Invoices recovered by Van", value: recoveredValue },
    { label: "Upsell lift (tiered quotes)", value: upsellLift },
  ];
  const total = generatedValue;

  return (
    <DashCard>
      <CardSectionHeader
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        iconEmerald
        title="Vantage View"
        description="ROI audit · value generated this month"
      />
      <div className="px-[18px] py-3.5">
        <div className="bg-revenue/10 p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-revenue">
            Total value generated
          </p>
          <p className="mt-1.5 text-[26px] font-extrabold tracking-[-0.02em] text-revenue">
            {formatCurrency(total)}
          </p>
        </div>
        <ul className="mt-2.5 flex flex-col">
          {rows.map((r) => (
            <li
              key={r.label}
              className="flex items-center justify-between border-t border-border py-[11px] text-[12.5px]"
            >
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-bold text-foreground">{formatCurrency(r.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </DashCard>
  );
}

function MarketingActivityCard() {
  const drafts = [
    {
      icon: Sun,
      trigger: "Heatwave",
      color: "text-amber-600",
      text: "AC running non-stop? Beat the heat — book a tune-up today and save 15%.",
      time: "2h ago",
    },
    {
      icon: CloudRain,
      trigger: "Rain & Storm",
      color: "text-sky-600",
      text: "Storms rolling in. Get your gutters & sump pump checked before the downpour.",
      time: "Yesterday",
    },
    {
      icon: Snowflake,
      trigger: "Freezing Temps",
      color: "text-indigo-600",
      text: "Don't let pipes freeze — schedule your winter-ready inspection this week.",
      time: "2 days ago",
    },
  ];

  return (
    <DashCard>
      <CardSectionHeader
        icon={<MessageSquare className="h-3.5 w-3.5" />}
        title="Marketing Activity"
        description="Weather-triggered texts Van drafted"
      />
      <ul className="flex flex-col gap-[9px] px-[18px] py-3.5">
        {drafts.map((d) => {
          const Icon = d.icon;
          return (
            <li key={d.trigger} className="border border-border bg-background px-[13px] py-[11px]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-foreground">
                  <Icon className={`h-3.5 w-3.5 ${d.color}`} />
                  {d.trigger}
                </span>
                <span className="text-[9.5px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  {d.time}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{d.text}</p>
            </li>
          );
        })}
      </ul>
    </DashCard>
  );
}

function JobsTable({ jobs, loading }: { jobs: JobWithCustomer[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="px-[18px] py-10 text-center text-sm text-muted-foreground">Loading jobs…</div>
    );
  }
  if (jobs.length === 0) {
    return (
      <div className="px-[18px] py-10 text-center text-sm text-muted-foreground">
        No jobs scheduled for today.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted text-left">
            <th className="px-[18px] py-2.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
              Customer
            </th>
            <th className="px-[18px] py-2.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
              Service
            </th>
            <th className="px-[18px] py-2.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
              Date
            </th>
            <th className="px-[18px] py-2.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
              Status
            </th>
            <th className="px-[18px] py-2.5 text-right text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
              Quote
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-t border-border">
              <td className="px-[18px] py-[13px] font-bold text-foreground">{job.customer_name}</td>
              <td className="px-[18px] py-[13px] text-muted-foreground">{job.title}</td>
              <td className="px-[18px] py-[13px] text-muted-foreground">
                {formatDate(job.service_date)}
              </td>
              <td className="px-[18px] py-[13px]">
                <StatusBadge status={job.status} />
              </td>
              <td className="px-[18px] py-[13px] text-right font-extrabold text-revenue">
                {formatCurrency(Number(job.quote_amount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
