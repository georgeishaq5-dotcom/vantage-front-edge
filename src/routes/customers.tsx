import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { AddCustomerModal } from "@/components/AddCustomerModal";
import { EditCustomerModal } from "@/components/EditCustomerModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { fetchCustomers, formatDate } from "@/lib/fsm";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Vantage FSM" },
      {
        name: "description",
        content: "Manage your customer ledger: search, view, and add new residential, commercial, and HOA accounts.",
      },
      { property: "og:title", content: "Customers — Vantage FSM" },
      { property: "og:description", content: "Manage your customer ledger and add new accounts." },
      { property: "og:url", content: "https://vantage-front-edge.lovable.app/customers" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-front-edge.lovable.app/customers" }],
  }),
  component: CustomersPage,
});

const TYPE_STYLES: Record<string, string> = {
  Residential: "bg-sky-50 text-sky-700 border border-sky-200",
  Commercial: "bg-secondary text-secondary-foreground border border-border",
  HOA: "bg-amber-50 text-amber-700 border border-amber-200",
};

function CustomersPage() {
  const [query, setQuery] = useState("");
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.service_address ?? "").toLowerCase().includes(q),
    );
  }, [customers, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
      <PageHeader
        title="Customers"
        description="Your complete customer ledger."
        action={<AddCustomerModal />}
      />

      <div className="mt-4 md:mt-6 flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or address…"
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "customer" : "customers"}
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Contact</th>
                <th className="px-6 py-3 font-semibold">Service Address</th>
                <th className="px-6 py-3 font-semibold">Added</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    Loading customers…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No customers match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 1 ? "bg-secondary/30" : "bg-card"}>
                    <td className="px-6 py-3.5 font-medium text-foreground">
                      <Link
                        to="/customers/$customerId"
                        params={{ customerId: c.id }}
                        className="hover:text-revenue hover:underline"
                      >
                        {c.full_name}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      {c.customer_type ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            TYPE_STYLES[c.customer_type] ?? "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {c.customer_type}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">
                      <div>{c.email || "—"}</div>
                      <div className="text-xs">{c.phone || ""}</div>
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">{c.service_address || "—"}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">{formatDate(c.created_at)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <EditCustomerModal
                        customer={c}
                        trigger={
                          <Button variant="secondary" size="sm" className="gap-1.5">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        }
                      />
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
