import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CloudRain,
  MapPin,
  DollarSign,
  Calendar,
  ArrowRight,
  ArrowDown,
  Send,
  Check,
  CalendarCheck,
  BadgeCheck,
  Radar,
  Search,
  TrendingUp,
  ShieldCheck,
  Sun,
  MessageSquare,
} from "lucide-react";

import { HomeNav } from "@/components/marketing/home/HomeNav";
import { HomeFooter } from "@/components/marketing/home/HomeFooter";
import { GlitchReveal } from "@/components/marketing/home/GlitchReveal";
import { AppLink } from "@/components/marketing/AppLink";

// Note: app.vantage-fsm.com -> marketing-page redirect is handled centrally
// in __root.tsx, since the same rule applies to every marketing path.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vantage — Field Service Software" },
      {
        name: "description",
        content:
          "Vantage finds the work, quotes it, schedules it, and collects — weather-triggered outreach, radius marketing, and payments built for field service crews.",
      },
    ],
  }),
  component: HomePage,
});

const heroCtaClass =
  "inline-flex items-stretch bg-[oklch(0.97_0.004_247)] text-[oklch(0.14_0.02_260)] transition-transform active:scale-[0.97]";

function CtaButton({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AppLink to={href} className={`${heroCtaClass} h-[58px] ${className ?? ""}`}>
      <span className="block w-1.5 bg-[var(--sig)]" />
      <span className="flex items-center gap-3.5 px-[34px] text-xs font-extrabold uppercase tracking-[0.32em]">
        {children}
      </span>
    </AppLink>
  );
}

function WireframeFloor({
  className,
  opacity = 0.12,
  maskStops = [28, 72],
}: {
  className?: string;
  opacity?: number;
  maskStops?: [number, number];
}) {
  const [start, end] = maskStops;
  return (
    <div
      className={`pointer-events-none absolute -inset-x-[15%] ${className}`}
      style={{
        backgroundImage: `linear-gradient(oklch(0.62 0.22 256 / ${opacity}) 1px, transparent 1px), linear-gradient(90deg, oklch(0.62 0.22 256 / ${opacity}) 1px, transparent 1px)`,
        backgroundSize: "58px 58px",
        transform: "perspective(620px) rotateX(63deg)",
        transformOrigin: "top center",
        WebkitMaskImage: `linear-gradient(to bottom, transparent, black ${start}%, black ${end}%, transparent)`,
        maskImage: `linear-gradient(to bottom, transparent, black ${start}%, black ${end}%, transparent)`,
      }}
    />
  );
}

function Kicker({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs font-extrabold tracking-[0.2em] text-[var(--sig)]">{index}</span>
      <span className="block h-px w-10 bg-[oklch(1_0_0/20%)]" />
      <span className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--sig)]">
        {label}
      </span>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 flex flex-col gap-3.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3.5 text-sm leading-[1.6] text-[oklch(0.85_0.01_257)]"
        >
          <span className="mt-[7px] block h-[7px] w-[7px] shrink-0 bg-[var(--sig)]" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * Diagonal corner-tick pair used only on the full-bleed feature panels
 * (01/02) — the design mirrors which corner pair lights up per side,
 * unlike the shared `CornerTicks` (all four corners) used elsewhere.
 */
function DiagonalTicks({ reverse }: { reverse?: boolean }) {
  if (reverse) {
    return (
      <>
        <span className="absolute -right-px -top-px z-[8] h-4 w-4 border-r border-t border-[var(--sig)]" />
        <span className="absolute -bottom-px -left-px z-[8] h-4 w-4 border-b border-l border-[var(--sig)]" />
      </>
    );
  }
  return (
    <>
      <span className="absolute -left-px -top-px z-[8] h-4 w-4 border-l border-t border-[var(--sig)]" />
      <span className="absolute -bottom-px -right-px z-[8] h-4 w-4 border-b border-r border-[var(--sig)]" />
    </>
  );
}

