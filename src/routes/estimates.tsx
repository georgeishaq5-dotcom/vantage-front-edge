import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search, Plus } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJobsWithCustomers, formatCurrency, formatDate } from "@/lib/fsm";

export const Route = createFileRoute("/estimates")({
  head: () => ({
    meta: [
      { title: "Estimates — Vantage FSM" },
      {
        name: "description",
        content: "Review and manage customer estimates and quotes awaiting approval.",
      },
      { property: "og:title", content: "Estimates — Vantage FSM" },
      { property: "og:description", content: "Manage customer estimates and quotes." },
    ],
  }),
  component: EstimatesPage,
});

function EstimatesPage() {
  const [query, setQuery] = useState("");
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsWithCustomers,
  });

  // Estimates are quoted jobs awaiting approval/scheduling.
  const estimates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs
      .filter((j) => j.status === "Quoted")
      .filter(
        (j) =>
          !q ||
          j.title.toLowerCase().includes(q) ||
          j.customer_name.toLowerCase().includes(q),
      );
  }, [jobs, query]);

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader
        title="Estimates"
        description="Quotes awaiting customer approval."
        action={
          <Button variant="revenue" asChild>
            <Link to="/quotes">
              <Plus className="mr-1.5 h-4 w-4" />
              New Estimate
            </Link>
          </Button>
        }
      />

      <div className="mt-6 flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or customer…"
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {estimates.length} {estimates.length === 1 ? "estimate" : "estimates"}
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-semibold">Estimate</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Created</th>
                <th className="px-6 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                    Loading estimates…
                  </td>
                </tr>
              ) : estimates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    No estimates yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                estimates.map((j, i) => (
                  <tr key={j.id} className={i % 2 === 1 ? "bg-secondary/30" : "bg-card"}>
                    <td className="px-6 py-3.5 font-medium text-foreground">{j.title}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">{j.customer_name}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">{formatDate(j.created_at)}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-foreground">
                      {formatCurrency(j.quote_amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
