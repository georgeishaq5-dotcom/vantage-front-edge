import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cookiePolicyHtml } from "@/lib/cookie-policy-html";

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Vantage FSM" },
      {
        name: "description",
        content:
          "Cookie Policy for Vantage FSM, explaining how we use cookies and similar technologies.",
      },
      { property: "og:title", content: "Cookie Policy — Vantage FSM" },
      {
        property: "og:description",
        content: "How Vantage FSM uses cookies and similar technologies.",
      },
      { property: "og:url", content: "https://vantage-fsm.com/cookie-policy" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-fsm.com/cookie-policy" }],
  }),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
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
            Cookie Policy
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 md:p-8">
        <div
          className="rounded-xl bg-white p-4 text-black shadow-sm md:p-8"
          dangerouslySetInnerHTML={{ __html: cookiePolicyHtml }}
        />
      </main>
    </div>
  );
}
