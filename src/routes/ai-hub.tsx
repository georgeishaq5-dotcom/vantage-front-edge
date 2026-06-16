import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { AgentRulesPanel } from "@/components/AgentRulesPanel";
import { Button } from "@/components/ui/button";
import { useVanChat } from "@/components/VanChat";

export const Route = createFileRoute("/ai-hub")({
  head: () => ({
    meta: [
      { title: "Van's AI Hub — Vantage FSM" },
      {
        name: "description",
        content: "Configure Van, your AI operator: target zip codes, profit margins, and tone.",
      },
      { property: "og:title", content: "Van's AI Hub — Vantage FSM" },
      {
        property: "og:description",
        content: "Configure Van, your AI operator's operational boundaries.",
      },
    ],
  }),
  component: AiHubPage,
});

function AiHubPage() {
  const van = useVanChat();
  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <PageHeader
        title="Van's AI Hub"
        description="Configure how Van runs your field service operation."
        action={
          <Button
            variant="revenue"
            onClick={() => van.open("Give me a summary of how my operation is performing this week.")}
          >
            Ask Van
          </Button>
        }
      />
      <div className="mt-6">
        <AgentRulesPanel />
      </div>
    </div>
  );
}
