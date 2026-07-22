import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Building2, ShieldCheck, Mail, Users } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { MemberAvatar } from "@/components/CrewAssignment";
import { UsageMeter } from "@/components/UsageMeter";
import { LimitReachedCallout } from "@/components/UpgradeCallout";
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
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useIsAdmin } from "@/hooks/useUserRole";
import { usePlan } from "@/hooks/usePlan";
import { inviteTeammate } from "@/lib/team.functions";
import { parseEntitlementError, type LimitReachedError } from "@/lib/entitlements";
import { cn } from "@/lib/utils";
import {
  COMPANY_ID,
  fetchTeamMembers,
  ROLE_BADGE_STYLES,
  STATUS_DOT_STYLES,
  type MemberStatus,
  type TeamMember,
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
      { property: "og:url", content: "https://vantage-front-edge.lovable.app/team" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-front-edge.lovable.app/team" }],
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
  const { usage } = usePlan();

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 md:py-8">
      <PageHeader
        title="My Team"
        description="Your crew, their roles, live status, and certified skills."
        action={<TeamActions />}
      />

      <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-3">
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

      {/* Seats = real login accounts in the workspace (the metered resource). */}
      <div className="mt-4 max-w-xs rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          Crew seats
        </div>
        <UsageMeter label="Login accounts" usage={usage.seats} />
      </div>

      {isLoading ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Loading team…</p>
      ) : (
        <div className="mt-4 md:mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

function TeamActions() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Admin access required to invite staff
      </span>
    );
  }

  // Inviting a user is the single, seat-gated way to add crew. The seat cap is
  // enforced server-side in inviteTeammate.
  return <InviteUserDialog />;
}

function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [limitError, setLimitError] = useState<LimitReachedError | null>(null);
  const invite = useServerFn(inviteTeammate);
  const { refetchUsage } = usePlan();

  const mutation = useMutation({
    mutationFn: () =>
      invite({ data: { email: email.trim(), redirectTo: window.location.origin } }),
    onSuccess: () => {
      toast.success("Invitation sent", {
        description: `An account-creation email is on its way to ${email.trim()}.`,
      });
      refetchUsage();
      setOpen(false);
      setEmail("");
      setLimitError(null);
    },
    onError: (err) => {
      const ent = parseEntitlementError(err);
      if (ent && ent.type === "LIMIT_REACHED") {
        setLimitError(ent);
        return;
      }
      toast.error(err instanceof Error ? err.message : "Could not send invite");
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setLimitError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="revenue">
          <Mail className="h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a new user</DialogTitle>
          <DialogDescription>
            Sign-ups are invite-only. We'll email an account-creation link so they can
            set a password and join the workspace. Each invited user takes a crew seat.
          </DialogDescription>
        </DialogHeader>

        {limitError && <LimitReachedCallout error={limitError} />}

        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Email address</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="new.teammate@company.com"
          />
        </div>
        <DialogFooter>
          <Button
            variant="revenue"
            disabled={!email.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Sending…" : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
