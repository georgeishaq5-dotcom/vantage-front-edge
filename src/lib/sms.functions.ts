import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFeature, resolveWorkspace } from "@/lib/entitlements.server";
import { isPhoneSuppressed } from "@/lib/sms-suppression.server";

const SendPromoSmsInput = z.object({
  to: z
    .string()
    .min(5)
    .max(20)
    .regex(/^\+?[0-9\s\-().]+$/, "Invalid phone number"),
  message: z.string().min(1).max(1600),
});

function normalizeE164(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^0-9]/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  // Assume US/NANP if 10 digits, otherwise prefix +.
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

export const sendPromoSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SendPromoSmsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: canManage, error: roleError } = await context.supabase.rpc("can_manage");
    if (roleError || !canManage) {
      throw new Error("Forbidden: manager or admin role required");
    }

    // Proximity/neighbor promo SMS is part of radius marketing (Growth+).
    const { effectivePlan } = await resolveWorkspace(context.supabase, context.userId);
    assertFeature(effectivePlan, "radius_campaigns");

    // Twilio auth via an API Key (SID + Secret) scoped to the account — not the
    // main Auth Token. Loaded dynamically so the Node SDK stays out of the
    // client bundle (*.functions.ts ships to the client).
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    if (!accountSid) throw new Error("TWILIO_ACCOUNT_SID is not configured");
    if (!apiKeySid) throw new Error("TWILIO_API_KEY_SID is not configured");
    if (!apiKeySecret) throw new Error("TWILIO_API_KEY_SECRET is not configured");

    const { default: twilio } = await import("twilio");
    const client = twilio(apiKeySid, apiKeySecret, { accountSid });

    // Honor STOP opt-outs: never text a suppressed number.
    const to = normalizeE164(data.to);
    if (await isPhoneSuppressed(to)) {
      throw new Error("This number has opted out of SMS (replied STOP) and cannot be texted.");
    }

    // Resolve a verified Twilio sender number from the account.
    const numbers = await client.incomingPhoneNumbers.list({ limit: 1 });
    const from = numbers[0]?.phoneNumber;
    if (!from) {
      throw new Error("No Twilio phone number is available to send from.");
    }

    try {
      const result = await client.messages.create({
        to,
        from,
        body: data.message,
      });
      return { sid: result.sid, status: result.status };
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      throw new Error(`Twilio error: ${message}`);
    }
  });
