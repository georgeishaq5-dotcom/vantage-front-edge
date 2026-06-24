import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Bump this version string whenever the legal terms are updated. Users who have
 * not yet accepted the current version will be shown the modal on next load.
 */
const CURRENT_TERMS_VERSION = "2026-06-24";
const STORAGE_KEY = "vantage.terms.acceptedVersion";

export function TermsUpdateModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const accepted = window.localStorage.getItem(STORAGE_KEY);
      if (accepted !== CURRENT_TERMS_VERSION) setOpen(true);
    } catch {
      // localStorage unavailable — fail silently, don't block the app.
    }
  }, []);

  const handleAgree = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, CURRENT_TERMS_VERSION);
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-update-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-revenue-muted text-revenue">
          <FileText className="h-6 w-6" />
        </div>
        <h2
          id="terms-update-title"
          className="mt-4 text-xl font-bold tracking-tight text-foreground"
        >
          Our Terms Have Updated
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We&apos;ve made changes to our legal policies, including our{" "}
          <Link
            to="/terms-of-service"
            className="font-medium text-brand hover:underline"
          >
            Terms of Service
          </Link>
          ,{" "}
          <Link to="/privacy-policy" className="font-medium text-brand hover:underline">
            Privacy Policy
          </Link>
          , and{" "}
          <Link to="/cookie-policy" className="font-medium text-brand hover:underline">
            Cookie Policy
          </Link>
          . Please review and accept the updated terms to continue using Vantage.
        </p>
        <Button
          variant="revenue"
          className="mt-6 w-full"
          onClick={handleAgree}
        >
          I Agree
        </Button>
      </div>
    </div>
  );
}
