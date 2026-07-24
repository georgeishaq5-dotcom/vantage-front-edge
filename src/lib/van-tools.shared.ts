import { tool } from "ai";
import { z } from "zod";

/**
 * Van's tool surface. These definitions are sent to Gemini so it knows what Van
 * can actually DO. They intentionally have NO `execute` — that makes them
 * client-side tools: the browser fulfils each call (see van-tools.client.ts)
 * using the exact same functions the UI buttons call, so Van runs as the
 * signed-in operator and inherits their plan limits + RLS. Nothing here can
 * bypass a permission the user doesn't already have.
 *
 * Keep the tool NAMES here in sync with the switch in van-tools.client.ts.
 */

const JOB_STATUS = z.enum(["Quoted", "Scheduled", "Completed", "Paid"]);

export const VAN_TOOLS = {
  // ---- Read / grounding: let Van see real data before it acts or answers ----
  list_jobs: tool({
    description:
      "List the company's jobs with customer name, status, dates and amount. Call this to answer questions about the schedule/board or to find a job's id before acting on it.",
    inputSchema: z.object({
      status: JOB_STATUS.optional().describe("Optional filter by job status."),
      search: z
        .string()
        .optional()
        .describe("Optional case-insensitive match on job title or customer name."),
    }),
  }),
  list_customers: tool({
    description:
      "List customers (name, phone, email, address). Use to find a customer's id by name before creating a job or updating them.",
    inputSchema: z.object({
      search: z.string().optional().describe("Optional case-insensitive name/phone match."),
    }),
  }),
  list_team: tool({
    description:
      "List team members (name, role, status) so you can find a tech's id before assigning them to a job.",
    inputSchema: z.object({}),
  }),
  list_outreach: tool({
    description: "List neighbor-outreach campaigns and their status (Pending/Approved/Vetoed).",
    inputSchema: z.object({}),
  }),

  // ---- Jobs ----
  create_job: tool({
    description:
      "Create a new job / add it to the schedule. Provide a customer by name (customer_name) or id. If a service_date is given the job is Scheduled, otherwise Quoted. This is a real write to the dispatch board.",
    inputSchema: z.object({
      customer_name: z.string().optional().describe("Customer name — resolved to an id."),
      customer_id: z.string().uuid().optional(),
      title: z.string().optional().describe("Job title. Defaults from the customer name."),
      status: JOB_STATUS.optional(),
      service_date: z
        .string()
        .optional()
        .describe("ISO date YYYY-MM-DD the job is scheduled for."),
      quote_amount: z.number().min(0).optional().describe("Quoted/estimate amount in dollars."),
    }),
  }),
  update_job_status: tool({
    description:
      "Move a job to a new status (Quoted → Scheduled → Completed → Paid). Identify the job by id or by title.",
    inputSchema: z.object({
      job_id: z.string().uuid().optional(),
      job_title: z.string().optional(),
      status: JOB_STATUS,
    }),
  }),
  update_job: tool({
    description: "Edit a job's title, scheduled service_date, or status. Identify by id or title.",
    inputSchema: z.object({
      job_id: z.string().uuid().optional(),
      job_title: z.string().optional(),
      title: z.string().optional(),
      service_date: z.string().nullable().optional().describe("ISO date YYYY-MM-DD, or null to clear."),
      status: JOB_STATUS.optional(),
    }),
  }),

  // ---- Customers ----
  create_customer: tool({
    description: "Create a new customer record.",
    inputSchema: z.object({
      full_name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().optional(),
      customer_type: z.enum(["Residential", "Commercial", "HOA"]).optional(),
      service_address: z.string().optional(),
    }),
  }),
  update_customer: tool({
    description: "Update an existing customer. Identify by id or by current name.",
    inputSchema: z.object({
      customer_id: z.string().uuid().optional(),
      customer_name: z.string().optional(),
      full_name: z.string().optional().describe("New name."),
      phone: z.string().optional(),
      email: z.string().optional(),
      service_address: z.string().optional(),
      site_notes: z.string().optional(),
    }),
  }),

  // ---- Dispatch ----
  assign_tech: tool({
    description:
      "Assign a team member (tech) to a job. Set lead=true to also make them the lead tech. Identify job and tech by id or name.",
    inputSchema: z.object({
      job_id: z.string().uuid().optional(),
      job_title: z.string().optional(),
      tech_id: z.string().uuid().optional(),
      tech_name: z.string().optional(),
      lead: z.boolean().optional(),
    }),
  }),
  unassign_tech: tool({
    description: "Remove a team member from a job. Identify job and tech by id or name.",
    inputSchema: z.object({
      job_id: z.string().uuid().optional(),
      job_title: z.string().optional(),
      tech_id: z.string().uuid().optional(),
      tech_name: z.string().optional(),
    }),
  }),

  // ---- Follow-ups / neighbor marketing (records only, no texts sent) ----
  create_outreach: tool({
    description:
      "Queue a neighbor-outreach follow-up for a job (finds the 10 closest neighbors and creates a Pending campaign record). Does NOT send any texts — sending requires the operator's approval.",
    inputSchema: z.object({
      job_id: z.string().uuid().optional(),
      job_title: z.string().optional(),
    }),
  }),
  update_outreach_status: tool({
    description: "Approve or veto a queued neighbor-outreach campaign.",
    inputSchema: z.object({
      outreach_id: z.string().uuid(),
      status: z.enum(["Pending", "Approved", "Vetoed"]),
    }),
  }),

  // ---- Money / irreversible actions: represented but NOT auto-executed ----
  // Van can prepare these, but the client returns a "confirmation_required"
  // result instead of firing them, so an LLM slip can't spend money or delete
  // data unattended. See van-tools.client.ts.
  send_promo_texts: tool({
    description:
      "Send promotional SMS texts to neighbors of a job. This spends money and messages real people, so it is NOT executed autonomously — calling it asks the operator to confirm first.",
    inputSchema: z.object({
      job_id: z.string().uuid().optional(),
      job_title: z.string().optional(),
    }),
  }),
  invite_teammate: tool({
    description:
      "Invite a new teammate by email (adds a paid seat). NOT executed autonomously — asks the operator to confirm first.",
    inputSchema: z.object({
      email: z.string(),
      role: z.enum(["Owner/Admin", "Dispatcher", "Field Tech"]).optional(),
    }),
  }),
} as const;

export type VanToolName = keyof typeof VAN_TOOLS;
