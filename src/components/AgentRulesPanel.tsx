import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bot, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAgentRules,
  saveAgentRules,
  VOICE_TONES,
  type AgentRules,
  type VoiceTone,
  type VetoLevel,
} from "@/lib/fsm";

export function AgentRulesPanel() {
  const queryClient = useQueryClient();
  const { data: rules, isLoading } = useQuery({
    queryKey: ["agent_rules"],
    queryFn: fetchAgentRules,
  });

  const [zips, setZips] = useState<string[]>([]);
  const [zipDraft, setZipDraft] = useState("");
  const [margin, setMargin] = useState<string>("0");
  const [tone, setTone] = useState<VoiceTone>("Professional");
  const [semiAuto, setSemiAuto] = useState(false);

  useEffect(() => {
    if (!rules) return;
    setZips(rules.target_zip_codes ?? []);
    setMargin(String(rules.min_profit_margin ?? 0));
    setTone(rules.voice_tone ?? "Professional");
    setSemiAuto(rules.veto_level === "Semi-Autonomous");
  }, [rules]);

  const mutation = useMutation({
    mutationFn: () =>
      saveAgentRules(rules?.id ?? null, {
        target_zip_codes: zips,
        min_profit_margin: Number(margin) || 0,
        voice_tone: tone,
        veto_level: (semiAuto ? "Semi-Autonomous" : "Full Manual Review") as VetoLevel,
      }),
    onSuccess: (saved: AgentRules) => {
      queryClient.setQueryData(["agent_rules"], saved);
      toast.success("AI Operator configuration saved", {
        className: "bg-revenue text-revenue-foreground",
      });
    },
    onError: () => toast.error("Failed to save configuration"),
  });

  function addZip() {
    const v = zipDraft.trim().replace(/\D/g, "").slice(0, 5);
    if (!v || zips.includes(v)) {
      setZipDraft("");
      return;
    }
    setZips((z) => [...z, v]);
    setZipDraft("");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-revenue-muted text-revenue">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">AI Operator</h2>
          <p className="text-sm text-muted-foreground">
            Define the operational boundaries your autonomous agent must respect.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading configuration…</p>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Target zip codes */}
          <div className="space-y-2">
            <Label>Target Zip Codes</Label>
            <div className="flex gap-2">
              <Input
                value={zipDraft}
                onChange={(e) => setZipDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addZip();
                  }
                }}
                placeholder="Add a zip code…"
                inputMode="numeric"
                className="max-w-xs"
              />
              <Button type="button" variant="secondary" onClick={addZip}>
                Add
              </Button>
            </div>
            {zips.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {zips.map((z) => (
                  <span
                    key={z}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {z}
                    <button
                      type="button"
                      onClick={() => setZips((list) => list.filter((x) => x !== z))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Minimum profit margin */}
          <div className="space-y-2">
            <Label htmlFor="margin">Minimum Job Profit Margin (%)</Label>
            <Input
              id="margin"
              type="number"
              min={0}
              max={100}
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              The agent will only pursue jobs projected above this margin.
            </p>
          </div>

          {/* Voice tone */}
          <div className="space-y-2">
            <Label>Voice Tone Profile</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as VoiceTone)}>
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Veto level */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-4">
            <div>
              <Label className="text-sm font-semibold">Veto Level</Label>
              <p className="text-xs text-muted-foreground">
                {semiAuto
                  ? "Semi-Autonomous — the agent acts and notifies you afterward."
                  : "Full Manual Review — every action waits for your approval."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Manual</span>
              <Switch checked={semiAuto} onCheckedChange={setSemiAuto} />
              <span className="text-xs text-muted-foreground">Semi-Auto</span>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-border pt-6">
            <Button
              variant="revenue"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
