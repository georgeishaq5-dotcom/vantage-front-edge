import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "My Team — Vantage FSM" },
      {
        name: "description",
        content: "Manage your field technicians and crew assignments in Vantage FSM.",
      },
      { property: "og:title", content: "My Team — Vantage FSM" },
      { property: "og:description", content: "Manage your field technicians and crew." },
    ],
  }),
  component: TeamPage,
});

const CREW = [
  { name: "Field Supervisor", role: "Administrator", initials: "FS", status: "Active" },
  { name: "Marcus Reed", role: "Lead Technician", initials: "MR", status: "On Job" },
  { name: "Dana Cole", role: "Technician", initials: "DC", status: "Available" },
];

function TeamPage() {
  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <PageHeader title="My Team" description="Your field technicians and crew." />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CREW.map((member) => (
          <div
            key={member.name}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sidebar text-sm font-semibold text-white">
                {member.initials}
              </div>
              <div className="leading-tight">
                <div className="font-medium text-foreground">{member.name}</div>
                <div className="text-xs text-muted-foreground">{member.role}</div>
              </div>
            </div>
            <div className="mt-4 inline-flex rounded-full bg-revenue-muted px-2.5 py-1 text-xs font-medium text-revenue">
              {member.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
