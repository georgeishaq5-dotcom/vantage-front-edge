import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ConfigureInput = z.object({
  prompt: z.string().trim().min(3).max(2000),
});

const UpgradeSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  recommended: z.boolean().optional(),
});

const PresetSchema = z.object({
  profession: z.string(),
  base_job_title: z.string(),
  base_job_description: z.string(),
  base_price: z.number(),
  upgrades: z.array(UpgradeSchema).min(2).max(8),
});

const SYSTEM_PROMPT = `You are Van, an AI operator for a field-service company.
The user will describe their trade or business. Generate realistic estimate presets for that trade.
Respond ONLY with a JSON object matching this shape:
{
  "profession": string,
  "base_job_title": string,
  "base_job_description": string (short, under 60 chars),
  "base_price": number (the typical base service price in USD),
  "upgrades": [
    { "key": string (kebab-case slug), "name": string, "description": string (one sentence), "price": number, "recommended": boolean }
  ]
}
Provide 4 upgrades. Use realistic USD prices for that trade. No markdown, no commentary.`;

/**
 * Ask Van to auto-generate and save trade-specific estimate presets from a
 * natural-language description. Writes are gated by RLS (managers only).
 */
export const configureTradePresets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ConfigureInput.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: data.prompt },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Van is busy (rate limited). Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
    if (!res.ok) throw new Error(`Van could not generate presets [${res.status}]`);

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Van returned an unexpected response. Please try again.");
    }

    const preset = PresetSchema.parse(parsed);

    // Persist to the singleton presets row using the caller's RLS context.
    const { data: existing } = await context.supabase
      .from("trade_presets")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await context.supabase
        .from("trade_presets")
        .update(preset)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("trade_presets").insert(preset);
      if (error) throw new Error(error.message);
    }

    return preset;
  });
