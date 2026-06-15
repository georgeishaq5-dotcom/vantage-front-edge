import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/PageHeader";
import { CreateJobModal } from "@/components/CreateJobModal";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkOrderSheet } from "@/components/WorkOrderSheet";
import { cn } from "@/lib/utils";
import {
  fetchJobsWithCustomers,
  updateJobStatus,
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
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsWithCustomers,
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<JobStatus | null>(null);
  const [activeOrder, setActiveOrder] = useState<JobWithCustomer | null>(null);


  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) =>
      updateJobStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });
      const previous = queryClient.getQueryData<JobWithCustomer[]>(["jobs"]);
      queryClient.setQueryData<JobWithCustomer[]>(["jobs"], (old = []) =>
        old.map((j) => (j.id === id ? { ...j, status } : j)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["jobs"], ctx.previous);
      toast.error("Failed to update job status");
    },
    onSuccess: (_data, { status }) => {
      toast.success(`Job moved to ${status}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  function handleDrop(status: JobStatus) {
    const id = draggingId;
    setDraggingId(null);
    setDragOverColumn(null);
    if (!id) return;
    const job = jobs.find((j) => j.id === id);
    if (!job || job.status === status) return;
    mutation.mutate({ id, status });
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Jobs"
        description={
          isMobile
            ? "Your jobs, grouped by stage."
            : "Drag a card between columns to update its status."
        }
        action={<CreateJobModal />}
      />

      {isMobile ? (
        <MobileJobList jobs={jobs} isLoading={isLoading} onOpen={setActiveOrder} />

      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {JOB_STATUSES.map((status) => {
            const columnJobs = jobs.filter((j) => j.status === status);
            const total = columnJobs.reduce((s, j) => s + Number(j.quote_amount), 0);
            return (
              <div
                key={status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColumn(status);
                }}
                onDragLeave={() => setDragOverColumn((c) => (c === status ? null : c))}
                onDrop={() => handleDrop(status)}
                className={cn(
                  "flex flex-col rounded-xl border bg-secondary/40 transition-colors",
                  dragOverColumn === status
                    ? "border-revenue ring-2 ring-revenue/30"
                    : "border-border",
                )}
              >
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
                    <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                      Drop jobs here
                    </p>
                  ) : (
                    columnJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        draggable
                        isDragging={draggingId === job.id}
                        onOpen={() => setActiveOrder(job)}
                        onDragStart={() => setDraggingId(job.id)}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOverColumn(null);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobileJobList({
  jobs,
  isLoading,
  onOpen,
}: {
  jobs: JobWithCustomer[];
  isLoading: boolean;
  onOpen: (job: JobWithCustomer) => void;
}) {
  if (isLoading) {
    return <p className="mt-8 text-center text-sm text-muted-foreground">Loading…</p>;
  }
  return (
    <div className="mt-5 space-y-6">
      {JOB_STATUSES.map((status) => {
        const columnJobs = jobs.filter((j) => j.status === status);
        if (columnJobs.length === 0) return null;
        return (
          <section key={status}>
            <div className="mb-2 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${COLUMN_ACCENT[status]}`} />
              <h2 className="text-sm font-semibold text-foreground">{status}</h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {columnJobs.length}
              </span>
            </div>
            <div className="space-y-3">
              {columnJobs.map((job) => (
                <JobCard key={job.id} job={job} showStatus onOpen={() => onOpen(job)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}


function JobCard({
  job,
  draggable,
  isDragging,
  showStatus,
  onDragStart,
  onDragEnd,
}: {
  job: JobWithCustomer;
  draggable?: boolean;
  isDragging?: boolean;
  showStatus?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        draggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{job.customer_name}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{job.title}</div>
        </div>
        {showStatus && <StatusBadge status={job.status} className="shrink-0" />}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">{formatDate(job.service_date)}</span>
        <span
          className={
            job.status === "Paid"
              ? "text-sm font-bold text-revenue"
              : "text-sm font-bold text-revenue"
          }
        >
          {formatCurrency(Number(job.quote_amount))}
        </span>
      </div>
    </div>
  );
}
