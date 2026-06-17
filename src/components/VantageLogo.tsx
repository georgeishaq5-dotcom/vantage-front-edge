import { cn } from "@/lib/utils";

/**
 * Vantage brand mark — a sleek, sharp "V" whose right arm extends into an
 * upward trend line with an arrowhead. Inherits the brand accent via the
 * `text-brand` color on the wrapping element (uses currentColor).
 */
export function VantageLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 32"
      className={cn("text-brand", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* The V + ascending trend line */}
      <path d="M4 7 L16 27 L25 11 L32 15 L40 4" />
      {/* Arrowhead capping the trend line */}
      <path d="M33 4 L40 4 L40 11" />
    </svg>
  );
}
