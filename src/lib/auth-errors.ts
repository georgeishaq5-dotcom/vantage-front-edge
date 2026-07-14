// Maps common Supabase Auth error messages to friendlier, actionable copy.
// Supabase doesn't expose stable error codes for all cases, so this matches
// on the (English) message text it currently returns.
export function friendlyAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "Authentication failed");
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

  return raw || "Something went wrong. Please try again.";
}

export function isUnconfirmedEmailError(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  return raw.toLowerCase().includes("email not confirmed");
}
