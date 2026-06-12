import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createJob, fetchCustomers, JOB_STATUSES, type JobStatus } from "@/lib/fsm";

const schema = z.object({
  title: z.string().trim().min(1, "Job title is required").max(160),
  customer_id: z.string().optional(),
  status: z.enum(["Quoted", "Scheduled", "Completed", "Paid"]),
  service_date: z.string().optional().or(z.literal("")),
  quote_amount: z.coerce.number().min(0).max(10_000_000),
});

type FormValues = z.infer<typeof schema>;

export function CreateJobModal() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "Quoted", quote_amount: 0 },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createJob({
        title: values.title,
        customer_id: values.customer_id || null,
        status: values.status,
        service_date: values.service_date || null,
        quote_amount: values.quote_amount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job created successfully");
      reset({ status: "Quoted", quote_amount: 0 });
      setOpen(false);
    },
    onError: () => toast.error("Could not create job. Please try again."),
  });

  const status = watch("status");
  const customerId = watch("customer_id");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset({ status: "Quoted", quote_amount: 0 });
      }}
    >
      <DialogTrigger asChild>
        <Button variant="revenue">Create New Job</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>Add a job to the board and track it to completion.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="grid grid-cols-2 gap-x-4 gap-y-5 py-2"
        >
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="title">
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input id="title" placeholder="e.g. Quarterly HVAC inspection" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="customer_id">Customer</Label>
            <Select value={customerId} onValueChange={(v) => setValue("customer_id", v)}>
              <SelectTrigger id="customer_id">
                <SelectValue placeholder="Link a customer" />
              </SelectTrigger>
              <SelectContent>
                {(customers ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setValue("status", v as JobStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service_date">Service Date</Label>
            <Input id="service_date" type="date" {...register("service_date")} />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="quote_amount">Quote Amount (USD)</Label>
            <Input id="quote_amount" type="number" step="0.01" min="0" {...register("quote_amount")} />
          </div>

          <DialogFooter className="col-span-2 mt-2">
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
