import { Check, MapPin, Volume2 } from "lucide-react";
import { CornerTicks } from "./CornerTicks";
import type { WeatherStage } from "./useWeatherStage";

const LABEL: Record<WeatherStage, string> = {
  rain: "Rain · 1:40 PM",
  clearing: "Clearing · 2:00 PM",
  sent: "Clearing · 2:00 PM",
};

export function LiveHeader({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[oklch(1_0_0/8%)] px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span
          className="block h-[7px] w-[7px] rounded-full bg-[var(--sig)] shadow-[0_0_8px_var(--sig)]"
          style={{ animation: "home-lm-live 1.4s ease-in-out infinite" }}
        />
        <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[oklch(0.6_0.02_257)]">
          {label}
        </span>
      </div>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sig)]">
        {value}
      </span>
    </div>
  );
}

const BLIPS_HERO = [
  { left: "67%", top: "33%", delay: "0.55s", size: 9 },
  { left: "37%", top: "60%", delay: "1.75s", size: 9 },
  { left: "62%", top: "71%", delay: "2.7s", size: 9 },
  { left: "30%", top: "38%", delay: "1.1s", size: 8 },
  { left: "73%", top: "57%", delay: "2.2s", size: 8 },
];

const TRAVEL_ANGLES = [0, 60, 120, 180, 240, 300];
const WAVE_DELAYS = [0, 0.11, 0.22, 0.33, 0.44, 0.55, 0.66];

