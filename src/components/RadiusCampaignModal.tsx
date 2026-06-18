import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, MapPin } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadiusMarketing } from "@/components/RadiusMarketing";
import {
  fetchCustomers,
  fetchJobsWithCustomers,
  type JobWithCustomer,
} from "@/lib/fsm";

export function RadiusCampaignModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsWithCustomers,
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const [selected, setSelected] = useState<JobWithCustomer | null>(null);

  // Jobs that have a mappable customer address make the best campaign anchors.
  const launchable = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...jobs].sort((a, b) => {
      const at = a.service_date?.slice(0, 10) === today ? 0 : 1;
      const bt = b.service_date?.slice(0, 10) === today ? 0 : 1;
      return at - bt;
    });
  }, [jobs]);

  const customer = selected
    ? customers.find((c) => c.id === selected.customer_id) ?? null
    : null;

  function handleOpenChange(next: boolean) {
    if (!next) setSelected(null);
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden bg-sidebar p-0 text-sidebar-foreground">
        <DialogHeader className="space-y-0 border-b border-sidebar-border px-5 py-4 text-left">
          <div className="flex items-center gap-2">
            {selected && (
              <button
                type="button"
                aria-label="Back to job list"
                onClick={() => setSelected(null)}
                className="-ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-white">
                {selected ? selected.title : "Launch Radius Campaign"}
              </DialogTitle>
              <DialogDescription className="truncate text-xs text-sidebar-foreground/70">
                {selected
                  ? selected.customer_name
                  : "Pick a job to anchor your hyper-local outreach."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {selected ? (
          <div className="flex-1 overflow-y-auto">
            <RadiusMarketing job={selected} customer={customer} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            {launchable.length === 0 ? (
              <p className="rounded-lg border border-dashed border-sidebar-border py-10 text-center text-sm text-sidebar-foreground/60">
                No jobs yet — create a job to anchor a campaign.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {launchable.map((job) => (
                  <li key={job.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(job)}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 text-left transition-colors hover:bg-sidebar-accent/70"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-revenue/20 text-revenue">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">
                          {job.customer_name}
                        </span>
                        <span className="block truncate text-xs text-sidebar-foreground/60">
                          {job.title}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
