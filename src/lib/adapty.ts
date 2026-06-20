import { Capacitor } from "@capacitor/core";
import {
  adapty,
  type AdaptyPaywall,
  type AdaptyPaywallProduct,
} from "@adapty/capacitor";

/**
 * Adapty public SDK key.
 * TODO: Replace this placeholder with your real Adapty Public SDK key before
 * shipping the native build. Find it in the Adapty dashboard under
 * App Settings → General → API keys (Public SDK key).
 */
export const ADAPTY_PUBLIC_SDK_KEY = "public_live_REPLACE_WITH_YOUR_KEY";

/** The placement id configured in the Adapty dashboard for the main paywall. */
export const ADAPTY_PLACEMENT_ID = "premium";

/** Adapty's purchase/paywall SDK only runs inside the native iOS/Android app. */
export function isAdaptyAvailable(): boolean {
  return (
    Capacitor.isNativePlatform() &&
    !ADAPTY_PUBLIC_SDK_KEY.includes("REPLACE_WITH_YOUR_KEY")
  );
}

let activated = false;

async function ensureActivated() {
  if (activated) return;
  await adapty.activate({ apiKey: ADAPTY_PUBLIC_SDK_KEY });
  activated = true;
}

export type PaywallData = {
  paywall: AdaptyPaywall;
  products: AdaptyPaywallProduct[];
};

/** Fetch the configured paywall and its products from Adapty (native only). */
export async function loadPaywall(): Promise<PaywallData> {
  await ensureActivated();
  const paywall = await adapty.getPaywall({ placementId: ADAPTY_PLACEMENT_ID });
  const products = await adapty.getPaywallProducts({ paywall });
  return { paywall, products };
}

/** Trigger a purchase for the given product (native only). */
export async function purchaseProduct(product: AdaptyPaywallProduct) {
  await ensureActivated();
  return adapty.makePurchase({ product });
}

/** Restore previously made purchases (required by Apple, native only). */
export async function restorePurchases() {
  await ensureActivated();
  return adapty.restorePurchases();
}
