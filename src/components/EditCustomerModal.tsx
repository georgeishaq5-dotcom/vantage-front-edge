import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { Pencil } from "lucide-react";
import {
  CUSTOMER_TYPES,
  formatUSPhoneInput,
  toE164US,
  updateCustomer,
  type Customer,
  type CustomerType,
} from "@/lib/fsm";

export function EditCustomerModal({
  customer,
  trigger,
}: {
  customer: Customer;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(customer.full_name);
  const [email, setEmail] = useState(customer.email ?? "");
  const [phone, setPhone] = useState(formatUSPhoneInput(customer.phone ?? ""));
  const [type, setType] = useState<CustomerType | "">(customer.customer_type ?? "");
  const [address, setAddress] = useState(customer.service_address ?? "");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setFullName(customer.full_name);
      setEmail(customer.email ?? "");
      setPhone(formatUSPhoneInput(customer.phone ?? ""));
      setType(customer.customer_type ?? "");
      setAddress(customer.service_address ?? "");
    }
  }, [open, customer]);

  const mutation = useMutation({
    mutationFn: () =>
      updateCustomer(customer.id, {
        full_name: fullName.trim(),
        email: email.trim() || null,
        // Persist phone in E.164 so it is Twilio-ready everywhere.
        phone: phone.trim() ? toE164US(phone) : null,
        customer_type: (type as CustomerType) || null,
        service_address: address.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer profile updated");
      setOpen(false);
    },
    onError: () => toast.error("Could not update customer. Please try again."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit Customer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>Update this client's contact details.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = fullName.trim();
            if (!name) {
              toast.error("Full name is required");
              return;
            }
            if (name.length > 120) {
              toast.error("Full name must be 120 characters or fewer");
              return;
            }
            const trimmedEmail = email.trim();
            if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
              toast.error("Enter a valid email address");
              return;
            }
            if (trimmedEmail.length > 255) {
              toast.error("Email must be 255 characters or fewer");
              return;
            }
            if (address.trim().length > 255) {
              toast.error("Address must be 255 characters or fewer");
              return;
            }
            mutation.mutate();
          }}
          className="space-y-5 py-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="edit_full_name">Full Name</Label>
            <Input
              id="edit_full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Maria Delgado"
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit_type">Customer Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as CustomerType)}>
              <SelectTrigger id="edit_type">
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

          <div className="space-y-1.5">
            <Label htmlFor="edit_email">Email</Label>
            <Input
              id="edit_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              maxLength={255}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit_phone">Phone Number</Label>
            <Input
              id="edit_phone"
              value={phone}
              onChange={(e) => setPhone(formatUSPhoneInput(e.target.value))}
              placeholder="(555) 000-0000"
              inputMode="tel"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit_address">Property Address</Label>
            <AddressAutocomplete
              id="edit_address"
              value={address}
              onChange={setAddress}
              placeholder="Start typing a street address…"
            />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="revenue" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