function FeatNum({ n, side }: { n: string; side: "left" | "right" }) {
  return (
    <span
      className={`pointer-events-none absolute -top-[18px] z-[1] text-[150px] font-extralight leading-none tracking-tighter text-[oklch(1_0_0/5%)] ${
        side === "left" ? "left-[26px]" : "right-[26px]"
      }`}
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

function TagStrip({ label, side }: { label: string; side: "left" | "right" }) {
  return (
    <span
      className={`absolute bottom-3.5 z-[5] text-[10px] font-extrabold tracking-[0.28em] text-[oklch(0.46_0.02_257)] ${
        side === "left" ? "left-[18px]" : "right-[18px]"
      }`}
    >
      {label}
    </span>
  );
}

/** Full-bleed feature row (layout A) — 01 Outreach / 02 Growth. */
function FullBleedFeature({
  reverse,
  num,
  eyebrow,
  title,
  body,
  bullets,
  tag,
  visual,
}: {
  reverse?: boolean;
  num: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  tag: string;
  visual: ReactNode;
}) {
  return (
    <div
      className="home-feat-card flex flex-wrap items-center border border-[oklch(1_0_0/11%)]"
      style={{
        background: "linear-gradient(155deg, oklch(0.15 0.022 262), oklch(0.101 0.02 264))",
        justifyContent: reverse ? "flex-end" : undefined,
      }}
    >
      <span className="home-feat-bar" />
      <DiagonalTicks reverse={reverse} />
      <FeatNum n={num} side={reverse ? "left" : "right"} />
      {!reverse && visual}
      <div
        className="relative z-[2] box-border max-w-[600px] flex-[1.2_1_420px] px-7 py-10 sm:px-10 sm:py-14 md:px-14 md:py-[72px]"
        style={{
          background: reverse
            ? "linear-gradient(to left, oklch(0.128 0.02 262 / 94%) 62%, oklch(0.128 0.02 262 / 55%) 82%, transparent)"
            : "linear-gradient(to right, oklch(0.128 0.02 262 / 88%) 55%, transparent)",
        }}
      >
        <Kicker index={num} label={eyebrow} />
        <h2 className="mt-[22px] text-[clamp(24px,2.4vw,32px)] font-normal uppercase leading-[1.35] tracking-[0.07em] text-[oklch(0.96_0.005_247)]">
          {title}
        </h2>
        <p className="mt-[18px] text-[15px] leading-[1.85] text-[oklch(0.67_0.02_257)]">{body}</p>
        <Bullets items={bullets} />
      </div>
      {reverse && visual}
      <TagStrip label={tag} side={reverse ? "right" : "left"} />
    </div>
  );
}

function OutreachVisual() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent 30%, black 70%)",
          maskImage: "linear-gradient(to right, transparent 30%, black 70%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-35 [background-image:linear-gradient(oklch(1_0_0/6%)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/6%)_1px,transparent_1px)] [background-size:26px_26px]"
          style={{ animation: "home-lm-drift 7s linear infinite" }}
        />
        <div className="home-lm-scan opacity-55" />
      </div>
      <div className="relative z-[2] order-2 flex flex-1 basis-[320px] items-center justify-center p-7 sm:p-12">
        <div className="flex w-full max-w-[330px] flex-col gap-3.5">
          <div className="flex gap-2.5">
            {["Tue", "Wed"].map((d) => (
              <div
                key={d}
                className="flex flex-1 flex-col items-center gap-2 border border-[oklch(1_0_0/10%)] bg-[oklch(0.128_0.02_262/78%)] px-2 py-3.5 text-[oklch(0.55_0.02_257)]"
              >
                <CloudRain className="h-[18px] w-[18px]" />
                <span className="text-[9px] font-bold uppercase tracking-[0.18em]">{d}</span>
              </div>
            ))}
            <div
              className="flex flex-1 flex-col items-center gap-2 border border-[oklch(1_0_0/10%)] px-2 py-3.5 text-[var(--sig)]"
              style={{ animation: "home-lm-slot 5.2s ease-in-out infinite" }}
            >
              <Sun className="h-[18px] w-[18px]" />
              <span className="text-[9px] font-extrabold uppercase tracking-[0.18em]">Thu</span>
            </div>
          </div>
          <div className="flex justify-center text-[color-mix(in_oklch,var(--sig)_65%,transparent)]">
            <ArrowDown className="h-4 w-4" />
          </div>
          <div
            className="flex items-center gap-3 border border-[color-mix(in_oklch,var(--sig)_40%,transparent)] bg-[oklch(0.128_0.02_262/85%)] px-[15px] py-[13px]"
            style={{ animation: "home-lm-drop 5.2s ease-in-out infinite" }}
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center bg-[var(--sig)] text-[oklch(0.13_0.02_260)]">
              <Send className="h-[15px] w-[15px]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[oklch(0.95_0.006_247)]">
                Clear skies Thursday — slot open
              </p>
              <p className="mt-[3px] text-[10.5px] text-[oklch(0.55_0.02_257)]">
                Texting nearby leads automatically
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const GROWTH_BLIPS = [
  { left: "16%", top: "32%", size: 9, shadow: 12, delay: "0.5s" },
  { left: "40%", top: "26%", size: 8, shadow: 10, delay: "1.8s" },
  { left: "10%", top: "62%", size: 8, shadow: 10, delay: "3.2s" },
  { left: "42%", top: "72%", size: 9, shadow: 12, delay: "4.6s" },
];

function GrowthVisual() {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 w-[58%] [mask-image:linear-gradient(to_left,transparent,black_34%)] [-webkit-mask-image:linear-gradient(to_left,transparent,black_34%)]">
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(oklch(1_0_0/13%)_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute left-[27%] top-1/2 h-[90px] w-[90px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--sig)]"
          style={{ animation: "home-lm-ping 3s ease-out infinite", animationDelay: `${i}s` }}
        />
      ))}
      <div className="absolute left-[27%] top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[color-mix(in_oklch,var(--sig)_30%,transparent)]" />
      {GROWTH_BLIPS.map((b) => (
        <span
          key={b.left + b.top}
          className="absolute rounded-full bg-[var(--sig)]"
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            boxShadow: `0 0 ${b.shadow}px var(--sig)`,
            animation: "home-lm-blip 6s linear infinite",
            animationDelay: b.delay,
          }}
        />
      ))}
      <div className="absolute left-[27%] top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center bg-[var(--sig)] text-[oklch(0.13_0.02_260)] shadow-[0_0_22px_color-mix(in_oklch,var(--sig)_60%,transparent)]">
        <MapPin className="h-[18px] w-[18px]" />
      </div>
      <div className="home-lm-scan opacity-45" />
    </div>
  );
}

