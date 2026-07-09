import { CloudRain, Sun, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherStage } from "./useWeatherStage";

const LABEL: Record<WeatherStage, string> = {
  rain: "Rain · 1:40 PM",
  clearing: "Clearing · 2:00 PM",
  sent: "Clearing · 2:00 PM",
};

export function WeatherHud({
  stage,
  variant = "hero",
}: {
  stage: WeatherStage;
  variant?: "hero" | "compact";
}) {
  const isHero = variant === "hero";
  const isRain = stage === "rain";
  const isSent = stage === "sent";
  const radarSize = isHero ? 118 : 100;
  const pinSize = isHero ? 30 : 26;

  return (
    <div
      className={cn(
        "relative w-full border border-[oklch(1_0_0/11%)] bg-[oklch(0.155_0.022_260/88%)] backdrop-blur-sm",
        isHero ? "max-w-[460px]" : "max-w-[430px] bg-[oklch(0.155_0.022_260)]",
      )}
    >
      {isHero && (
        <>
          <span className="absolute -left-px -top-px h-4 w-4 border-l border-t border-[var(--sig)]" />
          <span className="absolute -right-px -top-px h-4 w-4 border-r border-t border-[var(--sig)]" />
          <span className="absolute -bottom-px -left-px h-4 w-4 border-b border-l border-[var(--sig)]" />
          <span className="absolute -bottom-px -right-px h-4 w-4 border-b border-r border-[var(--sig)]" />
        </>
      )}

      <div
        className={cn(
          "relative overflow-hidden bg-[oklch(0.11_0.02_263)]",
          isHero ? "h-[216px]" : "h-[170px]",
        )}
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 7%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 7%) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[var(--sig)] opacity-60"
          style={{ width: radarSize, height: radarSize }}
        />
        <div
          className="absolute left-1/2 top-1/2 rounded-full border-[1.5px] border-[var(--sig)]"
          style={{
            width: radarSize,
            height: radarSize,
            animation: "home-ping-ring 2.4s ease-out infinite",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center bg-[var(--sig)] text-[oklch(0.13_0.02_260)]"
          style={{ width: pinSize, height: pinSize }}
        >
          <MapPin className={isHero ? "h-[15px] w-[15px]" : "h-[13px] w-[13px]"} strokeWidth={2} />
        </div>
        <div
          className={cn(
            "absolute flex items-center gap-2 border border-[oklch(1_0_0/14%)] bg-[oklch(0.128_0.02_262/88%)]",
            isHero ? "left-3.5 top-3.5 px-3 py-1.5" : "left-3 top-3 px-2.5 py-1.5",
          )}
        >
          {isRain ? (
            <CloudRain className="h-[13px] w-[13px] text-[oklch(0.67_0.02_257)]" strokeWidth={2} />
          ) : (
            <Sun className="h-[13px] w-[13px] text-[var(--sig)]" strokeWidth={2} />
          )}
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[oklch(0.92_0.008_247)]">
            {LABEL[stage]}
          </span>
        </div>
      </div>

      <div className={cn("flex flex-col gap-3", isHero ? "p-[18px]" : "gap-2.5 p-4")}>
        {isHero && (
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[oklch(0.55_0.02_257)]">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Auto-outreach · 1.5 mi radius
          </div>
        )}
        <div
          className={cn(
            "border border-[oklch(0.62_0.22_256/35%)] bg-[oklch(0.62_0.22_256/10%)] leading-relaxed text-[oklch(0.92_0.008_247)] transition-all duration-500",
            isHero ? "px-[15px] py-[13px] text-[13px]" : "px-3.5 py-3 text-[12.5px]",
            isSent ? "opacity-100" : isHero ? "translate-y-1.5 opacity-35" : "opacity-35",
          )}
        >
          Skies are clearing on your street — we have a detailing slot open at 3:00 PM today. Reply
          YES to book.
        </div>
        {isHero && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {(["rain", "clearing", "sent"] as WeatherStage[]).map((s) => (
              <span
                key={s}
                className="block h-[5px] transition-all duration-300"
                style={{
                  width: s === stage ? 26 : 6,
                  background: s === stage ? "var(--sig)" : "oklch(1 0 0 / 18%)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
