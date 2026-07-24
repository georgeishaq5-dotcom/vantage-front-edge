import {
  assignMember,
  createCustomer,
  createOutreachForJob,
  fetchCustomers,
  fetchJobsWithFullCustomers,
  fetchTeamMembers,
  fetchNeighborOutreach,
  setLeadTech,
  unassignMember,
  updateCustomer,
  updateJob,
  updateJobStatus,
  updateOutreachStatus,
  type JobStatus,
} from "@/lib/fsm";
import type { VanToolName } from "@/lib/van-tools.shared";

/**
 * Browser-side execution of Van's tools (runs only from VanChat's onToolCall,
 * never during SSR). NOTE: do not rename this to `*.client.ts` — that suffix is
 * a TanStack Start reserved convention that import-protection forbids from the
 * server bundle, and VanChat is server-reachable via __root for SSR.
 *
 * Van decides WHICH tool to call and with
 * what arguments; this module actually performs the action, reusing the same
 * data functions the UI uses (so the signed-in user's plan limits + RLS apply).
 *
 * Every return value is a small JSON object that Gemini reads back to narrate
 * what happened. On failure we return `{ ok: false, error }` rather than throw,
 * so Van can tell the operator it couldn't do it instead of the stream dying.
 */

export type VanToolContext = {
  /** The `createJob` TanStack server fn, wrapped via useServerFn in VanChat. */
  createJob: (args: { data: Record<string, unknown> }) => Promise<{ id: string; title: string }>;
  /** Invalidate React Query caches so the UI reflects Van's changes immediately. */
  invalidate: (keys: string[]) => void;
};

type ToolResult = Record<string, unknown>;

const norm = (s: string) => s.trim().toLowerCase();

async function resolveJob(input: { job_id?: string; job_title?: string }) {
  if (input.job_id) return { id: input.job_id };
  if (!input.job_title) return null;
  const jobs = await fetchJobsWithFullCustomers();
  const q = norm(input.job_title);
  const hit =
    jobs.find((j) => norm(j.title) === q) ||
    jobs.find((j) => norm(j.title).includes(q)) ||
    jobs.find((j) => norm(j.customer?.full_name ?? "").includes(q));
  return hit ? { id: hit.id, title: hit.title } : null;
}

async function resolveCustomer(input: { customer_id?: string; customer_name?: string }) {
  if (input.customer_id) return { id: input.customer_id };
  if (!input.customer_name) return null;
  const customers = await fetchCustomers();
  const q = norm(input.customer_name);
  const hit =
    customers.find((c) => norm(c.full_name) === q) ||
    customers.find((c) => norm(c.full_name).includes(q));
  return hit ? { id: hit.id, name: hit.full_name, address: hit.service_address } : null;
}

async function resolveTech(input: { tech_id?: string; tech_name?: string }) {
  if (input.tech_id) return { id: input.tech_id };
  if (!input.tech_name) return null;
  const team = await fetchTeamMembers();
  const q = norm(input.tech_name);
  const hit =
    team.find((m) => norm(m.full_name) === q) ||
    team.find((m) => norm(m.full_name).includes(q));
  return hit ? { id: hit.id, name: hit.full_name } : null;
}

