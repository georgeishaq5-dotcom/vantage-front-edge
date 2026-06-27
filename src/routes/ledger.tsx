import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronDown,
  FileText,
  Loader2,
  MapPin,
  Send,
  Radar,
  ShieldAlert,
} from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditCustomerModal } from "@/components/EditCustomerModal";
import { useFeatureGate } from "@/components/FeatureGate";
import { sendPromoSms } from "@/lib/sms.functions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  adjacentAddresses,
  buildInvoiceHistory,
  buildLedger,
  collectOverdue,
  fetchCustomers,
  fetchJobs,
  formatCurrency,
  formatDate,
  INVOICE_STATUS_STYLES,
  toE164US,
  updateCustomer,
  type ARStatus,
  type LedgerEntry,
} from "@/lib/fsm";


export const Route = createFileRoute("/ledger")({
  head: () => ({
    meta: [
      { title: "Client Ledger — Vantage FSM" },
      {
        name: "description",
        content:
          "Relational client ledger with lifetime value, AR status, and an internal AR auditor for overdue invoices.",
      },
      { property: "og:title", content: "Client Ledger — Vantage FSM" },
      {
        property: "og:description",
        content: "Track lifetime value, AR status, and audit overdue invoices.",
      },
      { property: "og:url", content: "https://vantage-front-edge.lovable.app/ledger" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-front-edge.lovable.app/ledger" }],
  }),
  component: LedgerPage,
});

const AR_TAG: Record<ARStatus, string> = {
  Paid: "bg-revenue-muted text-revenue border border-revenue/30",
  Current: "bg-sky-50 text-sky-700 border border-sky-200",
  Overdue: "bg-red-50 text-red-700 border border-red-200",
};

function ARTag({ status }: { status: ARStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        AR_TAG[status],
      )}
    >
      {status === "Overdue" && <AlertTriangle className="h-3 w-3" />}
      {status}
    </span>
  );
}

