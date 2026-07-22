import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RecordSmsConsentInput = z.object({
  /** Customer the number belongs to (null for a not-yet-saved lead). */
  customerId: z.string().uuid().nullable().optional(),
  /** E.164 phone number the consent applies to. */
  phone: z.string().trim().min(5).max(40),
  /** The exact consent language shown to and agreed by the customer. */
  consentTextShown: z.string().trim().min(1).max(2000),
  /** Which form captured the consent. */
  source: z.string().trim().min(1).max(60),
});

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
function clientIp(): string | null {
  const req = getRequest();
  const xff = req?.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  return req?.headers.get("x-real-ip") ?? null;
}

/**
 * Records an immutable SMS proof-of-consent row. Runs server-side so we can
 * capture the request IP and store the exact `consent_text_shown` string. The
 * insert is tenant-scoped via RLS (company_id = current_company_id()).
 */
export const recordSmsConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RecordSmsConsentInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: profile, error: profileErr } = await context.supabase
      .from("profiles")
      .select("company_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileErr) throw new Error("Could not load your workspace");
    const companyId = profile?.company_id as string | undefined;
    if (!companyId) throw new Error("No company found for this account");

    // The table isn't in the generated Database types until the migration is
    // applied, so use an untyped handle for this insert (same pattern as fsm.ts).
    const db = context.supabase as unknown as { from: (t: string) => any };
    const { error } = await db.from("sms_consent_records").insert({
      company_id: companyId,
      customer_id: data.customerId ?? null,
      phone_number: data.phone,
      consent_text_shown: data.consentTextShown,
      source: data.source,
      ip_address: clientIp(),
    });
    if (error) throw new Error(error.message);

    return { ok: true };
  });
