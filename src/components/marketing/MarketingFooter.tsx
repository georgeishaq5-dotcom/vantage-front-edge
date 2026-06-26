import { Link } from "@tanstack/react-router";
import { VantageLogo } from "@/components/VantageLogo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { to: "/features", label: "Features" },
      { to: "/pricing", label: "Pricing" },
      { to: "/dashboard", label: "Sign in" },
    ],
  },
  {
    title: "Company",
    links: [{ to: "/about", label: "About" }],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy-policy", label: "Privacy policy" },
      { to: "/terms-of-service", label: "Terms of service" },
      { to: "/cookie-policy", label: "Cookie policy" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-muted">
                <VantageLogo className="h-4.5 w-5.5" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-foreground">
                Vantage
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The field service platform built for the work that happens
              outdoors — quoting, dispatch, and growth that responds to the
              forecast.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Vantage. All rights reserved.</p>
          <p>Made for crews who work outside.</p>
        </div>
      </div>
    </footer>
  );
}
