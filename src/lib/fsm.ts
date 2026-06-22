import { supabase } from "@/integrations/supabase/client";

export type JobStatus = "Quoted" | "Scheduled" | "Completed" | "Paid";
export type CustomerType = "Residential" | "Commercial" | "HOA";

export interface Customer {
  id: string;
  company_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  customer_type: CustomerType | null;
  address?: string | null;
  service_address: string | null;
  site_notes: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  company_id?: string | null;
  customer_id: string | null;
  assigned_tech_id?: string | null;
  job_phase?: string | null;
  skill_tag?: string | null;
  title: string;
  description?: string | null;
  status: JobStatus;
  service_date: string | null;
  scheduled_date?: string | null;
  quote_amount: number;
  total_amount?: number;
  scheduled_by_id: string | null;
  created_at: string;
}

export interface JobWithCustomer extends Job {
  customer_name: string;
}

export const JOB_STATUSES: JobStatus[] = ["Quoted", "Scheduled", "Completed", "Paid"];
export const CUSTOMER_TYPES: CustomerType[] = ["Residential", "Commercial", "HOA"];

const db = supabase as unknown as {
  from: (t: string) => any;
};

/**
 * Resolves the signed-in user's company_id from their profile so it can be
 * attached explicitly to inserts (matching the RLS `company_id = current_company_id()`
 * policy). If the profile is missing a company we provision one on the fly so the
 * tenant context is never NULL.
 */
