import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Building2, ShieldCheck, UserPlus, Mail } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { MemberAvatar } from "@/components/CrewAssignment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useIsAdmin } from "@/hooks/useUserRole";
import { inviteTeammate } from "@/lib/team.functions";
import { cn } from "@/lib/utils";
import {
  COMPANY_ID,
  createTeamMember,
  fetchTeamMembers,
  ROLE_BADGE_STYLES,
  STATUS_DOT_STYLES,
  TEAM_ROLES,
  type MemberStatus,
  type TeamMember,
  type TeamRole,
} from "@/lib/fsm";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "My Team — Vantage FSM" },
      {
        name: "description",
        content:
          "Manage your field technicians, dispatchers, and admins with roles, live status, and skill tags.",
      },
      { property: "og:title", content: "My Team — Vantage FSM" },
      { property: "og:description", content: "Manage your crew, roles, and skills." },
    ],
  }),
  component: TeamPage,
});

const STATUS_LABEL: Record<MemberStatus, string> = {
  Active: "Active",
  Busy: "On Job",
  Offline: "Offline",
};

function TeamPage() {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team_members"],
    queryFn: fetchTeamMembers,
  });
  const me = useCurrentMember();

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <PageHeader
        title="My Team"
        description="Your crew, their roles, live status, and certified skills."
        action={<TeamActions />}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          Workspace: <span className="text-foreground">{COMPANY_ID}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-revenue" />
          RBAC: Owner/Admin · Dispatcher · Field Tech
        </span>
        {me && (
          <span className="inline-flex items-center gap-2 rounded-full border border-revenue/30 bg-revenue-muted px-3 py-1.5 text-xs font-medium text-revenue">
            <MemberAvatar member={me} />
            Viewing as {me.full_name}
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Loading team…</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} isMe={member.id === me?.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, isMe }: { member: TeamMember; isMe: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm",
        isMe ? "border-revenue/40 ring-1 ring-revenue/20" : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <MemberAvatar member={member} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-foreground">{member.full_name}</span>
            {isMe && <span className="text-[10px] font-bold text-revenue">YOU</span>}
          </div>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
              ROLE_BADGE_STYLES[member.role],
            )}
          >
            {member.role}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_DOT_STYLES[member.status])} />
        {STATUS_LABEL[member.status]}
      </div>

      {member.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {member.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AddTeammateDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<TeamRole>("Field Tech");
  const [status, setStatus] = useState<MemberStatus>("Active");
  const [skills, setSkills] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createTeamMember({
        full_name: name.trim(),
        role,
        status,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Teammate added");
      setOpen(false);
      setName("");
      setSkills("");
      setRole("Field Tech");
      setStatus("Active");
    },
    onError: () => toast.error("Could not add teammate"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="revenue">
          <UserPlus className="h-4 w-4" />
          Add Teammate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Teammate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tm-name">Full Name</Label>
            <Input
              id="tm-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sam Rivera"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as MemberStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Busy">On Job</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tm-skills">Skill Tags</Label>
            <Input
              id="tm-skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Master Electrician, HVAC"
            />
            <p className="text-xs text-muted-foreground">Separate skills with commas.</p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="revenue"
            disabled={!name.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Adding…" : "Add Teammate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
