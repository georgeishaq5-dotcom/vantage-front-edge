import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, MapPin, MessageSquare, Briefcase } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchCustomers,
  fetchJobsWithCustomers,
  formatCurrency,
  formatDate,
} from "@/lib/fsm";

export const Route = createFileRoute("/customers/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer Profile — Vantage FSM" },
      { name: "description", content: "Detailed customer profile, job history, and communications." },
    ],
  }),
  component: CustomerProfilePage,
});

function CustomerProfilePage() {
  const { customerId } = Route.useParams();
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsWithCustomers,
  });

  const customer = customers.find((c) => c.id === customerId);
  const customerJobs = useMemo(
    () => jobs.filter((j) => j.customer_id === customerId),
    [jobs, customerId],
  );

  if (!customer) {
    return (
      <div className="mx-auto max-w-4xl px-8 py-12 text-center text-muted-foreground">
        <p>Customer not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/customers">Back to Customers</Link>
        </Button>
      </div>
    );
  }

  const initials = customer.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1.5" asChild>
        <Link to="/customers">
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>
      </Button>

      <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary text-xl font-bold text-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground">{customer.full_name}</h1>
          {customer.customer_type && (
            <span className="mt-1 inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
              {customer.customer_type}
            </span>
          )}
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> {customer.email || "—"}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> {customer.phone || "—"}
            </span>
            <span className="flex items-center gap-2 sm:col-span-2">
              <MapPin className="h-4 w-4" /> {customer.service_address || "—"}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Site Notes
            </h2>
            <p className="text-sm text-foreground">
              {customer.site_notes || "No site notes recorded for this customer."}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Customer since {formatDate(customer.created_at)}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {customerJobs.length === 0 ? (
              <div className="px-6 py-12 text-center text-muted-foreground">
                <Briefcase className="mx-auto mb-3 h-8 w-8 opacity-40" />
                No jobs on record for this customer.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">Job</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {customerJobs.map((j, i) => (
                    <tr key={j.id} className={i % 2 === 1 ? "bg-secondary/30" : "bg-card"}>
                      <td className="px-6 py-3.5 font-medium text-foreground">{j.title}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{j.status}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{formatDate(j.service_date)}</td>
                      <td className="px-6 py-3.5 text-right font-semibold text-foreground">
                        {formatCurrency(j.quote_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="communications" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground opacity-50" />
            <h2 className="text-base font-semibold text-foreground">No messages yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Texts, emails, and call logs with {customer.full_name.split(" ")[0]} will appear here
              as they are sent.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
