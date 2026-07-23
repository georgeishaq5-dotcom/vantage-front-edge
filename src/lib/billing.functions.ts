import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TRIAL_DAYS } from "@/lib/entitlements";

/**
 * Admin-only: set the current workspace's plan directly, without going through
 * Stripe. Intended for testing and manual operations. Paid plans are marked
 * `active` so they take effect immediately; `free` clears the subscription.
 * For real customer billing use the Stripe Checkout + webhook flow instead.
 *
 * The reverse trial grants Crew-level access until `trial_ends_at` passes, so
 * setting `plan` alone wouldn't change the *effective* plan mid-trial. The
 * `trial` option makes a switch deterministic:
 *   - "expire" (default) — end the trial now, so effective plan == `plan`.
 *   - "reset"  — start a fresh 30-day Crew trial (effective plan becomes Crew).
 *   - "keep"   — leave `trial_ends_at` untouched.
 */
export const setCompanyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        plan: z.enum(["free", "growth", "crew"]),
        trial: z.enum(["expire", "reset", "keep"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Hard block in production: real plan changes must go through Stripe
    // Checkout + the webhook. This direct override exists only for QA on
    // preview/staging, so a workspace admin can never self-assign a paid plan
    // for free in production.
    if (process.env.VERCEL_ENV === "production") {
      throw new Error("Direct plan changes are disabled in production.");
    }

    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error("Could not verify permissions");
    if (!isAdmin) throw new Error("Only admins can change the plan");

    const { data: profile, error: profileErr } = await context.supabase
      .from("profiles")
      .select("company_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileErr) throw new Error("Could not load your workspace");
    const companyId = profile?.company_id;
    if (!companyId) throw new Error("No company found for this account");

    const subscription_status = data.plan === "free" ? "free" : "active";
    const update: Record<string, unknown> = {
      plan: data.plan,
      subscription_status,
    };

    const trial = data.trial ?? "expire";
    if (trial === "expire") {
      update.trial_ends_at = new Date(Date.now() - 86_400_000).toISOString();
    } else if (trial === "reset") {
      update.trial_ends_at = new Date(
        Date.now() + TRIAL_DAYS * 86_400_000,
      ).toISOString();
    }
    // "keep" leaves trial_ends_at as-is.

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upErr } = await supabaseAdmin
      .from("companies")
      .update(update)
      .eq("id", companyId);
    if (upErr) throw new Error(upErr.message);

    return { ok: true, plan: data.plan, trial };
  });
