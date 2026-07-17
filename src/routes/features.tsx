import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CloudRain,
  Sun,
  ArrowDown,
  Send,
  MapPin,
  CalendarCheck,
  Check,
  DollarSign,
  BadgeCheck,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

import { HomeNav } from "@/components/marketing/home/HomeNav";
import { HomeFooter } from "@/components/marketing/home/HomeFooter";
import { GlitchReveal } from "@/components/marketing/home/GlitchReveal";
import { AppLink } from "@/components/marketing/AppLink";

// Note: app.vantage-fsm.com -> /dashboard redirect for this path is
// handled centrally in __root.tsx.
export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Vantage" },
      {
        name: "description",
        content:
          "Quoting, dispatch, weather-triggered outreach, and radius marketing built for field service crews.",
      },
    ],
  }),
  component: FeaturesPage,
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

/** Perspective wireframe floor used behind the hero and CTA sections. */
function WireframeFloor({
  className,
  opacity = 0.12,
  rotate = 63,
  mask,
}: {
  className?: string;
  opacity?: number;
  rotate?: number;
  mask: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute -inset-x-[15%] ${className}`}
      style={{
        backgroundImage: `linear-gradient(oklch(0.62 0.22 256 / ${opacity}) 1px, transparent 1px), linear-gradient(90deg, oklch(0.62 0.22 256 / ${opacity}) 1px, transparent 1px)`,
        backgroundSize: "58px 58px",
        transform: `perspective(620px) rotateX(${rotate}deg)`,
        transformOrigin: "top center",
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
}

/** The small "01 — Outreach" row used in every bento card's text block. */
function Kicker({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-[11px]">
      <span className="text-xs font-extrabold tracking-[0.2em] text-[var(--sig)]">{index}</span>
      <span className="block h-px w-[22px] bg-[oklch(1_0_0/20%)]" />
      <span className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--sig)]">
        {label}
      </span>
    </div>
  );
}

/** Giant faint background numeral — only on the two wide cards (01, 05). */
function FeatNum({ n, side }: { n: string; side: "left" | "right" }) {
  return (
    <span
      aria-hidden="true"
      className={`home-feat-num pointer-events-none absolute -top-[18px] z-[1] text-[120px] font-extralight leading-none tracking-tighter text-[oklch(1_0_0/5%)] ${
        side === "left" ? "left-[22px]" : "right-[22px]"
      }`}
    >
      {n}
    </span>
  );
}

/** Single top corner tick — only on cards 01 (left) and 02 (right). */
function CornerTick({ side }: { side: "left" | "right" }) {
  return side === "left" ? (
    <span className="absolute -left-px -top-px z-[8] h-[15px] w-[15px] border-l border-t border-[var(--sig)]" />
  ) : (
    <span className="absolute -right-px -top-px z-[8] h-[15px] w-[15px] border-r border-t border-[var(--sig)]" />
  );
}

/** Static faint grid backdrop used behind the Outreach/Operations/Sales visuals. */
function MiniGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(oklch(1_0_0/6%)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/6%)_1px,transparent_1px)] [background-size:26px_26px]"
    />
  );
}

/** Wide (row-flex) bento card shell — cards 01 Outreach and 05 Payments. */
function WideFeatCard({
  corner,
  numSide,
  num,
  children,
}: {
  corner?: "left" | "right";
  numSide?: "left" | "right";
  num: string;
  children: ReactNode;
}) {
  return (
    <div
      className="home-feat-card flex h-full flex-wrap items-stretch overflow-hidden border border-[oklch(1_0_0/11%)]"
      style={{
        background: "linear-gradient(150deg, oklch(0.155 0.022 262), oklch(0.105 0.02 264))",
      }}
    >
      <span className="home-feat-bar" />
      {corner && <CornerTick side={corner} />}
      {numSide && <FeatNum n={num} side={numSide} />}
      {children}
    </div>
  );
}

/** Stacked (column-flex) bento card shell — cards 02, 03, 04, 06. */
function StackFeatCard({ corner, children }: { corner?: "left" | "right"; children: ReactNode }) {
  return (
    <div
      className="home-feat-card flex h-full flex-col overflow-hidden border border-[oklch(1_0_0/11%)]"
      style={{
        background: "linear-gradient(165deg, oklch(0.155 0.022 262), oklch(0.105 0.02 264))",
      }}
    >
      <span className="home-feat-bar" />
      {corner && <CornerTick side={corner} />}
      {children}
    </div>
  );
}

/** Text half of a wide card (icon + kicker + title + body). */
function WideCardText({
  icon: Icon,
  num,
  eyebrow,
  title,
  body,
  basis,
  minW,
  bodyMaxWidth,
}: {
  icon: LucideIcon;
  num: string;
  eyebrow: string;
  title: string;
  body: string;
  basis: string;
  minW: string;
  bodyMaxWidth: string;
}) {
  return (
    <div className={`relative z-[2] box-border px-[clamp(26px,3vw,40px)] py-9 ${basis} ${minW}`}>
      <div className="flex items-center gap-[14px]">
        <div className="grid h-11 w-11 shrink-0 place-items-center border border-[color-mix(in_oklch,var(--sig)_45%,transparent)] text-[var(--sig)]">
          <Icon className="h-5 w-5" />
        </div>
        <Kicker index={num} label={eyebrow} />
      </div>
      <h2 className="mt-[22px] text-[clamp(21px,2vw,27px)] font-normal uppercase leading-[1.36] tracking-[0.06em] text-[oklch(0.96_0.005_247)]">
        {title}
      </h2>
      <p className={`mt-3.5 text-[15px] leading-[1.8] text-[oklch(0.67_0.02_257)] ${bodyMaxWidth}`}>
        {body}
      </p>
    </div>
  );
}

/** Visual half of a wide card — dark inset panel with a left border. */
function WideVisualPanel({
  basis,
  padding,
  children,
}: {
  basis: string;
  padding: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative z-[2] box-border flex min-w-[min(100%,240px)] items-center justify-center overflow-hidden border-l border-[oklch(1_0_0/7%)] bg-[oklch(0.1_0.02_263/55%)] ${basis} ${padding}`}
    >
      {children}
    </div>
  );
}

