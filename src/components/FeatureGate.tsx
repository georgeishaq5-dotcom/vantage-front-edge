import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { useEntitlements } from "@/hooks/useEntitlements";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import type { PremiumFeature } from "@/lib/entitlements";

type FeatureGateContextValue = {
  /** True when the workspace currently has Pro access. */
  pro: boolean;
  subscribed: boolean;
  trialRemaining: number;
  isLoading: boolean;
  /**
   * Returns true if the workspace may use the feature. Otherwise opens the
   * upgrade paywall and returns false. Use to wrap premium click handlers.
   */
  requirePro: (feature: PremiumFeature) => boolean;
  /** Force-open the paywall for a feature (e.g. from a locked tab). */
  openPaywall: (feature?: PremiumFeature) => void;
};

const FeatureGateContext = createContext<FeatureGateContextValue | null>(null);

export function useFeatureGate() {
  const ctx = useContext(FeatureGateContext);
  if (!ctx) throw new Error("useFeatureGate must be used within FeatureGateProvider");
  return ctx;
}

export function FeatureGateProvider({ children }: { children: ReactNode }) {
  const { pro, subscribed, trialRemaining, isLoading } = useEntitlements();
  const [activeFeature, setActiveFeature] = useState<PremiumFeature | null>(null);
  const [open, setOpen] = useState(false);

  const openPaywall = useCallback((feature?: PremiumFeature) => {
    setActiveFeature(feature ?? null);
    setOpen(true);
  }, []);

  const requirePro = useCallback(
    (feature: PremiumFeature) => {
      if (pro) return true;
      openPaywall(feature);
      return false;
    },
    [pro, openPaywall],
  );

  return (
    <FeatureGateContext.Provider
      value={{ pro, subscribed, trialRemaining, isLoading, requirePro, openPaywall }}
    >
      {children}

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="my-auto w-full max-w-md">
            <PremiumPaywall
              feature={activeFeature ?? undefined}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </FeatureGateContext.Provider>
  );
}
