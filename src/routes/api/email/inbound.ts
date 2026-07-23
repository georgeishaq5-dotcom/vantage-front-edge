import { createFileRoute } from "@tanstack/react-router";

/**
 * Resend inbound-email webhook — receives mail sent to support@vantage-fsm.com,
 * logs it, and forwards a clean notification to the team inbox. There is no
 * mailbox UI; a forwarded notification is enough.
 *
 * Verified with Svix (Resend signs webhooks via Svix): svix-id / svix-timestamp
 * / svix-signature headers over the RAW body, using RESEND_WEBHOOK_SECRET.
 * Configure in Resend → Webhooks with the `email.received` event pointed at:
 *   https://app.vantage-fsm.com/api/email/inbound
 *
 * Env: RESEND_WEBHOOK_SECRET (signing secret), RESEND_API_KEY (fetch + send),
 * SUPPORT_FORWARD_TO (team inbox), SUPPORT_FROM (a Resend-verified from-address).
 */

const SUPPORT_ADDRESS = "support@vantage-fsm.com";

function normalizeAddr(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "email" in (v as Record<string, unknown>)) {
    return String((v as Record<string, unknown>).email ?? "");
  }
  return "";
}

function toAddressList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(normalizeAddr).filter(Boolean);
  const single = normalizeAddr(v);
  return single ? [single] : [];
}

/**
 * Fallback fetch of the full received email if the webhook payload didn't
 * include the body. Endpoint per Resend's Received-Emails API; best-effort.
 */
async function fetchReceivedBody(id: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch(`https://api.resend.com/emails/received/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return "";
    const json = (await res.json()) as { text?: string; html?: string };
    return json.text ?? json.html ?? "";
  } catch {
    return "";
  }
}

export const Route = createFileRoute("/api/email/inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
        const apiKey = process.env.RESEND_API_KEY;
        if (!webhookSecret) {
          console.error("[api/email/inbound] RESEND_WEBHOOK_SECRET is not configured");
          return new Response("Webhook not configured", { status: 500 });
        }

        const rawBody = await request.text();
        // Resend uses Svix; free tier may send the webhook-* header prefix.
        const id = request.headers.get("svix-id") ?? request.headers.get("webhook-id") ?? "";
        const timestamp =
          request.headers.get("svix-timestamp") ?? request.headers.get("webhook-timestamp") ?? "";
        const signature =
          request.headers.get("svix-signature") ?? request.headers.get("webhook-signature") ?? "";

        let event: { type?: string; data?: Record<string, unknown> };
        try {
          const { Webhook } = await import("svix");
          const wh = new Webhook(webhookSecret);
          event = wh.verify(rawBody, {
            "svix-id": id,
            "svix-timestamp": timestamp,
            "svix-signature": signature,
          }) as { type?: string; data?: Record<string, unknown> };
        } catch (err) {
          console.error("[api/email/inbound] signature verification failed:", err);
          return new Response("Invalid signature", { status: 401 });
        }

        if (event?.type !== "email.received") {
          return Response.json({ ignored: true, reason: "unhandled_event" });
        }

        const data = event.data ?? {};
        const toAddresses = toAddressList(data.to);
        if (!toAddresses.some((a) => a.toLowerCase() === SUPPORT_ADDRESS)) {
          return Response.json({ ignored: true, reason: "not_support_address" });
        }

        const resendEmailId =
          (typeof data.email_id === "string" && data.email_id) ||
          (typeof data.id === "string" && data.id) ||
          null;
        const fromAddress = normalizeAddr(data.from);
        const subject = typeof data.subject === "string" ? data.subject : "(no subject)";
        let body = typeof data.text === "string" ? data.text : "";
        if (!body && apiKey && resendEmailId) {
          body = await fetchReceivedBody(resendEmailId, apiKey);
        }
        if (!body && typeof data.html === "string") body = data.html;

        // 1) Log first so there's a durable record even if the forward fails.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as unknown as { from: (t: string) => any };
        const { data: inserted, error: insertErr } = await db
          .from("support_inbound_emails")
          .insert({
            resend_email_id: resendEmailId,
            from_address: fromAddress,
            to_address: toAddresses.join(", "),
            subject,
            body,
            forwarded: false,
          })
          .select("id")
          .single();
        if (insertErr) console.error("[api/email/inbound] log insert failed:", insertErr);

        // 2) Forward a clean notification to the team inbox via Resend.
        const forwardTo = process.env.SUPPORT_FORWARD_TO ?? "vantagefsm@gmail.com";
        const from = process.env.SUPPORT_FROM; // must be a Resend-verified from-address
        let forwarded = false;
        if (apiKey && from) {
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(apiKey);
            const text = `New message to ${SUPPORT_ADDRESS}\n\nFrom: ${fromAddress || "unknown"}\nSubject: ${subject}\n\n${body || "(no body)"}`;
            const result = await resend.emails.send({
              from,
              to: [forwardTo],
              replyTo: fromAddress || undefined,
              subject: `[Support] ${subject}`,
              text,
            });
            forwarded = !result.error;
            if (result.error) console.error("[api/email/inbound] forward failed:", result.error);
          } catch (err) {
            console.error("[api/email/inbound] forward threw:", err);
          }
        } else {
          console.warn(
            "[api/email/inbound] SUPPORT_FROM/RESEND_API_KEY missing — logged but not forwarded",
          );
        }

        if (forwarded && inserted?.id) {
          const { error: updErr } = await db
            .from("support_inbound_emails")
            .update({ forwarded: true })
            .eq("id", inserted.id);
          if (updErr) console.error("[api/email/inbound] forwarded flag update failed:", updErr);
        }

        return Response.json({ received: true, forwarded });
      },
    },
  },
});
