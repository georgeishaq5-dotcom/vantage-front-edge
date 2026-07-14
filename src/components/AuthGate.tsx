import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingGate } from "@/components/OnboardingGate";
import { VantageLogo } from "@/components/VantageLogo";
import { friendlyAuthError, isUnconfirmedEmailError } from "@/lib/auth-errors";

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

function passwordStrength(password: string): { label: string; score: 0 | 1 | 2 | 3; className: string } {
  if (!password) return { label: "", score: 0, className: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

  if (password.length < 6 || score <= 1) return { label: "Weak", score: 1, className: "bg-destructive" };
  if (score === 2) return { label: "Okay", score: 2, className: "bg-amber-500" };
  return { label: "Strong", score: 3, className: "bg-emerald-500" };
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder = "••••••••",
  strengthMeter,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  strengthMeter?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const strength = strengthMeter ? passwordStrength(value) : null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          minLength={6}
          autoComplete={autoComplete}
          required
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {strength && value.length > 0 && (
        <div className="space-y-1">
          <div className="flex h-1 gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-full flex-1 rounded-full transition-colors ${
                  i < strength.score ? strength.className : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Password strength: {strength.label}</p>
        </div>
      )}
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
  const [companyName, setCompanyName] = useState("");
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

  function normalizedEmail() {
    return email.trim().toLowerCase();
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

    if (mode === "signup" && password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
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
            data: { company_name: companyName.trim() },
          },
        });
        if (error) throw error;
        localStorage.setItem(LAST_EMAIL_STORAGE_KEY, normalized);
        toast.success("Workspace created — check your email to confirm and sign in.");
        switchMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalized, password });
        if (error) throw error;
        localStorage.setItem(LAST_EMAIL_STORAGE_KEY, normalized);
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

  if (mode === "forgot") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar px-4">
        <div className="w-full max-w-sm rounded-2xl border border-sidebar-border bg-card p-8 shadow-2xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-muted">
              <VantageLogo className="h-6 w-8" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {forgotSent
                ? "Check your email for a reset link."
                : "We'll email you a link to set a new password."}
            </p>
          </div>

          {forgotSent ? (
            <Button variant="outline" className="w-full" onClick={() => switchMode("signin")}>
              Back to sign in
            </Button>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" variant="revenue" className="w-full" disabled={busy === "email"}>
                {busy === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="block w-full text-center text-sm font-semibold text-brand transition-colors hover:text-brand/80"
              >
                Back to sign in
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <div className="w-full max-w-sm rounded-2xl border border-sidebar-border bg-card p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-muted">
            <VantageLogo className="h-6 w-8" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Vantage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Create your company workspace"
              : "Sign in to your workspace"}
          </p>
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="company">Company name</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Field Services"
                autoComplete="organization"
                autoFocus
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus={mode === "signin"}
              required
            />
          </div>
          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            strengthMeter={mode === "signup"}
          />
          {mode === "signup" && (
            <PasswordField
              id="confirm-password"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
          )}

          {mode === "signin" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-xs font-medium text-brand transition-colors hover:text-brand/80"
              >
                Forgot password?
              </button>
            </div>
          )}

          {showResend && (
            <button
              type="button"
              onClick={handleResend}
              disabled={busy === "resend"}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
            >
              {busy === "resend" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Resend confirmation email
            </button>
          )}

          <Button type="submit" variant="revenue" className="w-full" disabled={busy !== null}>
            {busy === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create workspace" : "Sign in"}
          </Button>

          {mode === "signup" && (
            <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link to="/terms-of-service" className="font-medium text-brand hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy-policy" className="font-medium text-brand hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          )}
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          OR
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy !== null}>
          {busy === "google" && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue with Google
        </Button>

        {/* Apple Sign In — styled per Apple Human Interface Guidelines.
            Hidden behind APPLE_SIGN_IN_ENABLED until Apple is set up natively. */}
        {APPLE_SIGN_IN_ENABLED && (
          <button
            type="button"
            onClick={handleApple}
            disabled={busy !== null}
            aria-label="Continue with Apple"
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-black px-4 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
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

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have a workspace?" : "Need a new workspace?"}{" "}
          <button
            type="button"
            onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
            className="font-semibold text-brand transition-colors hover:text-brand/80"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>

        <p className="mt-4 rounded-lg border border-border bg-secondary/40 px-3 py-3 text-center text-xs text-muted-foreground">
          Joining an existing company is invite-only — ask your workspace admin to
          send an invite from the My Team page.
        </p>
      </div>
    </div>
  );
}
