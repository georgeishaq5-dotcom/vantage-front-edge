import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

export type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "vantage:theme";

/**
 * Inline script rendered in the document <head> so the correct theme class is
 * on <html> before first paint (no flash-of-wrong-theme). Scoped to the app
 * subdomain — the marketing site keeps its own fixed palette.
 */
export const THEME_INIT_SCRIPT = `(function(){try{if(!location.hostname.startsWith('app.'))return;var m=localStorage.getItem('${THEME_STORAGE_KEY}');if(m!=='light'&&m!=='dark'&&m!=='system')m='system';var dark=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function prefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") return prefersDark() ? "dark" : "light";
  return mode;
}

function applyTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Read synchronously so the very first client render already matches what the
  // head init-script applied — the provider's own markup is theme-independent,
  // so this can't cause a hydration mismatch.
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredMode()),
  );

  useEffect(() => {
    const theme = resolveTheme(mode);
    setResolvedTheme(theme);
    applyTheme(theme);

    // While on "system", track the OS preference live.
    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next: ResolvedTheme = mql.matches ? "dark" : "light";
      setResolvedTheme(next);
      applyTheme(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mode]);

  function setMode(next: ThemeMode) {
    if (typeof window !== "undefined") window.localStorage.setItem(THEME_STORAGE_KEY, next);
    setModeState(next);
  }

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

/** Delays reflecting client-only state until after mount to avoid SSR mismatch. */
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

const MODES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/** Full three-way segmented control (Light / Dark / System) for Settings. */
export function ThemeModeControl() {
  const { mode, setMode } = useTheme();
  const mounted = useMounted();
  const active = mounted ? mode : "system";

  return (
    <div className="inline-flex border border-border bg-card p-0.5">
      {MODES.map((m) => {
        const Icon = m.icon;
        const isActive = active === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            aria-pressed={isActive}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-[12px] font-bold transition-colors",
              isActive
                ? "bg-revenue text-revenue-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  light: "dark",
  dark: "system",
  system: "light",
};

/** Compact header button that cycles Light → Dark → System. */
export function ThemeToggleButton() {
  const { mode, resolvedTheme, setMode } = useTheme();
  const mounted = useMounted();
  const shownMode = mounted ? mode : "system";

  const Icon =
    shownMode === "system" ? Monitor : (mounted ? resolvedTheme : "light") === "dark" ? Moon : Sun;
  const label =
    shownMode === "system"
      ? "Theme: System"
      : shownMode === "dark"
        ? "Theme: Dark"
        : "Theme: Light";

  return (
    <button
      type="button"
      onClick={() => setMode(NEXT_MODE[shownMode])}
      aria-label={label}
      title={label}
      className="grid h-[34px] w-[34px] place-items-center border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon className="h-[15px] w-[15px]" />
    </button>
  );
}
