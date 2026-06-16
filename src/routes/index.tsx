import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, FileClock, CalendarClock, Info, Sparkles, TrendingUp, MessageSquare, CloudRain, Sun, Snowflake } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
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
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`What is ${label}?`}
                  className="text-muted-foreground/60 transition-colors hover:text-foreground"
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
              ? "flex h-9 w-9 items-center justify-center rounded-lg bg-revenue-muted text-revenue"
              : "flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground"
          }
        >
          {icon}
        </div>
      </div>
      <div
        className={
          emerald
            ? "mt-4 text-3xl font-extrabold tracking-tight text-revenue"
            : "mt-4 text-3xl font-extrabold tracking-tight text-foreground"
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
      <div className="mx-auto max-w-6xl px-8 py-8">
        <PageHeader
          title="Dashboard"
          description="A snapshot of revenue, invoicing, and today's field work."
        />

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>

        <section className="mt-8 rounded-xl border border-border bg-card shadow-sm">
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
