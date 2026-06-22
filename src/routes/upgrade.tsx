import { createFileRoute } from "@tanstack/react-router";

import { PremiumPaywall } from "@/components/PremiumPaywall";

export const Route = createFileRoute("/upgrade")({
  head: () => ({
    meta: [
      { title: "Upgrade — Vantage" },
      {
        name: "description",
        content: "Upgrade to the Pro Operator plan to unlock premium field service features.",
      },
      { property: "og:title", content: "Upgrade — Vantage" },
      {
        property: "og:description",
        content: "Unlock premium Vantage features with a Pro Operator subscription.",
      },
      { property: "og:url", content: "https://vantage-front-edge.lovable.app/upgrade" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-front-edge.lovable.app/upgrade" }],
  }),
  component: UpgradePage,
});

function UpgradePage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-8">
      <PremiumPaywall />
    </div>
  );
}