/** Fixed-height dark visual panel shared by cards 03 (Operations) and 04 (Sales). */
function PanelVisual({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative h-[118px] overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 40%, oklch(0.145 0.022 263), oklch(0.1 0.02 263))",
      }}
    >
      {children}
    </div>
  );
}

/** Text footer shared by the four stacked cards (02, 03, 04, 06). */
function StackCardFooter({
  padTop,
  num,
  eyebrow,
  title,
  body,
}: {
  padTop: string;
  num: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div
      className={`relative z-[2] border-t border-[oklch(1_0_0/7%)] px-[clamp(24px,2.6vw,34px)] pb-[34px] ${padTop}`}
    >
      <Kicker index={num} label={eyebrow} />
      <h2 className="mt-[18px] text-[clamp(20px,1.8vw,24px)] font-normal uppercase leading-[1.38] tracking-[0.06em] text-[oklch(0.96_0.005_247)]">
        {title}
      </h2>
      <p className="mt-[13px] text-[14.5px] leading-[1.8] text-[oklch(0.67_0.02_257)]">{body}</p>
    </div>
  );
}

/* ---------------------------- card visuals ---------------------------- */

function OutreachVisual() {
  return (
    <>
      <MiniGrid />
      <div className="relative flex w-full max-w-[300px] flex-col gap-[13px]">
        <div className="flex gap-[9px]">
          {(["Tue", "Wed"] as const).map((d) => (
            <div
              key={d}
              className="flex flex-1 flex-col items-center gap-[7px] border border-[oklch(1_0_0/10%)] bg-[oklch(0.128_0.02_262/78%)] px-[6px] py-[11px] text-[oklch(0.55_0.02_257)]"
            >
              <CloudRain className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase tracking-[0.16em]">{d}</span>
            </div>
          ))}
          <div
            className="flex flex-1 flex-col items-center gap-[7px] border border-[oklch(1_0_0/10%)] px-[6px] py-[11px] text-[var(--sig)]"
            style={{ animation: "home-lm-slot 5.2s ease-in-out infinite" }}
          >
            <Sun className="h-4 w-4" />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.16em]">Thu</span>
          </div>
        </div>
        <div className="flex justify-center text-[color-mix(in_oklch,var(--sig)_65%,transparent)]">
          <ArrowDown className="h-[15px] w-[15px]" />
        </div>
        <div
          className="flex items-center gap-[11px] border border-[color-mix(in_oklch,var(--sig)_40%,transparent)] bg-[oklch(0.128_0.02_262/85%)] px-[13px] py-3"
          style={{ animation: "home-lm-drop 5.2s ease-in-out infinite" }}
        >
          <div className="grid h-[30px] w-[30px] shrink-0 place-items-center bg-[var(--sig)] text-[oklch(0.13_0.02_260)]">
            <Send className="h-[14px] w-[14px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11.5px] font-bold text-[oklch(0.95_0.006_247)]">
              Clear Thursday — slot open
            </p>
            <p className="mt-[3px] text-[10px] text-[oklch(0.55_0.02_257)]">
              Texting nearby leads automatically
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const GROWTH_BLIPS = [
  { left: "34%", top: "30%", size: 8, delay: "0.4s" },
  { left: "70%", top: "36%", size: 7, delay: "2.1s" },
  { left: "30%", top: "64%", size: 7, delay: "3.6s" },
  { left: "68%", top: "66%", size: 8, delay: "5s" },
];

function GrowthVisual() {
  return (
    <div
      className="relative flex-1 min-h-[200px] overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 46%, oklch(0.145 0.022 263), oklch(0.1 0.02 263))",
      }}
    >
      <div
        className="absolute inset-0 opacity-50 [background-image:radial-gradient(oklch(1_0_0/12%)_1.4px,transparent_1.4px)] [background-size:26px_26px]"
        style={{
          WebkitMaskImage: "radial-gradient(circle at 50% 46%, black 40%, transparent 78%)",
          maskImage: "radial-gradient(circle at 50% 46%, black 40%, transparent 78%)",
        }}
      />
      <div className="absolute left-1/2 top-[46%] h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[color-mix(in_oklch,var(--sig)_30%,transparent)]" />
      <div
        className="absolute left-1/2 top-[46%] h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "conic-gradient(color-mix(in oklch, var(--sig) 24%, transparent), transparent 58deg)",
          animation: "home-lm-spin 6s linear infinite",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 30%, black 32%, black 96%, transparent 98%)",
          maskImage:
            "radial-gradient(circle, transparent 30%, black 32%, black 96%, transparent 98%)",
        }}
      />
      <span
        className="absolute left-1/2 top-[46%] h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--sig)]"
        style={{ animation: "home-lm-ping 3s ease-out infinite" }}
      />
      <span
        className="absolute left-1/2 top-[46%] h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--sig)]"
        style={{ animation: "home-lm-ping 3s ease-out infinite", animationDelay: "1.5s" }}
      />
      {GROWTH_BLIPS.map((b) => (
        <span
          key={b.left + b.top}
          className="absolute rounded-full bg-[var(--sig)] shadow-[0_0_10px_var(--sig)]"
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            animation: "home-lm-blip 6s linear infinite",
            animationDelay: b.delay,
          }}
        />
      ))}
      <div
        className="absolute left-1/2 top-[46%] grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center bg-[var(--sig)] text-[oklch(0.13_0.02_260)] shadow-[0_0_24px_color-mix(in_oklch,var(--sig)_60%,transparent)]"
        style={{ animation: "home-lm-float 5s ease-in-out infinite" }}
      >
        <MapPin className="h-[21px] w-[21px]" />
      </div>
    </div>
  );
}

