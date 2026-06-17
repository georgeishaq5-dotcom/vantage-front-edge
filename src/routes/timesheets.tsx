import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Clock, Play, Square } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/timesheets")({
  head: () => ({
    meta: [
      { title: "Time & Timesheets — Vantage FSM" },
      {
        name: "description",
        content: "Track work hours with a live timer and review the day's time entries.",
      },
      { property: "og:title", content: "Time & Timesheets — Vantage FSM" },
      {
        property: "og:description",
        content: "Clock in, clock out, and review daily time logs.",
      },
    ],
  }),
  component: TimesheetsPage,
});

type TimeEntry = {
  id: string;
  start: number;
  end: number;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatClock(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const STORAGE_KEY = "vantage_timesheet_entries";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function TimesheetsPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [clockedInAt, setClockedInAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${todayKey()}`);
      if (raw) setEntries(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (clockedInAt === null) {
      if (tick.current) clearInterval(tick.current);
      return;
    }
    tick.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [clockedInAt]);

  function persist(next: TimeEntry[]) {
    setEntries(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_KEY}_${todayKey()}`, JSON.stringify(next));
    }
  }

  function handleClock() {
    if (clockedInAt === null) {
      setClockedInAt(Date.now());
      setNow(Date.now());
    } else {
      const entry: TimeEntry = {
        id: crypto.randomUUID(),
        start: clockedInAt,
        end: Date.now(),
      };
      persist([entry, ...entries]);
      setClockedInAt(null);
    }
  }

  const elapsed = clockedInAt === null ? 0 : now - clockedInAt;
  const loggedTotal = entries.reduce((sum, e) => sum + (e.end - e.start), 0);
  const dailyTotal = loggedTotal + elapsed;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-8 md:py-8">
      <PageHeader
        title="Time & Timesheets"
        description="Track your hours and review the day's entries."
      />

      <Tabs defaultValue="track" className="mt-4 md:mt-6">
        <TabsList>
          <TabsTrigger value="track">Track Time</TabsTrigger>
          <TabsTrigger value="log">Time Log</TabsTrigger>
        </TabsList>

        <TabsContent value="track">
          <div className="flex flex-col items-center gap-3 md:gap-5 rounded-xl border border-border bg-card p-3 md:p-6 text-center shadow-sm md:p-10">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                clockedInAt !== null
                  ? "bg-revenue-muted text-revenue"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  clockedInAt !== null ? "bg-revenue animate-pulse" : "bg-muted-foreground"
                }`}
              />
              {clockedInAt !== null ? "On the clock" : "Clocked out"}
            </span>

            <div className="font-mono text-5xl font-extrabold tracking-tight tabular-nums text-foreground md:text-7xl">
              {formatDuration(elapsed)}
            </div>

            <Button
              size="lg"
              variant={clockedInAt !== null ? "destructive" : "revenue"}
              className="w-full max-w-xs gap-2 rounded-xl text-base"
              onClick={handleClock}
            >
              {clockedInAt !== null ? (
                <>
                  <Square className="h-4 w-4" /> Clock Out
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Clock In
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Logged today: <span className="font-semibold text-foreground">{formatDuration(loggedTotal)}</span>
            </p>
          </div>
        </TabsContent>

        <TabsContent value="log">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6 md:py-4">
              <h2 className="text-sm font-semibold text-foreground md:text-base">Today's Entries</h2>
              <span className="text-xs font-semibold text-foreground">
                Total {formatDuration(dailyTotal)}
              </span>
            </div>

            {entries.length === 0 && clockedInAt === null ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                <Clock className="mx-auto mb-3 h-8 w-8 opacity-40" />
                No time entries yet today. Clock in to get started.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {clockedInAt !== null && (
                  <li className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">In progress</p>
                      <p className="text-xs text-muted-foreground">
                        {formatClock(clockedInAt)} — now
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-revenue">
                      {formatDuration(elapsed)}
                    </span>
                  </li>
                )}
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">Time entry</p>
                      <p className="text-xs text-muted-foreground">
                        {formatClock(e.start)} — {formatClock(e.end)}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                      {formatDuration(e.end - e.start)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
