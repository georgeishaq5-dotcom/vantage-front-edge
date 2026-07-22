import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ACTIVE_JOB_STATUSES,
  entitlementErrorToThrow,
  limitFor,
  nextPlanForResource,
} from "@/lib/entitlements";
import { resolveWorkspace } from "@/lib/entitlements.server";

const NewJobInput = z.object({
  customer_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["Quoted", "Scheduled", "Completed", "Paid"]),
  service_date: z.string().max(40).nullable().optional(),
  scheduled_date: z.string().max(60).nullable().optional(),
  quote_amount: z.number().min(0).max(9_999_999),
  total_amount: z.number().min(0).max(9_999_999).optional(),
});

/**
 * The sole server-side writer of jobs. The `jobs` client INSERT policy is
 * dropped (see migration 20260721_close_jobs_insert_backdoor), so the only way
 * to create a job is through this function, which:
 *   1. resolves the caller's EFFECTIVE plan (reverse trial aware),
 *   2. counts the company's ACTIVE jobs (Quoted/Scheduled only — not
 *      completed/paid), and
 *   3. rejects with a typed LIMIT_REACHED error at the plan's active-jobs cap.
 * Insert runs through the service-role client, so company_id is set explicitly.
 */
export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => NewJobInput.parse(d))
  .handler(async ({ data, context }) => {
    const { companyId, effectivePlan } = await resolveWorkspace(
      context.supabase,
      context.userId,
    );

    const cap = limitFor(effectivePlan, "activeJobs");
    const creatingActiveJob =
      data.status === "Quoted" || data.status === "Scheduled";

    // Only open/scheduled jobs count against the cap, and only finite caps gate.
    if (creatingActiveJob && Number.isFinite(cap)) {
      const { count, error: countErr } = await context.supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .in("status", ACTIVE_JOB_STATUSES as unknown as string[]);
      if (countErr) throw new Error("Could not check your active-job count");

      const usage = count ?? 0;
      if (usage >= cap) {
        throw entitlementErrorToThrow({
          type: "LIMIT_REACHED",
          limit: "activeJobs",
          plan: effectivePlan,
          requiredPlan: nextPlanForResource(effectivePlan, "activeJobs"),
          limitValue: cap,
          usage,
        });
      }
    }

    // Service role is the sole writer (client INSERT policy removed), so there
    // is no JWT current_company_id() default — set company_id explicitly.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      company_id: companyId,
      customer_id: data.customer_id ?? null,
      title: data.title,
      description: data.description ?? data.title,
      status: data.status,
      service_date: data.service_date ?? null,
      scheduled_date: data.scheduled_date ?? null,
      quote_amount: data.quote_amount,
      total_amount: data.total_amount ?? data.quote_amount,
    };
    const { data: job, error } = await supabaseAdmin
      .from("jobs")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return job;
  });
