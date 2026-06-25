import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const TWILIO_GATEWAY = "https://connector-gateway.lovable.dev/twilio";

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
  headers: Record<string, string>,
): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(address)}`,
    { headers },
  );
  if (!res.ok) return null;
  const data = await res.json();
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
  .inputValidator((input) => FindNeighborsInput.parse(input))
  .handler(async ({ data }) => {
    const lovableApiKey = process.env.LOVABLE_API_KEY;
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");
    if (!mapsKey) throw new Error("Google Maps connector is not configured");

    const headers = {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": mapsKey,
    };

    const origin = await geocode(data.jobAddress, headers);
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
      const loc = await geocode(c.address, headers);
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
  .inputValidator((input) => BlastInput.parse(input))
  .handler(async ({ data }) => {
    const lovableApiKey = process.env.LOVABLE_API_KEY;
    const twilioApiKey = process.env.TWILIO_API_KEY;
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");
    if (!twilioApiKey) throw new Error("TWILIO_API_KEY is not configured");

    const headers = {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": twilioApiKey,
    };

    const numbersRes = await fetch(
      `${TWILIO_GATEWAY}/IncomingPhoneNumbers.json?PageSize=1`,
      { method: "GET", headers },
    );
    const numbersData = await numbersRes.json();
    if (!numbersRes.ok) {
      throw new Error(`Failed to resolve Twilio sender number [${numbersRes.status}]`);
    }
    const from: string | undefined =
      numbersData?.incoming_phone_numbers?.[0]?.phone_number;
    if (!from) throw new Error("No Twilio phone number is available to send from.");

    let sent = 0;
    const failures: string[] = [];
    for (const r of data.recipients) {
      const firstName = r.firstName.trim().split(/\s+/)[0] || "there";
      const message = `Hi ${firstName}, it's ${data.company}. We are doing a job right down the street from you today. Let us know if you want us to swing by for a quick check-up or quote while our crew is in the area!`;
      try {
        const res = await fetch(`${TWILIO_GATEWAY}/Messages.json`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            To: normalizeE164(r.phone),
            From: from,
            Body: message,
          }),
        });
        if (res.ok) sent += 1;
        else failures.push(r.phone);
      } catch {
        failures.push(r.phone);
      }
    }

    return { sent, failed: failures.length };
  });
