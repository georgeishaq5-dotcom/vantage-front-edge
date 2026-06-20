import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type AiConsentContextValue = {
  /** True when the signed-in user has agreed to AI data processing. */
  granted: boolean;
  isLoading: boolean;
  /** Returns true if consent already granted; otherwise opens the gate and returns false. */
  ensureConsent: () => boolean;
  /** Force-open the consent modal (e.g. from a "consent required" screen). */
  openConsent: () => void;
};

const AiConsentContext = createContext<AiConsentContextValue | null>(null);

export function useAiConsent() {
  const ctx = useContext(AiConsentContext);
  if (!ctx) throw new Error("useAiConsent must be used within AiConsentProvider");
  return ctx;
}

async function fetchConsent(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("ai_consent_granted")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.ai_consent_granted);
}

export function AiConsentProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: granted = false, isLoading } = useQuery({
    queryKey: ["ai-consent"],
    queryFn: fetchConsent,
  });

  const agreeMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ ai_consent_granted: true })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(["ai-consent"], true);
      setOpen(false);
      toast.success("AI features unlocked.");
    },
    onError: () => toast.error("Could not save your choice. Please try again."),
  });

  const ensureConsent = useCallback(() => {
    if (granted) return true;
    setOpen(true);
    return false;
  }, [granted]);

  const openConsent = useCallback(() => setOpen(true), []);

  // Prevent background scroll while the un-dismissible gate is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <AiConsentContext.Provider value={{ granted, isLoading, ensureConsent, openConsent }}>
      {children}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-consent-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-revenue/10">
              <ShieldAlert className="h-6 w-6 text-revenue" />
            </div>
            <h2 id="ai-consent-title" className="text-lg font-bold text-foreground">
              AI data processing consent
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              To provide automated insights, your chat prompts and job data will be sent to a
              third-party AI provider for processing.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              See our{" "}
              <a href="/privacy" className="font-medium text-brand underline" target="_blank" rel="noreferrer">
                Privacy Policy
              </a>{" "}
              for details on what is collected and how it is used. You can decline and continue
              using the rest of the app without AI features.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <Button
                variant="revenue"
                className="w-full sm:flex-1"
                disabled={agreeMutation.isPending}
                onClick={() => agreeMutation.mutate()}
              >
                I Agree
              </Button>
              <Button
                variant="outline"
                className="w-full sm:flex-1"
                disabled={agreeMutation.isPending}
                onClick={() => setOpen(false)}
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}
    </AiConsentContext.Provider>
  );
}
