import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MailCheck, MapPin, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  fetchNeighborOutreachWithJobs,
  updateOutreachStatus,
  formatCurrency,
  type NeighborOutreachWithJob,
  type OutreachStatus,
} from "@/lib/fsm";

export function NeighborOutreachFeed() {
  const queryClient = useQueryClient();
  const { data: outreach = [] } = useQuery({
    queryKey: ["neighbor_outreach"],
    queryFn: fetchNeighborOutreachWithJobs,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OutreachStatus }) =>
      updateOutreachStatus(id, status),
    onSuccess: (_d, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["neighbor_outreach"] });
      if (status === "Approved") {
        toast.success("Postcards dispatched to the block", {
          className: "bg-revenue text-revenue-foreground",
        });
      } else {
        toast("Outreach vetoed");
      }
    },
    onError: () => toast.error("Action failed"),
  });

  const pending = outreach.filter((o) => o.status === "Pending");
  if (pending.length === 0) return null;

  return (
    <div className="mt-4 md:mt-6 space-y-3">
      {pending.map((o) => (
        <OutreachCard
          key={o.id}
          outreach={o}
          pending={mutation.isPending}
          onApprove={() => mutation.mutate({ id: o.id, status: "Approved" })}
          onVeto={() => mutation.mutate({ id: o.id, status: "Vetoed" })}
        />
      ))}
    </div>
  );
}

function OutreachCard({
  outreach,
  pending,
  onApprove,
  onVeto,
}: {
  outreach: NeighborOutreachWithJob;
  pending: boolean;
  onApprove: () => void;
  onVeto: () => void;
}) {
  const count = outreach.neighbor_addresses.length;
  const customerName = outreach.job?.customer?.full_name ?? "an upcoming job";
  const address = outreach.job?.customer?.service_address;

  return (
    <div className="rounded-xl border border-revenue/30 bg-revenue-muted/40 p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-revenue text-revenue-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              AI Operator · Neighbor Outreach
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              I found {count} neighbors around your job for{" "}
              <span className="font-medium text-foreground">{customerName}</span>. Tap Approve
              to autonomously mail postcards to this block for{" "}
              <span className="font-semibold text-revenue">{formatCurrency(outreach.cost)}</span>.
            </p>
            {address && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="line-clamp-1">Centered on {address}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={onVeto} disabled={pending}>
            Veto
          </Button>
          <Button variant="revenue" size="sm" onClick={onApprove} disabled={pending}>
            {pending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <MailCheck className="mr-1.5 h-3.5 w-3.5" />
            )}
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