function OperationsVisual() {
  return (
    <PanelVisual>
      <MiniGrid />
      <div className="absolute inset-0 flex flex-col justify-center gap-[6px] px-[22px]">
        <div className="flex items-center gap-[11px]">
          <span className="w-[46px] text-[9.5px] font-bold text-[oklch(0.5_0.02_257)]">2:00</span>
          <span className="block h-[18px] flex-1 border border-dashed border-[oklch(1_0_0/10%)]" />
        </div>
        <div className="flex items-stretch gap-[11px]">
          <span className="w-[46px] pt-2 text-[9.5px] font-extrabold text-[var(--sig)]">3:00</span>
          <div
            className="relative min-h-[40px] flex-1 border border-[oklch(1_0_0/10%)]"
            style={{ animation: "home-lm-slot 5s ease-in-out infinite" }}
          >
            <div
              className="flex items-center gap-[9px] px-[10px] py-[7px]"
              style={{ animation: "home-lm-drop 5s ease-in-out infinite" }}
            >
              <div className="grid h-[26px] w-[26px] shrink-0 place-items-center bg-[var(--sig)] text-[oklch(0.13_0.02_260)]">
                <CalendarCheck className="h-3 w-3" />
              </div>
              <p className="min-w-0 text-[10.5px] font-bold text-[oklch(0.95_0.006_247)]">
                Crew A — assigned
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-[11px]">
          <span className="w-[46px] text-[9.5px] font-bold text-[oklch(0.5_0.02_257)]">4:00</span>
          <span className="block h-[18px] flex-1 border border-dashed border-[oklch(1_0_0/10%)]" />
        </div>
      </div>
    </PanelVisual>
  );
}

