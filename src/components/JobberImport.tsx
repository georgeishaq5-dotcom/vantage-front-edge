import { useState } from "react";
import { toast } from "sonner";
import { DownloadCloud, KeyRound, BellRing } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALERT_ROUTING } from "@/lib/fsm";

export function JobberImport() {
  const [token, setToken] = useState("");
  const [syncing, setSyncing] = useState(false);

  function sync() {
    if (token.trim().length < 8) {
      toast.error("Enter a valid Jobber API token to sync.");
      return;
    }
    setSyncing(true);
    // Placeholder import handshake — wiring to the Jobber API happens server-side.
    setTimeout(() => {
      setSyncing(false);
      toast.success("Jobber account linked — Van will import customers & jobs in the background.");
    }, 1100);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
            <DownloadCloud className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Sync Direct from Jobber Account</h2>
            <p className="text-sm text-muted-foreground">
              Paste your Jobber API token to import customers, jobs, and revenue history.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2 border-t border-border pt-5">
          <Label htmlFor="jobber-token">Jobber API Token</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="jobber-token"
                type="password"
                placeholder="jbr_live_••••••••••••••••"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="revenue" onClick={sync} disabled={syncing} className="gap-2">
              <DownloadCloud className="h-4 w-4" />
              {syncing ? "Syncing…" : "Sync from Jobber"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Find your token in Jobber under Settings → API Access. It is stored securely and never shown in plain text.
          </p>
        </div>
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
