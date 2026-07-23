import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createGoogleProvider, GEMINI_CHAT_MODEL } from "@/lib/google-ai.server";

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const google = createGoogleProvider(apiKey);

    let preset: z.infer<typeof PresetSchema>;
    try {
      const result = await generateObject({
        model: google(GEMINI_CHAT_MODEL),
        schema: PresetSchema,
        system: SYSTEM_PROMPT,
        prompt: data.prompt,
      });
      preset = result.object;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 429) {
        throw new Error("Van is busy (rate limited). Try again shortly.");
      }
      throw new Error("Van returned an unexpected response. Please try again.");
    }

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
