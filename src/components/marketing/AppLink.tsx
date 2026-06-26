import { forwardRef, type AnchorHTMLAttributes } from "react";

/**
 * A link from the marketing site into the product (app.vantage-fsm.com).
 * This must be a real <a> tag, not a router <Link> — the app lives on a
 * different hostname, so the client-side router can't navigate there.
 *
 * `to` is a path on the app subdomain, e.g. "/dashboard".
 */
export const AppLink = forwardRef<
  HTMLAnchorElement,
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string }
>(function AppLink({ to, ...props }, ref) {
  // Resolve relative to the current hostname so this works correctly on
  // localhost/previews as well as the real app.vantage-fsm.com setup.
  const href =
    typeof window !== "undefined"
      ? (() => {
          const bareHost = window.location.hostname.replace(/^app\./, "");
          return `${window.location.protocol}//app.${bareHost}${to}`;
        })()
      : to;

  return <a ref={ref} href={href} {...props} />;
});
