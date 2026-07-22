import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ACTIVE_JOB_STATUSES, limitFor } from "@/lib/entitlements";
import { resolveWorkspace } from "@/lib/entitlements.server";

/** Serialisable cap: `null` means unlimited (JSON can't carry Infinity). */
function serialisableLimit(cap: number): number | null {
  return Number.isFinite(cap) ? cap : null;
}

/**
 * Authoritative usage + plan snapshot for the current workspace, used by the
 * usage meters. Seats are counted from `profiles` via the service-role client
 * (profiles RLS is own-row only, so the client can't count crew itself);
 * active jobs are counted via the user-scoped client (tenant SELECT policy).
 */
export const fetchWorkspaceUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { companyId, tier, effectivePlan } = await resolveWorkspace(
      context.supabase,
      context.userId,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const seatsRes = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId);

    const jobsRes = await context.supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .in("status", ACTIVE_JOB_STATUSES as unknown as string[]);

    return {
      plan: tier.plan,
      subscription_status: tier.subscription_status,
      trial_ends_at: tier.trial_ends_at,
      effectivePlan,
      seats: {
        used: seatsRes.count ?? 0,
        limit: serialisableLimit(limitFor(effectivePlan, "seats")),
      },
      activeJobs: {
        used: jobsRes.count ?? 0,
        limit: serialisableLimit(limitFor(effectivePlan, "activeJobs")),
      },
    };
  });
