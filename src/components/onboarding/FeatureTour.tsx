import { useState, type ReactNode } from "react";
import { ArrowRight, Bell, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/notifications";

interface TourSlide {
  eyebrow: string;
  title: string;
  body: string;
  illustration: ReactNodeFn;
}

type ReactNodeFn = () => ReactNode;

/* ---------- Minimalist animated illustrations ---------- */

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="tour-float grid h-44 w-44 place-items-center rounded-3xl bg-brand-muted/60 text-brand shadow-sm">
      {children}
    </div>
  );
}

const QuotingArt: ReactNodeFn = () => (
  <Frame>
    <svg viewBox="0 0 96 96" className="h-24 w-24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <rect x="20" y="14" width="56" height="68" rx="8" className="opacity-30" />
      <path className="tour-draw" d="M32 36 H64 M32 50 H64 M32 64 H52" />
      <circle className="tour-pop" cx="70" cy="66" r="14" fill="currentColor" stroke="none" />
      <path d="M64 66 l5 5 l8 -10" stroke="white" strokeWidth={4} className="tour-pop" />
    </svg>
  </Frame>
);

const DispatchArt: ReactNodeFn = () => (
  <Frame>
    <svg viewBox="0 0 96 96" className="h-24 w-24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <rect x="16" y="20" width="64" height="60" rx="8" className="opacity-30" />
      <path d="M16 36 H80" />
      <rect x="26" y="46" width="12" height="12" rx="2" fill="currentColor" stroke="none" className="tour-pop" />
      <rect x="44" y="46" width="12" height="12" rx="2" fill="currentColor" stroke="none" className="tour-pop opacity-60" />
      <rect x="26" y="62" width="12" height="12" rx="2" fill="currentColor" stroke="none" className="tour-pop opacity-40" />
      <path className="tour-draw" d="M48 30 l8 8 l16 -18" />
    </svg>
  </Frame>
);

const ShieldArt: ReactNodeFn = () => (
  <Frame>
    <svg viewBox="0 0 96 96" className="h-24 w-24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M48 14 L74 24 V46 C74 64 62 76 48 82 C34 76 22 64 22 46 V24 Z" className="opacity-30" />
      <path className="tour-draw" d="M36 48 l8 9 l18 -22" />
    </svg>
  </Frame>
);

const LeadArt: ReactNodeFn = () => (
  <Frame>
    <svg viewBox="0 0 96 96" className="h-24 w-24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="48" cy="48" r="10" fill="currentColor" stroke="none" className="tour-pop" />
      <circle cx="48" cy="48" r="22" className="opacity-50" />
      <circle cx="48" cy="48" r="34" className="opacity-25" />
      <path d="M48 14 V6 M48 90 V82 M14 48 H6 M90 48 H82" />
    </svg>
  </Frame>
);

const ReputationArt: ReactNodeFn = () => (
  <Frame>
    <svg viewBox="0 0 96 96" className="h-24 w-24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
      <path className="tour-pop" d="M48 18 l8 16 l18 2 -13 13 4 18 -17 -9 -17 9 4 -18 -13 -13 18 -2 Z" fill="currentColor" stroke="none" />
      <path className="tour-draw" d="M20 80 l16 -16 12 8 16 -22" />
    </svg>
  </Frame>
);

const SLIDES: TourSlide[] = [
  {
    eyebrow: "Smart Quoting",
    title: "Win Jobs Faster.",
    body: "Build estimates in seconds with the interactive upsell menu and satellite auto-measure tools that price square and linear footage automatically.",
    illustration: QuotingArt,
  },
  {
    eyebrow: "AI Dispatch",
    title: "Smarter Scheduling.",
    body: "The heat-map calendar surfaces the best days to work, while drag-and-drop routing keeps your crews moving efficiently.",
    illustration: DispatchArt,
  },
  {
    eyebrow: "Liability Shield",
    title: "Cover Your Assets.",
    body: "AI pre-job inspections document every site, and mandatory e-signatures lock in scope before a single timer starts.",
    illustration: ShieldArt,
  },
  {
    eyebrow: "Sleep & Sell",
    title: "24/7 Lead Capture.",
    body: "An embeddable web widget and Twilio voice lead sync capture prospects around the clock — even while you sleep.",
    illustration: LeadArt,
  },
  {
    eyebrow: "Reputation Engine",
    title: "Grow Automatically.",
    body: "Automated 5-star review requests fire on paid invoices and Van re-engages stagnant quotes to keep your pipeline full.",
    illustration: ReputationArt,
  },
];

export function FeatureTour({ onFinish }: { onFinish: () => void }) {
  const { enablePush, pushEnabled } = useNotifications();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const isNotificationStep = index === SLIDES.length;
  const total = SLIDES.length + 1;

  function next() {
    setIndex((i) => Math.min(i + 1, SLIDES.length));
  }

  async function handleEnable() {
    setBusy(true);
    const ok = await enablePush();
    setBusy(false);
    if (ok) toast.success("Push notifications enabled — you're in the loop.");
    else toast.message("You can enable notifications anytime from the bell menu.");
  }

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-background">
      {/* Top bar: progress + skip */}
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-8 bg-brand" : i < index ? "w-4 bg-brand/40" : "w-4 bg-border",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onFinish}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip Tour
        </button>
      </div>

      {/* Slide stage */}
      <div className="flex flex-1 items-center justify-center px-6 pb-10">
        {isNotificationStep ? (
          <div
            key="notify"
            className="tour-slide-active flex w-full max-w-md flex-col items-center text-center"
          >
            <div className="tour-pop mb-8 grid h-24 w-24 place-items-center rounded-3xl bg-brand text-brand-foreground shadow-md">
              <Bell className="h-11 w-11" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Stay in the loop.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Enable notifications for critical updates — new leads, approved quotes, job status
              changes, and customer messages.
            </p>
            <Button
              variant="brand"
              size="lg"
              disabled={busy || pushEnabled}
              onClick={handleEnable}
              className="mt-10 h-14 w-full max-w-sm text-base"
            >
              {pushEnabled ? (
                <>
                  <Check className="h-5 w-5" /> Notifications Enabled
                </>
              ) : (
                <>
                  <Bell className="h-5 w-5" /> Enable Push Notifications
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={onFinish}
              className="mt-6 text-sm font-semibold text-brand transition-colors hover:text-brand/80"
            >
              Enter Vantage <ArrowRight className="ml-1 inline h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            key={index}
            className="tour-slide-active flex w-full max-w-md flex-col items-center text-center"
          >
            <div className="mb-10">{SLIDES[index].illustration()}</div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
              {SLIDES[index].eyebrow}
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {SLIDES[index].title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {SLIDES[index].body}
            </p>
            <Button variant="brand" size="lg" onClick={next} className="mt-10 h-12 w-full max-w-xs">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
