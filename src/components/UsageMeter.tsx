import { cn } from "@/lib/utils";
import { type ResourceUsage } from "@/hooks/usePlan";

/**
 * A compact usage meter (e.g. "Seats 1/1", "Active jobs 22/25"). Goes amber at
 * ~80% of the cap and red at the limit. Renders an "unlimited" pill when the
 * plan has no cap for the resource.
 */
export function UsageMeter({
  label,
  usage,
  className,
}: {
  label: string;
  usage: ResourceUsage;
  className?: string;
}) {
  if (usage.unlimited) {
    return (
      <div className={cn("flex items-center justify-between gap-3", className)}>
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="text-xs font-bold text-revenue">Unlimited</span>
      </div>
    );
  }

  const tone = usage.atLimit ? "red" : usage.nearLimit ? "amber" : "normal";
  const barColor =
    tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-revenue";
  const textColor =
    tone === "red"
      ? "text-red-600"
      : tone === "amber"
        ? "text-amber-600"
        : "text-foreground";
  const pct = Math.min(100, Math.round(usage.ratio * 100));

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className={cn("text-xs font-bold tabular-nums", textColor)}>
          {usage.used} / {usage.limit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
