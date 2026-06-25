import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Camera, Mic, Pencil, Check, X, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/lib/notifications";
import { formatCurrency } from "@/lib/fsm";

type DraftSource = "photo" | "voice";

interface AiQuoteDraft {
  id: string;
  customer: string;
  job: string;
  source: DraftSource;
  rationale: string;
  suggestedPrice: number;
}

const SEED_DRAFTS: AiQuoteDraft[] = [
  {
    id: "draft-1",
    customer: "Jordan Reyes",
    job: "Gutter cleaning & guard install",
    source: "photo",
    rationale: "AI estimated 180 linear ft of guttering with debris from uploaded photos.",
    suggestedPrice: 1240,
  },
  {
    id: "draft-2",
    customer: "Marcus Bell",
    job: "Exterior soft wash — 2 story",
    source: "voice",
    rationale: "Drafted from your voice note: '2 story colonial, mildew on north siding'.",
    suggestedPrice: 685,
  },
];

const SOURCE_META: Record<DraftSource, { icon: typeof Camera; label: string }> = {
  photo: { icon: Camera, label: "AI Photo Quote" },
  voice: { icon: Mic, label: "AI Voice Quote" },
};

export function AiQuoteDrafts() {
  const { notify } = useNotifications();
  const [drafts, setDrafts] = useState<AiQuoteDraft[]>(SEED_DRAFTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function startEdit(d: AiQuoteDraft) {
    setEditingId(d.id);
    setEditValue(String(d.suggestedPrice));
  }

  function saveEdit(id: string) {
    const parsed = Math.max(0, Math.round(Number(editValue) || 0));
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, suggestedPrice: parsed } : d)),
    );
    setEditingId(null);
    toast.success("Price updated", { description: "Draft saved — not yet sent." });
  }

  function approve(d: AiQuoteDraft) {
    notify(
      "quote_approved",
      "Quote approved & sent",
      `You approved a ${formatCurrency(d.suggestedPrice)} quote for ${d.customer}.`,
    );
    setDrafts((prev) => prev.filter((x) => x.id !== d.id));
    toast.success("Quote sent to client", {
      description: `${d.customer} will receive your approved ${formatCurrency(d.suggestedPrice)} quote.`,
    });
  }

  function discard(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    toast("Draft discarded", { description: "The AI quote was not sent." });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 md:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
            <Sparkles className="h-5 w-5 text-revenue" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">AI Quote Drafts</h2>
            <p className="text-xs text-muted-foreground">
              Review, edit, and approve — AI never sends a quote on its own
            </p>
          </div>
        </div>
        {drafts.length > 0 && (
          <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
            {drafts.length} draft{drafts.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {drafts.length === 0 ? (
        <div className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-8 text-center">
          <ShieldCheck className="h-7 w-7 text-revenue" />
          <p className="mt-2 text-sm font-medium text-foreground">No drafts awaiting review</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            New AI photo & voice quotes will land here as drafts for your approval.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {drafts.map((d) => {
            const Icon = SOURCE_META[d.source].icon;
            const isEditing = editingId === d.id;
            return (
              <li key={d.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{d.customer}</p>
                    <p className="text-xs text-muted-foreground">{d.job}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    Draft
                  </span>
                </div>

                <p className="mt-2 text-xs italic text-muted-foreground">{d.rationale}</p>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-card px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Suggested price
                  </span>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 w-28 text-right"
                        autoFocus
                      />
                      <Button size="sm" variant="revenue" onClick={() => saveEdit(d.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(d)}
                      className="inline-flex items-center gap-1.5 text-lg font-extrabold tracking-tight text-revenue transition-colors hover:text-revenue/80"
                    >
                      {formatCurrency(d.suggestedPrice)}
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="revenue" onClick={() => approve(d)}>
                    <Check className="h-3.5 w-3.5" />
                    Approve &amp; Send to Client
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => discard(d.id)}>
                    <X className="h-3.5 w-3.5" />
                    Discard
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
