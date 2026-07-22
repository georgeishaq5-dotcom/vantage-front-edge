import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { toast } from "sonner";

import { useEntitlements } from "@/hooks/useEntitlements";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import {
  can,
  featureState,
  FEATURES,
  type FeatureState,
  type Plan,
  type PlanFeature,
} from "@/lib/entitlements";

type FeatureGateContextValue = {
  /** The workspace's effective plan (accounts for the reverse trial). */
  plan: Plan;
  subscribed: boolean;
  isTrial: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
  /** Crew seats included on the current plan (Infinity = unlimited). */
  seatLimit: number;
  /** Active-job cap on the current plan (Infinity = unlimited). */
  activeJobCap: number;
  /** True when the effective plan may use the feature. */
  can: (feature: PlanFeature) => boolean;
  /** "available" | "locked" | "coming_soon" for the effective plan. */
  featureState: (feature: PlanFeature) => FeatureState;
  /**
   * Returns true if the current plan may use the feature. Otherwise opens the
   * upgrade paywall (or a coming-soon notice) and returns false. Use to wrap
   * premium click handlers.
   */
  requireFeature: (feature: PlanFeature) => boolean;
  /** @deprecated Use {@link requireFeature}. Retained for back-compat. */
  requirePro: (feature: PlanFeature) => boolean;
  /** Force-open the paywall for a feature (e.g. from a locked tab or a cap). */
  openPaywall: (feature?: PlanFeature) => void;
};

const FeatureGateContext = createContext<FeatureGateContextValue | null>(null);

export function useFeatureGate() {
  const ctx = useContext(FeatureGateContext);
  if (!ctx) throw new Error("useFeatureGate must be used within FeatureGateProvider");
  return ctx;
}

export function FeatureGateProvider({ children }: { children: ReactNode }) {
  const { plan, subscribed, isTrial, trialDaysRemaining, isLoading, seatLimit, activeJobCap } =
    useEntitlements();
  const [activeFeature, setActiveFeature] = useState<PlanFeature | null>(null);
  const [open, setOpen] = useState(false);

  const openPaywall = useCallback((feature?: PlanFeature) => {
    setActiveFeature(feature ?? null);
    setOpen(true);
  }, []);

  const requireFeature = useCallback(
    (feature: PlanFeature) => {
      const state = featureState(plan, feature);
      if (state === "available") return true;
      if (state === "coming_soon") {
        toast.info(`${FEATURES[feature].label} is coming soon`, {
          description: "We're building this — it isn't available on any plan yet.",
        });
        return false;
      }
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
        activeJobCap,
        can: (feature) => can(plan, feature),
        featureState: (feature) => featureState(plan, feature),
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
