import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bot,
  Loader2,
  X,
  Clock,
  ShieldCheck,
  CloudRain,
  Filter,
  Globe,
  Copy,
  Check,
  Star,
  ClipboardList,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
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
  FOLLOW_UP_TRIGGERS,
  type AgentRules,
  type VoiceTone,
  type VetoLevel,
  type FollowUpTrigger,
} from "@/lib/fsm";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
}

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

  // New operational dials
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(19);
  const [maxDiscount, setMaxDiscount] = useState("10");
  const [followUp, setFollowUp] = useState<FollowUpTrigger>("Every 3 Days");
  const [autoApprove, setAutoApprove] = useState("250");
  const [handoffKeyword, setHandoffKeyword] = useState("HUMAN");
  const [weatherRain, setWeatherRain] = useState(false);
  const [weatherHeat, setWeatherHeat] = useState(false);
  const [weatherFreeze, setWeatherFreeze] = useState(false);
  const [strictness, setStrictness] = useState(50);

  // Reputation engine & lead capture (front-end automations)
  const [copied, setCopied] = useState(false);
  const [autoReviews, setAutoReviews] = useState(true);
  const [autoFollowUp, setAutoFollowUp] = useState(true);

  const EMBED_CODE = `<!-- Van AI Lead Capture Widget -->
<script
  src="https://widget.vantagefsm.app/van.js"
  data-vantage-id="vfsm_live_8a2c91"
  async
></script>`;

  const STAGNANT_QUOTES = [
    { name: "Marcus Bellwether", service: "Gutter Replacement", amount: 4200, days: 21 },
    { name: "Dana Cho", service: "Roof Inspection", amount: 1850, days: 18 },
    { name: "Theo Vance", service: "Siding Repair", amount: 6750, days: 16 },
  ];

  function copyEmbed() {
    navigator.clipboard?.writeText(EMBED_CODE).then(() => {
      setCopied(true);
      toast.success("Embed code copied");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    if (!rules) return;
    setZips(rules.target_zip_codes ?? []);
    setMargin(String(rules.min_profit_margin ?? 0));
    setTone(rules.voice_tone ?? "Professional");
    setSemiAuto(rules.veto_level === "Semi-Autonomous");
    setStartHour(rules.outreach_start_hour ?? 8);
    setEndHour(rules.outreach_end_hour ?? 19);
    setMaxDiscount(String(rules.max_autonomous_discount ?? 10));
    setFollowUp(rules.follow_up_trigger ?? "Every 3 Days");
    setAutoApprove(String(rules.auto_approve_limit ?? 250));
    setHandoffKeyword(rules.handoff_keyword ?? "HUMAN");
    setWeatherRain(rules.weather_rain ?? false);
    setWeatherHeat(rules.weather_heat ?? false);
    setWeatherFreeze(rules.weather_freeze ?? false);
    setStrictness(rules.lead_strictness ?? 50);
  }, [rules]);

  const mutation = useMutation({
    mutationFn: () =>
      saveAgentRules(rules?.id ?? null, {
        target_zip_codes: zips,
        min_profit_margin: Number(margin) || 0,
        voice_tone: tone,
        veto_level: (semiAuto ? "Semi-Autonomous" : "Full Manual Review") as VetoLevel,
        outreach_start_hour: startHour,
        outreach_end_hour: endHour,
        max_autonomous_discount: Number(maxDiscount) || 0,
        follow_up_trigger: followUp,
        auto_approve_limit: Number(autoApprove) || 0,
        handoff_keyword: handoffKeyword.trim() || "HUMAN",
        weather_rain: weatherRain,
        weather_heat: weatherHeat,
        weather_freeze: weatherFreeze,
        lead_strictness: strictness,
      }),
    onSuccess: (saved: AgentRules) => {
      queryClient.setQueryData(["agent_rules"], saved);
      toast.success("Van's configuration saved", {
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

  const strictnessLabel = strictness < 34 ? "Loose" : strictness < 67 ? "Balanced" : "Strict";

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-revenue-muted text-revenue">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">AI Operator</h2>
          <p className="text-sm text-muted-foreground">
            Define the operational boundaries Van must respect.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading configuration…</p>
      ) : (
        <div className="mt-6 space-y-8">
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
              Van will only pursue jobs projected above this margin.
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

          {/* ============ Core Operational Dials ============ */}
          <div className="space-y-5 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-revenue" />
              <h3 className="text-sm font-semibold text-foreground">Core Operational Dials</h3>
            </div>

            {/* Allowed outreach hours */}
            <div className="space-y-2">
              <Label>Allowed Outreach Hours</Label>
              <div className="flex items-center gap-3">
                <Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {formatHour(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">to</span>
                <Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {formatHour(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Van only contacts leads and neighbors within this window.
              </p>
            </div>

            {/* Max autonomous discount */}
            <div className="space-y-2">
              <Label htmlFor="maxDiscount">Max Autonomous Discount (%)</Label>
              <Input
                id="maxDiscount"
                type="number"
                min={0}
                max={100}
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className="max-w-xs"
              />
            </div>

            {/* Follow-up triggers */}
            <div className="space-y-2">
              <Label>Follow-Up Triggers</Label>
              <Select value={followUp} onValueChange={(v) => setFollowUp(v as FollowUpTrigger)}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLLOW_UP_TRIGGERS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ============ Financial & Safety Guardrails ============ */}
          <div className="space-y-5 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-revenue" />
              <h3 className="text-sm font-semibold text-foreground">Financial &amp; Safety Guardrails</h3>
            </div>

            {/* Auto-approve max limit */}
            <div className="space-y-2">
              <Label htmlFor="autoApprove">Auto-Approve Maximum Limit ($)</Label>
              <Input
                id="autoApprove"
                type="number"
                min={0}
                value={autoApprove}
                onChange={(e) => setAutoApprove(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Van auto-books any job priced under this amount without review.
              </p>
            </div>

            {/* Human hand-off keyword */}
            <div className="space-y-2">
              <Label htmlFor="handoff">Human Hand-Off Keyword</Label>
              <Input
                id="handoff"
                value={handoffKeyword}
                onChange={(e) => setHandoffKeyword(e.target.value)}
                className="max-w-xs uppercase"
              />
              <p className="text-xs text-muted-foreground">
                When a customer texts this word, Van pauses and alerts the Admin.
              </p>
            </div>
          </div>

          {/* ============ Smart Filtering ============ */}
          <div className="space-y-5 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-revenue" />
              <h3 className="text-sm font-semibold text-foreground">Smart Filtering</h3>
            </div>

            {/* Weather-triggered actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-muted-foreground" />
                <Label>Weather-Triggered Actions</Label>
              </div>
              <div className="space-y-3 rounded-lg border border-border bg-secondary/40 p-4">
                <label className="flex items-center gap-3 text-sm text-foreground">
                  <Checkbox
                    checked={weatherRain}
                    onCheckedChange={(c) => setWeatherRain(Boolean(c))}
                  />
                  Rain &amp; Storm
                </label>
                <label className="flex items-center gap-3 text-sm text-foreground">
                  <Checkbox
                    checked={weatherHeat}
                    onCheckedChange={(c) => setWeatherHeat(Boolean(c))}
                  />
                  Heatwave
                </label>
                <label className="flex items-center gap-3 text-sm text-foreground">
                  <Checkbox
                    checked={weatherFreeze}
                    onCheckedChange={(c) => setWeatherFreeze(Boolean(c))}
                  />
                  Freezing Temps
                </label>
              </div>
            </div>

            {/* Lead filtering strictness */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Lead Filtering Strictness</Label>
                <span className="text-xs font-medium text-revenue">{strictnessLabel}</span>
              </div>
              <Slider
                value={[strictness]}
                onValueChange={(v) => setStrictness(v[0])}
                min={0}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Loose</span>
                <span>Strict</span>
              </div>
            </div>
          </div>

          {/* ============ Website Lead Capture ============ */}
          <div className="space-y-4 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-revenue" />
              <h3 className="text-sm font-semibold text-foreground">Website Lead Capture</h3>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Embed Code</p>
                <Button type="button" variant="secondary" size="sm" onClick={copyEmbed} className="gap-1.5">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-md bg-foreground/90 p-3 text-xs leading-relaxed text-background">
                <code>{EMBED_CODE}</code>
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste this on your website to let Van automatically quote and book website visitors 24/7.
            </p>
          </div>

          {/* ============ Reputation Engine ============ */}
          <div className="space-y-5 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-revenue" />
              <h3 className="text-sm font-semibold text-foreground">Reputation Engine</h3>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-4">
              <div className="pr-4">
                <Label className="text-sm font-semibold">Automated Review Requests</Label>
                <p className="text-xs text-muted-foreground">
                  Van texts a Google review link the moment an invoice is marked Paid.
                </p>
              </div>
              <Switch checked={autoReviews} onCheckedChange={setAutoReviews} />
            </div>
          </div>

          {/* ============ Sales Opportunity Queue ============ */}
          <div className="space-y-4 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-revenue" />
              <h3 className="text-sm font-semibold text-foreground">Sales Opportunity Queue</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Quotes with no movement in over 14 days. Van can nudge these prospects automatically.
            </p>

            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-4">
              <div className="pr-4">
                <Label className="text-sm font-semibold">Auto Follow-Up Texts</Label>
                <p className="text-xs text-muted-foreground">
                  Send a friendly check-in to every stagnant quote below.
                </p>
              </div>
              <Switch checked={autoFollowUp} onCheckedChange={setAutoFollowUp} />
            </div>

            <div className="divide-y divide-border rounded-lg border border-border">
              {STAGNANT_QUOTES.map((q) => (
                <div key={q.name} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{q.name}</p>
                    <p className="text-xs text-muted-foreground">{q.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      ${q.amount.toLocaleString()}
                    </p>
                    <p className="text-xs font-medium text-destructive">{q.days} days stale</p>
                  </div>
                </div>
              ))}
            </div>
          </div>



          {/* Veto level */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-4">
            <div>
              <Label className="text-sm font-semibold">Veto Level</Label>
              <p className="text-xs text-muted-foreground">
                {semiAuto
                  ? "Semi-Autonomous — Van acts and notifies you afterward."
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
