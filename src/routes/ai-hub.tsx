import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { AgentRulesPanel } from "@/components/AgentRulesPanel";
import { Button } from "@/components/ui/button";
import { useVanChat } from "@/components/VanChat";
import { useAiConsent } from "@/components/AiConsentGate";

export const Route = createFileRoute("/ai-hub")({
  head: () => ({
    meta: [
      { title: "Van's AI Hub — Vantage FSM" },
      {
        name: "description",
        content: "Configure Van, your AI operator: outreach hours, discounts, guardrails, and lead filtering.",
      },
      { property: "og:title", content: "Van's AI Hub — Vantage FSM" },
      {
        property: "og:description",
        content: "Tune Van's operational dials, financial guardrails, and smart filtering.",
      },
      { property: "og:url", content: "https://vantage-front-edge.lovable.app/ai-hub" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-front-edge.lovable.app/ai-hub" }],
  }),
  component: AiHubPage,
});

function AiHubPage() {
  const van = useVanChat();
  const { granted, isLoading, openConsent } = useAiConsent();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!granted) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center md:px-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-revenue/10">
          <Lock className="h-6 w-6 text-revenue" />
        </div>
        <h1 className="text-xl font-bold text-foreground">AI features require your consent</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          To use Van's AI Hub, your chat prompts and job data will be sent to a third-party AI
          provider for processing. Review the details and grant consent to continue.
        </p>
        <Button variant="revenue" className="mt-6" onClick={openConsent}>
          Review &amp; grant consent
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-8 md:py-8">
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
      <div className="mt-4 md:mt-6">
        <AgentRulesPanel />
      </div>
    </div>
  );
}
