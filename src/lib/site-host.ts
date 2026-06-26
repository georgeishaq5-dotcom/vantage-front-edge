import { createIsomorphicFn } from "@tanstack/react-start";

/**
 * Vantage is served from two hostnames on the same codebase:
 *   - vantage-fsm.com (and www.)  -> public marketing site
 *   - app.vantage-fsm.com         -> the actual product (dashboard, jobs, etc.)
 *
 * These helpers let route `beforeLoad` hooks redirect a visitor to the right
 * "side" of the site based on which hostname they're on. They work both
 * during SSR (the very first request) and during client-side navigation.
 *
 * `createIsomorphicFn` is used (rather than a guarded dynamic import) so the
 * server-only `@tanstack/react-start/server` import is stripped from the
 * client bundle entirely at build time, instead of just being skipped at
 * runtime — TanStack Start's import-protection plugin rejects any client
 * chunk that references that module at all, even behind a typeof check.
 */

const APP_SUBDOMAIN = "app.";

export function isAppHost(hostname: string): boolean {
  return hostname.startsWith(APP_SUBDOMAIN);
}

export type HostContext = {
  hostname: string;
  protocol: "http:" | "https:";
};

const getHostContext = createIsomorphicFn()
  .server(async (): Promise<HostContext> => {
    const { getRequestHost, getRequestProtocol } = await import(
      "@tanstack/react-start/server"
    );
    return {
      hostname: getRequestHost(),
      protocol: `${getRequestProtocol()}:` as "http:" | "https:",
    };
  })
  .client((): HostContext => ({
    hostname: window.location.hostname,
    protocol: window.location.protocol as "http:" | "https:",
  }));

/** Resolve the current hostname + protocol on the server (SSR) or in the browser. */
export async function resolveHostContext(): Promise<HostContext | null> {
  try {
    return await getHostContext();
  } catch {
    // Not in a request context (e.g. static analysis) — treat as unknown.
    return null;
  }
}

function bareHostFrom(hostname: string): string {
  return hostname.replace(/^app\./, "");
}

/** Build the app-subdomain URL for a given path, given the current host context. */
export function toAppUrl(path: string, ctx: HostContext): string {
  const bareHost = bareHostFrom(ctx.hostname);
  return `${ctx.protocol}//${APP_SUBDOMAIN}${bareHost}${path}`;
}

/** Build the marketing-domain URL for a given path, given the current host context. */
export function toMarketingUrl(path: string, ctx: HostContext): string {
  const bareHost = bareHostFrom(ctx.hostname);
  return `${ctx.protocol}//${bareHost}${path}`;
}
