// Pulls a human-readable message out of whatever shape an auth failure
// takes. Supabase errors are normally Error instances, but a raw fetch/
// parsing failure can surface as a plain object (or one whose .message is
// blank) — in either case we fall back to something other than "[object
// Object]" or an empty string so the toast is never blank or unreadable.
function extractMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  if (err && typeof err === "object") {
    const withMessage = err as { message?: unknown; error_description?: unknown; msg?: unknown };
    const candidate = withMessage.message ?? withMessage.error_description ?? withMessage.msg;
    if (typeof candidate === "string" && candidate) return candidate;
    // Nothing usable on the object — surface its shape instead of "" or
    // "[object Object]" so there's at least something to search logs for.
    try {
      const json = JSON.stringify(err);
      if (json && json !== "{}") return json;
    } catch {
      // ignore — fall through to the generic fallback below
    }
  }
  return "";
}

// Maps common Supabase Auth error messages to friendlier, actionable copy.
// Supabase doesn't expose stable error codes for all cases, so this matches
// on the (English) message text it currently returns.
export function friendlyAuthError(err: unknown): string {
  // Log the raw error so it's inspectable in the browser console — the
  // toast text alone (especially the generic fallback) isn't enough to
  // diagnose an unexpected failure shape.
  console.error("[auth]", err);

  const raw = extractMessage(err);
  const message = raw.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "That email or password isn't right. Double-check and try again.";
  }
  if (message.includes("email not confirmed")) {
    return "Please confirm your email before signing in — check your inbox for the verification link.";
  }
  if (message.includes("user already registered") || message.includes("already been registered")) {
    return "An account with that email already exists — try signing in instead.";
  }
  if (message.includes("password should be at least")) {
    return "Password must be at least 6 characters.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts — please wait a minute and try again.";
  }
  if (message.includes("network")) {
    return "Network error — check your connection and try again.";
  }

  return raw || "Something went wrong — please try again in a moment.";
}

export function isUnconfirmedEmailError(err: unknown): boolean {
  return extractMessage(err).toLowerCase().includes("email not confirmed");
}
