import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Briefcase } from "lucide-react";
import { toast } from "sonner";

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
import {
  PROFESSIONS,
  presetForProfession,
  fetchMyProfile,
  fetchTradePresets,
  saveTradePresets,
  completeOnboarding,
} from "@/lib/fsm";

const OTHER = "__other__";

/**
 * Mandatory first-login modal: captures the user's trade and seeds
 * trade-specific estimate presets before the app is usable.
 */
export function OnboardingGate() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my_profile"],
    queryFn: fetchMyProfile,
  });

  const [choice, setChoice] = useState<string>("");
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  if (isLoading || !profile || profile.onboarded) return null;

  const profession = choice === OTHER ? custom.trim() : choice;
  const canSubmit = !!profession;

  async function submit() {
    if (!profession) return;
    setBusy(true);
    try {
      // Seed trade-specific presets (managers only; ignore if not permitted).
      try {
        const existing = await fetchTradePresets();
        await saveTradePresets(existing?.id ?? null, presetForProfession(profession));
        queryClient.invalidateQueries({ queryKey: ["trade_presets"] });
      } catch {
        /* non-managers can't write presets; onboarding still completes */
      }
      await completeOnboarding(profession);
      await queryClient.invalidateQueries({ queryKey: ["my_profile"] });
      toast.success(`Welcome aboard — ${profession} presets are ready.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your trade");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-revenue text-revenue-foreground">
            <Briefcase className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Welcome to VantageFSM</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let's tailor your workspace. What is your profession?
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Profession</Label>
            <Select value={choice} onValueChange={setChoice}>
              <SelectTrigger>
                <SelectValue placeholder="Select your trade…" />
              </SelectTrigger>
              <SelectContent>
                {PROFESSIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER}>Other (type it in)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {choice === OTHER && (
            <div className="space-y-1.5">
              <Label htmlFor="custom-trade">Your trade</Label>
              <Input
                id="custom-trade"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="e.g. Mobile Detailing"
                autoFocus
              />
            </div>
          )}

          <Button
            variant="revenue"
            className="w-full"
            disabled={!canSubmit || busy}
            onClick={submit}
          >
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Set up my workspace
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            We'll preload estimate templates for your trade. You can edit them anytime in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
