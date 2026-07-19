import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { OnboardingGate } from "@/components/OnboardingGate";
import { friendlyAuthError, isUnconfirmedEmailError } from "@/lib/auth-errors";
import vantageLogo from "@/assets/vantage-logo.png";

// Apple sign-in is hidden until Apple is configured as a native Supabase
// provider (Services ID + client-secret JWT). Flip to true to re-enable.
const APPLE_SIGN_IN_ENABLED = false;

// The path the user was trying to reach before AuthGate intercepted them,
// so we can send them back there (instead of always to "/") after sign-in.
const REDIRECT_STORAGE_KEY = "vantage:post-auth-redirect";
// The last email used to sign in, so returning users don't have to retype it.
const LAST_EMAIL_STORAGE_KEY = "vantage:last-email";

export function AuthGate({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const wasSignedOut = useRef(true);

  useEffect(() => {
    // Capture the intended destination the first time we see there's no
    // session, before AuthScreen takes over the page.
    if (!session && typeof window !== "undefined") {
      const path = window.location.pathname + window.location.search;
      if (path && path !== "/") sessionStorage.setItem(REDIRECT_STORAGE_KEY, path);
    }
  }, [session]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
        else queryClient.clear();
      }
      if (event === "SIGNED_IN" && wasSignedOut.current) {
        wasSignedOut.current = false;
        const redirectTo = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
        if (redirectTo) {
          sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
          if (redirectTo !== window.location.pathname + window.location.search) {
            router.navigate({ href: redirectTo });
          }
        }
      }
      if (event === "SIGNED_OUT") wasSignedOut.current = true;
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      wasSignedOut.current = !data.session;
      setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, [queryClient, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return (
    <>
      {children}
      <OnboardingGate />
    </>
  );
}

function passwordStrength(password: string): {
  label: string;
  score: 0 | 1 | 2 | 3;
  className: string;
} {
  if (!password) return { label: "", score: 0, className: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

  if (password.length < 6 || score <= 1)
    return { label: "Weak", score: 1, className: "bg-destructive" };
  if (score === 2) return { label: "Okay", score: 2, className: "bg-amber-500" };
  return { label: "Strong", score: 3, className: "bg-emerald-500" };
}

const FIELD_LABEL =
  "block text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground";
const FIELD_INPUT =
  "h-[42px] w-full border border-border bg-background px-3 text-[13.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand";

function TextField({
  id,
  label,
  ...props
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className={`mb-1.5 ${FIELD_LABEL}`}>
        {label}
      </label>
      <input id={id} className={FIELD_INPUT} {...props} />
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder = "••••••••",
  strengthMeter,
  rightLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  strengthMeter?: boolean;
  rightLabel?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const strength = strengthMeter ? passwordStrength(value) : null;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={FIELD_LABEL}>
          {label}
        </label>
        {rightLabel}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          minLength={6}
          autoComplete={autoComplete}
          required
          className={`${FIELD_INPUT} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {strength && value.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex h-1 gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-full flex-1 transition-colors ${
                  i < strength.score ? strength.className : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-[10.5px] text-muted-foreground">Password strength: {strength.label}</p>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.7 4.2-16.9 10.3z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.4 26.9 36.3 24 36.3c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.1 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.6 5.6C39.9 37.4 44 31.5 44 24c0-1.3-.1-2.7-.4-3.9z"
      />
    </svg>
  );
}

/** Dark submit button with an accent bar down the left edge (canonical design). */
function BarButton({
  bar,
  loading,
  children,
  ...props
}: { bar: string; loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="flex h-11 w-full items-stretch bg-foreground text-background transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={`w-1 shrink-0 ${bar}`} />
      <span className="flex flex-1 items-center justify-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em]">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </span>
    </button>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
        Or
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

type Mode = "signin" | "signup" | "forgot";
type BusyAction = "email" | "google" | "apple" | "resend" | null;

function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [showResend, setShowResend] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    const lastEmail = localStorage.getItem(LAST_EMAIL_STORAGE_KEY);
    if (lastEmail) setEmail(lastEmail);
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setShowResend(false);
    setForgotSent(false);
    setPassword("");
    setConfirmPassword("");
    setAgreed(false);
  }

  function normalizedEmail() {
    return email.trim().toLowerCase();
  }

  /** Persist (or clear) the remembered email based on the Remember-me choice. */
  function rememberEmail(normalized: string) {
    if (rememberMe) localStorage.setItem(LAST_EMAIL_STORAGE_KEY, normalized);
    else localStorage.removeItem(LAST_EMAIL_STORAGE_KEY);
  }

  async function handleResend() {
    setBusy("resend");
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: normalizedEmail() });
      if (error) throw error;
      toast.success("Confirmation email resent — check your inbox.");
      setShowResend(false);
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setShowResend(false);

    if (mode === "signup") {
      if (password !== confirmPassword) {
        toast.error("Passwords don't match.");
        return;
      }
      if (!agreed) {
        toast.error("Please agree to the Terms of Service and Privacy Policy.");
        return;
      }
    }

    setBusy("email");
    const normalized = normalizedEmail();
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: normalized,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim(), company_name: companyName.trim() },
          },
        });
        if (error) throw error;
        rememberEmail(normalized);
        toast.success("Workspace created — check your email to confirm and sign in.");
        switchMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalized, password });
        if (error) throw error;
        rememberEmail(normalized);
      }
    } catch (err) {
      toast.error(friendlyAuthError(err));
      if (mode === "signin" && isUnconfirmedEmailError(err)) setShowResend(true);
    } finally {
      setBusy(null);
    }
  }

  async function handleGoogle() {
    setBusy("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error(friendlyAuthError(error) || "Google sign-in failed");
      setBusy(null);
      return;
    }
    // Supabase redirects the page itself on success; no further action needed here.
  }

  async function handleApple() {
    setBusy("apple");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error(friendlyAuthError(error) || "Apple sign-in failed");
      setBusy(null);
      return;
    }
    // Supabase redirects the page itself on success; no further action needed here.
  }

  const maxW = mode === "signup" ? "max-w-[420px]" : "max-w-[380px]";
  const subLabel = mode === "signup" ? "Create your account" : "Sign in to Vantage";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className={`mx-auto flex w-full flex-col gap-5 ${maxW}`}>
        <div className="flex flex-col items-center gap-3">
          <img src={vantageLogo} alt="Vantage" className="h-[26px] w-auto object-contain" />
          <p className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground">
            {subLabel}
          </p>
        </div>

        {mode === "forgot" ? (
          <div className="flex flex-col gap-4 border border-border bg-card p-[26px]">
            <div>
              <p className="text-[14px] font-extrabold text-foreground">Reset your password</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                {forgotSent
                  ? "Check your email for a link to set a new password."
                  : "Enter the email on your account and we'll send a link to reset your password."}
              </p>
            </div>

            {forgotSent ? (
              <p className="border border-revenue/35 bg-revenue/[0.08] px-3 py-3 text-[12.5px] font-bold text-revenue">
                ✓ Reset link sent — check your email.
              </p>
            ) : (
              <form onSubmit={handleForgot} className="flex flex-col gap-4">
                <TextField
                  id="forgot-email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  autoFocus
                  required
                />
                <BarButton
                  type="submit"
                  bar="bg-brand"
                  loading={busy === "email"}
                  disabled={busy !== null}
                >
                  Send Reset Link
                </BarButton>
              </form>
            )}

            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="text-center text-[12px] font-bold text-brand transition-colors hover:text-brand/80"
            >
              ← Back to sign in
            </button>
          </div>
        ) : (
          <>
            <form
              onSubmit={handleEmail}
              className="flex flex-col gap-4 border border-border bg-card p-[26px]"
            >
              {mode === "signup" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    id="full-name"
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jordan Reyes"
                    autoComplete="name"
                    autoFocus
                    required
                  />
                  <TextField
                    id="company"
                    label="Business Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Reyes Exterior Co."
                    autoComplete="organization"
                    required
                  />
                </div>
              )}

              <TextField
                id="email"
                label={mode === "signup" ? "Work Email" : "Email"}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus={mode === "signin"}
                required
              />

              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder={mode === "signup" ? "Create a password" : "••••••••"}
                strengthMeter={mode === "signup"}
                rightLabel={
                  mode === "signin" ? (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-[11px] font-bold text-brand transition-colors hover:text-brand/80"
                    >
                      Forgot password?
                    </button>
                  ) : undefined
                }
              />

              {mode === "signup" && (
                <PasswordField
                  id="confirm-password"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                />
              )}

              {mode === "signin" && (
                <label className="flex cursor-pointer items-center gap-2.5 text-[12px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-[15px] w-[15px] accent-[oklch(0.66_0.16_158)]"
                  />
                  Remember me
                </label>
              )}

              {mode === "signup" && (
                <label className="flex cursor-pointer items-start gap-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-[15px] w-[15px] shrink-0 accent-[oklch(0.66_0.16_158)]"
                  />
                  <span>
                    I agree to the{" "}
                    <Link to="/terms-of-service" className="font-bold text-brand hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy-policy" className="font-bold text-brand hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              )}

              {showResend && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={busy === "resend"}
                  className="flex w-full items-center justify-center gap-1.5 border border-border bg-muted/50 px-3 py-2 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
                >
                  {busy === "resend" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Resend confirmation email
                </button>
              )}

              <BarButton
                type="submit"
                bar={mode === "signup" ? "bg-revenue" : "bg-brand"}
                loading={busy === "email"}
                disabled={busy !== null}
              >
                {mode === "signup" ? "Create Account" : "Sign In"}
              </BarButton>

              <OrDivider />

              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy !== null}
                className="flex h-11 w-full items-center justify-center gap-2.5 border border-border bg-card text-[12.5px] font-bold text-foreground transition-colors hover:border-foreground/30 disabled:opacity-60"
              >
                {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </button>

              {/* Apple Sign In — hidden behind APPLE_SIGN_IN_ENABLED until Apple
                  is configured as a native Supabase provider. */}
              {APPLE_SIGN_IN_ENABLED && (
                <button
                  type="button"
                  onClick={handleApple}
                  disabled={busy !== null}
                  aria-label="Continue with Apple"
                  className="flex h-11 w-full items-center justify-center gap-2 bg-black px-4 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
                >
                  {busy === "apple" ? (
                    <Loader2 className="h-[18px] w-[18px] animate-spin" />
                  ) : (
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                      className="h-[18px] w-[18px] fill-current"
                    >
                      <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.984 1.34 1.667 1.659 1.899.319.232 1.219.386 1.843.067.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758.347-.79.505-1.217.473-1.282z" />
                    </svg>
                  )}
                  Continue with Apple
                </button>
              )}
            </form>

            <p className="text-center text-[12.5px] text-muted-foreground">
              {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
                className="font-bold text-brand transition-colors hover:text-brand/80"
              >
                {mode === "signup" ? "Sign in" : "Create one"}
              </button>
            </p>

            <p className="border border-border bg-muted/40 px-3 py-3 text-center text-[11.5px] leading-relaxed text-muted-foreground">
              Joining an existing company is invite-only — ask your workspace admin to send an
              invite from the My Team page.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
