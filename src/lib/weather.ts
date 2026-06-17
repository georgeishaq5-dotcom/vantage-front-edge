// ============= Weather "Workability" heat-map (simulated 7-day forecast) =============

export type WorkabilityLevel = 1 | 2 | 3 | 4;

export interface DayForecast {
  level: WorkabilityLevel;
  label: string;
  condition: string;
}

export const WORKABILITY_META: Record<
  WorkabilityLevel,
  {
    label: string;
    condition: string;
    tint: string;
    badge: string;
    topBorder: string;
    /** Highly transparent full-cell heat-map tint (~12% opacity). */
    cellTint: string;
    /** Tailwind text color for the watermark weather icon. */
    iconColor: string;
  }
> = {
  1: {
    label: "Optimal",
    condition: "Clear & sunny",
    tint: "bg-emerald-50/70",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    topBorder: "border-t-[3px] border-t-emerald-500",
    cellTint: "bg-emerald-500/[0.12]",
    iconColor: "text-emerald-500/15",
  },
  2: {
    label: "Fair",
    condition: "Partly cloudy",
    tint: "bg-sky-50/70",
    badge: "bg-sky-100 text-sky-700 border border-sky-200",
    topBorder: "border-t-[3px] border-t-sky-500",
    cellTint: "bg-sky-500/[0.12]",
    iconColor: "text-sky-500/15",
  },
  3: {
    label: "Caution",
    condition: "Rain / wind — expect delays",
    tint: "bg-amber-50/80",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    topBorder: "border-t-[3px] border-t-amber-500",
    cellTint: "bg-amber-500/[0.13]",
    iconColor: "text-amber-500/20",
  },
  4: {
    label: "Severe",
    condition: "Thunderstorms — do not book",
    tint: "bg-rose-50/80",
    badge: "bg-rose-100 text-rose-700 border border-rose-200",
    topBorder: "border-t-[3px] border-t-rose-500",
    cellTint: "bg-rose-500/[0.13]",
    iconColor: "text-rose-500/20",
  },
};

// Deterministic pseudo-forecast so the same date always renders the same level.
const SEED_PATTERN: WorkabilityLevel[] = [1, 2, 1, 3, 2, 4, 1];

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Returns a map of ISO date -> forecast for the next 7 days starting today.
export function buildForecast(): Record<string, DayForecast> {
  const map: Record<string, DayForecast> = {};
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const level = SEED_PATTERN[i % SEED_PATTERN.length];
    map[iso] = {
      level,
      label: WORKABILITY_META[level].label,
      condition: WORKABILITY_META[level].condition,
    };
  }
  return map;
}
