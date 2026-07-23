import { createFileRoute } from "@tanstack/react-router";

import { suppressPhone, unsuppressPhone } from "@/lib/sms-suppression.server";

/**
 * Inbound Twilio SMS webhook — handles the mandatory STOP/HELP keywords.
 *
 * Authenticated by the Twilio request signature (X-Twilio-Signature), which is
 * computed with the account Auth Token — set TWILIO_AUTH_TOKEN. Configure this
 * URL as the "A MESSAGE COMES IN" webhook on the Twilio number:
 *   https://app.vantage-fsm.com/api/sms/inbound   (POST)
 *
 * STOP-family  → record withdrawal + add to the suppression list, confirm.
 * START-family → remove from the suppression list, confirm re-subscribe.
 * HELP/INFO    → reply with program info + support contact.
 * Opt-out is global by phone (all tenants share one sender number).
 */

const STOP_KEYWORDS = new Set([
  "STOP",
  "STOPALL",
  "UNSUBSCRIBE",
  "CANCEL",
  "END",
  "QUIT",
  "REVOKE",
  "OPTOUT",
]);
const START_KEYWORDS = new Set(["START", "YES", "UNSTOP", "OPTIN"]);
const HELP_KEYWORDS = new Set(["HELP", "INFO"]);

const SUPPORT_EMAIL = "support@vantage-fsm.com";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twiml(message?: string): Response {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/sms/inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!authToken) {
          console.error("[api/sms/inbound] TWILIO_AUTH_TOKEN is not configured");
          return new Response("Twilio auth not configured", { status: 500 });
        }

        const signature = request.headers.get("x-twilio-signature");
        const rawBody = await request.text();
        const params = Object.fromEntries(new URLSearchParams(rawBody)) as Record<string, string>;

        // Reconstruct the exact public URL Twilio signed.
        const proto = request.headers.get("x-forwarded-proto") ?? "https";
        const host = request.headers.get("host") ?? "";
        const url = `${proto}://${host}/api/sms/inbound`;

        const { default: twilio } = await import("twilio");
        const valid =
          !!signature &&
          (twilio as unknown as {
            validateRequest: (
              token: string,
              sig: string,
              url: string,
              params: Record<string, string>,
            ) => boolean;
          }).validateRequest(authToken, signature, url, params);
        if (!valid) {
          return new Response("Invalid signature", { status: 403 });
        }

        const from = (params.From ?? "").trim();
        const keyword = (params.Body ?? "").trim().toUpperCase().split(/\s+/)[0] ?? "";
        if (!from) return twiml();

        if (STOP_KEYWORDS.has(keyword)) {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const db = supabaseAdmin as unknown as { from: (t: string) => any };
          // Mark every active consent record for this number as withdrawn.
          await db
            .from("sms_consent_records")
            .update({ withdrawn_at: new Date().toISOString() })
            .eq("phone_number", from)
            .is("withdrawn_at", null);
          await suppressPhone(from, "STOP");
          return twiml(
            "You're unsubscribed from Vantage FSM texts and won't receive more. Reply START to opt back in.",
          );
        }

        if (START_KEYWORDS.has(keyword)) {
          await unsuppressPhone(from);
          return twiml(
            "You're re-subscribed to Vantage FSM service texts. Reply STOP to opt out, HELP for help.",
          );
        }

        if (HELP_KEYWORDS.has(keyword)) {
          return twiml(
            `Vantage FSM: appointment & service updates from your provider. Msg & data rates may apply. Reply STOP to opt out. Help: ${SUPPORT_EMAIL}`,
          );
        }

        // Not a keyword we handle — acknowledge with no reply.
        return twiml();
      },
    },
  },
});
