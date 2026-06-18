import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, FileClock, CalendarClock, Info, Sparkles, TrendingUp, MessageSquare, CloudRain, Sun, Snowflake, Megaphone } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { RadiusCampaignModal } from "@/components/RadiusCampaignModal";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useVanChat } from "@/components/VanChat";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  fetchJobsWithCustomers,
  formatCurrency,
  formatDate,
  type JobWithCustomer,
} from "@/lib/fsm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vantage FSM" },
      {
        name: "description",
        content: "Track weekly revenue, pending invoices, and today's scheduled field service jobs.",
      },
      { property: "og:title", content: "Dashboard — Vantage FSM" },
      {
        property: "og:description",
        content: "Track weekly revenue, pending invoices, and today's scheduled jobs.",
      },
    ],
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
    <div className="rounded-xl border border-border bg-card p-3 md:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate text-xs font-medium text-muted-foreground md:text-sm">{label}</span>
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
              ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-revenue-muted text-revenue md:h-9 md:w-9"
              : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground md:h-9 md:w-9"
          }
        >
          {icon}
        </div>
      </div>
      <div
        className={
          emerald
            ? "mt-2 text-xl md:mt-4 md:text-3xl font-extrabold tracking-tight text-revenue"
            : "mt-2 text-xl md:mt-4 md:text-3xl font-extrabold tracking-tight text-foreground"
        }
      >
        {value}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      {askVanPrompt && (
        <button
          type="button"
          onClick={() => van.open(askVanPrompt)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-revenue transition-colors hover:text-revenue/80"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask Van for Max Profit Recommendations
        </button>
      )}
    </div>
  );
}

function Dashboard() {
  const [radiusOpen, setRadiusOpen] = useState(false);
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsWithCustomers,
  });

  const weeklyRevenue = jobs
    .filter((j) => j.status === "Paid" && withinDays(j.service_date, 7))
    .reduce((sum, j) => sum + Number(j.quote_amount), 0);

  const pendingInvoices = jobs.filter((j) => j.status === "Completed");
  const pendingTotal = pendingInvoices.reduce((sum, j) => sum + Number(j.quote_amount), 0);

  const todaysJobs = jobs.filter((j) => j.status === "Scheduled" && isToday(j.service_date));

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
        <PageHeader
          title="Dashboard"
          description="A snapshot of revenue, invoicing, and today's field work."
        />

        <div className="mt-4 md:mt-6 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          <MetricCard
            emerald
            label="Weekly Revenue"
            value={formatCurrency(weeklyRevenue)}
            hint="Paid jobs in the last 7 days"
            icon={<DollarSign className="h-5 w-5" />}
            tooltip="Total value of jobs marked Paid with a service date in the last 7 days."
            askVanPrompt="Analyze my weekly revenue and recommend the highest-margin jobs to prioritize for maximum profit."
          />
          <MetricCard
            label="Pending Invoices"
            value={String(pendingInvoices.length)}
            hint={`${formatCurrency(pendingTotal)} awaiting payment`}
            icon={<FileClock className="h-5 w-5" />}
            tooltip="Completed jobs that have not yet been paid — revenue waiting to be collected."
            askVanPrompt="Which pending invoices should I chase first to maximize collected profit this week?"
          />
          <MetricCard
            label="Scheduled Today"
            value={String(todaysJobs.length)}
            hint="Jobs on today's route"
            icon={<CalendarClock className="h-5 w-5" />}
            tooltip="Jobs with a Scheduled status set for today's date."
            askVanPrompt="Optimize today's schedule and routing to maximize profit across my scheduled jobs."
          />
          <MetricCard
            emerald
            label="Vantage View"
            value={formatCurrency(pendingTotal * 0.6 + weeklyRevenue * 0.18 + 1850)}
            hint="Value generated this month"
            icon={<TrendingUp className="h-5 w-5" />}
            tooltip="Estimated value Vantage generated: recovered invoices, upsell lift, and marketing-driven bookings."
          />
        </div>

        <div className="mt-4 md:mt-6 grid grid-cols-1 gap-3 md:gap-5 lg:grid-cols-2">
          <RoiAuditCard pendingTotal={pendingTotal} weeklyRevenue={weeklyRevenue} />
          <MarketingActivityCard />
        </div>



        <section className="mt-5 md:mt-8 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">Today's Jobs</h2>
            <span className="text-xs text-muted-foreground">Scheduled · {todaysJobs.length}</span>
          </div>
          <JobsTable jobs={todaysJobs} loading={isLoading} />
        </section>
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
    { label: "Marketing-driven bookings", value: 1850 },
  ];
  const total = generatedValue + 1850;

  return (
    <div className="rounded-xl border border-border bg-card p-3 md:p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-revenue-muted text-revenue">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">Vantage View</h2>
            <p className="text-xs text-muted-foreground">ROI Audit · value generated this month</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-revenue-muted/60 p-4">
        <p className="text-xs font-medium text-muted-foreground">Total value generated</p>
        <p className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-revenue">
          {formatCurrency(total)}
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-semibold text-foreground">{formatCurrency(r.value)}</span>
          </li>
        ))}
      </ul>
    </div>
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
    <div className="rounded-xl border border-border bg-card p-3 md:p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
          <MessageSquare className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">Marketing Activity</h2>
          <p className="text-xs text-muted-foreground">Weather-triggered texts Van drafted</p>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {drafts.map((d) => {
          const Icon = d.icon;
          return (
            <li
              key={d.trigger}
              className="rounded-lg border border-border bg-secondary/30 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Icon className={`h-3.5 w-3.5 ${d.color}`} />
                  {d.trigger}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {d.time}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{d.text}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}



function JobsTable({ jobs, loading }: { jobs: JobWithCustomer[]; loading: boolean }) {
  if (loading) {
    return <div className="px-6 py-10 text-center text-sm text-muted-foreground">Loading jobs…</div>;
  }
  if (jobs.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-muted-foreground">
        No jobs scheduled for today.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-6 py-3 font-semibold">Customer</th>
            <th className="px-6 py-3 font-semibold">Service</th>
            <th className="px-6 py-3 font-semibold">Date</th>
            <th className="px-6 py-3 font-semibold">Status</th>
            <th className="px-6 py-3 text-right font-semibold">Quote</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, i) => (
            <tr key={job.id} className={i % 2 === 1 ? "bg-secondary/40" : "bg-card"}>
              <td className="px-6 py-3.5 font-medium text-foreground">{job.customer_name}</td>
              <td className="px-6 py-3.5 text-muted-foreground">{job.title}</td>
              <td className="px-6 py-3.5 text-muted-foreground">{formatDate(job.service_date)}</td>
              <td className="px-6 py-3.5">
                <StatusBadge status={job.status} />
              </td>
              <td className="px-6 py-3.5 text-right font-semibold text-revenue">
                {formatCurrency(Number(job.quote_amount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
