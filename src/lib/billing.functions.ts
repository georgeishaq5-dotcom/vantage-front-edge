import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-only: set the current workspace's plan directly, without going through
 * Stripe. Intended for testing and manual operations. Paid plans are marked
 * `active` so they take effect immediately; `free` clears the subscription.
 * For real customer billing use the Stripe Checkout + webhook flow instead.
 */
export const setCompanyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ plan: z.enum(["free", "growth", "crew"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
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

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const subscription_status = data.plan === "free" ? "free" : "active";
    const { error: upErr } = await supabaseAdmin
      .from("companies")
      .update({ plan: data.plan, subscription_status })
      .eq("id", companyId);
    if (upErr) throw new Error(upErr.message);

    return { ok: true, plan: data.plan };
  });
