import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fetchJobsWithCustomers, formatCurrency, formatDate } from "@/lib/fsm";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Vantage FSM" },
      {
        name: "description",
        content: "View upcoming scheduled field service jobs on the Vantage FSM calendar.",
      },
      { property: "og:title", content: "Calendar — Vantage FSM" },
      { property: "og:description", content: "Upcoming scheduled field service jobs." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsWithCustomers,
  });

  const scheduled = jobs
    .filter((j) => j.service_date && (j.status === "Scheduled" || j.status === "Quoted"))
    .sort((a, b) => (a.service_date! < b.service_date! ? -1 : 1));

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <PageHeader title="Calendar" description="Upcoming scheduled field work, by date." />

      <section className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Upcoming Jobs</h2>
        </div>
        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : scheduled.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No scheduled jobs.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {scheduled.map((job) => (
              <li key={job.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="font-medium text-foreground">{job.customer_name}</div>
                  <div className="text-sm text-muted-foreground">{job.title}</div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(job.service_date)}
                  </span>
                  <StatusBadge status={job.status} />
                  <span className="w-24 text-right font-semibold text-revenue">
                    {formatCurrency(Number(job.quote_amount))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
