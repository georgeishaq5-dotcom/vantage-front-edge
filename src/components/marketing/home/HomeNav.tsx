import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

import { VantageLogo } from "@/components/VantageLogo";
import { AppLink } from "@/components/marketing/AppLink";
import { supabase } from "@/integrations/supabase/client";

const LINKS = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

const navLinkClass =
  "text-[11px] font-bold uppercase tracking-[0.28em] text-[oklch(0.67_0.02_257)] transition-colors hover:text-[oklch(0.95_0.006_247)]";

export function HomeNav() {
  const [open, setOpen] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[oklch(1_0_0/8%)] bg-[oklch(0.128_0.02_262/82%)] backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-9">
        <Link to="/" className="flex items-center gap-3 transition-transform active:scale-[0.97]">
          <VantageLogo className="h-[26px] w-auto" />
          <span className="text-sm font-extrabold uppercase tracking-[0.26em] text-[oklch(0.95_0.006_247)]">
            Vantage
          </span>
        </Link>

        <nav className="hidden items-center gap-11 md:flex">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-8 md:flex">
          {hasSession ? (
            <AppLink
              to="/dashboard"
              className="inline-flex items-stretch bg-[oklch(0.97_0.004_247)] text-[oklch(0.14_0.02_260)] transition-transform active:scale-[0.97]"
            >
              <span className="block w-1 bg-[var(--sig)]" />
              <span className="flex items-center px-[22px] text-[10px] font-extrabold uppercase tracking-[0.3em]">
                Go to dashboard
              </span>
            </AppLink>
          ) : (
            <>
              <AppLink to="/dashboard" className={navLinkClass}>
                Sign in
              </AppLink>
              <AppLink
                to="/dashboard"
                className="inline-flex h-[42px] items-stretch bg-[oklch(0.97_0.004_247)] text-[oklch(0.14_0.02_260)] transition-transform active:scale-[0.97]"
              >
                <span className="block w-1 bg-[var(--sig)]" />
                <span className="flex items-center px-[22px] text-[10px] font-extrabold uppercase tracking-[0.3em]">
                  Get started free
                </span>
              </AppLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center text-[oklch(0.95_0.006_247)] md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[oklch(1_0_0/8%)] bg-[oklch(0.128_0.02_262)] px-6 pb-6 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[oklch(0.85_0.01_257)]"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-3">
              <AppLink
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="text-[11px] font-bold uppercase tracking-[0.28em] text-[oklch(0.85_0.01_257)]"
              >
                Sign in
              </AppLink>
              <AppLink
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-stretch self-start bg-[oklch(0.97_0.004_247)] text-[oklch(0.14_0.02_260)]"
              >
                <span className="block w-1 bg-[var(--sig)]" />
                <span className="flex items-center px-5 text-[10px] font-extrabold uppercase tracking-[0.3em]">
                  Get started free
                </span>
              </AppLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
