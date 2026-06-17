import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { VantageLogo } from "@/components/VantageLogo";
import { FeatureTour } from "@/components/onboarding/FeatureTour";
import {
  PROFESSIONS,
  TEAM_SIZES,
  REVENUE_BANDS,
  YEARS_IN_BUSINESS,
  presetForProfession,
  fetchMyProfile,
  fetchTradePresets,
  saveTradePresets,
  saveOnboardingDetails,
  finishOnboarding,
} from "@/lib/fsm";

const OTHER = "__other__";

/**
 * Mandatory onboarding sequence:
 *  Step 1 — expanded business profile capture
 *  Step 2 — animated 5-page feature tour
 *  Step 3 — global notification opt-in (final tour page)
 */
export function OnboardingGate() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my_profile"],
    queryFn: fetchMyProfile,
  });

  const [stage, setStage] = useState<"form" | "tour">("form");
  const [choice, setChoice] = useState("");
  const [custom, setCustom] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [yearlyRevenue, setYearlyRevenue] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [busy, setBusy] = useState(false);

  if (isLoading || !profile || profile.onboarded) return null;

  const profession = choice === OTHER ? custom.trim() : choice;
  const canSubmit =
    !!profession && !!companyName.trim() && !!teamSize && !!yearlyRevenue && !!yearsInBusiness;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      try {
        const existing = await fetchTradePresets();
        await saveTradePresets(existing?.id ?? null, presetForProfession(profession));
        queryClient.invalidateQueries({ queryKey: ["trade_presets"] });
      } catch {
        /* non-managers can't write presets; onboarding still continues */
      }
      await saveOnboardingDetails({
        profession,
        company_name: companyName.trim(),
        team_size: teamSize,
        yearly_revenue: yearlyRevenue,
        years_in_business: yearsInBusiness,
      });
      setStage("tour");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your details");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    try {
      await finishOnboarding();
      await queryClient.invalidateQueries({ queryKey: ["my_profile"] });
      toast.success(`Welcome aboard${companyName ? `, ${companyName}` : ""}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not finish setup");
    }
  }

  if (stage === "tour") return <FeatureTour onFinish={finish} />;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background/90 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-md sm:p-10">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-muted">
            <VantageLogo className="h-7 w-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to Vantage</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tell us about your business so we can tailor your workspace.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Vantage Field Services"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Industry</Label>
            <Select value={choice} onValueChange={setChoice}>
              <SelectTrigger className="h-11">
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
                className="h-11"
                autoFocus
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Team Size</Label>
              <Select value={teamSize} onValueChange={setTeamSize}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_SIZES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Years in Business</Label>
              <Select value={yearsInBusiness} onValueChange={setYearsInBusiness}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS_IN_BUSINESS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Estimated Yearly Revenue</Label>
            <Select value={yearlyRevenue} onValueChange={setYearlyRevenue}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a range…" />
              </SelectTrigger>
              <SelectContent>
                {REVENUE_BANDS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="brand"
            className="h-12 w-full text-base"
            disabled={!canSubmit || busy}
            onClick={submit}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Next, a quick tour of what Vantage can do for you.
          </p>
        </div>
      </div>
    </div>
  );
}
