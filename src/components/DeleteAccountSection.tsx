import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";

export function DeleteAccountSection() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMyAccount();
      await supabase.auth.signOut();
      await queryClient.cancelQueries();
      queryClient.clear();
      toast.success("Your account has been permanently deleted.");
      if (typeof window !== "undefined") window.location.assign("/");
    } catch (err) {
      console.error("[settings] delete account failed:", err);
      toast.error("We couldn't delete your account. Please try again.");
      setDeleting(false);
      setOpen(false);
    }
  }

  return (
    <div className="mt-4 md:mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-3 md:p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <Trash2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Delete Account</h2>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and sign out. This action cannot be undone.
          </p>
        </div>
      </div>
      <div className="mt-5 border-t border-destructive/20 pt-5">
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete My Account
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={(v) => !deleting && setOpen(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and immediately sign you out. This action is
              irreversible and your data cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Yes, delete forever"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
