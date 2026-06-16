import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crown, UserPlus } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  assignMember,
  unassignMember,
  setLeadTech,
  avatarTint,
  initials,
  type JobAssignment,
  type TeamMember,
} from "@/lib/fsm";

export function MemberAvatar({
  member,
  isLead,
  size = "sm",
  className,
}: {
  member: TeamMember;
  isLead?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className="relative" title={`${member.full_name}${isLead ? " · Lead Tech" : ""}`}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold ring-2 ring-card",
          size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs",
          avatarTint(member.id),
          isLead && "ring-revenue",
          className,
        )}
      >
        {initials(member.full_name)}
      </div>
      {isLead && (
        <Crown className="absolute -right-1 -top-1.5 h-3.5 w-3.5 fill-revenue text-revenue" />
      )}
    </div>
  );
}

export function CrewAssignment({
  jobId,
  members,
  assignments,
  disabled,
}: {
  jobId: string;
  members: TeamMember[];
  assignments: JobAssignment[];
  disabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const jobAssignments = assignments.filter((a) => a.job_id === jobId);
  const memberById = new Map(members.map((m) => [m.id, m]));

  const assigned = jobAssignments
    .map((a) => ({ assignment: a, member: memberById.get(a.team_member_id) }))
    .filter((x): x is { assignment: JobAssignment; member: TeamMember } => !!x.member)
    .sort((a, b) => Number(b.assignment.is_lead) - Number(a.assignment.is_lead));

  const hasLead = jobAssignments.some((a) => a.is_lead);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["job_assignments"] });

  const toggle = useMutation({
    mutationFn: async ({ memberId, on }: { memberId: string; on: boolean }) => {
      if (on) await assignMember(jobId, memberId);
      else await unassignMember(jobId, memberId);
    },
    onError: () => toast.error("Could not update crew"),
    onSuccess: invalidate,
  });

  const makeLead = useMutation({
    mutationFn: (memberId: string) => setLeadTech(jobId, memberId),
    onError: () => toast.error("Could not set Lead Tech"),
    onSuccess: () => {
      invalidate();
      toast.success("Lead Tech updated");
    },
  });

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex -space-x-2">
        {assigned.length === 0 ? (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        ) : (
          assigned.map(({ member, assignment }) => (
            <MemberAvatar key={member.id} member={member} isLead={assignment.is_lead} />
          ))
        )}
      </div>

      {!disabled && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Assign crew"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-revenue hover:text-revenue"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0">
            <div className="border-b border-border px-3 py-2.5">
              <p className="text-sm font-semibold text-foreground">Assign Crew</p>
              <p className="text-xs text-muted-foreground">
                {hasLead ? "Lead Tech designated" : "Select a Lead Tech (required)"}
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {members.map((m) => {
                const a = jobAssignments.find((x) => x.team_member_id === m.id);
                const isAssigned = !!a;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/60"
                  >
                    <button
                      type="button"
                      onClick={() => toggle.mutate({ memberId: m.id, on: !isAssigned })}
                      className="flex flex-1 items-center gap-2.5 text-left"
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={isAssigned}
                        className="h-4 w-4 accent-revenue"
                      />
                      <MemberAvatar member={m} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {m.full_name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {m.role}
                        </span>
                      </span>
                    </button>
                    {isAssigned && (
                      <button
                        type="button"
                        onClick={() => makeLead.mutate(m.id)}
                        aria-label="Make Lead Tech"
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                          a?.is_lead
                            ? "border-revenue bg-revenue-muted text-revenue"
                            : "border-border text-muted-foreground hover:border-revenue hover:text-revenue",
                        )}
                        title="Designate Lead Tech"
                      >
                        <Crown className={cn("h-3.5 w-3.5", a?.is_lead && "fill-revenue")} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
