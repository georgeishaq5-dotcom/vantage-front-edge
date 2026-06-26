import { useEffect, useState } from "react";
import { CloudRain, Sun, MessageSquare, MapPin } from "lucide-react";

type Stage = "rain" | "clearing" | "sent";

const STAGE_DURATIONS: Record<Stage, number> = {
  rain: 2200,
  clearing: 1600,
  sent: 3200,
};

export function WeatherTriggerDemo() {
  const [stage, setStage] = useState<Stage>("rain");

  useEffect(() => {
    const order: Stage[] = ["rain", "clearing", "sent"];
    let i = order.indexOf(stage);
    const t = setTimeout(() => {
      i = (i + 1) % order.length;
      setStage(order[i]);
    }, STAGE_DURATIONS[stage]);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      {/* Map-ish backdrop */}
      <div className="relative h-44 overflow-hidden bg-sidebar">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(var(--sidebar-border) 1px, transparent 1px), linear-gradient(90deg, var(--sidebar-border) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* Geo-fence radius ring */}
        <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-revenue/50">
          <div className="absolute inset-0 animate-ping rounded-full border-2 border-revenue/30" />
        </div>
        <div className="absolute left-1/2 top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-revenue shadow-lg">
          <MapPin className="h-4 w-4 text-revenue-foreground" />
        </div>

        {/* Weather badge, top-left */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1.5 shadow-sm">
          {stage === "rain" ? (
            <CloudRain className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-revenue" />
          )}
          <span className="text-[11px] font-semibold text-foreground">
            {stage === "rain" ? "Rain · 1:40 PM" : "Clearing · 2:00 PM"}
          </span>
        </div>
      </div>

      {/* SMS panel */}
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          Auto-outreach · 1.5 mi radius
        </div>

        <div
          className={[
            "rounded-xl rounded-tl-sm bg-brand-muted px-3.5 py-2.5 text-[13px] leading-snug text-foreground transition-all duration-500",
            stage === "sent"
              ? "translate-y-0 opacity-100"
              : "translate-y-1 opacity-40",
          ].join(" ")}
        >
          Skies are clearing on your street — we have a detailing slot open
          at 3:00 PM today. Reply YES to book.
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          {(["rain", "clearing", "sent"] as Stage[]).map((s) => (
            <span
              key={s}
              className={[
                "h-1.5 rounded-full transition-all duration-300",
                s === stage ? "w-6 bg-brand" : "w-1.5 bg-border",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
