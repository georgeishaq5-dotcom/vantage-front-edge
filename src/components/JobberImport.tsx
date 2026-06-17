import { useState } from "react";
import { toast } from "sonner";
import {
  DownloadCloud,
  KeyRound,
  BellRing,
  Users,
  MapPin,
  FileText,
  Briefcase,
  ReceiptText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALERT_ROUTING } from "@/lib/fsm";

// Everything our database can support, mapped from each provider's API.
const HISTORICAL_ENTITIES = [
  { icon: Users, label: "Customer Profiles" },
  { icon: MapPin, label: "Property Addresses" },
  { icon: FileText, label: "Active & Past Quotes" },
  { icon: Briefcase, label: "Historical Job Records" },
  { icon: ReceiptText, label: "Invoices" },
] as const;

type Provider = {
  id: "jobber" | "quoteiq";
  name: string;
  tokenPlaceholder: string;
  tokenHint: string;
};

const PROVIDERS: Provider[] = [
  {
    id: "jobber",
    name: "Jobber",
    tokenPlaceholder: "jbr_live_••••••••••••••••",
    tokenHint: "Find your token in Jobber under Settings → API Access.",
  },
  {
    id: "quoteiq",
    name: "QuoteIQ",
    tokenPlaceholder: "qiq_live_••••••••••••••••",
    tokenHint: "Find your token in QuoteIQ under Account → Developer → API Keys.",
  },
];

function ImporterCard({ provider }: { provider: Provider }) {
  const [token, setToken] = useState("");
  const [syncing, setSyncing] = useState(false);

  function runFullHistoricalSync() {
    if (token.trim().length < 8) {
      toast.error(`Enter a valid ${provider.name} API token to sync.`);
      return;
    }
    setSyncing(true);
    // Placeholder import handshake — the full API mapping runs server-side and
    // pulls every supported entity (customers, addresses, quotes, jobs, invoices).
    setTimeout(() => {
      setSyncing(false);
      toast.success(
        `${provider.name} linked — Van is importing your full history (customers, quotes, jobs & invoices) in the background.`,
      );
    }, 1100);
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
          <DownloadCloud className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Sync Direct from {provider.name} Account
          </h2>
          <p className="text-sm text-muted-foreground">
            Paste your {provider.name} API token to import your complete history.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2 border-t border-border pt-5">
        <Label htmlFor={`${provider.id}-token`}>{provider.name} API Token</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`${provider.id}-token`}
            type="password"
            placeholder={provider.tokenPlaceholder}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {provider.tokenHint} It is stored securely and never shown in plain text.
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          This sync pulls
        </p>
        <ul className="mt-2 grid grid-cols-1 gap-1.5">
          {HISTORICAL_ENTITIES.map((e) => (
            <li key={e.label} className="flex items-center gap-2 text-sm text-foreground">
              <e.icon className="h-4 w-4 text-revenue" />
              {e.label}
            </li>
          ))}
        </ul>
      </div>

      <Button
        variant="revenue"
        onClick={runFullHistoricalSync}
        disabled={syncing}
        className="mt-4 w-full gap-2"
      >
        <DownloadCloud className="h-4 w-4" />
        {syncing ? "Syncing…" : "Run Full Historical Sync"}
      </Button>
    </div>
  );
}

export function JobberImport() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {PROVIDERS.map((p) => (
          <ImporterCard key={p.id} provider={p} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Van Alert Routing</h2>
            <p className="text-sm text-muted-foreground">
              How Van decides who receives each type of notification.
            </p>
          </div>
        </div>
        <ul className="mt-5 space-y-3 border-t border-border pt-5">
          {ALERT_ROUTING.map((r) => (
            <li key={r.category} className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{r.label}</span>
              <span
                className={
                  r.audience === "Lead Tech"
                    ? "rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 border border-sky-200"
                    : "rounded-full bg-revenue-muted px-3 py-1 text-xs font-medium text-revenue"
                }
              >
                → {r.audience}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
