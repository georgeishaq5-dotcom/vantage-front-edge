import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/fsm";

const STYLES: Record<JobStatus, string> = {
  Quoted: "bg-secondary text-secondary-foreground border border-border",
  Scheduled: "bg-sky-50 text-sky-700 border border-sky-200",
  Completed: "bg-amber-50 text-amber-700 border border-amber-200",
  Paid: "bg-revenue-muted text-revenue border border-revenue/30",
};

export function StatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