function LedgerPage() {
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });
  const [expanded, setExpanded] = useState<string | null>(null);

  const ledger = useMemo(() => buildLedger(customers, jobs), [customers, jobs]);
  const overdue = useMemo(() => collectOverdue(ledger), [ledger]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
      <PageHeader
        title="Client Ledger"
        description="Relational view of lifetime value, AR status, and service history."
        action={<AuditorPanel overdue={overdue} />}
      />

      <div className="mt-4 md:mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-semibold">Client</th>
                <th className="px-6 py-3 font-semibold">Total Lifetime Value</th>
                <th className="px-6 py-3 font-semibold">Current AR Status</th>
                <th className="px-6 py-3 font-semibold">Last Service Date</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    Loading ledger…
                  </td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    No clients yet.
                  </td>
                </tr>
              ) : (
                ledger.map((entry, i) => (
                  <LedgerRow
                    key={entry.customer.id}
                    entry={entry}
                    zebra={i % 2 === 1}
                    open={expanded === entry.customer.id}
                    onToggle={() =>
                      setExpanded((cur) => (cur === entry.customer.id ? null : entry.customer.id))
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LedgerRow({
  entry,
  zebra,
  open,
  onToggle,
}: {
  entry: LedgerEntry;
  zebra: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={cn("cursor-pointer transition-colors hover:bg-secondary/60", zebra ? "bg-secondary/30" : "bg-card")}
        onClick={onToggle}
      >
        <td className="px-6 py-3.5 font-medium text-foreground">{entry.customer.full_name}</td>
        <td className="px-6 py-3.5 font-semibold text-revenue">
          {formatCurrency(entry.lifetimeValue)}
        </td>
        <td className="px-6 py-3.5">
          <ARTag status={entry.arStatus} />
        </td>
        <td className="px-6 py-3.5 text-muted-foreground">{formatDate(entry.lastServiceDate)}</td>
        <td className="px-6 py-3.5 text-right">
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </td>
      </tr>
      {open && (
        <tr className="bg-sidebar/[0.03]">
          <td colSpan={5} className="px-6 pb-6 pt-2">
            <ClientProfile entry={entry} />
          </td>
        </tr>
      )}
    </>
  );
}

function ClientProfile({ entry }: { entry: LedgerEntry }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Account Overview</h3>
            <EditCustomerModal customer={entry.customer} />
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Outstanding AR</dt>
              <dd className="font-semibold text-foreground">{formatCurrency(entry.outstanding)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total Jobs</dt>
              <dd className="font-medium text-foreground">{entry.jobs.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Service Address</dt>
              <dd className="text-right font-medium text-foreground">
                {entry.customer.service_address || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Contact</dt>
              <dd className="font-medium text-foreground">{entry.customer.phone || entry.customer.email || "—"}</dd>
            </div>
          </dl>
        </div>

        <SiteNotes entry={entry} />
      </div>

      <Tabs defaultValue="promo">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="promo">Proximity Promo</TabsTrigger>
          <TabsTrigger value="invoices">Invoice History</TabsTrigger>
        </TabsList>
        <TabsContent value="promo" className="mt-3">
          <NeighborHook entry={entry} />
        </TabsContent>
        <TabsContent value="invoices" className="mt-3">
          <InvoiceHistory entry={entry} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SiteNotes({ entry }: { entry: LedgerEntry }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(entry.customer.site_notes ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      updateCustomer(entry.customer.id, { site_notes: notes.trim() || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Site note saved");
    },
    onError: () => toast.error("Could not save note. Please try again."),
  });

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-foreground">Site Notes &amp; Hazards</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Persistent warnings for the crew (e.g. gate codes, pets, parking).
      </p>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="e.g. Gate code is 1234. Beware of dog in the back yard."
        className="mt-3 bg-card"
      />
      <Button
        variant="revenue"
        size="sm"
        className="mt-3"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Saving…" : "Save Note"}
      </Button>
    </div>
  );
}

function InvoiceHistory({ entry }: { entry: LedgerEntry }) {
  const invoices = useMemo(() => buildInvoiceHistory(entry.jobs), [entry.jobs]);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Invoice History</h3>
      </div>
      <div className="mt-3 space-y-2">
        {invoices.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/30 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{inv.title}</div>
                <div className="text-xs text-muted-foreground">{formatDate(inv.date)}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold text-revenue">
                  {formatCurrency(inv.amount)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    INVOICE_STATUS_STYLES[inv.status],
                  )}
                >
                  {inv.status}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    toast.info("PDF generation coming soon", {
                      description: `Invoice for ${inv.title} will be available as a PDF.`,
                    })
                  }
                >
                  <FileText className="h-3.5 w-3.5" />
                  Generate PDF Invoice
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


function NeighborHook({ entry }: { entry: LedgerEntry }) {
  const neighbors = useMemo(
    () => adjacentAddresses(entry.customer.service_address),
    [entry.customer.service_address],
  );
  const sendSms = useServerFn(sendPromoSms);
  const [sending, setSending] = useState(false);

  const testNumber = entry.customer.phone;
  const e164Number = toE164US(testNumber);

  async function deploy() {
    if (!testNumber) {
      toast.error("No contact phone number on file", {
        description: "Add a contact phone to this account before deploying.",
      });
      return;
    }
    setSending(true);
    try {
      const result = await sendSms({
        data: {
          to: e164Number,
          message: `Hi from Vantage FSM! We're running a neighborhood promo near ${entry.customer.service_address || "your area"}. Reply YES to claim your spot.`,
        },
      });
      toast.success("Promo SMS delivered", {
        description: `Twilio confirmed message ${result.sid} (${result.status}) to ${e164Number}.`,
      });

    } catch (err) {
      toast.error("Failed to send promo SMS", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSending(false);
    }
  }


  return (
    <div className="relative overflow-hidden rounded-lg border border-sidebar/40 bg-sidebar p-5 text-sidebar-foreground">
      <div className="flex items-center gap-2">
        <Radar className="h-4 w-4 text-revenue" />
        <h3 className="text-sm font-semibold text-white">Deploy Proximity Promo</h3>
      </div>
      <p className="mt-1 text-xs text-sidebar-foreground/70">
        Target neighbors within a 0.2 mile radius of this account.
      </p>

      <div className="relative mt-4 flex h-32 items-center justify-center rounded-md border border-sidebar-border bg-[radial-gradient(circle,rgba(148,163,184,0.25)_1px,transparent_1px)] [background-size:16px_16px]">
        <span className="absolute h-24 w-24 animate-none rounded-full border border-revenue/40 bg-revenue/5" />
        <span className="absolute h-16 w-16 rounded-full border border-revenue/60 bg-revenue/10" />
        <MapPin className="relative h-6 w-6 text-revenue" />
      </div>

      <ul className="mt-3 space-y-1">
        {neighbors.map((addr) => (
          <li key={addr} className="flex items-center gap-2 text-xs text-sidebar-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-revenue" />
            {addr}
          </li>
        ))}
      </ul>

      <Button
        variant="revenue"
        className="mt-4 w-full"
        onClick={deploy}
        disabled={sending}
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {sending ? "Sending…" : `Send Promo to Test Number`}
      </Button>

    </div>
  );
}

function AuditorPanel({ overdue }: { overdue: ReturnType<typeof collectOverdue> }) {
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const { requireFeature } = useFeatureGate();

  function sendFollowUp(id: string, name: string) {
    if (!requireFeature("auto_collections")) return;
    setSent((s) => ({ ...s, [id]: true }));
    toast.success("Follow-up sent", {
      description: `A polite collection SMS was simulated to ${name}.`,
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="default" className="gap-2">
          <ShieldAlert className="h-4 w-4" />
          AR Auditor
          {overdue.length > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
              {overdue.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            AR Auditor
          </SheetTitle>
          <SheetDescription>
            Invoices more than 48 hours past their service date. Send a one-click follow-up to
            recover outstanding revenue.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 md:mt-6 space-y-3">
          {overdue.length === 0 ? (
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-10 text-center text-sm text-muted-foreground">
              No overdue invoices. You're all caught up.
            </div>
          ) : (
            overdue.map((o) => (
              <div
                key={o.job.id}
                className="rounded-lg border border-red-200 bg-red-50/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground">{o.customer.full_name}</div>
                    <div className="text-xs text-muted-foreground">{o.job.title}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                    {o.hoursLate}h late
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Due {formatDate(o.job.service_date)}</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(Number(o.job.quote_amount))}
                  </span>
                </div>
                <Button
                  variant={sent[o.job.id] ? "outline" : "revenue"}
                  size="sm"
                  className="mt-3 w-full"
                  disabled={sent[o.job.id]}
                  onClick={() => sendFollowUp(o.job.id, o.customer.full_name)}
                >
                  <Send className="h-3.5 w-3.5" />
                  {sent[o.job.id] ? "Follow-up Sent" : "Send Automated Follow-up"}
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
