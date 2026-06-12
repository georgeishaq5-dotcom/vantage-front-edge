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
