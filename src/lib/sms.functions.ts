import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

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

    const lovableApiKey = process.env.LOVABLE_API_KEY;
    const twilioApiKey = process.env.TWILIO_API_KEY;
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");
    if (!twilioApiKey) throw new Error("TWILIO_API_KEY is not configured");

    const headers = {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": twilioApiKey,
    };

    // Resolve a verified Twilio sender number from the account.
    const numbersRes = await fetch(
      `${GATEWAY_URL}/IncomingPhoneNumbers.json?PageSize=1`,
      { method: "GET", headers },
    );
    const numbersData = await numbersRes.json();
    if (!numbersRes.ok) {
      throw new Error(
        `Failed to resolve Twilio sender number [${numbersRes.status}]`,
      );
    }
    const from: string | undefined =
      numbersData?.incoming_phone_numbers?.[0]?.phone_number;
    if (!from) {
      throw new Error("No Twilio phone number is available to send from.");
    }

    const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: normalizeE164(data.to),
        From: from,
        Body: data.message,
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(
        result?.message
          ? `Twilio error: ${result.message}`
          : `Twilio request failed [${res.status}]`,
      );
    }

    return { sid: result.sid as string, status: result.status as string };
  });
