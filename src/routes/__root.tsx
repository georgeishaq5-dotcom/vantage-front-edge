import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  redirect,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { AuthGate } from "@/components/AuthGate";
import { VanChatProvider } from "@/components/VanChat";
import { AiConsentProvider } from "@/components/AiConsentGate";
import { FeatureGateProvider } from "@/components/FeatureGate";
import { NotificationsProvider } from "@/lib/notifications";
import { isAppHost, resolveHostContext, toAppUrl } from "@/lib/site-host";
import { HeaderBar } from "@/components/HeaderBar";
import { TermsUpdateModal } from "@/components/TermsUpdateModal";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-4 md:mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-4 md:mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

// Paths that belong to the public marketing site. Everything else is part
// of the product and should only ever be served from app.vantage-fsm.com.
const MARKETING_PATHS = new Set(["/", "/features", "/pricing", "/about"]);

// The blog (/blog, /blog/$slug, ...) is also marketing-only, but its
// dynamic slug segment can't be listed in the exact-match Set above.
function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATHS.has(pathname) || pathname === "/blog" || pathname.startsWith("/blog/");
}

// Server/infrastructure routes that must work identically on every
// hostname and should never be redirected (API endpoints, sitemap, etc).
function isInfrastructureRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/lovable/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/email/unsubscribe" ||
    pathname === "/unsubscribe"
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ location }) => {
    if (isInfrastructureRoute(location.pathname)) return;

    const ctx = await resolveHostContext();
    if (!ctx) return;

    const onAppHost = isAppHost(ctx.hostname);
    const isMarketing = isMarketingPath(location.pathname);

    if (onAppHost && isMarketing) {
      // The product's host should never render the marketing pages.
      throw redirect({ href: toAppUrl("/dashboard", ctx) });
    }

    if (!onAppHost && !isMarketing) {
      // Any app screen (dashboard, jobs, customers, etc.) reached on the
      // plain marketing domain belongs on the app subdomain instead.
      throw redirect({ href: toAppUrl(location.href, ctx) });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Vantage: Field Service Manager" },
      {
        name: "description",
        content:
          "Vantage is the all-in-one field service platform for quoting, dispatch, and automated growth.",
      },
      { name: "author", content: "Vantage" },
      { property: "og:title", content: "Vantage: Field Service Manager" },
      {
        property: "og:description",
        content:
          "Vantage is the all-in-one field service platform for quoting, dispatch, and automated growth.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Vantage" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Vantage" },
      { name: "theme-color", content: "#1e4fff" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/NMavsWjQPtYXu3wCmGZEAE594wI3/social-images/social-1781798128397-ChatGPT_Image_Jun_18,_2026,_11_33_55_AM.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/NMavsWjQPtYXu3wCmGZEAE594wI3/social-images/social-1781798128397-ChatGPT_Image_Jun_18,_2026,_11_33_55_AM.webp" },
      { name: "twitter:title", content: "Vantage: Field Service Manager" },
      { name: "twitter:description", content: "Vantage is the all-in-one field service platform for quoting, dispatch, and automated growth." },
      { name: "google-site-verification", content: "y6X7f2siEE2wTWBOVGGH61wnTv6FdkxhqN1TBZzl51I" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", href: "/icon-192.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Vantage",
              url: "https://vantage-fsm.com",
              description:
                "Vantage is the all-in-one field service platform for quoting, dispatch, and automated growth.",
            },
            {
              "@type": "WebSite",
              name: "Vantage: Field Service Manager",
              url: "https://vantage-fsm.com",
              description:
                "Vantage is the all-in-one field service platform for quoting, dispatch, and automated growth.",
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  const isMarketingRoute = isMarketingPath(location.pathname);
  const isPublicRoute = location.pathname === "/unsubscribe";

  // The marketing site (home, features, pricing, about) is public and has
  // its own nav/footer per-page — it must never be wrapped in AuthGate,
  // the app sidebar, or any of the app-only providers below. The unsubscribe
  // page is also public so email recipients can opt out without signing in.
  if (isMarketingRoute || isPublicRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>
        <AuthGate>
          <AiConsentProvider>
          <FeatureGateProvider>
          <VanChatProvider>
            <div className="flex min-h-screen w-full bg-background">
              <AppSidebar />
              <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
                <HeaderBar />
                {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                <Outlet />
              </main>
              <BottomNav />
              <TermsUpdateModal />
            </div>
          </VanChatProvider>
          </FeatureGateProvider>
          </AiConsentProvider>
        </AuthGate>
        <Toaster richColors position="top-right" />
      </NotificationsProvider>
    </QueryClientProvider>
  );
}
