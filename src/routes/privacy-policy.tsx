import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { privacyPolicyHtml } from "@/lib/privacy-policy-html";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Vantage FSM" },
      {
        name: "description",
        content:
          "Privacy Policy for Vantage FSM, describing how we collect, use, and protect your data.",
      },
      { property: "og:title", content: "Privacy Policy — Vantage FSM" },
      {
        property: "og:description",
        content: "How Vantage FSM collects, uses, and protects your data.",
      },
      { property: "og:url", content: "https://vantage-fsm.com/privacy-policy" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-fsm.com/privacy-policy" }],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 md:px-8">
          <Button asChild variant="ghost" size="sm">
            <Link to="/settings">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
            Privacy Policy
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 md:p-8">
        <div
          className="rounded-xl bg-white p-4 text-black shadow-sm md:p-8"
          dangerouslySetInnerHTML={{ __html: privacyPolicyHtml }}
        />
      </main>
    </div>
  );
}
