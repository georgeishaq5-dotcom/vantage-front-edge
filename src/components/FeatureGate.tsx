import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { useEntitlements } from "@/hooks/useEntitlements";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { planAllows, type Plan, type PremiumFeature } from "@/lib/entitlements";

type FeatureGateContextValue = {
  /** The workspace's effective plan (accounts for the reverse trial). */
  plan: Plan;
  subscribed: boolean;
  isTrial: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
  /** Crew seats included on the current plan (Infinity = unlimited). */
  seatLimit: number;
  /** Customer storage cap on the current plan (Infinity = unlimited). */
  customerCap: number;
  /** Active-job cap on the current plan (Infinity = unlimited). */
  activeJobCap: number;
  /**
   * Returns true if the current plan may use the feature. Otherwise opens the
   * upgrade paywall and returns false. Use to wrap premium click handlers.
   */
  requireFeature: (feature: PremiumFeature) => boolean;
  /** @deprecated Use {@link requireFeature}. Retained for back-compat. */
  requirePro: (feature: PremiumFeature) => boolean;
  /** Force-open the paywall for a feature (e.g. from a locked tab or a cap). */
  openPaywall: (feature?: PremiumFeature) => void;
};

const FeatureGateContext = createContext<FeatureGateContextValue | null>(null);

export function useFeatureGate() {
  const ctx = useContext(FeatureGateContext);
  if (!ctx) throw new Error("useFeatureGate must be used within FeatureGateProvider");
  return ctx;
}

export function FeatureGateProvider({ children }: { children: ReactNode }) {
  const {
    plan,
    subscribed,
    isTrial,
    trialDaysRemaining,
    isLoading,
    seatLimit,
    customerCap,
    activeJobCap,
  } = useEntitlements();
  const [activeFeature, setActiveFeature] = useState<PremiumFeature | null>(null);
  const [open, setOpen] = useState(false);

  const openPaywall = useCallback((feature?: PremiumFeature) => {
    setActiveFeature(feature ?? null);
    setOpen(true);
  }, []);

  const requireFeature = useCallback(
    (feature: PremiumFeature) => {
      if (planAllows(plan, feature)) return true;
      openPaywall(feature);
      return false;
    },
    [plan, openPaywall],
  );

  return (
    <FeatureGateContext.Provider
      value={{
        plan,
        subscribed,
        isTrial,
        trialDaysRemaining,
        isLoading,
        seatLimit,
        customerCap,
        activeJobCap,
        requireFeature,
        requirePro: requireFeature,
        openPaywall,
      }}
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
