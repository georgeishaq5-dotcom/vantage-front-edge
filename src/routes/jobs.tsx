import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/PageHeader";
import { CreateJobModal } from "@/components/CreateJobModal";
import {
  fetchJobsWithCustomers,
  formatCurrency,
  formatDate,
  JOB_STATUSES,
  type JobStatus,
  type JobWithCustomer,
} from "@/lib/fsm";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs — Vantage FSM" },
      {
        name: "description",
        content: "Track every job across Quoted, Scheduled, Completed, and Paid on a clean Kanban board.",
      },
      { property: "og:title", content: "Jobs — Vantage FSM" },
      { property: "og:description", content: "Kanban board for field service jobs." },
    ],
  }),
  component: JobsPage,
});

const COLUMN_ACCENT: Record<JobStatus, string> = {
  Quoted: "bg-muted-foreground/40",
  Scheduled: "bg-sky-500",
  Completed: "bg-amber-500",
  Paid: "bg-revenue",
};

function JobsPage() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsWithCustomers,
  });

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <PageHeader
        title="Jobs"
        description="Drag-free overview of your pipeline by status."
        action={<CreateJobModal />}
      />

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {JOB_STATUSES.map((status) => {
          const columnJobs = jobs.filter((j) => j.status === status);
          const total = columnJobs.reduce((s, j) => s + Number(j.quote_amount), 0);
          return (
            <div key={status} className="flex flex-col rounded-xl border border-border bg-secondary/40">
              <div className="flex items-center justify-between rounded-t-xl border-b border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${COLUMN_ACCENT[status]}`} />
                  <span className="text-sm font-semibold text-foreground">{status}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {columnJobs.length}
                  </span>
                </div>
                <span
                  className={
                    status === "Paid"
                      ? "text-xs font-semibold text-revenue"
                      : "text-xs font-medium text-muted-foreground"
                  }
                >
                  {formatCurrency(total)}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-3">
                {isLoading ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">Loading…</p>
                ) : columnJobs.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No jobs</p>
                ) : (
                  columnJobs.map((job) => <JobCard key={job.id} job={job} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JobCard({ job }: { job: JobWithCustomer }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="text-sm font-semibold text-foreground">{job.customer_name}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{job.title}</div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">{formatDate(job.service_date)}</span>
        <span
          className={
            job.status === "Paid"
              ? "text-sm font-bold text-revenue"
              : "text-sm font-bold text-foreground"
          }
        >
          {formatCurrency(Number(job.quote_amount))}
        </span>
      </div>
    </div>
  );
}
