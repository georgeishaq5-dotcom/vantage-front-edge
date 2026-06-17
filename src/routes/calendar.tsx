import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDays,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  CalendarPlus,
  GripVertical,
} from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  fetchJobsWithFullCustomers,
  fetchTeamMembers,
  fetchJobAssignments,
  updateJob,
  formatCurrency,
  formatDate,
  JOB_STATUSES,
  type JobWithFullCustomer,
  type TeamMember,
  type JobAssignment,
  type JobStatus,
} from "@/lib/fsm";
import {
  buildForecast,
  WORKABILITY_META,
  type WorkabilityLevel,
} from "@/lib/weather";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Vantage FSM" },
      {
        name: "description",
        content:
          "Interactive scheduling calendar with drag-and-drop dispatch, personnel filters, and a weather workability heat-map.",
      },
      { property: "og:title", content: "Calendar — Vantage FSM" },
      { property: "og:description", content: "Interactive field service scheduling with weather awareness." },
    ],
  }),
  component: CalendarPage,
});

type ViewMode = "agenda" | "grid";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoOf(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Minimalist monochrome weather icon for each workability level.
const WORKABILITY_ICON: Record<WorkabilityLevel, typeof Sun> = {
  1: Sun,
  2: CloudSun,
  3: CloudRain,
  4: CloudLightning,
};

function CalendarPage() {
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsWithFullCustomers,
  });
  const { data: members = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: fetchTeamMembers,
  });
  const { data: assignments = [] } = useQuery({
    queryKey: ["job_assignments"],
    queryFn: fetchJobAssignments,
  });

  const [view, setView] = useState<ViewMode>("grid");
  const [cursor, setCursor] = useState(() => new Date());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  // Filters
  const [personnel, setPersonnel] = useState<string>("all");
  const [phase, setPhase] = useState<string>("all");
  const [skill, setSkill] = useState<string>("all");

  const forecast = useMemo(() => buildForecast(), []);

  const allSkills = useMemo(
    () => Array.from(new Set(members.flatMap((m) => m.skills ?? []))).sort(),
    [members],
  );

  // job -> assigned member ids
  const jobMembers = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of assignments) {
      const arr = map.get(a.job_id) ?? [];
      arr.push(a.team_member_id);
      map.set(a.job_id, arr);
    }
    return map;
  }, [assignments]);

  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m] as const)),
    [members],
  );

  const matchesFilters = useMemo(() => {
    return (job: JobWithFullCustomer): boolean => {
      if (phase !== "all" && job.status !== phase) return false;
      const assigned = jobMembers.get(job.id) ?? [];
      if (personnel !== "all") {
        if (!assigned.includes(personnel) && job.scheduled_by_id !== personnel)
          return false;
      }
      if (skill !== "all") {
        const has = assigned.some((id) => memberById.get(id)?.skills?.includes(skill));
        if (!has) return false;
      }
      return true;
    };
  }, [phase, personnel, skill, jobMembers, memberById]);

  const filtered = useMemo(() => jobs.filter(matchesFilters), [jobs, matchesFilters]);

  const scheduled = useMemo(
    () =>
      filtered
        .filter((j) => j.service_date && j.status !== "Paid")
        .sort((a, b) => (a.service_date! < b.service_date! ? -1 : 1)),
    [filtered],
  );

  const unscheduled = useMemo(
    () => filtered.filter((j) => !j.service_date && j.status !== "Completed" && j.status !== "Paid"),
    [filtered],
  );

  const scheduleMutation = useMutation({
    mutationFn: ({ id, iso }: { id: string; iso: string }) =>
      updateJob(id, { status: "Scheduled", service_date: iso }),
    onMutate: async ({ id, iso }) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });
      const previous = queryClient.getQueryData<JobWithFullCustomer[]>(["jobs"]);
      queryClient.setQueryData<JobWithFullCustomer[]>(["jobs"], (old = []) =>
        old.map((j) =>
          j.id === id ? { ...j, status: "Scheduled" as JobStatus, service_date: iso } : j,
        ),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["jobs"], ctx.previous);
      toast.error("Failed to schedule job");
    },
    onSuccess: (_d, { iso }) => {
      const f = forecast[iso];
      if (f && f.level >= 3) {
        toast.warning(`Scheduled on a ${f.label} weather day — ${f.condition}`);
      } else {
        toast.success("Job scheduled");
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  function handleDrop(iso: string) {
    const id = draggingId;
    setDraggingId(null);
    setDragOverDay(null);
    if (!id) return;
    const job = jobs.find((j) => j.id === id);
    if (!job || job.service_date === iso) return;
    scheduleMutation.mutate({ id, iso });
  }

  // ---- Month grid construction ----
  const monthDays = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [cursor]);

  const jobsByDay = useMemo(() => {
    const map = new Map<string, JobWithFullCustomer[]>();
    for (const j of scheduled) {
      if (!j.service_date) continue;
      const arr = map.get(j.service_date) ?? [];
      arr.push(j);
      map.set(j.service_date, arr);
    }
    return map;
  }, [scheduled]);

  // ---- Sync to device calendar (ICS export with duplicate Job ID guard) ----
  function syncToDevice() {
    const SYNC_KEY = "vantage_synced_job_ids";
    let prior: string[] = [];
    try {
      prior = JSON.parse(localStorage.getItem(SYNC_KEY) ?? "[]");
    } catch {
      prior = [];
    }
    const priorSet = new Set(prior);
    const seen = new Set<string>();
    const fresh = scheduled.filter((j) => {
      if (priorSet.has(j.id) || seen.has(j.id)) return false;
      seen.add(j.id);
      return true;
    });

    const duplicates = scheduled.length - fresh.length;
    if (fresh.length === 0) {
      toast.info(`No new jobs to sync — ${duplicates} already on your device calendar.`);
      return;
    }

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//VantageFSM//Calendar//EN",
    ];
    for (const j of fresh) {
      const date = (j.service_date ?? "").replace(/-/g, "");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${j.id}@vantagefsm`,
        `DTSTART;VALUE=DATE:${date}`,
        `SUMMARY:${j.title} — ${j.customer?.full_name ?? "Unassigned"}`,
        `DESCRIPTION:${j.customer?.service_address ?? ""}`,
        "END:VEVENT",
      );
    }
    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vantage-schedule.ics";
    a.click();
    URL.revokeObjectURL(url);

    localStorage.setItem(SYNC_KEY, JSON.stringify([...priorSet, ...fresh.map((j) => j.id)]));
    toast.success(
      `Synced ${fresh.length} job${fresh.length === 1 ? "" : "s"}` +
        (duplicates > 0 ? ` — skipped ${duplicates} duplicate${duplicates === 1 ? "" : "s"}.` : "."),
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Calendar"
        description="Schedule field work with drag-and-drop dispatch and weather awareness."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={syncToDevice} className="gap-1.5">
              <CalendarPlus className="h-4 w-4" />
              Sync to Device Calendar
            </Button>
            <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
              <button
                onClick={() => setView("agenda")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  view === "agenda"
                    ? "bg-revenue text-revenue-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="h-4 w-4" />
                Agenda
              </button>
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  view === "grid"
                    ? "bg-revenue text-revenue-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                Month Grid
              </button>
            </div>
          </div>
        }
      />

      {/* Sticky filter matrix */}
      <div className="sticky top-0 z-20 -mx-4 mt-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Filters
          </span>
          <FilterSelect
            value={personnel}
            onChange={setPersonnel}
            placeholder="Personnel"
            options={members.map((m) => ({ value: m.id, label: m.full_name }))}
          />
          <FilterSelect
            value={phase}
            onChange={setPhase}
            placeholder="Job Phase"
            options={JOB_STATUSES.map((s) => ({ value: s, label: s }))}
          />
          <FilterSelect
            value={skill}
            onChange={setSkill}
            placeholder="Skill Tag"
            options={allSkills.map((s) => ({ value: s, label: s }))}
          />
          {(personnel !== "all" || phase !== "all" || skill !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPersonnel("all");
                setPhase("all");
                setSkill("all");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {view === "agenda" ? (
        <AgendaView jobs={scheduled} isLoading={isLoading} />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
          {/* Unscheduled jobs panel */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">Unscheduled Jobs</h2>
                <p className="text-xs text-muted-foreground">Drag onto a date to schedule</p>
              </div>
              <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto p-3">
                {unscheduled.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                    Nothing unscheduled
                  </p>
                ) : (
                  unscheduled.map((job) => (
                    <div
                      key={job.id}
                      draggable
                      onDragStart={() => setDraggingId(job.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverDay(null);
                      }}
                      className={cn(
                        "cursor-grab rounded-lg border border-border bg-secondary/40 p-3 shadow-sm transition-all hover:border-revenue/50 active:cursor-grabbing active:scale-[0.98]",
                        draggingId === job.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start gap-1.5">
                        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {job.customer?.full_name ?? "Unassigned"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{job.title}</div>
                          <div className="mt-1 text-xs font-medium text-revenue">
                            {formatCurrency(Number(job.quote_amount))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <WeatherLegend />
          </aside>

          {/* Month grid */}
          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 text-foreground">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold">
                  {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map((d, i) => {
                const iso = isoOf(d);
                const inMonth = d.getMonth() === cursor.getMonth();
                const isToday = iso === isoOf(new Date());
                const f = forecast[iso];
                const dayJobs = jobsByDay.get(iso) ?? [];
                return (
                  <div
                    key={iso + i}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverDay(iso);
                    }}
                    onDragLeave={() => setDragOverDay((c) => (c === iso ? null : c))}
                    onDrop={() => handleDrop(iso)}
                    className={cn(
                      "relative min-h-[104px] border-b border-r border-border bg-card p-1.5 transition-colors [&:nth-child(7n)]:border-r-0",
                      !inMonth && "bg-muted/20",
                      f && WORKABILITY_META[f.level].topBorder,
                      dragOverDay === iso && "ring-2 ring-inset ring-revenue",
                    )}
                  >
                    <div className="relative flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                          isToday
                            ? "bg-revenue text-revenue-foreground"
                            : inMonth
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {d.getDate()}
                      </span>
                      {f &&
                        (() => {
                          const Icon = WORKABILITY_ICON[f.level];
                          return (
                            <Icon
                              className="h-3.5 w-3.5 text-muted-foreground"
                              aria-label={WORKABILITY_META[f.level].label}
                            />
                          );
                        })()}
                    </div>
                    <div className="relative mt-1 flex flex-col gap-1">
                      {dayJobs.slice(0, 3).map((job) => (
                        <div
                          key={job.id}
                          draggable
                          onDragStart={() => setDraggingId(job.id)}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOverDay(null);
                          }}
                          className="cursor-grab truncate rounded bg-card/90 px-1.5 py-1 text-[11px] font-medium text-foreground shadow-sm ring-1 ring-border active:cursor-grabbing"
                          title={`${job.customer?.full_name ?? "Unassigned"} — ${job.title}`}
                        >
                          {job.customer?.full_name ?? "Unassigned"}
                        </div>
                      ))}
                      {dayJobs.length > 3 && (
                        <span className="px-1 text-[10px] text-muted-foreground">
                          +{dayJobs.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[160px] bg-card text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AgendaView({
  jobs,
  isLoading,
}: {
  jobs: JobWithFullCustomer[];
  isLoading: boolean;
}) {
  return (
    <section className="mt-6 rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-foreground">Upcoming Jobs</h2>
      </div>
      {isLoading ? (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : jobs.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
          No scheduled jobs match these filters.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {jobs.map((job) => (
            <li key={job.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <div className="font-medium text-foreground">
                  {job.customer?.full_name ?? "Unassigned"}
                </div>
                <div className="truncate text-sm text-muted-foreground">{job.title}</div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-muted-foreground">{formatDate(job.service_date)}</span>
                <StatusBadge status={job.status} />
                <span className="w-24 text-right font-semibold text-revenue">
                  {formatCurrency(Number(job.quote_amount))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WeatherLegend() {
  const items: { level: WorkabilityLevel; icon: typeof Sun }[] = [
    { level: 1, icon: Sun },
    { level: 2, icon: CloudSun },
    { level: 3, icon: CloudRain },
    { level: 4, icon: CloudLightning },
  ];
  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-3 shadow-sm">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Workability (7-day)
      </h3>
      <ul className="flex flex-col gap-1.5">
        {items.map(({ level, icon: Icon }) => {
          const meta = WORKABILITY_META[level];
          return (
            <li key={level} className={cn("flex items-center gap-2 rounded-md px-2 py-1", meta.tint)}>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">{meta.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{meta.condition}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
