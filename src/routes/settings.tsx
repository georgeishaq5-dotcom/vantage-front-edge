import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AgentRulesPanel } from "@/components/AgentRulesPanel";


export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Vantage FSM" },
      { name: "description", content: "Manage your Vantage FSM user profile and account preferences." },
      { property: "og:title", content: "Settings — Vantage FSM" },
      { property: "og:description", content: "Manage your profile and account preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <PageHeader title="Settings" description="Manage your profile and workspace preferences." />

      <div className="mt-6">
        <AgentRulesPanel />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">

        <h2 className="text-base font-semibold text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update how your information appears across Vantage FSM.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue="Field Supervisor" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue="admin@vantage.io" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Input id="role" defaultValue="Administrator" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <Input id="company" defaultValue="Vantage Field Services" disabled />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-6">
          <Button variant="revenue" disabled>
            Save Changes
          </Button>
          <span className="text-xs text-muted-foreground">
            Profile editing will be enabled once authentication is added.
          </span>
        </div>
      </div>
    </div>
  );
}
