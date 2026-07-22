import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
import { SmsConsentCheckbox, smsConsentText } from "@/components/SmsConsentCheckbox";
import { recordSmsConsent } from "@/lib/consent.functions";
import { Pencil } from "lucide-react";
import {
  CUSTOMER_TYPES,
  fetchMyProfile,
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
  const [smsConsent, setSmsConsent] = useState(false);
  const queryClient = useQueryClient();
  const recordConsent = useServerFn(recordSmsConsent);
  const { data: profile } = useQuery({ queryKey: ["my_profile"], queryFn: fetchMyProfile });
  const company = profile?.company_name?.trim() || "your service provider";

  useEffect(() => {
    if (open) {
      setFullName(customer.full_name);
      setEmail(customer.email ?? "");
      setPhone(formatUSPhoneInput(customer.phone ?? ""));
      setType(customer.customer_type ?? "");
      setAddress(customer.service_address ?? "");
      setSmsConsent(false);
    }
  }, [open, customer]);

  // E.164 of what's typed, and whether it's a new/changed number vs what's on
  // file — consent is only required (and recorded) for a new/changed number.
  const phoneE164 = phone.trim() ? toE164US(phone) : null;
  const phoneChanged = !!phoneE164 && phoneE164 !== (customer.phone ?? null);

  const mutation = useMutation({
    mutationFn: async () => {
      await updateCustomer(customer.id, {
        full_name: fullName.trim(),
        email: email.trim() || null,
        // Persist phone in E.164 so it is Twilio-ready everywhere.
        phone: phoneE164,
        customer_type: (type as CustomerType) || null,
        service_address: address.trim() || null,
      });
      if (phoneChanged && smsConsent) {
        try {
          await recordConsent({
            data: {
              customerId: customer.id,
              phone: phoneE164!,
              consentTextShown: smsConsentText(company),
              source: "edit_customer",
            },
          });
        } catch {
          toast.warning("Customer saved, but the SMS consent record failed to save.");
        }
      }
    },
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
            // A new/changed phone number may only be saved with SMS consent.
            if (phoneChanged && !smsConsent) {
              toast.error("Confirm SMS consent to save this phone number, or leave it unchanged.");
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
            {phoneChanged && (
              <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                <SmsConsentCheckbox
                  checked={smsConsent}
                  onCheckedChange={setSmsConsent}
                  company={company}
                  id="edit-customer-sms-consent"
                />
              </div>
            )}
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
