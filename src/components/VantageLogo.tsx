import { cn } from "@/lib/utils";
import vantageLogo from "@/assets/vantage-logo.png";

/**
 * Vantage brand mark — the official "V" logo image. Sizing is controlled via
 * the `className` (e.g. `h-7 w-9`); the image is contained and sits on a
 * transparent background so it works on both light and dark surfaces.
 */
export function VantageLogo({ className }: { className?: string }) {
  return (
    <img
      src={vantageLogo}
      alt="Vantage logo"
      className={cn("bg-transparent object-contain", className)}
    />
  );
}
