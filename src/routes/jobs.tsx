import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, StickyNote } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { CreateJobModal } from "@/components/CreateJobModal";
import { WorkOrderSheet } from "@/components/WorkOrderSheet";
import { NeighborOutreachFeed } from "@/components/NeighborOutreachFeed";
import { CrewAssignment } from "@/components/CrewAssignment";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { cn } from "@/lib/utils";
import {
  fetchJobsWithFullCustomers,
  fetchTeamMembers,
  fetchJobAssignments,
  updateJob,
  laneTransition,
  jobLane,
  createOutreachForJob,
  DISPATCH_LANES,
  type DispatchLane,
  type JobWithFullCustomer,
  type JobWithCustomer,
  type TeamMember,
  type JobAssignment,
} from "@/lib/fsm";



export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Dispatch Board — Vantage FSM" },
      {
        name: "description",
        content:
          "Drag-and-drop dispatch board to assign field service jobs across Unscheduled, Scheduled Today, and Completed.",
      },
      { property: "og:title", content: "Dispatch Board — Vantage FSM" },
      { property: "og:description", content: "Drag-and-drop dispatch board for field crews." },
    ],
  }),
  component: JobsPage,
});

const LANE_ACCENT: Record<DispatchLane, string> = {
  Unscheduled: "bg-muted-foreground/40",
  "Scheduled Today": "bg-sky-500",
  Completed: "bg-revenue",
};

const TYPE_STYLES: Record<string, string> = {
  Residential: "bg-sky-50 text-sky-700 border border-sky-200",
  Commercial: "bg-secondary text-secondary-foreground border border-border",
  HOA: "bg-amber-50 text-amber-700 border border-amber-200",
};

function JobsPage() {
  const queryClient = useQueryClient();
  const me = useCurrentMember();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsWithFullCustomers,
  });
  const { data: members = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: fetchTeamMembers,
  });
  const { data: assignments = [] } = useQuery({
    queryKey: ["job_assignments"],
    queryFn: fetchJobAssignments,
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverLane, setDragOverLane] = useState<DispatchLane | null>(null);
  const [activeOrder, setActiveOrder] = useState<JobWithCustomer | null>(null);

  const mutation = useMutation({
    mutationFn: ({ id, lane }: { id: string; lane: DispatchLane }) =>
      updateJob(id, { ...laneTransition(lane), scheduled_by_id: me?.id ?? null }),
    onMutate: async ({ id, lane }) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });
      const previous = queryClient.getQueryData<JobWithFullCustomer[]>(["jobs"]);
      const patch = { ...laneTransition(lane), scheduled_by_id: me?.id ?? null };
      queryClient.setQueryData<JobWithFullCustomer[]>(["jobs"], (old = []) =>
        old.map((j) => (j.id === id ? { ...j, ...patch } : j)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["jobs"], ctx.previous);
      toast.error("Failed to move job");
    },
    onSuccess: async (_d, { id, lane }) => {
      toast.success(`Job moved to ${lane}`);
      // Simulate the AI agent background workflow when a job gets scheduled.
      if (lane === "Scheduled Today") {
        const job = jobs.find((j) => j.id === id);
        const created = await createOutreachForJob(
          id,
          job?.customer?.service_address ?? null,
        );
        if (created) {
          toast("AI Operator found 10 neighbors around this job", {
            className: "bg-revenue text-revenue-foreground",
          });
          queryClient.invalidateQueries({ queryKey: ["neighbor_outreach"] });
        }
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),

  });

  function handleDrop(lane: DispatchLane) {
    const id = draggingId;
    setDraggingId(null);
    setDragOverLane(null);
    if (!id) return;
    const job = jobs.find((j) => j.id === id);
    if (!job || jobLane(job) === lane) return;
    mutation.mutate({ id, lane });
  }

  function openOrder(job: JobWithFullCustomer) {
    setActiveOrder({
      ...job,
      customer_name: job.customer?.full_name ?? "Unassigned",
    });
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Dispatch Board"
        description="Drag jobs between lanes to dispatch your crews."
        action={<CreateJobModal />}
      />

      <NeighborOutreachFeed />

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">

        {DISPATCH_LANES.map((lane) => {
          const laneJobs = jobs.filter((j) => jobLane(j) === lane);
          return (
            <div
              key={lane}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverLane(lane);
              }}
              onDragLeave={() => setDragOverLane((c) => (c === lane ? null : c))}
              onDrop={() => handleDrop(lane)}
              className={cn(
                "flex flex-col rounded-xl border bg-secondary/40 transition-colors",
                dragOverLane === lane
                  ? "border-revenue ring-2 ring-revenue/30"
                  : "border-border",
              )}
            >
              <div className="flex items-center justify-between rounded-t-xl border-b border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${LANE_ACCENT[lane]}`} />
                  <span className="text-sm font-semibold text-foreground">{lane}</span>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {laneJobs.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-3">
                {isLoading ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">Loading…</p>
                ) : laneJobs.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                    Drop jobs here
                  </p>
                ) : (
                  laneJobs.map((job) => (
                    <DispatchCard
                      key={job.id}
                      job={job}
                      members={members}
                      assignments={assignments}
                      isDragging={draggingId === job.id}
                      onOpen={() => openOrder(job)}
                      onDragStart={() => setDraggingId(job.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverLane(null);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <WorkOrderSheet
        job={activeOrder}
        open={!!activeOrder}
        onOpenChange={(o) => !o && setActiveOrder(null)}
      />
    </div>
  );
}

function DispatchCard({
  job,
  members,
  assignments,
  isDragging,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  job: JobWithFullCustomer;
  members: TeamMember[];
  assignments: JobAssignment[];
  isDragging?: boolean;
  onOpen?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const customer = job.customer;
  const type = customer?.customer_type;
  const scheduledBy = members.find((m) => m.id === job.scheduled_by_id);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cn(
        "cursor-grab rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:border-revenue/50 hover:shadow-md active:cursor-grabbing active:scale-[0.98]",
        isDragging && "rotate-1 opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {customer?.full_name ?? "Unassigned"}
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{job.title}</div>
        </div>
        {type && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              TYPE_STYLES[type] ?? "bg-secondary text-secondary-foreground"
            }`}
          >
            {type}
          </span>
        )}
      </div>

      {customer?.service_address && (
        <div className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{customer.service_address}</span>
        </div>
      )}

      {customer?.site_notes && (
        <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
          <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2">{customer.site_notes}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="truncate text-[11px] text-muted-foreground">
          Scheduled by: {scheduledBy?.full_name ?? "—"}
        </span>
        <CrewAssignment jobId={job.id} members={members} assignments={assignments} />
      </div>
    </div>
  );
}
