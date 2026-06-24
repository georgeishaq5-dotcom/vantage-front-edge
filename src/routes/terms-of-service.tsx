import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { termsOfServiceHtml } from "@/lib/terms-of-service-html";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Vantage FSM" },
      {
        name: "description",
        content:
          "Terms of Service for Vantage FSM, the legally binding agreement governing your use of the app.",
      },
      { property: "og:title", content: "Terms of Service — Vantage FSM" },
      {
        property: "og:description",
        content: "The legal terms governing your use of Vantage FSM.",
      },
      { property: "og:url", content: "https://vantage-fsm.com/terms-of-service" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-fsm.com/terms-of-service" }],
  }),
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
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
            Terms of Service
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 md:p-8">
        <div
          className="rounded-xl bg-white p-4 text-black shadow-sm md:p-8"
          dangerouslySetInnerHTML={{ __html: termsOfServiceHtml }}
        />
      </main>
    </div>
  );
}
