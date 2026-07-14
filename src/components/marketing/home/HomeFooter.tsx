import { Link } from "@tanstack/react-router";
import { VantageLogo } from "@/components/VantageLogo";
import { AppLink } from "@/components/marketing/AppLink";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { to: "/features", label: "Features", external: false },
      { to: "/pricing", label: "Pricing", external: false },
      { to: "/blog", label: "Blog", external: false },
      { to: "/dashboard", label: "Sign in", external: true },
    ],
  },
  {
    title: "Company",
    links: [{ to: "/about", label: "About", external: false }],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy-policy", label: "Privacy policy", external: false },
      { to: "/terms-of-service", label: "Terms of service", external: false },
      { to: "/cookie-policy", label: "Cookie policy", external: false },
    ],
  },
];

const footerLinkClass =
  "text-[13px] text-[oklch(0.67_0.02_257)] transition-colors hover:text-[oklch(0.95_0.006_247)]";

export function HomeFooter() {
  return (
    <footer className="border-t border-[oklch(1_0_0/8%)] bg-[oklch(0.113_0.02_263)]">
      <div className="mx-auto max-w-[1280px] px-9 pb-10 pt-[72px]">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <VantageLogo className="h-[22px] w-auto" />
              <span className="text-[13px] font-extrabold uppercase tracking-[0.26em] text-[oklch(0.95_0.006_247)]">
                Vantage
              </span>
            </div>
            <p className="mt-4 max-w-[300px] text-[13px] leading-[1.85] text-[oklch(0.55_0.02_257)]">
              The field service platform built for the work that happens outdoors — quoting,
              dispatch, and growth that responds to the forecast.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-[var(--sig)]">
                {col.title}
              </h3>
              <ul className="mt-5 flex flex-col gap-3.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <AppLink to={link.to} className={footerLinkClass}>
                        {link.label}
                      </AppLink>
                    ) : (
                      <Link to={link.to} className={footerLinkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-2.5 border-t border-[oklch(1_0_0/8%)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] tracking-wide text-[oklch(0.5_0.02_257)]">
            © {new Date().getFullYear()} Vantage. All rights reserved.
          </p>
          <p className="text-[11px] uppercase tracking-wider text-[oklch(0.5_0.02_257)]">
            Made for crews who work outside.
          </p>
        </div>
      </div>
    </footer>
  );
}
