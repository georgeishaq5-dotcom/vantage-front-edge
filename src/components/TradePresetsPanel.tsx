import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Wand2, Bot, Save, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchTradePresets,
  saveTradePresets,
  DEFAULT_PRESET,
  type PresetUpgrade,
  type TradePresetInput,
} from "@/lib/fsm";
import { configureTradePresets } from "@/lib/presets.functions";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || crypto.randomUUID();
}

export function TradePresetsPanel() {
  const queryClient = useQueryClient();
  const { data: preset, isLoading } = useQuery({
    queryKey: ["trade_presets"],
    queryFn: fetchTradePresets,
  });

  const [form, setForm] = useState<TradePresetInput>(DEFAULT_PRESET);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [vanOpen, setVanOpen] = useState(false);
  const [vanPrompt, setVanPrompt] = useState("");

  useEffect(() => {
    if (preset) {
      setExistingId(preset.id);
      setForm({
        profession: preset.profession,
        base_job_title: preset.base_job_title,
        base_job_description: preset.base_job_description,
        base_price: Number(preset.base_price),
        upgrades: preset.upgrades?.length ? preset.upgrades : DEFAULT_PRESET.upgrades,
      });
    }
  }, [preset]);

  const saveMut = useMutation({
    mutationFn: () => saveTradePresets(existingId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trade_presets"] });
      toast.success("Presets saved.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save presets"),
  });

  const configureFn = useServerFn(configureTradePresets);
  const vanMut = useMutation({
    mutationFn: (prompt: string) => configureFn({ data: { prompt } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trade_presets"] });
      setVanOpen(false);
      setVanPrompt("");
      toast.success("Van reconfigured your presets.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Van could not configure presets"),
  });

  function updateUpgrade(i: number, patch: Partial<PresetUpgrade>) {
    setForm((f) => ({
      ...f,
      upgrades: f.upgrades.map((u, idx) => (idx === i ? { ...u, ...patch } : u)),
    }));
  }
  function removeUpgrade(i: number) {
    setForm((f) => ({ ...f, upgrades: f.upgrades.filter((_, idx) => idx !== i) }));
  }
  function addUpgrade() {
    setForm((f) => ({
      ...f,
      upgrades: [
        ...f.upgrades,
        { key: crypto.randomUUID(), name: "New upgrade", description: "", price: 0 },
      ],
    }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ask Van */}
      <div className="rounded-xl border border-revenue/40 bg-revenue-muted/30 p-3 md:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-revenue text-revenue-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Ask Van to Configure</h3>
              <p className="text-sm text-muted-foreground">
                Describe your business and Van will rebuild your pricing presets instantly.
              </p>
            </div>
          </div>
          <Button variant="revenue" className="gap-1.5" onClick={() => setVanOpen(true)}>
            <Wand2 className="h-4 w-4" />
            Ask Van
          </Button>
        </div>
      </div>

      {/* Base job */}
      <div className="rounded-xl border border-border bg-card p-3 md:p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-revenue" />
          <h3 className="text-base font-semibold text-foreground">Base Job</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Profession / Trade</Label>
            <Input
              value={form.profession}
              onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Base Price ($)</Label>
            <Input
              type="number"
              value={form.base_price}
              onChange={(e) => setForm((f) => ({ ...f, base_price: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Base Job Title</Label>
            <Input
              value={form.base_job_title}
              onChange={(e) => setForm((f) => ({ ...f, base_job_title: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Base Job Description</Label>
            <Input
              value={form.base_job_description}
              onChange={(e) => setForm((f) => ({ ...f, base_job_description: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Upgrades */}
      <div className="rounded-xl border border-border bg-card p-3 md:p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Optional Upgrades</h3>
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={addUpgrade}>
            <Plus className="h-4 w-4" />
            Add Upgrade
          </Button>
        </div>
        <div className="space-y-4">
          {form.upgrades.map((u, i) => (
            <div key={u.key} className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={u.name}
                    onChange={(e) => updateUpgrade(i, { name: e.target.value, key: u.key || slugify(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Price ($)</Label>
                  <Input
                    type="number"
                    value={u.price}
                    onChange={(e) => updateUpgrade(i, { price: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input
                  value={u.description}
                  onChange={(e) => updateUpgrade(i, { description: e.target.value })}
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Switch
                    checked={!!u.recommended}
                    onCheckedChange={(v) => updateUpgrade(i, { recommended: v })}
                  />
                  Recommended
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeUpgrade(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {form.upgrades.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No upgrades yet. Add one to get started.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="revenue" className="gap-1.5" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Presets
        </Button>
      </div>

      {/* Ask Van dialog */}
      <Dialog open={vanOpen} onOpenChange={setVanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-revenue" />
              Ask Van to Configure
            </DialogTitle>
            <DialogDescription>
              Tell Van about your trade and it will overwrite your presets with relevant services and upgrades.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={vanPrompt}
            onChange={(e) => setVanPrompt(e.target.value)}
            placeholder="e.g. I am a mobile detailer, set up my prices."
            rows={4}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setVanOpen(false)} disabled={vanMut.isPending}>
              Cancel
            </Button>
            <Button
              variant="revenue"
              className="gap-1.5"
              disabled={vanMut.isPending || vanPrompt.trim().length < 3}
              onClick={() => vanMut.mutate(vanPrompt.trim())}
            >
              {vanMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Configure with Van
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
