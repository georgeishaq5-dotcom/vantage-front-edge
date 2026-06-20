import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Vantage" },
      {
        name: "description",
        content:
          "Privacy Policy for the Vantage field service management app, covering what data we collect and how it is used.",
      },
      { property: "og:title", content: "Privacy Policy — Vantage" },
      {
        property: "og:description",
        content: "How Vantage collects, uses, and protects your data.",
      },
      { property: "og:url", content: "https://vantage-front-edge.lovable.app/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-front-edge.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const updated = "June 19, 2026";
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>

        <section className="mt-8 space-y-4 text-foreground">
          <p>
            This Privacy Policy explains how Vantage ("we", "us", or "our") collects, uses, and
            protects your information when you use the Vantage application and website (the
            "Service").
          </p>

          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p>
            We collect information you provide directly, such as your name, email address, business
            details, customer records, job and scheduling data, and any content you enter into the
            Service. We also collect basic technical data (such as device type and usage analytics)
            to operate and improve the Service.
          </p>

          <h2 className="text-xl font-semibold">2. How We Use Information</h2>
          <p>
            We use your information to provide and maintain the Service, authenticate your account,
            process your business operations (quoting, dispatch, customer management), provide
            support, and improve features. We do not sell your personal information.
          </p>

          <h2 className="text-xl font-semibold">3. Data Storage and Security</h2>
          <p>
            Your data is stored securely using industry-standard infrastructure and access controls.
            We take reasonable measures to protect your information, though no method of transmission
            or storage is completely secure.
          </p>

          <h2 className="text-xl font-bold">
            <strong>AI Data Processing</strong>
          </h2>
          <p className="font-semibold">
            Vantage includes AI features (such as "Van", our AI operator). This section explains
            how those features handle your data.
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>What personal information the AI feature collects:</strong> the chat prompts
              and messages you type to the AI, together with related business data you reference or
              that is provided as context — including job details, scheduling information, customer
              records, and account information associated with your workspace.
            </li>
            <li>
              <strong>Why the data is collected:</strong> solely to generate automated insights,
              recommendations, summaries, and responses that you request. We do not use this data
              for advertising, and we do not sell it.
            </li>
            <li>
              <strong>Where the data is processed:</strong> prompts and the necessary context are
              processed on our secure backend infrastructure and then forwarded to a third-party AI
              processing provider. Processing may occur on servers operated by that provider.
            </li>
            <li>
              <strong>Whether the data is sent to an external LLM:</strong> yes. Your prompts and
              the associated job data are transmitted to an external third-party large language
              model (LLM) provider for processing. That provider processes the data only to return
              a response and does not use your data to train its models.
            </li>
          </ul>
          <p className="font-semibold">
            AI features are optional and gated behind your explicit, in-app consent. If you decline,
            the AI features are disabled and no prompts or job data are sent to the AI provider.
          </p>



          <h2 className="text-xl font-semibold">4. Sharing of Information</h2>
          <p>
            We share information only with service providers that help us operate the Service (such
            as hosting, database, and authentication providers), or where required by law. These
            providers are bound to protect your data.
          </p>

          <h2 className="text-xl font-semibold">5. Your Rights</h2>
          <p>
            You may access, update, or delete your account and associated data at any time from the
            Settings page, including using the Delete Account feature to permanently remove your
            account. You may also contact us to exercise applicable data rights.
          </p>

          <h2 className="text-xl font-semibold">6. Children's Privacy</h2>
          <p>The Service is not directed to children under 13, and we do not knowingly collect their data.</p>

          <h2 className="text-xl font-semibold">7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the updated version on
            this page with a new "Last updated" date.
          </p>

          <h2 className="text-xl font-semibold">8. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at{" "}
            <a className="text-primary underline" href="mailto:privacy@vantage-front-edge.lovable.app">
              privacy@vantage-front-edge.lovable.app
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