export async function executeVanTool(
  toolName: string,
  rawInput: unknown,
  ctx: VanToolContext,
): Promise<ToolResult> {
  const input = (rawInput ?? {}) as Record<string, any>;
  try {
    switch (toolName as VanToolName) {
      // ---------- Reads ----------
      case "list_jobs": {
        let jobs = await fetchJobsWithFullCustomers();
        if (input.status) jobs = jobs.filter((j) => j.status === input.status);
        if (input.search) {
          const q = norm(String(input.search));
          jobs = jobs.filter(
            (j) => norm(j.title).includes(q) || norm(j.customer?.full_name ?? "").includes(q),
          );
        }
        return {
          ok: true,
          count: jobs.length,
          jobs: jobs.slice(0, 50).map((j) => ({
            id: j.id,
            title: j.title,
            customer: j.customer?.full_name ?? "Unassigned",
            status: j.status,
            service_date: j.service_date,
            amount: j.total_amount ?? j.quote_amount,
          })),
        };
      }
      case "list_customers": {
        let customers = await fetchCustomers();
        if (input.search) {
          const q = norm(String(input.search));
          customers = customers.filter(
            (c) => norm(c.full_name).includes(q) || (c.phone ?? "").includes(String(input.search)),
          );
        }
        return {
          ok: true,
          count: customers.length,
          customers: customers.slice(0, 50).map((c) => ({
            id: c.id,
            name: c.full_name,
            phone: c.phone,
            email: c.email,
            address: c.service_address,
          })),
        };
      }
      case "list_team": {
        const team = await fetchTeamMembers();
        return {
          ok: true,
          team: team.map((m) => ({ id: m.id, name: m.full_name, role: m.role, status: m.status })),
        };
      }
      case "list_outreach": {
        const outreach = await fetchNeighborOutreach();
        return {
          ok: true,
          outreach: outreach.map((o) => ({
            id: o.id,
            job_id: o.job_id,
            status: o.status,
            neighbors: o.neighbor_addresses?.length ?? 0,
          })),
        };
      }

      // ---------- Jobs ----------
      case "create_job": {
        const customer = await resolveCustomer(input);
        if ((input.customer_name || input.customer_id) && !customer) {
          return { ok: false, error: `No customer found matching "${input.customer_name}".` };
        }
        const status: JobStatus = input.status ?? (input.service_date ? "Scheduled" : "Quoted");
        const title =
          input.title?.trim() ||
          (customer?.name ? `${customer.name} — Service` : "Service Job");
        const job = await ctx.createJob({
          data: {
            title,
            customer_id: customer?.id ?? null,
            status,
            service_date: input.service_date ?? null,
            quote_amount: Number(input.quote_amount ?? 0),
          },
        });
        ctx.invalidate(["jobs", "customers"]);
        return {
          ok: true,
          created: { id: job.id, title, status, service_date: input.service_date ?? null },
          message: `Created job "${title}"${input.service_date ? ` scheduled for ${input.service_date}` : ""}.`,
        };
      }
      case "update_job_status": {
        const job = await resolveJob(input);
        if (!job) return { ok: false, error: "Could not find that job." };
        await updateJobStatus(job.id, input.status as JobStatus);
        ctx.invalidate(["jobs"]);
        return { ok: true, message: `Moved "${job.title ?? job.id}" to ${input.status}.` };
      }
      case "update_job": {
        const job = await resolveJob(input);
        if (!job) return { ok: false, error: "Could not find that job." };
        await updateJob(job.id, {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.service_date !== undefined ? { service_date: input.service_date } : {}),
          ...(input.status !== undefined ? { status: input.status as JobStatus } : {}),
        });
        ctx.invalidate(["jobs"]);
        return { ok: true, message: `Updated job "${job.title ?? job.id}".` };
      }

      // ---------- Customers ----------
      case "create_customer": {
        const created = await createCustomer({
          full_name: input.full_name,
          phone: input.phone ?? null,
          email: input.email ?? null,
          customer_type: input.customer_type ?? null,
          service_address: input.service_address ?? null,
        });
        ctx.invalidate(["customers"]);
        return { ok: true, created: { id: created.id, name: created.full_name } };
      }
      case "update_customer": {
        const customer = await resolveCustomer(input);
        if (!customer) return { ok: false, error: "Could not find that customer." };
        await updateCustomer(customer.id, {
          ...(input.full_name !== undefined ? { full_name: input.full_name } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.service_address !== undefined
            ? { service_address: input.service_address }
            : {}),
          ...(input.site_notes !== undefined ? { site_notes: input.site_notes } : {}),
        });
        ctx.invalidate(["customers"]);
        return { ok: true, message: "Customer updated." };
      }

      // ---------- Dispatch ----------
      case "assign_tech": {
        const job = await resolveJob(input);
        if (!job) return { ok: false, error: "Could not find that job." };
        const tech = await resolveTech(input);
        if (!tech) return { ok: false, error: "Could not find that team member." };
        await assignMember(job.id, tech.id);
        if (input.lead) await setLeadTech(job.id, tech.id);
        ctx.invalidate(["jobs", "job-assignments"]);
        return {
          ok: true,
          message: `Assigned ${tech.name ?? "tech"} to "${job.title ?? job.id}"${input.lead ? " as lead" : ""}.`,
        };
      }
      case "unassign_tech": {
        const job = await resolveJob(input);
        if (!job) return { ok: false, error: "Could not find that job." };
        const tech = await resolveTech(input);
        if (!tech) return { ok: false, error: "Could not find that team member." };
        await unassignMember(job.id, tech.id);
        ctx.invalidate(["jobs", "job-assignments"]);
        return { ok: true, message: `Removed ${tech.name ?? "tech"} from "${job.title ?? job.id}".` };
      }

      // ---------- Follow-ups ----------
      case "create_outreach": {
        const job = await resolveJob(input);
        if (!job) return { ok: false, error: "Could not find that job." };
        const jobs = await fetchJobsWithFullCustomers();
        const full = jobs.find((j) => j.id === job.id);
        const outreach = await createOutreachForJob(job.id, full?.customer?.service_address ?? null);
        ctx.invalidate(["neighbor-outreach"]);
        if (!outreach) return { ok: true, message: "Outreach already exists for that job." };
        return {
          ok: true,
          message: `Queued neighbor outreach (${outreach.neighbor_addresses?.length ?? 0} neighbors) — Pending your approval. No texts sent.`,
        };
      }
      case "update_outreach_status": {
        await updateOutreachStatus(input.outreach_id, input.status);
        ctx.invalidate(["neighbor-outreach"]);
        return { ok: true, message: `Outreach marked ${input.status}.` };
      }

      // ---------- Gated: money / irreversible ----------
      case "send_promo_texts":
        return {
          ok: false,
          status: "confirmation_required",
          action: "send_promo_texts",
          message:
            "Sending promo texts costs money and messages real people, so I can't do it autonomously. Open the neighbor-marketing panel and confirm the send there.",
        };
      case "invite_teammate":
        return {
          ok: false,
          status: "confirmation_required",
          action: "invite_teammate",
          message:
            "Inviting a teammate adds a paid seat, so I can't do it autonomously. Confirm it from Team settings and I'll help set them up.",
        };

      default:
        return { ok: false, error: `Van has no tool named "${toolName}".` };
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : "Action failed.";
    return { ok: false, error };
  }
}
