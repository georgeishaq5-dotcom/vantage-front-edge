/**
 * Server-only helpers for the SMS suppression list (STOP opt-outs). All access
 * goes through the service-role client — the table is not exposed to tenants.
 * Opt-out is global by phone number because every tenant shares one Twilio
 * sender number, so a STOP can't be attributed to a single company.
 */

type AnyDb = { from: (t: string) => any };

async function adminDb(): Promise<AnyDb> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // sms_suppressions isn't in the generated Database types until the migration
  // is applied, so use an untyped handle (same pattern as fsm.ts).
  return supabaseAdmin as unknown as AnyDb;
}

/**
 * True when the number has opted out (replied STOP). Fails open on a read
 * error (returns false) — Twilio still blocks messages to STOPped numbers at
 * the account level, so a transient DB error won't cause an illegal send.
 */
export async function isPhoneSuppressed(phone: string): Promise<boolean> {
  try {
    const db = await adminDb();
    const { data, error } = await db
      .from("sms_suppressions")
      .select("phone_number")
      .eq("phone_number", phone)
      .maybeSingle();
    if (error) {
      console.error("[sms-suppression] read failed:", error);
      return false;
    }
    return !!data;
  } catch (err) {
    console.error("[sms-suppression] read threw:", err);
    return false;
  }
}

/** Add a number to the suppression list (idempotent). */
export async function suppressPhone(phone: string, reason = "STOP"): Promise<void> {
  const db = await adminDb();
  const { error } = await db
    .from("sms_suppressions")
    .upsert({ phone_number: phone, reason }, { onConflict: "phone_number" });
  if (error) console.error("[sms-suppression] upsert failed:", error);
}

/** Remove a number from the suppression list (on START/opt back in). */
export async function unsuppressPhone(phone: string): Promise<void> {
  const db = await adminDb();
  const { error } = await db.from("sms_suppressions").delete().eq("phone_number", phone);
  if (error) console.error("[sms-suppression] delete failed:", error);
}
