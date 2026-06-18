import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bot,
  Camera,
  CheckCircle2,
  ClipboardList,
  Eraser,
  History,
  Loader2,
  Lock,
  MapPin,
  Megaphone,
  PenLine,
  Phone,
  Play,
  ScanEye,
  ShieldCheck,
  Timer,
  User,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RadiusMarketing } from "@/components/RadiusMarketing";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import {
  fetchCustomers,
  fetchJobLock,
  fetchTeamMembers,
  fetchJobAssignments,
  acquireJobLock,
  releaseJobLock,
  formatUSPhoneInput,
  formatRelativeTime,
  buildJobActivityLog,
  updateJobStatus,
  type Customer,
  type JobLock,
  type JobWithCustomer,
} from "@/lib/fsm";

export type WorkOrderTab = "order" | "inspection" | "activity" | "radius";

const DEFAULT_CHECKLIST = [
  "Pre-service photo taken",
  "Property inspected for open windows",
  "Equipment staged & area secured",
  "Service performed to spec",
  "Post-service cleanup",
];

export function WorkOrderSheet({
  job,
  open,
  onOpenChange,
  initialTab,
}: {
  job: JobWithCustomer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: WorkOrderTab;
}) {
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const customer = useMemo(
    () => customers.find((c) => c.id === job?.customer_id) ?? null,
    [customers, job?.customer_id],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto bg-sidebar p-0 text-sidebar-foreground sm:max-w-xl"
      >
        {job && (
          <WorkOrderBody
            key={`${job.id}-${initialTab ?? "order"}`}
            job={job}
            customer={customer}
            initialTab={initialTab ?? "order"}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function WorkOrderBody({
  job,
  customer,
  onClose,
  initialTab,
}: {
  job: JobWithCustomer;
  customer: Customer | null;
  onClose: () => void;
  initialTab: WorkOrderTab;
}) {
  const queryClient = useQueryClient();
  const me = useCurrentMember();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [completing, setCompleting] = useState(false);
  const [lock, setLock] = useState<JobLock | null>(null);
  const [tab, setTab] = useState<WorkOrderTab>(initialTab);
  const [inspectionSigned, setInspectionSigned] = useState(false);
  const [jobStarted, setJobStarted] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: fetchTeamMembers,
  });
  const { data: assignments = [] } = useQuery({
    queryKey: ["job_assignments"],
    queryFn: fetchJobAssignments,
  });

  const activity = useMemo(
    () => buildJobActivityLog(job, members, assignments, job.customer_name),
    [job, members, assignments],
  );

  const lockedByOther = !!lock && !!me && lock.locked_by_id !== me.id;

  // Acquire an edit lock on open, release on close, and watch for collisions.
  useEffect(() => {
    if (!me) return;
    let active = true;
    acquireJobLock(job.id, me.id, me.full_name)
      .then((held) => active && setLock(held))
      .catch(() => {});

    const channel = supabase
      .channel(`job_lock_${job.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_locks", filter: `job_id=eq.${job.id}` },
        () => {
          fetchJobLock(job.id).then((l) => active && setLock(l)).catch(() => {});
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
      releaseJobLock(job.id, me.id).catch(() => {});
    };
  }, [job.id, me?.id, me?.full_name]);

  const phone = customer?.phone ? formatUSPhoneInput(customer.phone) : null;
  const siteNotes = customer?.site_notes?.trim();

  const mutation = useMutation({
    mutationFn: () => updateJobStatus(job.id, "Completed"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job completed", {
        description: `Invoice generated for ${job.customer_name}.`,
      });
      onClose();
    },
    onError: () => toast.error("Could not complete the job. Please try again."),
    onSettled: () => setCompleting(false),
  });

  return (
    <div className="flex min-h-full flex-col">
      {lockedByOther && (
        <div className="flex items-center gap-3 border-b border-amber-400/60 bg-amber-400/20 px-5 py-3">
          <Lock className="h-5 w-5 shrink-0 text-amber-300" />
          <p className="text-sm font-medium text-amber-50">
            {lock?.locked_by_name} is currently editing this job. Editing is locked to prevent
            overwriting their changes.
          </p>
        </div>
      )}
      {/* Header & Context */}
      <SheetHeader className="space-y-0 border-b border-sidebar-border bg-sidebar px-5 py-5 text-left">
        <SheetTitle className="text-lg font-bold text-white">{job.title}</SheetTitle>
        <SheetDescription className="text-sidebar-foreground/70">
          Active Work Order · {job.status}
        </SheetDescription>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 shrink-0 text-revenue" />
            <span className="font-semibold text-white">{job.customer_name}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 shrink-0 text-revenue" />
            <a
              href={phone ? `tel:${customer?.phone}` : undefined}
              className="font-medium text-sidebar-foreground/90 hover:text-white"
            >
              {phone || "No phone on file"}
            </a>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-revenue" />
            <span className="font-medium text-sidebar-foreground/90">
              {customer?.service_address || "No service address on file"}
            </span>
          </div>
        </dl>

        {siteNotes && (
          <div className="mt-4 flex gap-3 rounded-lg border border-amber-400/60 bg-amber-400/15 p-3.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-amber-200">
                Site Notes &amp; Hazards
              </div>
              <p className="mt-1 text-sm font-medium text-amber-50">{siteNotes}</p>
            </div>
          </div>
        )}
      </SheetHeader>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-sidebar-border bg-sidebar px-5">
        <button
          type="button"
          onClick={() => setTab("order")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
            tab === "order"
              ? "border-revenue text-white"
              : "border-transparent text-sidebar-foreground/60 hover:text-white",
          )}
        >
          <ClipboardList className="h-4 w-4" />
          Work Order
        </button>
        <button
          type="button"
          onClick={() => setTab("inspection")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
            tab === "inspection"
              ? "border-revenue text-white"
              : "border-transparent text-sidebar-foreground/60 hover:text-white",
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          Pre-Job Inspection
        </button>
        <button
          type="button"
          onClick={() => setTab("activity")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
            tab === "activity"
              ? "border-revenue text-white"
              : "border-transparent text-sidebar-foreground/60 hover:text-white",
          )}
        >
          <History className="h-4 w-4" />
          Activity Log
        </button>
        <button
          type="button"
          onClick={() => setTab("radius")}
          className={cn(
            "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
            tab === "radius"
              ? "border-revenue text-white"
              : "border-transparent text-sidebar-foreground/60 hover:text-white",
          )}
        >
          <Megaphone className="h-4 w-4" />
          Radius Marketing
        </button>
      </div>

      {tab === "radius" ? (
        <RadiusMarketing job={job} customer={customer} />
      ) : tab === "activity" ? (
        <div className="flex-1 px-5 py-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">
            Audit Trail
          </h3>
          <ol className="relative space-y-5 border-l border-sidebar-border pl-5">
            {activity.map((e) => (
              <li key={e.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full ring-4 ring-sidebar",
                    e.isAi ? "bg-revenue text-revenue-foreground" : "bg-sidebar-accent text-white",
                  )}
                >
                  {e.isAi ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                </span>
                <p className="text-sm font-medium text-white">
                  <span className={e.isAi ? "text-revenue" : "text-sky-300"}>{e.actor}</span>{" "}
                  {e.action}
                </p>
                <p className="mt-0.5 text-xs text-sidebar-foreground/60">
                  {formatRelativeTime(e.at)}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-sidebar-foreground/50">
            This log is append-only — entries cannot be edited or deleted.
          </p>
        </div>
      ) : tab === "inspection" ? (
        <div className="flex-1 space-y-6 px-5 py-6">
          {/* Pre-Job photo upload zone */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
              Pre-Job Inspection Photos
            </h3>
            <p className="mb-3 text-xs text-sidebar-foreground/60">
              Document existing conditions before any work begins to protect against liability claims.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <PhotoSlot label="Front / Exterior" />
              <PhotoSlot label="Work Area" />
              <PhotoSlot label="Existing Damage" />
              <PhotoSlot label="Access Point" />
            </div>
          </section>

          {/* Van's Vision Scan — AI placeholder */}
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
              Van&apos;s Vision Scan
            </h3>
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-revenue/50 bg-revenue/10 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-revenue text-revenue-foreground">
                <ScanEye className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">AI hazard &amp; condition analysis</p>
                <p className="mt-1 text-xs text-sidebar-foreground/70">
                  Van will automatically scan uploaded photos for pre-existing damage, safety
                  hazards, and liability flags. (Analysis coming soon.)
                </p>
              </div>
            </div>
          </section>

          {/* E-Signature gate */}
          <section>
            <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-white">
              Customer Pre-Job Authorization
            </h3>
            <p className="mb-3 text-xs text-sidebar-foreground/60">
              A signature is required to unlock the job timer.
            </p>
            <SignaturePad onSignedChange={setInspectionSigned} />
          </section>

          {/* Start Job — gated by signature */}
          <Button
            variant={jobStarted ? "outline" : "revenue"}
            className="h-12 w-full"
            disabled={!inspectionSigned || lockedByOther || jobStarted}
            onClick={() => setJobStarted(true)}
          >
            {jobStarted ? (
              <>
                <Timer className="h-5 w-5" />
                Job Timer Running…
              </>
            ) : !inspectionSigned ? (
              <>
                <Lock className="h-5 w-5" />
                Capture Signature to Start Job
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Start Job Timer
              </>
            )}
          </Button>
        </div>
      ) : (
      <div className="flex-1 space-y-6 px-5 py-6">
        {/* Checklist */}
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
            Execution Checklist
          </h3>
          <ul className="space-y-2.5">
            {DEFAULT_CHECKLIST.map((item) => {
              const isChecked = !!checked[item];
              return (
                <li key={item}>
                  <button
                    type="button"
                    disabled={lockedByOther}
                    onClick={() => setChecked((c) => ({ ...c, [item]: !c[item] }))}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-colors",
                      isChecked
                        ? "border-revenue/50 bg-revenue/10"
                        : "border-sidebar-border bg-sidebar-accent/40 hover:bg-sidebar-accent/70",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-colors",
                        isChecked
                          ? "border-revenue bg-revenue text-revenue-foreground"
                          : "border-sidebar-foreground/40",
                      )}
                    >
                      {isChecked && <CheckCircle2 className="h-4 w-4" />}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isChecked
                          ? "text-sidebar-foreground/50 line-through"
                          : "text-white",
                      )}
                    >
                      {item}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Media Capture */}
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
            Service Documentation
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <PhotoSlot label="Before Photo" />
            <PhotoSlot label="After Photo" />
          </div>
        </section>

        {/* Digital Sign-Off */}
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
            Customer Approval
          </h3>
          <SignaturePad />
        </section>
      </div>
      )}

      {/* Sticky action — hidden on the Radius tab which has its own CTAs */}
      {tab !== "radius" && (
        <div className="sticky bottom-0 border-t border-sidebar-border bg-sidebar px-5 py-4">
          <Button
            variant="revenue"
            className="h-14 w-full text-base"
            disabled={completing || mutation.isPending || lockedByOther}
            onClick={() => {
              setCompleting(true);
              mutation.mutate();
            }}
          >
            {lockedByOther ? (
              <Lock className="h-5 w-5" />
            ) : mutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            {lockedByOther
              ? "Locked — another user is editing"
              : mutation.isPending
                ? "Completing…"
                : "Complete Job & Generate Invoice"}
          </Button>
        </div>
      )}
    </div>
  );
}

function PhotoSlot({ label }: { label: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-sidebar-border bg-sidebar-accent/40 transition-colors hover:border-revenue/60 hover:bg-sidebar-accent/70"
    >
      {preview ? (
        <img src={preview} alt={label} className="h-full w-full object-cover" />
      ) : (
        <>
          <Camera className="h-8 w-8 text-revenue" />
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="text-xs text-sidebar-foreground/60">Tap to capture</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />
    </button>
  );
}

function SignaturePad({ onSignedChange }: { onSignedChange?: (signed: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  function markSigned() {
    setHasInk(true);
    onSignedChange?.(true);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0f172a";
    }
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    markSigned();
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onSignedChange?.(false);
  }


  return (
    <div className="rounded-xl border border-sidebar-border bg-card p-3">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-36 w-full touch-none rounded-lg bg-white"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <PenLine className="h-3.5 w-3.5" />
          {hasInk ? "Signature captured" : "Sign above to approve"}
        </span>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clear}>
          <Eraser className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>
    </div>
  );
}
