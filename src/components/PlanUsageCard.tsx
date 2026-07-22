import { Gauge } from "lucide-react";

import { usePlan } from "@/hooks/usePlan";
import { UsageMeter } from "@/components/UsageMeter";

/**
 * Always-visible usage meters for the metered resources (seats, active jobs).
 * Rendered whenever at least one resource has a finite cap (i.e. on Starter),
 * so the user can always see how close they are before they hit a wall.
 */
export function PlanUsageCard({ className }: { className?: string }) {
  const { usage, usageLoading } = usePlan();

  // Nothing to meter when both resources are unlimited (Growth/Crew).
  if (usage.seats.unlimited && usage.activeJobs.unlimited) return null;
  if (usageLoading) return null;

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className ?? ""}`}>
      <div className="mb-3 flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
        <Gauge className="h-3.5 w-3.5" />
        Plan usage
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UsageMeter label="Crew seats" usage={usage.seats} />
        <UsageMeter label="Active jobs" usage={usage.activeJobs} />
      </div>
    </div>
  );
}
