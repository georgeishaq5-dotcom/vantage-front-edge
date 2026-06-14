import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { createCustomer, CUSTOMER_TYPES, formatUSPhoneInput, toE164US, type CustomerType } from "@/lib/fsm";

const schema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(120),
  email: z.string().trim().max(255).email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  customer_type: z.enum(["Residential", "Commercial", "HOA"]).optional(),
  service_address: z.string().trim().max(255).optional().or(z.literal("")),
  site_notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function AddCustomerModal({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createCustomer({
        full_name: values.full_name,
        email: values.email || null,
        phone: values.phone || null,
        customer_type: (values.customer_type as CustomerType) || null,
        service_address: values.service_address || null,
        site_notes: values.site_notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer added successfully");
      reset();
      setOpen(false);
    },
    onError: () => toast.error("Could not add customer. Please try again."),
  });

  const customerType = watch("customer_type");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button variant="revenue">Add New Customer</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>Create a new customer record in your ledger.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="grid grid-cols-2 gap-x-4 gap-y-5 py-2"
        >
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="full_name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input id="full_name" placeholder="e.g. Maria Delgado" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@email.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="(555) 000-0000"
              inputMode="tel"
              value={watch("phone") ?? ""}
              onChange={(e) => setValue("phone", formatUSPhoneInput(e.target.value))}
            />
          </div>


          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="customer_type">Customer Type</Label>
            <Select
              value={customerType}
              onValueChange={(v) => setValue("customer_type", v as CustomerType)}
            >
              <SelectTrigger id="customer_type">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="service_address">Property Address</Label>
            <AddressAutocomplete
              id="service_address"
              value={watch("service_address") ?? ""}
              onChange={(v) => setValue("service_address", v)}
              placeholder="Start typing a street address…"
            />
          </div>


          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="site_notes">Site Notes &amp; Gate Codes</Label>
            <Textarea
              id="site_notes"
              rows={3}
              placeholder="Access instructions, gate codes, pets, parking…"
              {...register("site_notes")}
            />
          </div>

          <DialogFooter className="col-span-2 mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="revenue" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