export async function getCurrentCompanyId(): Promise<string> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[fsm] getUser failed:", authError);
    throw authError;
  }
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not authenticated — no active user session.");

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("company_id")
    .eq("id", uid)
    .maybeSingle();
  if (profileError) {
    console.error("[fsm] profile lookup failed:", profileError);
    throw profileError;
  }

  if (profile?.company_id) return profile.company_id as string;

  // No company yet — create a workspace and link the profile to it.
  const { data: company, error: companyError } = await db
    .from("companies")
    .insert({ name: auth.user?.email ?? "My Workspace" })
    .select("id")
    .single();
  if (companyError) {
    console.error("[fsm] company creation failed:", companyError);
    throw companyError;
  }

  const { error: upsertError } = await db
    .from("profiles")
    .upsert({ id: uid, email: auth.user?.email, company_id: company.id });
  if (upsertError) {
    console.error("[fsm] profile upsert failed:", upsertError);
    throw upsertError;
  }

  return company.id as string;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await db
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function fetchJobs(): Promise<Job[]> {
  const { data, error } = await db
    .from("jobs")
    .select("*")
    .order("service_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Job[];
}

export async function fetchJobsWithCustomers(): Promise<JobWithCustomer[]> {
  const [jobs, customers] = await Promise.all([fetchJobs(), fetchCustomers()]);
  const map = new Map(customers.map((c) => [c.id, c.full_name]));
  return jobs.map((j) => ({
    ...j,
    customer_name: (j.customer_id && map.get(j.customer_id)) || "Unassigned",
  }));
}

export interface NewCustomer {
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  customer_type?: CustomerType | null;
  address?: string | null;
  service_address?: string | null;
  site_notes?: string | null;
}

// Split "First Last" into parts when explicit names aren't provided.
function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

export async function createCustomer(input: NewCustomer): Promise<Customer> {
  try {
    const company_id = await getCurrentCompanyId();
    const { first, last } = splitName(input.full_name);
    const row = {
      ...input,
      company_id,
      first_name: input.first_name ?? first,
      last_name: input.last_name ?? last,
      // Keep the new `address` column in sync with the legacy `service_address`.
      address: input.address ?? input.service_address ?? null,
    };
    const { data, error } = await db.from("customers").insert(row).select().single();
    if (error) throw error;
    return data as Customer;
  } catch (err) {
    console.error("[fsm] createCustomer failed:", err);
    throw err;
  }
}

export interface NewJob {
  customer_id?: string | null;
  title: string;
  description?: string | null;
  status: JobStatus;
  job_phase?: string | null;
  skill_tag?: string | null;
  assigned_tech_id?: string | null;
  service_date?: string | null;
  scheduled_date?: string | null;
  quote_amount: number;
  total_amount?: number;
}

export async function createJob(input: NewJob): Promise<Job> {
  try {
    const company_id = await getCurrentCompanyId();
    const row = {
      ...input,
      company_id,
      description: input.description ?? input.title,
      // Mirror the legacy `quote_amount` into the canonical `total_amount`.
      total_amount: input.total_amount ?? input.quote_amount,
    };
    const { data, error } = await db.from("jobs").insert(row).select().single();
    if (error) throw error;
    return data as Job;
  } catch (err) {
    console.error("[fsm] createJob failed:", err);
    throw err;
  }
}

export async function updateJobStatus(id: string, status: JobStatus): Promise<void> {
  const { error } = await db.from("jobs").update({ status }).eq("id", id);
  if (error) throw error;
}

export interface CustomerUpdate {
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  customer_type?: CustomerType | null;
  service_address?: string | null;
  site_notes?: string | null;
}

export async function updateCustomer(id: string, input: CustomerUpdate): Promise<Customer> {
  const { data, error } = await db
    .from("customers")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Customer;
}

export interface JobUpdate {
  status?: JobStatus;
  service_date?: string | null;
  title?: string;
  scheduled_by_id?: string | null;
}

export async function updateJob(id: string, input: JobUpdate): Promise<void> {
  const { error } = await db.from("jobs").update(input).eq("id", id);
  if (error) throw error;
}

// ============= Dispatch board =============

export type DispatchLane = "Unscheduled" | "Scheduled Today" | "Completed";

export const DISPATCH_LANES: DispatchLane[] = [
  "Unscheduled",
  "Scheduled Today",
  "Completed",
];

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Determine which dispatch lane a job belongs to.
export function jobLane(job: Job): DispatchLane {
  if (job.status === "Completed" || job.status === "Paid") return "Completed";
  if (job.service_date) return "Scheduled Today";
  return "Unscheduled";
}

// The job mutation needed to move a job into a target lane.
export function laneTransition(lane: DispatchLane): JobUpdate {
  switch (lane) {
    case "Unscheduled":
      return { status: "Quoted", service_date: null };
    case "Scheduled Today":
      return { status: "Scheduled", service_date: todayISO() };
    case "Completed":
      return { status: "Completed" };
  }
}

export interface JobWithFullCustomer extends Job {
  customer: Customer | null;
}

export async function fetchJobsWithFullCustomers(): Promise<JobWithFullCustomer[]> {
  const [jobs, customers] = await Promise.all([fetchJobs(), fetchCustomers()]);
  const map = new Map(customers.map((c) => [c.id, c]));
  return jobs.map((j) => ({
    ...j,
    customer: (j.customer_id && map.get(j.customer_id)) || null,
  }));
}

// ============= Phone number formatting =============

// Frontend mask: format raw digits into US (XXX) XXX-XXXX as the user types.
export function formatUSPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  const len = digits.length;
  if (len === 0) return "";
  if (len < 4) return `(${digits}`;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// Strip spaces/dashes and prepend +1 to match Twilio's E.164 requirement.
export function toE164US(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export type ARStatus = "Paid" | "Overdue" | "Current";

export interface LedgerEntry {
  customer: Customer;
  jobs: Job[];
  lifetimeValue: number;
  outstanding: number;
  arStatus: ARStatus;
  lastServiceDate: string | null;
  overdueInvoices: OverdueInvoice[];
}

export interface OverdueInvoice {
  job: Job;
  customer: Customer;
  hoursLate: number;
}

const OVERDUE_THRESHOLD_HOURS = 48;

function hoursSince(date: string | null): number {
  if (!date) return 0;
  const d = new Date(date.slice(0, 10) + "T00:00:00").getTime();
  return Math.max(0, Math.round((Date.now() - d) / 3_600_000));
}

export function buildLedger(customers: Customer[], jobs: Job[]): LedgerEntry[] {
  return customers
    .map<LedgerEntry>((customer) => {
      const own = jobs.filter((j) => j.customer_id === customer.id);
      const lifetimeValue = own
        .filter((j) => j.status === "Paid")
        .reduce((s, j) => s + Number(j.quote_amount), 0);
      const completed = own.filter((j) => j.status === "Completed");
      const outstanding = completed.reduce((s, j) => s + Number(j.quote_amount), 0);

      const overdueInvoices: OverdueInvoice[] = completed
        .map((job) => ({ job, customer, hoursLate: hoursSince(job.service_date) }))
        .filter((o) => o.hoursLate >= OVERDUE_THRESHOLD_HOURS);

      const dates = own
        .map((j) => j.service_date)
        .filter((d): d is string => !!d)
        .sort();
      const lastServiceDate = dates.length ? dates[dates.length - 1] : null;

      const arStatus: ARStatus =
        overdueInvoices.length > 0 ? "Overdue" : completed.length > 0 ? "Current" : "Paid";

      return {
        customer,
        jobs: own,
        lifetimeValue,
        outstanding,
        arStatus,
        lastServiceDate,
        overdueInvoices,
      };
    })
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue);
}

export function collectOverdue(entries: LedgerEntry[]): OverdueInvoice[] {
  return entries
    .flatMap((e) => e.overdueInvoices)
    .sort((a, b) => b.hoursLate - a.hoursLate);
}

// ============= Invoice history (derived from jobs) =============

export type InvoiceStatus = "Paid" | "Outstanding" | "Draft";

export interface Invoice {
  id: string;
  date: string | null;
  title: string;
  amount: number;
  status: InvoiceStatus;
}

export function buildInvoiceHistory(jobs: Job[]): Invoice[] {
  return jobs
    .map<Invoice>((j) => ({
      id: j.id,
      date: j.service_date,
      title: j.title,
      amount: Number(j.quote_amount),
      status:
        j.status === "Paid" ? "Paid" : j.status === "Completed" ? "Outstanding" : "Draft",
    }))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  Paid: "bg-revenue-muted text-revenue border border-revenue/30",
  Outstanding: "bg-amber-50 text-amber-700 border border-amber-200",
  Draft: "bg-secondary text-secondary-foreground border border-border",
};

// Simulated address generation for the Neighbor Hook proximity module.
export function adjacentAddresses(base: string | null, count = 5): string[] {
  const fallback = "Field Service Area";
  const source = (base ?? fallback).trim();
  const match = source.match(/^(\d+)\s+(.*)$/);
  if (!match) {
    return Array.from({ length: count }, (_, i) => `${source} — Unit ${i + 1}`);
  }
  const num = parseInt(match[1], 10);
  const street = match[2];
  const offsets = [2, -2, 4, -4, 6];
  return offsets
    .slice(0, count)
    .map((o) => `${Math.max(1, num + o)} ${street}`);
}

// ============= Marketing campaign analytics (simulated) =============

export type CampaignStatus = "Sent" | "Delivered" | "Link Clicked" | "Job Booked";

export const CAMPAIGN_FUNNEL: CampaignStatus[] = [
  "Sent",
  "Delivered",
  "Link Clicked",
  "Job Booked",
];

export interface PromoText {
  id: string;
  recipient: string;
  address: string;
  campaign: string;
  sentAt: number;
  status: CampaignStatus;
}

export const CAMPAIGN_STATUS_STYLES: Record<CampaignStatus, string> = {
  Sent: "bg-secondary text-secondary-foreground border border-border",
  Delivered: "bg-sky-50 text-sky-700 border border-sky-200",
  "Link Clicked": "bg-amber-50 text-amber-700 border border-amber-200",
  "Job Booked": "bg-revenue-muted text-revenue border border-revenue/30",
};

const PROMO_CAMPAIGNS = [
  "Spring Tune-Up Promo",
  "Neighbor Referral Bonus",
  "Proximity Flash Offer",
  "Seasonal Maintenance Push",
];

const PROMO_NAMES = [
  "Avery Collins",
  "Jordan Reyes",
  "Priya Nair",
  "Marcus Webb",
  "Elena Sokolova",
  "Tomás Herrera",
  "Hannah Bauer",
  "Wei Chen",
  "Olivia Grant",
  "Devon Brooks",
];

// Build a deterministic set of recent promo texts, optionally seeded from
// real customer addresses for the Neighbor Hook proximity campaigns.
export function buildPromoTexts(addresses: string[] = []): PromoText[] {
  const now = Date.now();
  return PROMO_NAMES.map((name, i) => {
    const baseAddr = addresses[i % Math.max(1, addresses.length)] ?? null;
    const neighbor = adjacentAddresses(baseAddr, 5)[i % 5];
    return {
      id: `promo-${i}`,
      recipient: name,
      address: neighbor,
      campaign: PROMO_CAMPAIGNS[i % PROMO_CAMPAIGNS.length],
      sentAt: now - i * 7 * 60_000,
      status: "Sent" as CampaignStatus,
    };
  });
}

export function nextCampaignStatus(status: CampaignStatus): CampaignStatus | null {
  const idx = CAMPAIGN_FUNNEL.indexOf(status);
  if (idx < 0 || idx >= CAMPAIGN_FUNNEL.length - 1) return null;
  return CAMPAIGN_FUNNEL[idx + 1];
}

export function formatRelativeTime(ts: number): string {
  const diff = Math.round((Date.now() - ts) / 60_000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const h = Math.round(diff / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// ============= AI Operator agent rules =============

export type VoiceTone = "Enthusiastic" | "Professional" | "Direct";
export type VetoLevel = "Full Manual Review" | "Semi-Autonomous";
export type FollowUpTrigger = "Every 3 Days" | "Every 5 Days" | "Weekly";

export const VOICE_TONES: VoiceTone[] = ["Enthusiastic", "Professional", "Direct"];
export const VETO_LEVELS: VetoLevel[] = ["Full Manual Review", "Semi-Autonomous"];
export const FOLLOW_UP_TRIGGERS: FollowUpTrigger[] = ["Every 3 Days", "Every 5 Days", "Weekly"];

export interface AgentRules {
  id: string;
  target_zip_codes: string[];
  min_profit_margin: number;
  voice_tone: VoiceTone;
  veto_level: VetoLevel;
  outreach_start_hour: number;
  outreach_end_hour: number;
  max_autonomous_discount: number;
  follow_up_trigger: FollowUpTrigger;
  auto_approve_limit: number;
  handoff_keyword: string;
  weather_rain: boolean;
  weather_heat: boolean;
  weather_freeze: boolean;
  lead_strictness: number;
  created_at: string;
  updated_at: string;
}

export interface AgentRulesInput {
  target_zip_codes: string[];
  min_profit_margin: number;
  voice_tone: VoiceTone;
  veto_level: VetoLevel;
  outreach_start_hour: number;
  outreach_end_hour: number;
  max_autonomous_discount: number;
  follow_up_trigger: FollowUpTrigger;
  auto_approve_limit: number;
  handoff_keyword: string;
  weather_rain: boolean;
  weather_heat: boolean;
  weather_freeze: boolean;
  lead_strictness: number;
}

// Load the single agent rules profile, or null if not yet configured.
export async function fetchAgentRules(): Promise<AgentRules | null> {
  const { data, error } = await db
    .from("agent_rules")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as AgentRules) ?? null;
}

// Upsert the agent rules profile (insert if none exists, otherwise update).
export async function saveAgentRules(
  existingId: string | null,
  input: AgentRulesInput,
): Promise<AgentRules> {
  if (existingId) {
    const { data, error } = await db
      .from("agent_rules")
      .update(input)
      .eq("id", existingId)
      .select()
      .single();
    if (error) throw error;
    return data as AgentRules;
  }
  const { data, error } = await db.from("agent_rules").insert(input).select().single();
  if (error) throw error;
  return data as AgentRules;
}

// ============= Neighbor outreach (automated direct mail) =============

export type OutreachStatus = "Pending" | "Approved" | "Vetoed";

export interface NeighborOutreach {
  id: string;
  job_id: string | null;
  neighbor_addresses: string[];
  cost: number;
  status: OutreachStatus;
  created_at: string;
  updated_at: string;
}

export interface NeighborOutreachWithJob extends NeighborOutreach {
  job: JobWithFullCustomer | null;
}

// Generate the 10 closest physical neighbor addresses around a base address.
export function nearbyNeighborAddresses(base: string | null, count = 10): string[] {
  const fallback = "Field Service Area";
  const source = (base ?? fallback).trim();
  const match = source.match(/^(\d+)\s+(.*)$/);
  if (!match) {
    return Array.from({ length: count }, (_, i) => `${source} — Unit ${i + 1}`);
  }
  const num = parseInt(match[1], 10);
  const street = match[2];
  const result: string[] = [];
  let step = 1;
  while (result.length < count) {
    const up = num + step * 2;
    const down = num - step * 2;
    result.push(`${up} ${street}`);
    if (result.length < count && down >= 1) result.push(`${down} ${street}`);
    step += 1;
  }
  return result.slice(0, count);
}

export async function fetchNeighborOutreach(): Promise<NeighborOutreach[]> {
  const { data, error } = await db
    .from("neighbor_outreach")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as NeighborOutreach[];
}

export async function fetchNeighborOutreachWithJobs(): Promise<NeighborOutreachWithJob[]> {
  const [outreach, jobs] = await Promise.all([
    fetchNeighborOutreach(),
    fetchJobsWithFullCustomers(),
  ]);
  const map = new Map(jobs.map((j) => [j.id, j]));
  return outreach.map((o) => ({
    ...o,
    job: (o.job_id && map.get(o.job_id)) || null,
  }));
}

// Simulate the AI agent background workflow: ping the mapping tool for the 10
// closest neighbors and queue a pending outreach campaign for a job.
export async function createOutreachForJob(
  jobId: string,
  baseAddress: string | null,
  cost = 10,
): Promise<NeighborOutreach | null> {
  // Avoid duplicate outreach for the same job.
  const { data: existing } = await db
    .from("neighbor_outreach")
    .select("id")
    .eq("job_id", jobId)
    .limit(1)
    .maybeSingle();
  if (existing) return null;

  const addresses = nearbyNeighborAddresses(baseAddress, 10);
  const { data, error } = await db
    .from("neighbor_outreach")
    .insert({ job_id: jobId, neighbor_addresses: addresses, cost, status: "Pending" })
    .select()
    .single();
  if (error) throw error;
  return data as NeighborOutreach;
}

export async function updateOutreachStatus(
  id: string,
  status: OutreachStatus,
): Promise<void> {
  const { error } = await db.from("neighbor_outreach").update({ status }).eq("id", id);
  if (error) throw error;
}

export const OUTREACH_STATUS_STYLES: Record<OutreachStatus, string> = {
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  Approved: "bg-revenue-muted text-revenue border border-revenue/30",
  Vetoed: "bg-secondary text-secondary-foreground border border-border",
};

// ============= Team & RBAC (multi-tenant placeholder) =============

// Placeholder tenant id until real auth / multi-tenant isolation is wired up.
export const COMPANY_ID = "vantage-co";

export type TeamRole = "Owner/Admin" | "Dispatcher" | "Field Tech";
export type MemberStatus = "Active" | "Busy" | "Offline";

export const TEAM_ROLES: TeamRole[] = ["Owner/Admin", "Dispatcher", "Field Tech"];

export interface TeamMember {
  id: string;
  company_id: string;
  full_name: string;
  role: TeamRole;
  status: MemberStatus;
  skills: string[];
  email: string | null;
  created_at: string;
  updated_at: string;
}

export const ROLE_BADGE_STYLES: Record<TeamRole, string> = {
  "Owner/Admin": "bg-revenue-muted text-revenue border border-revenue/30",
  Dispatcher: "bg-sky-50 text-sky-700 border border-sky-200",
  "Field Tech": "bg-secondary text-secondary-foreground border border-border",
};

// Status dot colors: Green (Active), Yellow (Busy), Gray (Offline).
export const STATUS_DOT_STYLES: Record<MemberStatus, string> = {
  Active: "bg-emerald-500",
  Busy: "bg-amber-400",
  Offline: "bg-muted-foreground/40",
};

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// Deterministic avatar color from a member id, for consistent badge tints.
const AVATAR_TINTS = [
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

export function avatarTint(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return AVATAR_TINTS[sum % AVATAR_TINTS.length];
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await db
    .from("team_members")
    .select("*")
    .eq("company_id", COMPANY_ID)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TeamMember[];
}

export interface NewTeamMember {
  full_name: string;
  role: TeamRole;
  status?: MemberStatus;
  skills?: string[];
  email?: string | null;
}

export async function createTeamMember(input: NewTeamMember): Promise<TeamMember> {
  const { data, error } = await db
    .from("team_members")
    .insert({ ...input, company_id: COMPANY_ID })
    .select()
    .single();
  if (error) throw error;
  return data as TeamMember;
}

// ============= Multi-tech crew assignments =============

export interface JobAssignment {
  id: string;
  job_id: string;
  team_member_id: string;
  is_lead: boolean;
  created_at: string;
}

export async function fetchJobAssignments(): Promise<JobAssignment[]> {
  const { data, error } = await db.from("job_assignments").select("*");
  if (error) throw error;
  return (data ?? []) as JobAssignment[];
}

export async function assignMember(jobId: string, memberId: string): Promise<void> {
  const { error } = await db
    .from("job_assignments")
    .insert({ job_id: jobId, team_member_id: memberId, is_lead: false });
  if (error) throw error;
}

export async function unassignMember(jobId: string, memberId: string): Promise<void> {
  const { error } = await db
    .from("job_assignments")
    .delete()
    .eq("job_id", jobId)
    .eq("team_member_id", memberId);
  if (error) throw error;
}

// Designate one assignee as the mandatory Lead Tech (clears any other lead).
export async function setLeadTech(jobId: string, memberId: string): Promise<void> {
  const clear = await db
    .from("job_assignments")
    .update({ is_lead: false })
    .eq("job_id", jobId);
  if (clear.error) throw clear.error;
  const { error } = await db
    .from("job_assignments")
    .update({ is_lead: true })
    .eq("job_id", jobId)
    .eq("team_member_id", memberId);
  if (error) throw error;
}

export async function setJobScheduledBy(jobId: string, memberId: string | null): Promise<void> {
  const { error } = await db.from("jobs").update({ scheduled_by_id: memberId }).eq("id", jobId);
  if (error) throw error;
}

// ============= Collision detection (edit locks) =============

export interface JobLock {
  job_id: string;
  locked_by_id: string;
  locked_by_name: string;
  locked_at: string;
}

export async function fetchJobLock(jobId: string): Promise<JobLock | null> {
  const { data, error } = await db
    .from("job_locks")
    .select("*")
    .eq("job_id", jobId)
    .maybeSingle();
  if (error) throw error;
  return (data as JobLock) ?? null;
}

// Acquire a lock for the current user. Returns the lock currently held: either
// our own (success) or another user's (collision).
export async function acquireJobLock(
  jobId: string,
  userId: string,
  userName: string,
): Promise<JobLock> {
  const existing = await fetchJobLock(jobId);
  if (existing && existing.locked_by_id !== userId) return existing;
  const { data, error } = await db
    .from("job_locks")
    .upsert(
      { job_id: jobId, locked_by_id: userId, locked_by_name: userName, locked_at: new Date().toISOString() },
      { onConflict: "job_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as JobLock;
}

export async function releaseJobLock(jobId: string, userId: string): Promise<void> {
  await db.from("job_locks").delete().eq("job_id", jobId).eq("locked_by_id", userId);
}

// ============= Alert routing (Van notification logic) =============

// System & marketing alerts go to Admins; active scheduling alerts go straight
// to the assigned Lead Tech on the job.
export type AlertCategory = "system" | "marketing" | "scheduling";
export type AlertAudience = "Admin" | "Lead Tech";

export function routeAlertTo(category: AlertCategory): AlertAudience {
  return category === "scheduling" ? "Lead Tech" : "Admin";
}

export const ALERT_ROUTING: { category: AlertCategory; label: string; audience: AlertAudience }[] = [
  { category: "system", label: "System & health alerts", audience: "Admin" },
  { category: "marketing", label: "Marketing & promo activity", audience: "Admin" },
  { category: "scheduling", label: "Active scheduling changes", audience: "Lead Tech" },
];

// ============= Unfalsifiable job activity log (audit trail) =============

export type ActivityActor = "Van" | "System" | string;

export interface JobActivityEntry {
  id: string;
  at: number;
  actor: ActivityActor;
  isAi: boolean;
  action: string;
}

// Build a deterministic, chronological audit trail of background actions on a
// specific job. Derived from the job lifecycle + assigned crew so the same job
// always renders the same immutable history.
export function buildJobActivityLog(
  job: Job,
  members: TeamMember[],
  assignments: JobAssignment[],
  customerName: string,
): JobActivityEntry[] {
  const jobAssignments = assignments.filter((a) => a.job_id === job.id);
  const memberById = new Map(members.map((m) => [m.id, m]));
  const lead = jobAssignments.find((a) => a.is_lead);
  const leadName = lead ? memberById.get(lead.team_member_id)?.full_name : null;
  const scheduledBy = job.scheduled_by_id
    ? memberById.get(job.scheduled_by_id)?.full_name
    : null;
  const dispatcher = members.find((m) => m.role === "Dispatcher")?.full_name ?? "Dispatcher";
  const admin = members.find((m) => m.role === "Owner/Admin")?.full_name ?? "Admin";

  const base = new Date(job.created_at).getTime();
  const HOUR = 3_600_000;
  const entries: JobActivityEntry[] = [];
  let step = 0;
  const push = (actor: ActivityActor, isAi: boolean, action: string) => {
    entries.push({ id: `${job.id}-${step}`, at: base + step * HOUR, actor, isAi, action });
    step += 1;
  };

  push("Van", true, `Lead captured for ${customerName} and qualified against agent rules`);
  push("Van", true, `Tiered quote of ${formatCurrency(Number(job.quote_amount))} drafted and sent`);

  if (job.status !== "Quoted") {
    push(scheduledBy ?? dispatcher, false, "changed schedule time and dispatched the job");
    if (job.service_date) {
      push("Van", true, `Arrival confirmation text sent to ${customerName}`);
    }
    for (const a of jobAssignments) {
      const m = memberById.get(a.team_member_id);
      if (m) push(dispatcher, false, `assigned ${m.full_name}${a.is_lead ? " as Lead Tech" : ""} to the job`);
    }
  }

  if (job.status === "Completed" || job.status === "Paid") {
    push("Van", true, "Neighbor outreach campaign queued around the service address");
    push(leadName ?? "Lead Tech", false, "closed out the work order and generated the invoice");
  }
  if (job.status === "Paid") {
    push("Van", true, "Payment received and reconciled");
    push(admin, false, "marked the invoice as paid");
  }

  return entries.sort((a, b) => b.at - a.at);
}

// ============= Financial reporting (completed-job revenue export) =============

export interface FinancialReportRow {
  jobId: string;
  customer: string;
  customerType: string;
  jobTitle: string;
  serviceDate: string;
  status: string;
  revenue: number;
}

export function buildFinancialReport(jobs: JobWithFullCustomer[]): FinancialReportRow[] {
  return jobs
    .filter((j) => j.status === "Completed" || j.status === "Paid")
    .map((j) => ({
      jobId: j.id,
      customer: j.customer?.full_name ?? "Unassigned",
      customerType: j.customer?.customer_type ?? "—",
      jobTitle: j.title,
      serviceDate: j.service_date ?? "",
      status: j.status,
      revenue: Number(j.quote_amount),
    }))
    .sort((a, b) => (b.serviceDate ?? "").localeCompare(a.serviceDate ?? ""));
}



// ============= Trade & pricing presets =============

export interface PresetUpgrade {
  key: string;
  name: string;
  description: string;
  price: number;
  recommended?: boolean;
}

export interface TradePreset {
  id: string;
  profession: string;
  base_job_title: string;
  base_job_description: string;
  base_price: number;
  upgrades: PresetUpgrade[];
  created_at: string;
  updated_at: string;
}

export interface TradePresetInput {
  profession: string;
  base_job_title: string;
  base_job_description: string;
  base_price: number;
  upgrades: PresetUpgrade[];
}

// Standard field service trades offered during onboarding.
export const PROFESSIONS = [
  "Landscaping",
  "Plumbing",
  "HVAC",
  "Handyman",
  "Fencing/Decking",
  "Electrical",
  "Cleaning",
  "Pest Control",
] as const;

// Per-trade default templates applied during onboarding / when a trade changes.
export const PROFESSION_PRESETS: Record<string, TradePresetInput> = {
  Landscaping: {
    profession: "Landscaping",
    base_job_title: "Lawn Maintenance",
    base_job_description: "Mowing, edging, blowing & seasonal cleanup",
    base_price: 120,
    upgrades: [
      { key: "fertilization", name: "Fertilization & weed control", description: "Seasonal treatment to keep turf healthy and green.", price: 85, recommended: true },
      { key: "mulch", name: "Premium mulch refresh", description: "Fresh hardwood mulch installed across all beds.", price: 160 },
      { key: "aeration", name: "Core aeration & overseed", description: "Relieve compaction and thicken the lawn.", price: 140, recommended: true },
      { key: "irrigation", name: "Irrigation tune-up", description: "Inspect and adjust all sprinkler zones.", price: 95 },
    ],
  },
  Plumbing: {
    profession: "Plumbing",
    base_job_title: "Service Call & Diagnosis",
    base_job_description: "On-site diagnosis and standard repair labor",
    base_price: 220,
    upgrades: [
      { key: "premium-parts", name: "Premium-grade fixtures", description: "Brand-name fixtures with extended warranty.", price: 180, recommended: true },
      { key: "water-heater", name: "Water heater flush", description: "Full tank flush to extend equipment life.", price: 130 },
      { key: "camera", name: "Camera line inspection", description: "Video scope of the main drain line.", price: 195, recommended: true },
      { key: "warranty", name: "Extended 3-year warranty", description: "Workmanship coverage for three years.", price: 220 },
    ],
  },
  HVAC: {
    profession: "HVAC",
    base_job_title: "System Service & Tune-Up",
    base_job_description: "Full inspection, cleaning, and performance check",
    base_price: 320,
    upgrades: [
      { key: "filter", name: "Premium filtration upgrade", description: "High-efficiency filter with better air quality.", price: 90, recommended: true },
      { key: "refrigerant", name: "Refrigerant top-off", description: "Recharge to manufacturer spec.", price: 160 },
      { key: "maintenance", name: "Annual maintenance plan", description: "Two scheduled tune-ups per year.", price: 240, recommended: true },
      { key: "thermostat", name: "Smart thermostat install", description: "Wi-Fi thermostat supplied and installed.", price: 210 },
    ],
  },
  Handyman: {
    profession: "Handyman",
    base_job_title: "Half-Day Service Block",
    base_job_description: "Up to 4 hours of general repair labor",
    base_price: 280,
    upgrades: [
      { key: "materials", name: "Materials & hardware", description: "Standard supplies sourced for the job.", price: 90, recommended: true },
      { key: "haul", name: "Debris haul-away", description: "Remove and dispose of old materials.", price: 75 },
      { key: "extra-hours", name: "Additional 2 hours", description: "Extend the visit for larger projects.", price: 140 },
      { key: "warranty", name: "Workmanship warranty", description: "One-year coverage on all labor.", price: 110 },
    ],
  },
  "Fencing/Decking": {
    profession: "Fencing/Decking",
    base_job_title: "Linear Footage Install",
    base_job_description: "Standard install priced per linear foot",
    base_price: 600,
    upgrades: [
      { key: "premium-material", name: "Premium material upgrade", description: "Cedar or composite instead of standard pine.", price: 450, recommended: true },
      { key: "gates", name: "Custom gate add-on", description: "Heavy-duty gate with locking hardware.", price: 320 },
      { key: "staining", name: "Seal & stain finish", description: "Protective stain to extend lifespan.", price: 280, recommended: true },
      { key: "removal", name: "Old fence removal", description: "Tear-out and disposal of existing fence.", price: 240 },
    ],
  },
  Electrical: {
    profession: "Electrical",
    base_job_title: "Service Call & Diagnosis",
    base_job_description: "On-site troubleshooting and standard labor",
    base_price: 250,
    upgrades: [
      { key: "panel", name: "Panel inspection", description: "Full safety review of the electrical panel.", price: 150, recommended: true },
      { key: "surge", name: "Whole-home surge protector", description: "Protect electronics from power spikes.", price: 280 },
      { key: "outlets", name: "GFCI outlet upgrades", description: "Replace standard outlets with GFCI.", price: 120, recommended: true },
      { key: "warranty", name: "Extended 3-year warranty", description: "Workmanship coverage for three years.", price: 200 },
    ],
  },
  Cleaning: {
    profession: "Cleaning",
    base_job_title: "Standard Cleaning Visit",
    base_job_description: "Full interior cleaning for a standard home",
    base_price: 160,
    upgrades: [
      { key: "deep", name: "Deep clean add-on", description: "Baseboards, vents, and detailed scrubbing.", price: 120, recommended: true },
      { key: "windows", name: "Interior windows", description: "Clean all reachable interior glass.", price: 70 },
      { key: "appliances", name: "Inside appliances", description: "Clean inside oven and refrigerator.", price: 85, recommended: true },
      { key: "recurring", name: "Recurring discount plan", description: "Locked rate for biweekly service.", price: 0 },
    ],
  },
  "Pest Control": {
    profession: "Pest Control",
    base_job_title: "General Pest Treatment",
    base_job_description: "Interior & perimeter treatment",
    base_price: 140,
    upgrades: [
      { key: "termite", name: "Termite inspection", description: "Full structure termite assessment.", price: 130, recommended: true },
      { key: "rodent", name: "Rodent exclusion", description: "Seal entry points and set traps.", price: 180 },
      { key: "mosquito", name: "Mosquito yard treatment", description: "Seasonal yard fogging.", price: 110, recommended: true },
      { key: "quarterly", name: "Quarterly protection plan", description: "Four visits per year at a locked rate.", price: 320 },
    ],
  },
};

export const DEFAULT_PRESET: TradePresetInput = {
  profession: "General Field Service",
  base_job_title: "Base Job",
  base_job_description: "Core service & labor",
  base_price: 480,
  upgrades: [
    { key: "premium-parts", name: "Premium-grade parts", description: "Longer-lasting components with extended manufacturer coverage.", price: 180, recommended: true },
    { key: "warranty", name: "Extended 3-year warranty", description: "Full workmanship coverage for three years instead of 30 days.", price: 220 },
    { key: "inspection", name: "Full system safety inspection", description: "Top-to-bottom check of the surrounding system while we're on site.", price: 95, recommended: true },
    { key: "maintenance", name: "Annual maintenance plan", description: "One scheduled tune-up per year to prevent future breakdowns.", price: 140 },
    { key: "priority", name: "Priority scheduling & 24/7 support", description: "Front-of-line booking and emergency phone support.", price: 75 },
  ],
};

// Resolve the preset template for a profession (custom trades fall back to default).
export function presetForProfession(profession: string): TradePresetInput {
  return PROFESSION_PRESETS[profession] ?? { ...DEFAULT_PRESET, profession };
}

// Load the singleton trade preset row (or null if none exists yet).
export async function fetchTradePresets(): Promise<TradePreset | null> {
  const { data, error } = await db
    .from("trade_presets")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, upgrades: (data.upgrades ?? []) as PresetUpgrade[] } as TradePreset;
}

// Upsert the singleton trade preset row.
export async function saveTradePresets(
  existingId: string | null,
  input: TradePresetInput,
): Promise<TradePreset> {
  if (existingId) {
    const { data, error } = await db
      .from("trade_presets")
      .update(input)
      .eq("id", existingId)
      .select()
      .single();
    if (error) throw error;
    return data as TradePreset;
  }
  const { data, error } = await db.from("trade_presets").insert(input).select().single();
  if (error) throw error;
  return data as TradePreset;
}

// ============= Profile / onboarding =============

export const TEAM_SIZES = ["1 (Solo)", "2-5", "6-15", "16+"] as const;
export const REVENUE_BANDS = ["Under $100k", "$100k-$500k", "$500k-$1M", "$1M+"] as const;
export const YEARS_IN_BUSINESS = [
  "Just starting",
  "1-3 years",
  "4-10 years",
  "10+ years",
] as const;

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  profession: string | null;
  onboarded: boolean;
  company_name: string | null;
  team_size: string | null;
  yearly_revenue: string | null;
  years_in_business: string | null;
}

export interface OnboardingDetails {
  profession: string;
  company_name: string;
  team_size: string;
  yearly_revenue: string;
  years_in_business: string;
}

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await db
    .from("profiles")
    .select(
      "id,email,full_name,profession,onboarded,company_name,team_size,yearly_revenue,years_in_business",
    )
    .eq("id", uid)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

// Persist the expanded onboarding details without completing onboarding yet.
export async function saveOnboardingDetails(input: OnboardingDetails): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await db.from("profiles").update(input).eq("id", uid);
  if (error) throw error;
}

// Mark onboarding complete after the feature tour finishes.
export async function finishOnboarding(): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await db.from("profiles").update({ onboarded: true }).eq("id", uid);
  if (error) throw error;
}

export async function completeOnboarding(profession: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await db
    .from("profiles")
    .update({ profession, onboarded: true })
    .eq("id", uid);
  if (error) throw error;
}


/**
 * Records consumption of one automated (Pro) job for the current workspace,
 * incrementing companies.automated_jobs_count. The first 3 are free-trial; see
 * src/lib/entitlements.ts for the access model.
 */
export async function consumeAutomatedJob(): Promise<number> {
  const companyId = await getCurrentCompanyId();
  const { data: current, error: readError } = await db
    .from("companies")
    .select("automated_jobs_count")
    .eq("id", companyId)
    .maybeSingle();
  if (readError) throw readError;
  const next = (current?.automated_jobs_count ?? 0) + 1;
  const { error } = await db
    .from("companies")
    .update({ automated_jobs_count: next })
    .eq("id", companyId);
  if (error) throw error;
  return next;
}