/** Paired grid feature card (layout B) — 03 Operations / 04 Sales. */
function GridFeature({
  num,
  eyebrow,
  title,
  body,
  bullets,
  visual,
}: {
  num: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  visual: ReactNode;
}) {
  return (
    <div
      className="home-feat-card flex flex-col border border-[oklch(1_0_0/11%)]"
      style={{
        background: "linear-gradient(165deg, oklch(0.155 0.022 262), oklch(0.108 0.02 263))",
      }}
    >
      <span className="home-feat-bar" />
      <div className="flex items-center justify-between border-b border-[oklch(1_0_0/8%)] px-5 py-3.5">
        <Kicker index={num} label={eyebrow} />
        <span className="text-[10px] font-extrabold tracking-[0.28em] text-[oklch(0.46_0.02_257)]">
          FT-{num}
        </span>
      </div>
      <div className="relative h-[232px] overflow-hidden [background:radial-gradient(circle_at_50%_40%,oklch(0.145_0.022_263),oklch(0.1_0.02_263))]">
        {visual}
      </div>
      <div className="px-6 pb-10 pt-8 sm:px-9">
        <h2 className="text-[clamp(22px,2.2vw,28px)] font-normal uppercase leading-[1.35] tracking-[0.07em] text-[oklch(0.96_0.005_247)]">
          {title}
        </h2>
        <p className="mt-4 text-[15px] leading-[1.85] text-[oklch(0.67_0.02_257)]">{body}</p>
        <Bullets items={bullets} />
      </div>
    </div>
  );
}

function OperationsVisual() {
  return (
    <>
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(oklch(1_0_0/6%)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/6%)_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="home-lm-scan opacity-50" />
      <div className="absolute inset-0 flex flex-col justify-center gap-2 px-7">
        <div className="flex items-center gap-3">
          <span className="w-[52px] text-[10px] font-bold tracking-[0.08em] text-[oklch(0.5_0.02_257)]">
            2:00 PM
          </span>
          <span className="block h-[30px] flex-1 border border-dashed border-[oklch(1_0_0/10%)]" />
        </div>
        <div className="flex items-stretch gap-3">
          <span className="w-[52px] pt-[9px] text-[10px] font-extrabold tracking-[0.08em] text-[var(--sig)]">
            3:00 PM
          </span>
          <div
            className="relative min-h-[54px] flex-1 border border-[oklch(1_0_0/10%)]"
            style={{ animation: "home-lm-slot 5s ease-in-out infinite" }}
          >
            <div
              className="flex items-center gap-[11px] px-3 py-[9px]"
              style={{ animation: "home-lm-drop 5s ease-in-out infinite" }}
            >
              <div className="grid h-[30px] w-[30px] shrink-0 place-items-center bg-[var(--sig)] text-[oklch(0.13_0.02_260)]">
                <CalendarCheck className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[oklch(0.95_0.006_247)]">
                  Crew A — assigned in one tap
                </p>
                <p className="mt-[2px] text-[10.5px] text-[oklch(0.55_0.02_257)]">
                  Confirmation texted to customer
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-[52px] text-[10px] font-bold tracking-[0.08em] text-[oklch(0.5_0.02_257)]">
            4:00 PM
          </span>
          <span className="block h-[30px] flex-1 border border-dashed border-[oklch(1_0_0/10%)]" />
        </div>
      </div>
    </>
  );
}

