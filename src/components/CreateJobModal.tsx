import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Satellite, Check, Plus, Ruler, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createJob, fetchCustomers, formatCurrency, updateCustomer } from "@/lib/fsm";
import { SatelliteMeasure, type MeasureResult } from "@/components/SatelliteMeasure";

interface Upgrade {
  key: string;
  name: string;
  price: number;
}

const UPGRADES: Upgrade[] = [
  { key: "premium-parts", name: "Premium-grade parts", price: 180 },
  { key: "warranty", name: "Extended 3-year warranty", price: 220 },
  { key: "inspection", name: "Full system safety inspection", price: 95 },
  { key: "maintenance", name: "Annual maintenance plan", price: 140 },
  { key: "priority", name: "Priority scheduling & 24/7 support", price: 75 },
];

const RATE_PER_SQFT = 0.85;
const RATE_PER_LINEAR_FT = 3.5;

export function CreateJobModal() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  // ---- Create Job tab state ----
  const [customerId, setCustomerId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [siteNotes, setSiteNotes] = useState("");
  const [attachedEstimate, setAttachedEstimate] = useState<string>("none");

  // ---- Create Estimate tab state ----
  const [estCustomerId, setEstCustomerId] = useState<string>("");
  const [basePrice, setBasePrice] = useState<string>("480");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [measureOpen, setMeasureOpen] = useState(false);
  const [measure, setMeasure] = useState<MeasureResult | null>(null);

  const measuredCharge = useMemo(() => {
    if (!measure) return 0;
    return Math.round(measure.feet * (measure.mode === "area" ? RATE_PER_SQFT : RATE_PER_LINEAR_FT));
  }, [measure]);

  const base = Number(basePrice) || 0;
  const upgradesTotal = useMemo(
    () => UPGRADES.filter((u) => selected[u.key]).reduce((s, u) => s + u.price, 0),
    [selected],
  );
  const estimateTotal = base + measuredCharge + upgradesTotal;

  function resetForms() {
    setCustomerId("");
    setTitle("");
    setDate(undefined);
    setSiteNotes("");
    setAttachedEstimate("none");
    setEstCustomerId("");
    setBasePrice("480");
    setSelected({});
    setMeasure(null);
  }

  const jobMutation = useMutation({
    mutationFn: async () => {
      const customer = customers.find((c) => c.id === customerId) || null;
      const serviceDate = date ? format(date, "yyyy-MM-dd") : null;
      const jobTitle =
        title.trim() || (customer ? `${customer.full_name} — Service` : "Service Job");
      await createJob({
        title: jobTitle,
        customer_id: customerId || null,
        status: serviceDate ? "Scheduled" : "Quoted",
        service_date: serviceDate,
        quote_amount: 0,
      });
      if (customer && siteNotes.trim()) {
        await updateCustomer(customer.id, { site_notes: siteNotes.trim() });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Job created and added to the dispatch board");
      resetForms();
      setOpen(false);
    },
    onError: () => toast.error("Could not create job. Please try again."),
  });

  const estimateMutation = useMutation({
    mutationFn: async () => {
      const customer = customers.find((c) => c.id === estCustomerId) || null;
      await createJob({
        title: customer ? `${customer.full_name} — Estimate` : "New Estimate",
        customer_id: estCustomerId || null,
        status: "Quoted",
        service_date: null,
        quote_amount: estimateTotal,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Estimate created");
      resetForms();
      setOpen(false);
    },
    onError: () => toast.error("Could not create estimate. Please try again."),
  });

  const toggle = (key: string) => setSelected((s) => ({ ...s, [key]: !s[key] }));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForms();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="revenue">Create New</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Create New</DialogTitle>
          <DialogDescription>
            Build a customer estimate or dispatch a job to the board.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="estimate" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="estimate">Create Estimate</TabsTrigger>
            <TabsTrigger value="job">Create Job</TabsTrigger>
          </TabsList>

          {/* ---- CREATE ESTIMATE ---- */}
          <TabsContent value="estimate" className="space-y-5 py-3">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => setMeasureOpen(true)}
            >
              <Satellite className="h-4 w-4" />
              Satellite Auto-Measure
            </Button>

            {measure && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <Ruler className="h-4 w-4 text-revenue" />
                  Measured: {measure.feet.toLocaleString()}{" "}
                  {measure.mode === "area" ? "sq ft" : "linear ft"}
                </span>
                <span className="font-semibold text-revenue">+{formatCurrency(measuredCharge)}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select value={estCustomerId} onValueChange={setEstCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="base_price">Base Job Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="base_price"
                  type="number"
                  min={0}
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-revenue" />
                <Label className="m-0">Optional Upgrades</Label>
              </div>
              <ul className="space-y-2">
                {UPGRADES.map((u) => {
                  const isOn = !!selected[u.key];
                  return (
                    <li key={u.key}>
                      <button
                        type="button"
                        onClick={() => toggle(u.key)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
                          isOn
                            ? "border-revenue/60 bg-revenue-muted/40 ring-1 ring-revenue/30"
                            : "border-border hover:border-revenue/40",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded border-2",
                            isOn
                              ? "border-revenue bg-revenue text-revenue-foreground"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {isOn ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
                        </span>
                        <span className="flex-1 text-sm font-medium text-foreground">{u.name}</span>
                        <span className="text-sm font-semibold text-foreground">+{formatCurrency(u.price)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-revenue/40 bg-card p-4 ring-1 ring-revenue/20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</p>
                <p className="text-2xl font-extrabold tracking-tight text-revenue">
                  {formatCurrency(estimateTotal)}
                </p>
              </div>
              <Button
                type="button"
                variant="revenue"
                disabled={estimateMutation.isPending || !estCustomerId}
                onClick={() => estimateMutation.mutate()}
              >
                {estimateMutation.isPending ? "Saving…" : "Create Estimate"}
              </Button>
            </div>
          </TabsContent>

          {/* ---- CREATE JOB ---- */}
          <TabsContent value="job" className="py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customerId) {
                  toast.error("Please select a customer");
                  return;
                }
                jobMutation.mutate();
              }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <Label htmlFor="job_customer">
                  Customer <span className="text-destructive">*</span>
                </Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="job_customer">
                    <SelectValue placeholder="Select an existing customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Quarterly HVAC inspection (optional)"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Service Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date (leave blank for unscheduled)</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="job_site_notes">Site Notes</Label>
                <Textarea
                  id="job_site_notes"
                  rows={3}
                  value={siteNotes}
                  onChange={(e) => setSiteNotes(e.target.value)}
                  placeholder="Access instructions, gate codes, pets, parking…"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Attach to Approved Estimate</Label>
                <Select value={attachedEstimate} onValueChange={setAttachedEstimate}>
                  <SelectTrigger>
                    <SelectValue placeholder="No estimate attached" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No estimate attached</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="revenue" disabled={jobMutation.isPending}>
                  {jobMutation.isPending ? "Saving…" : "Create Job"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <SatelliteMeasure open={measureOpen} onOpenChange={setMeasureOpen} onApply={setMeasure} />
    </Dialog>
  );
}
