import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDays,
  CalendarRange,
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
  type JobStatus,
} from "@/lib/fsm";
import { buildForecast, WORKABILITY_META, type WorkabilityLevel } from "@/lib/weather";

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
      {
        property: "og:description",
        content: "Interactive field service scheduling with weather awareness.",
      },
      { property: "og:url", content: "https://vantage-front-edge.lovable.app/calendar" },
    ],
    links: [{ rel: "canonical", href: "https://vantage-front-edge.lovable.app/calendar" }],
  }),
  component: CalendarPage,
});

type ViewMode = "week" | "month" | "agenda";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Shared canonical-design card / divider treatments (sharp corners, hairline).
const CARD = "border border-border bg-card";
const DIVIDER = "border-border";

function isoOf(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Monday-anchored start of the week containing `d`. */
function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (x.getDay() + 6) % 7; // Mon = 0 … Sun = 6
  x.setDate(x.getDate() - offset);
  return x;
}

// Minimalist monochrome weather icon for each workability level.
const WORKABILITY_ICON: Record<WorkabilityLevel, typeof Sun> = {
  1: Sun,
  2: CloudSun,
  3: CloudRain,
  4: CloudLightning,
};

const VIEW_OPTIONS: { value: ViewMode; label: string; icon: typeof List }[] = [
  { value: "week", label: "Week", icon: CalendarRange },
  { value: "month", label: "Month", icon: LayoutGrid },
  { value: "agenda", label: "Agenda", icon: List },
];

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

  const [view, setView] = useState<ViewMode>("week");
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

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m] as const)), [members]);

  const matchesFilters = useMemo(() => {
    return (job: JobWithFullCustomer): boolean => {
      if (phase !== "all" && job.status !== phase) return false;
      const assigned = jobMembers.get(job.id) ?? [];
      if (personnel !== "all") {
        if (!assigned.includes(personnel) && job.scheduled_by_id !== personnel) return false;
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
    () =>
      filtered.filter((j) => !j.service_date && j.status !== "Completed" && j.status !== "Paid"),
    [filtered],
  );

  const filtersActive = personnel !== "all" || phase !== "all" || skill !== "all";

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

  // ---- Week view construction (Mon-anchored, 7 columns) ----
  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const todayIso = isoOf(new Date());
  const weekStartIso = isoOf(weekDays[0]);
  const weekEndIso = isoOf(weekDays[6]);
  const isThisWeek = todayIso >= weekStartIso && todayIso <= weekEndIso;
  const weekJobs = weekDays.flatMap((d) => jobsByDay.get(isoOf(d)) ?? []);
  const weekTotal = weekJobs.reduce((sum, j) => sum + Number(j.quote_amount), 0);
  const weekRange = `${weekDays[0].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${weekDays[6].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  function shiftWeek(dir: number) {
    setCursor((c) => {
      const d = new Date(c);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  }
  function shiftMonth(dir: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + dir, 1));
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

    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VantageFSM//Calendar//EN"];
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
        (duplicates > 0
          ? ` — skipped ${duplicates} duplicate${duplicates === 1 ? "" : "s"}.`
          : "."),
    );
  }

  const dragProps = (iso: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverDay(iso);
    },
    onDragLeave: () => setDragOverDay((c) => (c === iso ? null : c)),
    onDrop: () => handleDrop(iso),
  });

  function JobBlock({ job }: { job: JobWithFullCustomer }) {
    return (
      <div
        draggable
        onDragStart={() => setDraggingId(job.id)}
        onDragEnd={() => {
          setDraggingId(null);
          setDragOverDay(null);
        }}
        title={`${job.customer?.full_name ?? "Unassigned"} — ${job.title}`}
        className={cn(
          "cursor-grab border border-revenue/25 border-l-2 border-l-revenue bg-revenue/[0.07] px-2.5 py-2 transition-colors hover:bg-revenue/[0.12] active:cursor-grabbing",
          draggingId === job.id && "opacity-50",
        )}
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="truncate text-[11px] font-bold text-foreground">
            {job.customer?.full_name ?? "Unassigned"}
          </span>
          <span className="shrink-0 text-[10px] font-extrabold text-revenue">
            {formatCurrency(Number(job.quote_amount))}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{job.title}</p>
        <div className="mt-1.5">
          <StatusBadge status={job.status} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-8 sm:py-7">
      <PageHeader
        title="Calendar"
        description="Schedule field work with drag-and-drop dispatch and weather awareness."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={syncToDevice}
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 border border-border bg-card px-3 text-[11px] font-bold uppercase tracking-wide text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              <CalendarPlus className="h-4 w-4" />
              Sync to Device
            </button>
            <div className="inline-flex w-full border border-border bg-card p-0.5 sm:w-auto">
              {VIEW_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = view === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setView(opt.value)}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors sm:flex-none",
                      active
                        ? "bg-revenue text-revenue-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        }
      />

      {/* Sticky filter matrix */}
      <div className="sticky top-0 z-20 -mx-4 mt-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
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
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setPersonnel("all");
                setPhase("all");
                setSkill("all");
              }}
              className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {view === "agenda" ? (
        <AgendaView jobs={scheduled} isLoading={isLoading} />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3.5 md:mt-5 lg:grid-cols-[260px_1fr]">
          {/* Unscheduled jobs panel (drag source, shared by week + month) */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className={CARD}>
              <div className={cn("border-b px-4 py-3", DIVIDER)}>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground">
                  Unscheduled Jobs
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Drag onto a day to schedule
                </p>
              </div>
              <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto p-3">
                {unscheduled.length === 0 ? (
                  <p className="border border-dashed border-border py-6 text-center text-[11px] text-muted-foreground">
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
                        "cursor-grab border border-border bg-muted/40 p-3 transition-colors hover:border-revenue/50 active:cursor-grabbing active:scale-[0.98]",
                        draggingId === job.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start gap-1.5">
                        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="truncate text-[12.5px] font-bold text-foreground">
                            {job.customer?.full_name ?? "Unassigned"}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {job.title}
                          </div>
                          <div className="mt-1 text-[11px] font-extrabold text-revenue">
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

          {view === "week" ? (
            /* ===== Week view: Mon–Sun day columns of real (date-only) jobs ===== */
            <section className={CARD}>
              <div className={cn("flex flex-wrap items-center gap-3 border-b px-4 py-3", DIVIDER)}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous week"
                    onClick={() => shiftWeek(-1)}
                    className="grid h-8 w-8 place-items-center border border-border text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next week"
                    onClick={() => shiftWeek(1)}
                    className="grid h-8 w-8 place-items-center border border-l-0 border-border text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-[13px] font-extrabold tracking-[0.01em] text-foreground">
                  {weekRange}
                </span>
                {isThisWeek ? (
                  <span className="border border-brand/45 bg-brand/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand">
                    This week
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCursor(new Date())}
                    className="border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Today
                  </button>
                )}
                <div className="flex-1" />
                <span className="text-[11.5px] font-bold text-muted-foreground">
                  {weekJobs.length} scheduled ·{" "}
                  <span className="text-revenue">{formatCurrency(weekTotal)}</span>
                </span>
              </div>

              <div className="overflow-x-auto">
                <div className="flex min-w-[840px]">
                  {weekDays.map((d) => {
                    const iso = isoOf(d);
                    const isToday = iso === todayIso;
                    const f = forecast[iso];
                    const dayJobs = jobsByDay.get(iso) ?? [];
                    return (
                      <div
                        key={iso}
                        {...dragProps(iso)}
                        className={cn(
                          "flex min-w-[120px] flex-1 flex-col border-r last:border-r-0",
                          DIVIDER,
                          dragOverDay === iso && "bg-revenue/[0.06] ring-2 ring-inset ring-revenue",
                        )}
                      >
                        <div
                          className={cn(
                            "border-b px-3 py-2",
                            DIVIDER,
                            isToday && "bg-brand/[0.07]",
                          )}
                        >
                          <p
                            className={cn(
                              "text-[9px] font-extrabold uppercase tracking-[0.18em]",
                              isToday ? "text-brand" : "text-muted-foreground",
                            )}
                          >
                            {d.toLocaleDateString("en-US", { weekday: "short" })}
                            {isToday && " · Today"}
                          </p>
                          <p
                            className={cn(
                              "mt-0.5 text-[15px] font-extrabold",
                              isToday ? "text-brand" : "text-foreground",
                            )}
                          >
                            {d.getDate()}
                          </p>
                        </div>

                        {f && (
                          <div
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5",
                              WORKABILITY_META[f.level].tint,
                            )}
                          >
                            {(() => {
                              const Icon = WORKABILITY_ICON[f.level];
                              return <Icon className="h-3 w-3 text-muted-foreground" />;
                            })()}
                            <span className="truncate text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                              {f.label}
                            </span>
                          </div>
                        )}

                        <div className="flex min-h-[140px] flex-1 flex-col gap-1.5 p-1.5">
                          {dayJobs.length === 0 ? (
                            <span className="mt-2 text-center text-[10px] text-muted-foreground/60">
                              —
                            </span>
                          ) : (
                            dayJobs.map((job) => <JobBlock key={job.id} job={job} />)
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : (
            /* ===== Month grid ===== */
            <section className={CARD}>
              <div className={cn("flex items-center justify-between border-b px-4 py-3", DIVIDER)}>
                <div className="flex items-center gap-2 text-foreground">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-[13px] font-extrabold uppercase tracking-[0.1em]">
                    {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => shiftMonth(-1)}
                    className="grid h-8 w-8 place-items-center border border-border text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCursor(new Date())}
                    className="h-8 border border-border px-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => shiftMonth(1)}
                    className="grid h-8 w-8 place-items-center border border-border text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className={cn("grid grid-cols-7 border-b", DIVIDER)}>
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {monthDays.map((d, i) => {
                  const iso = isoOf(d);
                  const inMonth = d.getMonth() === cursor.getMonth();
                  const isToday = iso === todayIso;
                  const f = forecast[iso];
                  const dayJobs = jobsByDay.get(iso) ?? [];
                  return (
                    <div
                      key={iso + i}
                      {...dragProps(iso)}
                      className={cn(
                        "relative min-h-[104px] overflow-hidden border-b border-r p-1.5 transition-colors [&:nth-child(7n)]:border-r-0",
                        DIVIDER,
                        inMonth ? "bg-card" : "bg-muted/20",
                        f && WORKABILITY_META[f.level].cellTint,
                        dragOverDay === iso && "ring-2 ring-inset ring-revenue",
                      )}
                    >
                      {f &&
                        (() => {
                          const Icon = WORKABILITY_ICON[f.level];
                          return (
                            <Icon
                              className={cn(
                                "pointer-events-none absolute bottom-1 right-1 h-14 w-14",
                                WORKABILITY_META[f.level].iconColor,
                              )}
                              aria-hidden="true"
                            />
                          );
                        })()}
                      <div className="relative flex items-center justify-between">
                        <span
                          className={cn(
                            "inline-flex h-6 w-6 items-center justify-center text-[11px] font-bold",
                            isToday
                              ? "bg-revenue text-revenue-foreground"
                              : inMonth
                                ? "text-foreground"
                                : "text-muted-foreground",
                          )}
                        >
                          {d.getDate()}
                        </span>
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
                            className="cursor-grab truncate border-l-2 border-l-revenue bg-revenue/[0.08] px-1.5 py-1 text-[11px] font-medium text-foreground active:cursor-grabbing"
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
          )}
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
      <SelectTrigger className="h-9 w-[160px] rounded-none bg-card text-sm">
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

function AgendaView({ jobs, isLoading }: { jobs: JobWithFullCustomer[]; isLoading: boolean }) {
  return (
    <section className={cn("mt-4 md:mt-5", CARD)}>
      <div className={cn("border-b px-5 py-3.5", DIVIDER)}>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground">
          Upcoming Jobs
        </p>
      </div>
      {isLoading ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : jobs.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          No scheduled jobs match these filters.
        </div>
      ) : (
        <ul>
          {jobs.map((job) => (
            <li
              key={job.id}
              className={cn(
                "flex flex-col gap-2 border-t px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-3.5",
                DIVIDER,
              )}
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-foreground">
                  {job.customer?.full_name ?? "Unassigned"}
                </div>
                <div className="truncate text-[12px] text-muted-foreground">{job.title}</div>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end sm:gap-6">
                <span className="whitespace-nowrap text-[12px] text-muted-foreground">
                  {formatDate(job.service_date)}
                </span>
                <StatusBadge status={job.status} />
                <span className="whitespace-nowrap text-right text-[13px] font-extrabold text-revenue sm:w-24">
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
    <div className={cn("mt-3.5 p-3", CARD)}>
      <h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
        Workability (7-day)
      </h3>
      <ul className="flex flex-col gap-1.5">
        {items.map(({ level, icon: Icon }) => {
          const meta = WORKABILITY_META[level];
          return (
            <li key={level} className={cn("flex items-center gap-2 px-2 py-1", meta.tint)}>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-bold text-foreground">{meta.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{meta.condition}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