function SalesVisual() {
  return (
    <>
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(oklch(1_0_0/6%)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/6%)_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="home-lm-sweep" />
      <div className="absolute left-1/2 top-1/2 w-[min(78%,340px)] -translate-x-1/2 -translate-y-1/2 border border-[oklch(1_0_0/12%)] bg-[oklch(0.128_0.02_262/82%)] px-5 py-[18px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[oklch(0.55_0.02_257)]">
            Quote draft
          </span>
          <span
            className="inline-flex items-center gap-1.5 border-[1.5px] border-[var(--sig)] px-2.5 py-1 text-[var(--sig)]"
            style={{ animation: "home-lm-stamp 4.6s ease-in-out infinite" }}
          >
            <Check className="h-3 w-3" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em]">Approved</span>
          </span>
        </div>
        <div className="mt-3.5 flex flex-col gap-[9px]">
          {[82, 64, 48].map((w, i) => (
            <span
              key={w}
              className="block h-2 origin-left"
              style={{
                width: `${w}%`,
                background:
                  i === 0
                    ? "linear-gradient(90deg, var(--sig), color-mix(in oklch, var(--sig) 20%, transparent))"
                    : "oklch(1 0 0 / 9%)",
                animation: "home-lm-typebar 4.6s ease-in-out infinite",
                animationDelay: `${i * 0.25}s`,
              }}
            />
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[oklch(0.55_0.02_257)]">
            <span>Quote → scheduled job</span>
          </div>
          <div className="h-1 overflow-hidden bg-[oklch(1_0_0/8%)]">
            <div
              className="h-full bg-[var(--sig)]"
              style={{ animation: "home-lm-fill 4.6s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/** Open editorial row (layout C) — 05 Payments / 06 Insight. */
function EditorialFeature({
  reverse,
  num,
  eyebrow,
  title,
  body,
  bullets,
  tag,
  visual,
}: {
  reverse?: boolean;
  num: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  tag: string;
  visual: ReactNode;
}) {
  const text = (
    <div className="min-w-[min(100%,360px)] flex-[1_1_360px]">
      <Kicker index={num} label={eyebrow} />
      <h2 className="mt-[22px] text-[clamp(24px,2.4vw,32px)] font-normal uppercase leading-[1.35] tracking-[0.07em] text-[oklch(0.96_0.005_247)]">
        {title}
      </h2>
      <p className="mt-[18px] text-[15px] leading-[1.85] text-[oklch(0.67_0.02_257)]">{body}</p>
      <Bullets items={bullets} />
    </div>
  );
  const graphic = (
    <div className="relative min-w-[min(100%,400px)] flex-[1.25_1_420px]">
      <span
        className={`pointer-events-none absolute -top-[46px] text-[130px] font-extralight leading-none tracking-tighter text-[oklch(1_0_0/5%)] ${
          reverse ? "left-0" : "right-0"
        }`}
      >
        {num}
      </span>
      <div
        className={`relative flex flex-col gap-[15px] overflow-hidden px-6 py-[26px] sm:px-8 ${
          reverse ? "border-r-2" : "border-l-2"
        } border-[var(--sig)]`}
        style={{
          background: reverse
            ? "linear-gradient(to left, oklch(0.15 0.022 262 / 65%), transparent)"
            : "linear-gradient(to right, oklch(0.15 0.022 262 / 65%), transparent)",
        }}
      >
        {visual}
      </div>
      <span
        className={`absolute -bottom-7 text-[10px] font-extrabold tracking-[0.28em] text-[oklch(0.46_0.02_257)] ${
          reverse ? "right-0" : "left-0"
        }`}
      >
        {tag}
      </span>
    </div>
  );
  return (
    <div
      className={`flex flex-wrap items-center gap-10 border-t border-[oklch(1_0_0/8%)] pt-24 sm:gap-14 md:gap-[72px] ${
        reverse ? "flex-wrap-reverse" : ""
      }`}
    >
      {reverse ? (
        <>
          {graphic}
          {text}
        </>
      ) : (
        <>
          {text}
          {graphic}
        </>
      )}
    </div>
  );
}

function PaymentsVisual() {
  return (
    <>
      <div className="home-lm-sweep" />
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <p className="text-[11px] text-[oklch(0.55_0.02_257)]">Balance collected on-site</p>
          <p
            className="mt-1 text-[44px] font-extrabold tracking-tight text-[oklch(0.97_0.004_247)]"
            style={{ animation: "home-lm-glow 2.8s ease-in-out infinite" }}
          >
            $1,240
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 border-[1.5px] border-[var(--sig)] px-3 py-1.5 text-[var(--sig)]"
          style={{ animation: "home-lm-stamp 4.2s ease-in-out infinite" }}
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.16em]">Paid</span>
        </span>
      </div>
      <div className="flex flex-col gap-[9px] border border-[oklch(1_0_0/9%)] bg-[oklch(0.128_0.02_262/70%)] px-4 py-3.5 text-[13px]">
        <div className="flex justify-between text-[oklch(0.67_0.02_257)]">
          <span>Deposit — on quote approval</span>
          <span>$250</span>
        </div>
        <div className="flex justify-between text-[oklch(0.67_0.02_257)]">
          <span>Balance — on job completion</span>
          <span>$990</span>
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-[oklch(0.55_0.02_257)]">
          <span className="inline-flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-[var(--sig)]" />
            Payout to your account
          </span>
          <span>2 days</span>
        </div>
        <div className="h-1 overflow-hidden bg-[oklch(1_0_0/8%)]">
          <div
            className="h-full bg-[var(--sig)]"
            style={{ animation: "home-lm-fill 4s ease-in-out infinite" }}
          />
        </div>
      </div>
    </>
  );
}

function InsightVisual() {
  const bars = [34, 52, 44, 66, 56, 84, 100];
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[oklch(0.55_0.02_257)]">
          Revenue · this week
        </span>
        <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--sig)]">
          <span
            className="block h-[7px] w-[7px] rounded-full bg-[var(--sig)] shadow-[0_0_8px_var(--sig)]"
            style={{ animation: "home-lm-live 1.4s ease-in-out infinite" }}
          />
          Live ledger
        </span>
      </div>
      <div className="mt-5 flex h-[150px] items-end gap-2 border-b border-[oklch(1_0_0/14%)] sm:gap-3.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className="block flex-1 origin-bottom"
            style={{
              height: `${h}%`,
              background:
                i < 3
                  ? "oklch(1 0 0 / 13%)"
                  : `color-mix(in oklch, var(--sig) ${32 + i * 10}%, transparent)`,
              boxShadow:
                i === bars.length - 1
                  ? "0 0 24px color-mix(in oklch, var(--sig) 40%, transparent)"
                  : undefined,
              animation: "home-lm-rise 1.1s cubic-bezier(0.22, 1, 0.36, 1) both",
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <span className="text-[11px] font-semibold text-[oklch(0.6_0.02_257)]">
          Outstanding invoices following up on their own
        </span>
        <span
          className="text-2xl font-extrabold tracking-tight text-[oklch(0.97_0.004_247)]"
          style={{ animation: "home-lm-glow 2.6s ease-in-out infinite" }}
        >
          $4,180
        </span>
      </div>
    </>
  );
}

const SOCIAL_PROOF = [
  {
    icon: ShieldCheck,
    title: "Payments secured by Stripe",
    body: "Every deposit and invoice runs through Stripe — the same payment infrastructure behind millions of businesses. Your money never touches us.",
  },
  {
    icon: CloudRain,
    title: "Built for outdoor trades",
    body: "Made specifically for landscaping, exterior cleaning, and home-services crews — not adapted from generic office software.",
  },
  {
    icon: DollarSign,
    title: "Free until it earns its keep",
    body: "Start without a card and run real jobs through it. Pay only once you've seen the results in your own ledger.",
  },
];

const ORBIT_NODES = [
  { icon: DollarSign, x: "88%", y: "50%", delay: 0 },
  { icon: Calendar, x: "69%", y: "83%", delay: 0.7 },
  { icon: Radar, x: "31%", y: "83%", delay: 1.4 },
  { icon: CloudRain, x: "12%", y: "50%", delay: 2.1 },
  { icon: Search, x: "31%", y: "17%", delay: 2.8 },
  { icon: TrendingUp, x: "69%", y: "17%", delay: 3.5 },
];

function HomePage() {
  return (
    <div
      className="vhome relative min-h-screen overflow-x-hidden bg-[oklch(0.128_0.02_262)] text-[oklch(0.95_0.006_247)]"
      style={{
        ["--sig" as string]: "oklch(0.72 0.16 158)",
        fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-[70]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.014) 0px, rgba(255,255,255,0.014) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <HomeNav />

      <main>
        {/* ============ WORDMARK HERO ============ */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-9 pb-[110px] pt-[150px]">
          <WireframeFloor className="bottom-[-14%] h-[52%]" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(52% 44% at 50% 38%, oklch(0.72 0.16 158 / 9%), transparent), radial-gradient(40% 34% at 82% 12%, oklch(0.62 0.22 256 / 8%), transparent)",
            }}
          />

          {/* animated ring array */}
          <div className="pointer-events-none absolute left-1/2 top-[44%] aspect-square w-[min(82vw,780px)] -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color-mix(in_oklch,var(--sig)_16%,transparent)]" />
            <div
              className="absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[color-mix(in_oklch,var(--sig)_22%,transparent)]"
              style={{ animation: "home-lm-tick 42s linear infinite" }}
            />
            <div className="absolute left-1/2 top-1/2 h-[48%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color-mix(in_oklch,var(--sig)_26%,transparent)]" />
            <div
              className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full [mask-image:radial-gradient(circle,transparent_32%,black_34%,black_70%,transparent_72%)] [-webkit-mask-image:radial-gradient(circle,transparent_32%,black_34%,black_70%,transparent_72%)]"
              style={{
                background:
                  "conic-gradient(color-mix(in oklch, var(--sig) 26%, transparent), transparent 58deg)",
                animation: "home-lm-radar 9s linear infinite",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 h-[86%] w-[86%]"
              style={{ animation: "home-lm-spin 26s linear infinite" }}
            >
              <span className="absolute left-1/2 top-0 -ml-[6px] -mt-[6px] h-3 w-3 rounded-full border-[1.5px] border-[var(--sig)] shadow-[0_0_12px_var(--sig)]" />
            </div>
            {[
              { left: "71%", top: "26%", size: 8, shadow: 12, delay: "1.2s" },
              { left: "24%", top: "64%", size: 8, shadow: 12, delay: "4.4s" },
              { left: "62%", top: "76%", size: 7, shadow: 10, delay: "6.8s" },
            ].map((b) => (
              <span
                key={b.left}
                className="absolute rounded-full bg-[var(--sig)]"
                style={{
                  left: b.left,
                  top: b.top,
                  width: b.size,
                  height: b.size,
                  boxShadow: `0 0 ${b.shadow}px var(--sig)`,
                  animation: "home-lm-blip 9s linear infinite",
                  animationDelay: b.delay,
                }}
              />
            ))}
          </div>

          <div className="relative z-[2] flex max-w-[1100px] flex-col items-center text-center">
            <GlitchReveal variant="soft">
              <div className="flex items-center gap-3.5">
                <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-[var(--sig)]">
                  Growth on Autopilot
                </span>
                <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
              </div>
            </GlitchReveal>
            <GlitchReveal variant="text" delay={120}>
              <h1
                className="mt-[26px] font-extrabold uppercase leading-[1] tracking-[0.1em] text-[oklch(0.97_0.004_247)]"
                style={{
                  fontSize: "clamp(54px, 12.5vw, 196px)",
                  textShadow: "0 0 60px oklch(0.72 0.16 158 / 22%)",
                  textIndent: "0.1em",
                }}
              >
                Vantage
              </h1>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={260}>
              <p className="mt-[30px] max-w-[720px] text-balance text-[clamp(15px,1.6vw,19px)] font-normal uppercase leading-[1.7] tracking-[0.14em] text-[oklch(0.78_0.015_257)]">
                It finds the work, books it, quotes it, and closes it — while you're still on a job
                site.
              </p>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={360}>
              <div className="mt-11 flex flex-wrap items-center justify-center gap-[18px]">
                <CtaButton href="/dashboard">
                  Get started free
                  <ArrowRight className="h-[15px] w-[15px]" />
                </CtaButton>
                <a
                  href="/pricing"
                  className="inline-flex h-14 items-center border border-[oklch(1_0_0/22%)] px-[30px] text-xs font-bold uppercase tracking-[0.32em] text-[oklch(0.85_0.01_257)] transition-[transform,border-color] active:scale-[0.97] hover:border-[oklch(1_0_0/50%)] hover:text-[oklch(0.97_0.004_247)]"
                >
                  See pricing
                </a>
              </div>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={440}>
              <p className="mt-[22px] text-xs font-medium tracking-wide text-[oklch(0.52_0.02_257)]">
                Live in minutes. No card required — Vantage starts finding work before you've paid a
                cent.
              </p>
            </GlitchReveal>
          </div>

          <div className="absolute bottom-[34px] left-9 flex items-center gap-4">
            <span className="text-[11px] font-extrabold tracking-[0.24em] text-[var(--sig)]">
              FT
            </span>
            <span className="block h-px w-11 bg-[oklch(1_0_0/25%)]" />
            <span className="text-[11px] font-bold tracking-[0.24em] text-[oklch(0.45_0.02_257)]">
              06
            </span>
          </div>
          <div className="absolute bottom-[34px] right-9 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.34em] text-[oklch(0.45_0.02_257)]">
              Scroll
            </span>
            <span
              className="block h-[34px] w-px"
              style={{ background: "linear-gradient(to bottom, oklch(1 0 0 / 40%), transparent)" }}
            />
          </div>
        </section>

        {/* ============ STATEMENT ============ */}
        <section className="relative overflow-hidden border-t border-[oklch(1_0_0/8%)] bg-[oklch(0.113_0.02_263)] px-9 py-[130px]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(44% 40% at 84% 30%, oklch(0.62 0.22 256 / 6%), transparent)",
            }}
          />
          <div className="relative mx-auto flex max-w-[1280px] flex-wrap items-center gap-[72px]">
            <div className="min-w-[min(100%,420px)] flex-[1.25_1_420px]">
              <GlitchReveal variant="soft">
                <div className="flex items-center gap-4">
                  <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-[var(--sig)]">
                    One platform
                  </span>
                </div>
              </GlitchReveal>
              <GlitchReveal variant="text" delay={120}>
                <h2
                  className="mt-7 text-balance font-light uppercase leading-[1.32] tracking-[0.09em] text-[oklch(0.97_0.004_247)]"
                  style={{ fontSize: "clamp(28px, 3.4vw, 46px)" }}
                >
                  One system that finds the work, wins it, schedules it, and collects — while you
                  stay on the tools.
                </h2>
              </GlitchReveal>
            </div>
            <GlitchReveal
              variant="soft"
              delay={200}
              className="flex min-w-[min(100%,360px)] flex-[1_1_360px] justify-center"
            >
              <div className="relative aspect-square w-full max-w-[380px]">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 50%, oklch(0.72 0.16 158 / 10%), transparent 62%)",
                  }}
                />
                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 h-full w-full overflow-visible"
                >
                  {ORBIT_NODES.map((node) => {
                    const x = parseFloat(node.x);
                    const y = parseFloat(node.y);
                    return (
                      <line
                        key={node.x + node.y}
                        x1="50"
                        y1="50"
                        x2={x}
                        y2={y}
                        stroke="color-mix(in oklch, var(--sig) 26%, transparent)"
                        strokeWidth="0.6"
                      />
                    );
                  })}
                </svg>
                {ORBIT_NODES.map((node) => (
                  <div
                    key={node.x + node.y}
                    className="absolute grid h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 place-items-center border border-[color-mix(in_oklch,var(--sig)_45%,transparent)] bg-[oklch(0.128_0.02_262)] text-[var(--sig)]"
                    style={{
                      left: node.x,
                      top: node.y,
                      animation: "home-lm-float 5s ease-in-out infinite",
                      animationDelay: `${node.delay}s`,
                    }}
                  >
                    <node.icon className="h-[18px] w-[18px]" />
                  </div>
                ))}
                <span
                  className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--sig)]"
                  style={{ animation: "home-lm-ping 2.8s ease-out infinite" }}
                />
                <div className="absolute left-1/2 top-1/2 grid h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 place-items-center bg-[var(--sig)] text-[oklch(0.13_0.02_260)] shadow-[0_0_26px_color-mix(in_oklch,var(--sig)_60%,transparent)]">
                  <MapPin className="h-6 w-6" />
                </div>
              </div>
            </GlitchReveal>
          </div>
        </section>

        {/* ============ FEATURE SEQUENCE 01–06 ============ */}
        <section className="px-9 py-[120px]">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-[110px]">
            <GlitchReveal variant="soft">
              <FullBleedFeature
                num="01"
                eyebrow="Outreach"
                title="Vantage finds you jobs before your competitors see the forecast"
                body="Vantage watches your local forecast. The moment a window opens, it texts the right leads and fills the slot. You find out when the job hits your calendar."
                bullets={[
                  "Set the rules once — Vantage handles every send after that",
                  "Reads real-time local forecasts, not a canned drip schedule",
                  "One tap pauses everything — you stay in control",
                ]}
                tag="FT-01 · OUTREACH"
                visual={<OutreachVisual />}
              />
            </GlitchReveal>

            <GlitchReveal variant="soft">
              <FullBleedFeature
                reverse
                num="02"
                eyebrow="Growth"
                title="Every job you finish quietly turns into your next five"
                body="Vantage markets to the neighbors around every finished job — the people who just watched you work. New leads arrive with zero outreach from you."
                bullets={[
                  "Fence a neighborhood in seconds — Vantage does the rest",
                  "Flyers and door-hanger copy write themselves",
                  "See exactly which streets are paying off",
                ]}
                tag="FT-02 · GROWTH"
                visual={<GrowthVisual />}
              />
            </GlitchReveal>

            <GlitchReveal variant="soft">
              <div className="flex flex-wrap items-center justify-between gap-6 border border-[oklch(1_0_0/9%)] bg-[oklch(0.15_0.022_262/55%)] px-6 py-[30px] sm:px-11">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[oklch(0.85_0.01_257)]">
                  Let Vantage loose on your own jobs.
                </p>
                <div className="flex flex-wrap items-center gap-[18px]">
                  <span className="text-[11px] font-medium tracking-wide text-[oklch(0.52_0.02_257)]">
                    No card required.
                  </span>
                  <CtaButton href="/dashboard" className="h-12">
                    Get started free
                  </CtaButton>
                </div>
              </div>
            </GlitchReveal>

            <div
              className="grid gap-[18px]"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))" }}
            >
              <GlitchReveal variant="soft">
                <GridFeature
                  num="03"
                  eyebrow="Operations"
                  title="Your day gets built and assigned before you've had coffee"
                  body="Vantage lays out every job and crew on one calendar. Everyone gets their day on their phone — nobody calls you asking where to be."
                  bullets={[
                    "Reshuffle a whole day in one drag",
                    "Vantage catches conflicts before they cost you a job",
                    "Customers get confirmations without you sending a thing",
                  ]}
                  visual={<OperationsVisual />}
                />
              </GlitchReveal>
              <GlitchReveal variant="soft" delay={120}>
                <GridFeature
                  num="04"
                  eyebrow="Sales"
                  title="Vantage writes the quote, sends it, and closes it"
                  body="Give it a few job details. Vantage drafts the line items, sends the quote, and lands the approval. You just show up."
                  bullets={[
                    "Vantage drafts the line items for you",
                    "Customers approve with one tap — no chasing",
                    "Approved quotes schedule themselves",
                  ]}
                  visual={<SalesVisual />}
                />
              </GlitchReveal>
            </div>

            <GlitchReveal variant="soft">
              <div className="flex flex-wrap items-center justify-between gap-6 border border-[oklch(1_0_0/9%)] bg-[oklch(0.15_0.022_262/55%)] px-6 py-[30px] sm:px-11">
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[oklch(0.85_0.01_257)]">
                  Vantage can be working your leads by tomorrow — free, no card.
                </p>
                <CtaButton href="/dashboard" className="h-12">
                  Get started free
                </CtaButton>
              </div>
            </GlitchReveal>

            <GlitchReveal variant="soft">
              <EditorialFeature
                num="05"
                eyebrow="Payments"
                title="Vantage collects before your truck leaves the driveway"
                body="Vantage takes the deposit at approval and collects the balance the moment the job's done. No invoicing night. No awkward follow-up calls."
                bullets={[
                  "Deposits and balances collect themselves",
                  "Customers pay from a text — no app to install",
                  "Every dollar files itself against the right job",
                ]}
                tag="FT-05 · PAYMENTS"
                visual={<PaymentsVisual />}
              />
            </GlitchReveal>

            <GlitchReveal variant="soft">
              <EditorialFeature
                reverse
                num="06"
                eyebrow="Insight"
                title="Vantage watches the money so you don't have to"
                body="Revenue, profit per job, and outstanding invoices — tracked for you. Late invoices get chased without you touching them."
                bullets={[
                  "Your week's revenue, tallied without a spreadsheet",
                  "Profit per job, not just totals",
                  "Late invoices follow up on their own",
                ]}
                tag="FT-06 · INSIGHT"
                visual={<InsightVisual />}
              />
            </GlitchReveal>
          </div>
        </section>

        {/* ============ SOCIAL PROOF PLACEHOLDER ============ */}
        <section className="relative border-t border-[oklch(1_0_0/8%)] bg-[oklch(0.113_0.02_263)] px-9 py-[110px]">
          <div className="mx-auto max-w-[1280px]">
            <GlitchReveal variant="soft">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-[var(--sig)]">
                    Field reports
                  </span>
                </div>
                <span className="inline-flex items-center gap-2 border border-dashed border-[oklch(1_0_0/22%)] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[oklch(0.52_0.02_257)]">
                  Real results from real crews — coming soon
                </span>
              </div>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={140} className="mt-11">
              <div
                className="grid gap-[18px]"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}
              >
                {SOCIAL_PROOF.map((card) => (
                  <div
                    key={card.title}
                    className="home-feat-card flex flex-col gap-5 border border-[oklch(1_0_0/11%)] px-[30px] py-[34px]"
                    style={{
                      background:
                        "linear-gradient(165deg, oklch(0.15 0.022 262), oklch(0.108 0.02 263))",
                    }}
                  >
                    <span className="home-feat-bar" />
                    <div className="grid h-11 w-11 place-items-center border border-[color-mix(in_oklch,var(--sig)_45%,transparent)] text-[var(--sig)]">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold uppercase leading-[1.5] tracking-[0.08em] text-[oklch(0.95_0.006_247)]">
                      {card.title}
                    </h3>
                    <p className="text-sm leading-[1.8] text-[oklch(0.62_0.02_257)]">{card.body}</p>
                  </div>
                ))}
              </div>
            </GlitchReveal>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="relative overflow-hidden border-t border-[oklch(1_0_0/8%)] bg-[oklch(0.1_0.022_263)] px-9 py-[140px]">
          <WireframeFloor className="bottom-[-18%] h-[70%]" opacity={0.11} maskStops={[30, 70]} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 45% at 50% 30%, oklch(0.62 0.22 256 / 8%), transparent)",
            }}
          />
          <div className="relative mx-auto flex max-w-[860px] flex-col items-center text-center">
            <GlitchReveal variant="soft">
              <div className="grid h-[46px] w-[46px] place-items-center border border-[var(--sig)] text-[var(--sig)]">
                <MessageSquare className="h-5 w-5" />
              </div>
            </GlitchReveal>
            <GlitchReveal variant="text" delay={100}>
              <h2
                className="mt-8 text-balance font-light uppercase leading-[1.28] tracking-[0.1em] text-[oklch(0.97_0.004_247)]"
                style={{ fontSize: "clamp(32px, 3.6vw, 50px)" }}
              >
                Put Vantage to work on your jobs.
              </h2>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={180}>
              <p className="mt-5 text-[15px] leading-[1.8] text-[oklch(0.67_0.02_257)]">
                Free until it makes you money. No card required.
              </p>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={260} className="mt-11">
              <CtaButton href="/dashboard">
                Start free trial
                <ArrowRight className="h-[15px] w-[15px]" />
              </CtaButton>
            </GlitchReveal>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
