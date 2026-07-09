import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-in reveal for the Home page's "signal glitch" identity — a brief
 * RGB-channel-split distortion that resolves into focus, fired once per
 * element the first time it enters the viewport. `text` is the punchier cut
 * used on headlines; `soft` is the gentler version for everything else.
 * Elements already in view on mount render statically (no flash on load).
 */
export function GlitchReveal({
  children,
  variant = "soft",
  delay = 0,
  className,
}: {
  children: ReactNode;
  variant?: "text" | "soft";
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"static" | "pre" | "run">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.92) setPhase("pre");
    else return;

    let timeout: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timeout = setTimeout(() => setPhase("run"), delay);
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        phase === "pre" && "home-glx-pre",
        phase === "run" && (variant === "text" ? "home-glx-run-text" : "home-glx-run-soft"),
        className,
      )}
    >
      {children}
    </div>
  );
}
