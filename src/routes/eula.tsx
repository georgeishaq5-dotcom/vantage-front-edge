import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { eulaHtml } from "@/lib/eula-html";

export const Route = createFileRoute("/eula")({
  head: () => ({
    meta: [
      { title: "End User License Agreement — Vantage FSM" },
      {
        name: "description",
        content:
          "End User License Agreement (EULA) for the Vantage FSM application.",
      },
      { property: "og:title", content: "End User License Agreement — Vantage FSM" },
      {
        property: "og:description",
        content: "The license terms for using the Vantage FSM application.",
      },
      { property: "og:url", content: "https://vantage-fsm.com/eula" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-fsm.com/eula" }],
  }),
  component: EulaPage,
});

function EulaPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 md:px-8">
          <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
            End User License Agreement
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 md:p-8">
        <div
          className="rounded-xl bg-white p-4 text-black shadow-sm md:p-8"
          dangerouslySetInnerHTML={{ __html: eulaHtml }}
        />
      </main>
    </div>
  );
}
