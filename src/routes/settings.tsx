import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Users, Plug } from "lucide-react";


export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Vantage FSM" },
      { name: "description", content: "Manage billing, your team, and integrations for Vantage FSM." },
      { property: "og:title", content: "Settings — Vantage FSM" },
      { property: "og:description", content: "Manage billing, team, and integrations." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <PageHeader title="Settings" description="Manage billing, your team, and integrations." />

      {/* Profile */}
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

      {/* Business administration */}
      <div className="mt-6 grid grid-cols-1 gap-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Billing</h2>
              <p className="text-sm text-muted-foreground">
                Manage your subscription plan and payment method.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
            <div>
              <p className="text-sm font-medium text-foreground">Pro Plan</p>
              <p className="text-xs text-muted-foreground">$199 / month · renews monthly</p>
            </div>
            <Button variant="secondary" disabled>
              Manage Billing
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Team</h2>
              <p className="text-sm text-muted-foreground">
                Invite teammates and manage roles and permissions.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
            <p className="text-sm text-muted-foreground">Manage your crew from the My Team workspace.</p>
            <Button variant="secondary" disabled>
              Invite Teammate
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
              <Plug className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Integrations</h2>
              <p className="text-sm text-muted-foreground">
                Connect the tools that power your operation.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Twilio · SMS &amp; Voice</p>
              <span className="rounded-full bg-revenue-muted px-3 py-1 text-xs font-medium text-revenue">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Google Maps · Routing</p>
              <span className="rounded-full bg-revenue-muted px-3 py-1 text-xs font-medium text-revenue">
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
