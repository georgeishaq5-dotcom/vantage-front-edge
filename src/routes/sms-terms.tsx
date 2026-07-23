import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { HomeNav } from "@/components/marketing/home/HomeNav";
import { HomeFooter } from "@/components/marketing/home/HomeFooter";

const SUPPORT_EMAIL = "noreply@vantage-fsm.com";

// Note: /sms-terms is registered as public content in __root.tsx so it renders
// on any host without auth (customers open it from the opt-in checkbox link).
export const Route = createFileRoute("/sms-terms")({
  head: () => ({
    meta: [
      { title: "SMS Terms & Consent — Vantage FSM" },
      {
        name: "description",
        content:
          "How Vantage FSM sends SMS on behalf of trades businesses: message types, frequency, rates, and how to opt out (STOP) or get help (HELP).",
      },
      { property: "og:title", content: "SMS Terms & Consent — Vantage FSM" },
      {
        property: "og:description",
        content: "Vantage FSM SMS program terms: message types, rates, STOP/HELP, and privacy.",
      },
      { property: "og:url", content: "https://vantage-fsm.com/sms-terms" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-fsm.com/sms-terms" }],
  }),
  component: SmsTermsPage,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-[oklch(1_0_0/10%)] py-8">
      <h2 className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--sig)]">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[15px] leading-[1.85] text-[oklch(0.72_0.02_257)]">
        {children}
      </div>
    </section>
  );
}

function SmsTermsPage() {
  return (
    <div
      className="vhome relative min-h-screen overflow-x-hidden bg-[oklch(0.128_0.02_262)] text-[oklch(0.95_0.006_247)]"
      style={{
        ["--sig" as string]: "oklch(0.72 0.16 158)",
        fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <HomeNav />

      <main className="mx-auto max-w-[820px] px-6 pb-16 pt-[140px] md:px-9">
        <div className="flex items-center gap-3.5">
          <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-[var(--sig)]">
            SMS Program Terms
          </span>
        </div>
        <h1
          className="mt-5 text-balance font-light uppercase leading-[1.2] tracking-[0.05em] text-[oklch(0.97_0.004_247)]"
          style={{ fontSize: "clamp(30px, 4.4vw, 48px)" }}
        >
          SMS Terms &amp; Consent
        </h1>
        <p className="mt-5 text-[15px] leading-[1.85] text-[oklch(0.67_0.02_257)]">
          Vantage FSM powers text messaging for independent trades businesses (landscaping,
          HVAC, plumbing, and other field service providers) that use our platform to run their
          jobs. When you give your service provider your phone number and opt in, they use
          Vantage to send you the messages described below.
        </p>

        <Section title="Program & message types">
          <p>
            The <span className="font-medium text-[oklch(0.9_0.01_257)]">Vantage FSM</span> SMS
            program sends transactional service messages on behalf of the trades business you
            hired, including:
          </p>
          <ul className="ml-5 list-disc space-y-1.5 marker:text-[var(--sig)]">
            <li>Appointment reminders and scheduling confirmations</li>
            <li>Quote and estimate follow-ups</li>
            <li>Job status updates (e.g. crew en route, work completed, invoice ready)</li>
          </ul>
        </Section>

        <Section title="Message frequency & rates">
          <p>
            <span className="font-medium text-[oklch(0.9_0.01_257)]">
              Message and data rates may apply. Message frequency varies
            </span>{" "}
            based on your appointments and the jobs in progress — you'll typically only receive
            messages tied to your own service.
          </p>
        </Section>

        <Section title="Opting out — reply STOP">
          <p>
            You can cancel the SMS service at any time. Reply{" "}
            <span className="font-mono font-semibold text-[oklch(0.9_0.01_257)]">STOP</span> to
            any message and you will no longer receive SMS messages from that business through
            Vantage. To rejoin, sign up again with your service provider as you did the first
            time.
          </p>
        </Section>

        <Section title="Help — reply HELP">
          <p>
            For help, reply{" "}
            <span className="font-mono font-semibold text-[oklch(0.9_0.01_257)]">HELP</span> to
            any message, or contact us at{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-[var(--sig)] underline underline-offset-2 hover:opacity-80"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="Privacy">
          <p>
            Carriers are not liable for delayed or undelivered messages. We handle your
            information as described in our{" "}
            <Link
              to="/privacy-policy"
              className="font-medium text-[var(--sig)] underline underline-offset-2 hover:opacity-80"
            >
              Privacy Policy
            </Link>
            . We do not sell your phone number, and mobile opt-in data is never shared with
            third parties for their own marketing.
          </p>
        </Section>
      </main>

      <HomeFooter />
    </div>
  );
}