export function WeatherHud({
  stage,
  variant = "hero",
}: {
  stage: WeatherStage;
  variant?: "hero" | "compact";
}) {
  if (variant === "hero") {
    return (
      <div
        className="home-lm-panel relative w-full max-w-[460px] border border-[oklch(1_0_0/12%)] backdrop-blur-[8px]"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.172 0.024 260 / 94%), oklch(0.118 0.02 263 / 94%))",
          boxShadow: "0 34px 80px -40px oklch(0.62 0.22 256 / 55%)",
        }}
      >
        <CornerTicks size={16} />
        <LiveHeader label="Live · auto-outreach" value={LABEL[stage]} />

        <div
          className="relative h-[236px] overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, oklch(0.15 0.022 263), oklch(0.098 0.02 263))",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.32]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(1 0 0 / 6%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 6%) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
              animation: "home-lm-drift 7s linear infinite",
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
            style={{
              borderColor: "color-mix(in oklch, var(--sig) 24%, transparent)",
              animation: "home-lm-tick 16s linear infinite",
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-[150px] w-[150px]"
            style={{ animation: "home-lm-spin 5.5s linear infinite" }}
          >
            <span className="absolute left-1/2 top-0 -ml-2 -mt-2 h-4 w-4 rounded-full border-[1.5px] border-[var(--sig)] shadow-[0_0_12px_var(--sig)]" />
          </div>
          <div
            className="absolute left-1/2 top-1/2 h-[216px] w-[216px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: "color-mix(in oklch, var(--sig) 20%, transparent)" }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-[146px] w-[146px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: "color-mix(in oklch, var(--sig) 24%, transparent)" }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: "color-mix(in oklch, var(--sig) 30%, transparent)" }}
          />
          <div
            className="absolute bottom-0 left-1/2 top-0 w-px"
            style={{ background: "color-mix(in oklch, var(--sig) 13%, transparent)" }}
          />
          <div
            className="absolute left-0 right-0 top-1/2 h-px"
            style={{ background: "color-mix(in oklch, var(--sig) 13%, transparent)" }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-[216px] w-[216px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "conic-gradient(color-mix(in oklch, var(--sig) 42%, transparent), transparent 66deg)",
              animation: "home-lm-radar 3.6s linear infinite",
              WebkitMaskImage: "radial-gradient(circle, black 70%, transparent 72%)",
              maskImage: "radial-gradient(circle, black 70%, transparent 72%)",
            }}
          />
          {BLIPS_HERO.map((b, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-[var(--sig)] shadow-[0_0_12px_var(--sig)]"
              style={{
                left: b.left,
                top: b.top,
                width: b.size,
                height: b.size,
                animation: `home-lm-blip 3.6s linear infinite`,
                animationDelay: b.delay,
              }}
            />
          ))}
          <span
            className="absolute left-1/2 top-1/2 h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--sig)]"
            style={{ animation: "home-lm-ping 2.4s ease-out infinite" }}
          />
          <div
            className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center bg-[var(--sig)] text-[oklch(0.13_0.02_260)]"
            style={{ boxShadow: "0 0 18px color-mix(in oklch, var(--sig) 60%, transparent)" }}
          >
            <MapPin className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="home-lm-scan" />
        </div>

        <div className="border-t border-[oklch(1_0_0/8%)] p-4">
          <div
            className="border px-[15px] py-[13px] text-[13px] leading-relaxed text-[oklch(0.92_0.008_247)]"
            style={{
              borderColor: "color-mix(in oklch, oklch(0.62 0.22 256) 42%, transparent)",
              background: "oklch(0.62 0.22 256 / 12%)",
              animation: "home-lm-drop 5.2s ease-in-out infinite",
            }}
          >
            Skies are clearing on your street — a detailing slot just opened at 3:00 PM. Reply YES
            to book.
          </div>
          <div className="mt-[11px] flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--sig)]">
            <Check className="h-[13px] w-[13px]" strokeWidth={2} />
            Delivered · 12 nearby leads
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="home-lm-panel relative w-full max-w-[430px] border border-[oklch(1_0_0/12%)]"
      style={{
        background: "linear-gradient(160deg, oklch(0.17 0.024 260), oklch(0.115 0.02 263))",
        boxShadow: "0 26px 62px -38px oklch(0.72 0.16 158 / 45%)",
      }}
    >
      <CornerTicks size={14} />
      <LiveHeader label="Broadcasting" value="Clear · 2:00 PM" />

      <div
        className="relative h-[196px] overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 50% 44%, oklch(0.15 0.022 263), oklch(0.1 0.02 263))",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 7%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 7%) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            animation: "home-lm-drift 6s linear infinite",
          }}
        />
        <div
          className="absolute left-1/2 top-[44%] h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "conic-gradient(color-mix(in oklch, var(--sig) 34%, transparent), transparent 72deg)",
            animation: "home-lm-spin 3s linear infinite",
            WebkitMaskImage: "radial-gradient(circle, black 66%, transparent 68%)",
            maskImage: "radial-gradient(circle, black 66%, transparent 68%)",
          }}
        />
        {[0, 0.87, 1.74].map((delay) => (
          <span
            key={delay}
            className="absolute left-1/2 top-[44%] h-[60px] w-[60px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--sig)]"
            style={{
              animation: "home-lm-ping 2.6s ease-out infinite",
              animationDelay: `${delay}s`,
            }}
          />
        ))}
        <div
          className="absolute left-1/2 top-[44%] h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
          style={{
            borderColor: "color-mix(in oklch, var(--sig) 45%, transparent)",
            animation: "home-lm-tick 7s linear infinite",
          }}
        />
        {TRAVEL_ANGLES.map((angle, i) => (
          <span
            key={angle}
            className="absolute left-1/2 top-[44%] h-0 w-0"
            style={{ transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
          >
            <span
              className="absolute -left-[3px] -top-[3px] h-[6px] w-[6px] rounded-full bg-[var(--sig)] shadow-[0_0_8px_var(--sig)]"
              style={{
                animation: "home-lm-travel 2.4s ease-out infinite",
                animationDelay: `${i * 0.4}s`,
              }}
            />
          </span>
        ))}
        <div
          className="absolute left-1/2 top-[44%] z-[3] grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center bg-[var(--sig)] text-[oklch(0.13_0.02_260)]"
          style={{
            boxShadow: "0 0 22px color-mix(in oklch, var(--sig) 68%, transparent)",
            animation: "home-lm-float 3s ease-in-out infinite",
          }}
        >
          <Volume2 className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        <div className="absolute bottom-3.5 left-0 right-0 z-[3] flex h-[30px] items-end justify-center gap-[5px]">
          {WAVE_DELAYS.map((delay) => (
            <span
              key={delay}
              className="h-full w-[5px] origin-bottom bg-[var(--sig)]"
              style={{
                animation: "home-lm-wave 0.9s ease-in-out infinite",
                animationDelay: `${delay}s`,
              }}
            />
          ))}
        </div>
        <div className="home-lm-scan" />
      </div>

      <div className="flex items-center justify-between border-t border-[oklch(1_0_0/8%)] px-4 py-[15px]">
        <span className="text-[11px] font-semibold tracking-wide text-[oklch(0.6_0.02_257)]">
          Leads reached · 1.5 mi radius
        </span>
        <span
          className="text-[22px] font-extrabold tracking-tight text-[oklch(0.97_0.004_247)]"
          style={{ animation: "home-lm-glow 2.6s ease-in-out infinite" }}
        >
          12
        </span>
      </div>
    </div>
  );
}