function SalesVisual() {
  return (
    <PanelVisual>
      <MiniGrid />
      <div className="home-lm-sweep" />
      <div className="absolute left-1/2 top-1/2 w-[min(80%,240px)] -translate-x-1/2 -translate-y-1/2 border border-[oklch(1_0_0/12%)] bg-[oklch(0.128_0.02_262/82%)] px-4 py-[14px]">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[oklch(0.55_0.02_257)]">
            Quote draft
          </span>
          <span
            className="inline-flex items-center gap-[5px] border-[1.5px] border-[var(--sig)] px-2 py-[3px] text-[var(--sig)]"
            style={{ animation: "home-lm-stamp 4.6s ease-in-out infinite" }}
          >
            <Check className="h-[10px] w-[10px]" />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.14em]">Approved</span>
          </span>
        </div>
        <div className="mt-[11px] flex flex-col gap-[7px]">
          <span
            className="block h-[7px] w-[82%] origin-left"
            style={{
              background:
                "linear-gradient(90deg, var(--sig), color-mix(in oklch, var(--sig) 20%, transparent))",
              animation: "home-lm-typebar 4.6s ease-in-out infinite",
            }}
          />
          <span
            className="block h-[7px] w-[60%] origin-left bg-[oklch(1_0_0/9%)]"
            style={{
              animation: "home-lm-typebar 4.6s ease-in-out infinite",
              animationDelay: "0.25s",
            }}
          />
        </div>
      </div>
    </PanelVisual>
  );
}

