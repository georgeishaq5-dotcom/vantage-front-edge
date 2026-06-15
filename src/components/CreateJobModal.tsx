import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createJob,
  fetchCustomers,
  updateCustomer,
} from "@/lib/fsm";

export function CreateJobModal() {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [siteNotes, setSiteNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  function resetForm() {
    setCustomerId("");
    setTitle("");
    setDate(undefined);
    setSiteNotes("");
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const customer = customers.find((c) => c.id === customerId) || null;
      const serviceDate = date ? format(date, "yyyy-MM-dd") : null;
      const jobTitle =
        title.trim() ||
        (customer ? `${customer.full_name} — Service` : "Service Job");

      await createJob({
        title: jobTitle,
        customer_id: customerId || null,
        // Date present -> scheduled, otherwise unscheduled.
        status: serviceDate ? "Scheduled" : "Quoted",
        service_date: serviceDate,
        quote_amount: 0,
      });

      // Persist site notes onto the linked customer so crews see them everywhere.
      if (customer && siteNotes.trim()) {
        await updateCustomer(customer.id, { site_notes: siteNotes.trim() });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Job created and added to the dispatch board");
      resetForm();
      setOpen(false);
    },
    onError: () => toast.error("Could not create job. Please try again."),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="revenue">Create New Job</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>
            Dispatch a job to the board. Add a date to schedule it for the crew.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!customerId) {
              toast.error("Please select a customer");
              return;
            }
            mutation.mutate();
          }}
          className="space-y-5 py-2"
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

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="revenue" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
