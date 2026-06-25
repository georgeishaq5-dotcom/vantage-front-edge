import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Sun, CloudRain, Snowflake, Send, X, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/notifications";
import { buildForecast, WORKABILITY_META, type WorkabilityLevel } from "@/lib/weather";

type TriggerKind = "clear" | "rain" | "freeze";

interface PendingCampaign {
  id: string;
  kind: TriggerKind;
  forecastLabel: string;
  prompt: string;
  campaign: string;
  message: string;
  recipients: number;
}

const TRIGGER_ICON: Record<TriggerKind, typeof Sun> = {
  clear: Sun,
  rain: CloudRain,
  freeze: Snowflake,
};

const TRIGGER_ACCENT: Record<TriggerKind, string> = {
  clear: "text-amber-600",
  rain: "text-sky-600",
  freeze: "text-indigo-600",
};

/** Build the operator-facing draft queue from the upcoming forecast. */
function buildPendingQueue(): PendingCampaign[] {
  const forecast = buildForecast();
  const days = Object.entries(forecast);
  const tomorrow = days[1]?.[1];
  const queue: PendingCampaign[] = [];

  const clearLevels: WorkabilityLevel[] = [1, 2];
  if (tomorrow && clearLevels.includes(tomorrow.level)) {
    queue.push({
      id: "clear-spring-refresh",
      kind: "clear",
      forecastLabel: tomorrow.condition,
      prompt:
        "It looks clear and sunny tomorrow. Ready to blast the Spring Refresh SMS to your past clients?",
      campaign: "Spring Refresh",
      message:
        "Beautiful weather ahead! Book your Spring Refresh service this week and save 15% — reply YES to grab a slot.",
      recipients: 142,
    });
  }

  const stormDay = days.find(([, d]) => d.level === 3 || d.level === 4)?.[1];
  if (stormDay) {
    queue.push({
      id: "rain-storm-prep",
      kind: "rain",
      forecastLabel: stormDay.condition,
      prompt:
        "Storms are rolling in this week. Ready to send the Storm Prep reminder to past clients?",
      campaign: "Storm Prep",
      message:
        "Storms are on the way. Let's get your gutters & drainage checked before the downpour — reply to schedule.",
      recipients: 98,
    });
  }

  return queue;
}

export function PendingActionsCard() {
  const { notify } = useNotifications();
  const initial = useMemo(() => buildPendingQueue(), []);
  const [queue, setQueue] = useState<PendingCampaign[]>(initial);
  const [sentCount, setSentCount] = useState(0);

  function sendAll() {
    if (queue.length === 0) return;
    const total = queue.reduce((sum, c) => sum + c.recipients, 0);
    queue.forEach((c) => {
      notify(
        "customer_message",
        `${c.campaign} campaign approved`,
        `You approved the ${c.campaign} SMS to ${c.recipients} past clients.`,
      );
    });
    setSentCount(total);
    setQueue([]);
    toast.success("Campaigns approved & queued", {
      description: `${total} past clients will receive your approved SMS.`,
    });
  }

  function sendOne(id: string) {
    const c = queue.find((q) => q.id === id);
    if (!c) return;
    notify(
      "customer_message",
      `${c.campaign} campaign approved`,
      `You approved the ${c.campaign} SMS to ${c.recipients} past clients.`,
    );
    setSentCount((n) => n + c.recipients);
    setQueue((prev) => prev.filter((q) => q.id !== id));
    toast.success(`${c.campaign} approved`, {
      description: `${c.recipients} past clients queued.`,
    });
  }

  function cancel(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
    toast("Campaign cancelled", { description: "Nothing was sent." });
  }

  function cancelAll() {
    setQueue([]);
    toast("All drafts cleared", { description: "No messages were sent." });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 md:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-revenue-muted text-revenue">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">Approval Queue</h2>
            <p className="text-xs text-muted-foreground">
              Weather-triggered campaigns held for your sign-off — nothing sends automatically
            </p>
          </div>
        </div>
        {queue.length > 0 && (
          <span className="shrink-0 rounded-full bg-revenue-muted px-2.5 py-0.5 text-xs font-semibold text-revenue">
            {queue.length} pending
          </span>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-8 text-center">
          <CheckCircle2 className="h-7 w-7 text-revenue" />
          <p className="mt-2 text-sm font-medium text-foreground">No pending campaigns</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {sentCount > 0
              ? `${sentCount} clients queued from your approved campaigns.`
              : "Van will draft new campaigns here when the weather lines up."}
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-5 flex flex-col gap-3">
            {queue.map((c) => {
              const Icon = TRIGGER_ICON[c.kind];
              return (
                <li
                  key={c.id}
                  className="rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card">
                      <Icon className={`h-4 w-4 ${TRIGGER_ACCENT[c.kind]}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{c.prompt}</p>
                      <p className="mt-1 rounded-md bg-card px-3 py-2 text-xs italic text-muted-foreground">
                        “{c.message}”
                      </p>
                      <p className="mt-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                        {c.campaign} · {c.recipients} past clients · Pending approval
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="revenue" onClick={() => sendOne(c.id)}>
                          <Send className="h-3.5 w-3.5" />
                          Send
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => cancel(c.id)}>
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {queue.length > 1 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <Button variant="revenue" className="flex-1 sm:flex-none" onClick={sendAll}>
                <Send className="h-4 w-4" />
                Send All ({queue.length})
              </Button>
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={cancelAll}>
                <X className="h-4 w-4" />
                Cancel All
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
