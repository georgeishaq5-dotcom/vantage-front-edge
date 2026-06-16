import { supabase } from "@/integrations/supabase/client";

export type JobStatus = "Quoted" | "Scheduled" | "Completed" | "Paid";
export type CustomerType = "Residential" | "Commercial" | "HOA";

export interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  customer_type: CustomerType | null;
  service_address: string | null;
  site_notes: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  customer_id: string | null;
  title: string;
  status: JobStatus;
  service_date: string | null;
  quote_amount: number;
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
  email?: string | null;
  phone?: string | null;
  customer_type?: CustomerType | null;
  service_address?: string | null;
  site_notes?: string | null;
}

export async function createCustomer(input: NewCustomer): Promise<Customer> {
  const { data, error } = await db.from("customers").insert(input).select().single();
  if (error) throw error;
  return data as Customer;
}

export interface NewJob {
  customer_id?: string | null;
  title: string;
  status: JobStatus;
  service_date?: string | null;
  quote_amount: number;
}

export async function createJob(input: NewJob): Promise<Job> {
  const { data, error } = await db.from("jobs").insert(input).select().single();
  if (error) throw error;
  return data as Job;
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

export const VOICE_TONES: VoiceTone[] = ["Enthusiastic", "Professional", "Direct"];
export const VETO_LEVELS: VetoLevel[] = ["Full Manual Review", "Semi-Autonomous"];

export interface AgentRules {
  id: string;
  target_zip_codes: string[];
  min_profit_margin: number;
  voice_tone: VoiceTone;
  veto_level: VetoLevel;
  created_at: string;
  updated_at: string;
}

export interface AgentRulesInput {
  target_zip_codes: string[];
  min_profit_margin: number;
  voice_tone: VoiceTone;
  veto_level: VetoLevel;
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


