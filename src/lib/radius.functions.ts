import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFeature, resolveWorkspace } from "@/lib/entitlements.server";

const RADIUS_MILES = 5;

function haversineMiles(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function geocode(
  address: string,
  apiKey: string,
): Promise<{ lat: number; lng: number } | null> {
  // Google Geocoding API directly (server key passed as a query param).
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.status !== "OK") return null; // ZERO_RESULTS / REQUEST_DENIED / etc.
  const loc = data?.results?.[0]?.geometry?.location;
  if (!loc || typeof loc.lat !== "number") return null;
  return { lat: loc.lat, lng: loc.lng };
}

const CandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
});

const FindNeighborsInput = z.object({
  jobAddress: z.string().min(3).max(300),
  candidates: z.array(CandidateSchema).max(500),
});

/** Geocode the job + each customer and return those within a 5-mile radius. */
export const findNeighbors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => FindNeighborsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: canManage, error: roleError } = await context.supabase.rpc("can_manage");
    if (roleError || !canManage) {
      throw new Error("Forbidden: manager or admin role required");
    }

    // Radius marketing is a Growth+ feature — enforce on the effective plan.
    const { effectivePlan } = await resolveWorkspace(context.supabase, context.userId);
    assertFeature(effectivePlan, "radius_campaigns");

    const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!mapsKey) throw new Error("GOOGLE_MAPS_API_KEY is not configured");

    const origin = await geocode(data.jobAddress, mapsKey);
    if (!origin) {
      throw new Error("Could not locate the job address on the map.");
    }

    const matches: {
      id: string;
      name: string;
      phone: string | null;
      address: string | null;
      distanceMiles: number;
    }[] = [];

    for (const c of data.candidates) {
      if (!c.address) continue;
      const loc = await geocode(c.address, mapsKey);
      if (!loc) continue;
      const distanceMiles = haversineMiles(origin.lat, origin.lng, loc.lat, loc.lng);
      if (distanceMiles <= RADIUS_MILES) {
        matches.push({ ...c, distanceMiles: Math.round(distanceMiles * 10) / 10 });
      }
    }

    matches.sort((a, b) => a.distanceMiles - b.distanceMiles);
    return { origin, radiusMiles: RADIUS_MILES, matches };
  });

function normalizeE164(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^0-9]/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

const BlastInput = z.object({
  company: z.string().min(1).max(120),
  recipients: z
    .array(
      z.object({
        phone: z.string().min(5).max(20),
        firstName: z.string().max(120),
      }),
    )
    .min(1)
    .max(200),
});

/** Send the templated "we're in your area" SMS to each nearby past customer. */
export const blastNeighbors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => BlastInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: canManage, error: roleError } = await context.supabase.rpc("can_manage");
    if (roleError || !canManage) {
      throw new Error("Forbidden: manager or admin role required");
    }

    // Radius marketing is a Growth+ feature — enforce on the effective plan.
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

    const numbers = await client.incomingPhoneNumbers.list({ limit: 1 });
    const from = numbers[0]?.phoneNumber;
    if (!from) throw new Error("No Twilio phone number is available to send from.");

    let sent = 0;
    const failures: string[] = [];
    for (const r of data.recipients) {
      const firstName = r.firstName.trim().split(/\s+/)[0] || "there";
      const message = `Hi ${firstName}, it's ${data.company}. We are doing a job right down the street from you today. Let us know if you want us to swing by for a quick check-up or quote while our crew is in the area!`;
      try {
        await client.messages.create({
          to: normalizeE164(r.phone),
          from,
          body: message,
        });
        sent += 1;
      } catch {
        failures.push(r.phone);
      }
    }

    return { sent, failed: failures.length };
  });
