import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  entitlementErrorToThrow,
  limitFor,
  nextPlanForResource,
} from "@/lib/entitlements";
import { resolveWorkspace } from "@/lib/entitlements.server";

/**
 * Admin-only: sends an account-creation (invite) email to a new staff member.
 * Sign-ups are disabled globally, so this is the only path to add crew — which
 * makes it the single place the SEAT cap is enforced.
 *
 * Seats = real auth users in the workspace, counted from `profiles`. The seat
 * check resolves the caller's EFFECTIVE plan (reverse-trial aware) and rejects
 * with a typed LIMIT_REACHED error once the plan's seat cap is reached.
 */
export const inviteTeammate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        redirectTo: z.string().url(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error("Could not verify permissions");
    if (!isAdmin) throw new Error("Only admins can invite teammates");

    const { companyId, effectivePlan } = await resolveWorkspace(
      context.supabase,
      context.userId,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Seat gate: count real workspace members before adding another.
    const cap = limitFor(effectivePlan, "seats");
    if (Number.isFinite(cap)) {
      const { count, error: countErr } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId);
      if (countErr) throw new Error("Could not check your crew seat count");

      const usage = count ?? 0;
      if (usage >= cap) {
        throw entitlementErrorToThrow({
          type: "LIMIT_REACHED",
          limit: "seats",
          plan: effectivePlan,
          requiredPlan: nextPlanForResource(effectivePlan, "seats"),
          limitValue: cap,
          usage,
        });
      }
    }

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: data.redirectTo,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