function PaymentsVisual() {
  return (
    <>
      <div className="home-lm-sweep" />
      <div className="relative flex w-full flex-col gap-[13px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] text-[oklch(0.55_0.02_257)]">Collected on-site</p>
            <p
              className="mt-[3px] text-[34px] font-extrabold tracking-tight text-[oklch(0.97_0.004_247)]"
              style={{ animation: "home-lm-glow 2.8s ease-in-out infinite" }}
            >
              $1,240
            </p>
          </div>
          <span
            className="inline-flex items-center gap-[6px] border-[1.5px] border-[var(--sig)] px-[11px] py-[5px] text-[var(--sig)]"
            style={{ animation: "home-lm-stamp 4.2s ease-in-out infinite" }}
          >
            <BadgeCheck className="h-3 w-3" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">Paid</span>
          </span>
        </div>
        <div className="flex flex-col gap-[7px] border border-[oklch(1_0_0/9%)] bg-[oklch(0.128_0.02_262/70%)] px-[13px] py-[11px] text-xs">
          <div className="flex justify-between text-[oklch(0.67_0.02_257)]">
            <span>Deposit — on approval</span>
            <span>$250</span>
          </div>
          <div className="flex justify-between text-[oklch(0.67_0.02_257)]">
            <span>Balance — on completion</span>
            <span>$990</span>
          </div>
        </div>
        <div>
          <div className="mb-[6px] flex items-center justify-between text-[10px] text-[oklch(0.55_0.02_257)]">
            <span>Payout to your account</span>
            <span>2 days</span>
          </div>
          <div className="h-1 overflow-hidden bg-[oklch(1_0_0/8%)]">
            <div
              className="h-full bg-[var(--sig)]"
              style={{ animation: "home-lm-fill 4s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

const INSIGHT_BARS = [
  { height: 34, background: "oklch(1 0 0 / 12%)" },
  { height: 52, background: "oklch(1 0 0 / 14%)" },
  { height: 44, background: "oklch(1 0 0 / 14%)" },
  { height: 66, background: "color-mix(in oklch, var(--sig) 42%, transparent)" },
  { height: 56, background: "color-mix(in oklch, var(--sig) 52%, transparent)" },
  { height: 82, background: "color-mix(in oklch, var(--sig) 72%, transparent)" },
  { height: 100, background: "var(--sig)", glow: true },
];

function InsightVisual() {
  return (
    <div
      className="relative overflow-hidden px-[clamp(24px,2.6vw,34px)] pb-[22px] pt-[26px]"
      style={{
        background:
          "radial-gradient(circle at 50% 20%, oklch(0.145 0.022 263), oklch(0.1 0.02 263))",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-[10px]">
        <span className="text-[9.5px] font-extrabold uppercase tracking-[0.22em] text-[oklch(0.55_0.02_257)]">
          Revenue · this week
        </span>
        <span className="flex items-center gap-[7px] text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-[var(--sig)]">
          <span
            className="block h-[7px] w-[7px] rounded-full bg-[var(--sig)] shadow-[0_0_8px_var(--sig)]"
            style={{ animation: "home-lm-glow 1.6s ease-in-out infinite" }}
          />
          Live
        </span>
      </div>
      <div className="mt-4 flex h-[82px] items-end gap-2 border-b border-[oklch(1_0_0/14%)]">
        {INSIGHT_BARS.map((bar, i) => (
          <span
            key={i}
            className={`block flex-1 origin-bottom ${bar.glow ? "shadow-[0_0_20px_color-mix(in_oklch,var(--sig)_40%,transparent)]" : ""}`}
            style={{
              height: `${bar.height}%`,
              background: bar.background,
              animation: "home-lm-rise 1.1s cubic-bezier(0.22, 1, 0.36, 1) both",
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10.5px] font-semibold text-[oklch(0.6_0.02_257)]">
          Invoices chasing themselves
        </span>
        <span
          className="text-[22px] font-extrabold tracking-[-0.01em] text-[oklch(0.97_0.004_247)]"
          style={{ animation: "home-lm-glow 2.6s ease-in-out infinite" }}
        >
          $4,180
        </span>
      </div>
    </div>
  );
}

/* ------------------------------- page ---------------------------------- */

function FeaturesPage() {
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
        {/* ============ FEATURES HERO ============ */}
        <section className="relative overflow-hidden px-9 pb-[90px] pt-[170px]">
          <WireframeFloor
            className="bottom-[-20%] h-[60%]"
            opacity={0.1}
            rotate={64}
            mask="linear-gradient(to bottom, transparent, black 34%, transparent)"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(46% 40% at 50% 22%, oklch(0.72 0.16 158 / 8%), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-[1000px] text-center">
            <GlitchReveal variant="soft">
              <div className="inline-flex items-center gap-3.5">
                <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-[var(--sig)]">
                  Everything Vantage does
                </span>
                <span className="block h-0.5 w-[26px] bg-[var(--sig)]" />
              </div>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={90}>
              <h1
                className="mt-[26px] text-balance font-light uppercase leading-[1.18] tracking-[0.06em] text-[oklch(0.97_0.004_247)]"
                style={{ fontSize: "clamp(34px, 5.4vw, 62px)" }}
              >
                Six jobs, done for you.
                <br />
                One platform.
              </h1>
            </GlitchReveal>
            <GlitchReveal variant="soft" delay={180}>
              <p className="mx-auto mt-6 max-w-[600px] text-base leading-[1.85] text-[oklch(0.67_0.02_257)]">
                Vantage finds the work, wins it, schedules it, and collects — so you can stay on the
                tools. Here's the whole platform at a glance.
              </p>
            </GlitchReveal>
          </div>
        </section>

        {/* ============ ALL FEATURES (BENTO) ============ */}
        <section className="px-9 pb-10 pt-5">
          <div className="mx-auto grid max-w-[1280px] grid-cols-12 grid-flow-dense gap-[18px] max-[940px]:grid-cols-2 max-[560px]:grid-cols-1">
            {/* 01 Outreach — wide, forecast → text visual */}
            <GlitchReveal variant="soft" className="col-span-8 max-[940px]:col-span-2">
              <WideFeatCard corner="left" numSide="right" num="01">
                <WideCardText
                  icon={CloudRain}
                  num="01"
                  eyebrow="Outreach"
                  title="Finds you jobs before competitors see the forecast"
                  body="Vantage watches your local forecast and texts the right leads the moment a window opens — filling the slot before you've checked the weather."
                  basis="flex-[1.3_1_320px]"
                  minW="min-w-[min(100%,280px)]"
                  bodyMaxWidth="max-w-[420px]"
                />
                <WideVisualPanel basis="flex-[1_1_260px]" padding="p-7">
                  <OutreachVisual />
                </WideVisualPanel>
              </WideFeatCard>
            </GlitchReveal>

            {/* 02 Growth — tall, radar visual */}
            <GlitchReveal
              variant="soft"
              delay={90}
              className="col-span-4 row-span-2 max-[940px]:col-span-2 max-[940px]:row-span-1"
            >
              <StackFeatCard corner="right">
                <GrowthVisual />
                <StackCardFooter
                  padTop="pt-[30px]"
                  num="02"
                  eyebrow="Growth"
                  title="Turns every finished job into your next five"
                  body="Vantage markets to the neighbors around every completed job — the people who just watched you work. New leads arrive with zero outreach."
                />
              </StackFeatCard>
            </GlitchReveal>

            {/* 03 Operations — mini timeline */}
            <GlitchReveal variant="soft" delay={150} className="col-span-4 max-[940px]:col-span-2">
              <StackFeatCard>
                <OperationsVisual />
                <StackCardFooter
                  padTop="pt-[28px]"
                  num="03"
                  eyebrow="Operations"
                  title="Builds your day before you've had coffee"
                  body="Vantage lays out every job and crew on one calendar, then sends each tech their day — nobody calls asking where to be."
                />
              </StackFeatCard>
            </GlitchReveal>

            {/* 04 Sales — quote approved */}
            <GlitchReveal variant="soft" className="col-span-4 max-[940px]:col-span-2">
              <StackFeatCard>
                <SalesVisual />
                <StackCardFooter
                  padTop="pt-[28px]"
                  num="04"
                  eyebrow="Sales"
                  title="Writes the quote, sends it, and closes it"
                  body="Give Vantage a few details. It drafts the line items, sends the quote, and lands the one-tap approval. You just show up."
                />
              </StackFeatCard>
            </GlitchReveal>

            {/* 05 Payments — wide, paid card */}
            <GlitchReveal variant="soft" delay={90} className="col-span-7 max-[940px]:col-span-2">
              <WideFeatCard numSide="left" num="05">
                <WideCardText
                  icon={DollarSign}
                  num="05"
                  eyebrow="Payments"
                  title="Collects before your truck leaves the driveway"
                  body="Deposit at approval, balance the moment the job's done. Customers pay from a text — no invoicing night, no follow-up calls."
                  basis="flex-[1.15_1_300px]"
                  minW="min-w-[min(100%,260px)]"
                  bodyMaxWidth="max-w-[400px]"
                />
                <WideVisualPanel basis="flex-[1_1_250px]" padding="p-[26px]">
                  <PaymentsVisual />
                </WideVisualPanel>
              </WideFeatCard>
            </GlitchReveal>

            {/* 06 Insight — bar chart */}
            <GlitchReveal variant="soft" delay={150} className="col-span-5 max-[940px]:col-span-2">
              <StackFeatCard>
                <InsightVisual />
                <StackCardFooter
                  padTop="pt-[24px]"
                  num="06"
                  eyebrow="Insight"
                  title="Watches the money so you don't have to"
                  body="Vantage tracks revenue and profit per job, and chases late invoices on its own — the ledger stays current without a spreadsheet."
                />
              </StackFeatCard>
            </GlitchReveal>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="relative mt-[60px] overflow-hidden border-t border-[oklch(1_0_0/8%)] bg-[oklch(0.1_0.022_263)] px-9 py-[130px]">
          <WireframeFloor
            className="bottom-[-18%] h-[70%]"
            opacity={0.11}
            mask="linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)"
          />
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
            <GlitchReveal variant="soft" delay={100}>
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
