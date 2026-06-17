/// <reference types="google.maps" />
// Lightweight loader for the Google Maps JavaScript API (Places library).
// Uses the referrer-restricted browser key injected by the connector.

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as
  | string
  | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as
  | string
  | undefined;

let loaderPromise: Promise<typeof google> | null = null;

export function isMapsConfigured(): boolean {
  return Boolean(BROWSER_KEY);
}

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }
  if ((window as any).google?.maps?.places) {
    return Promise.resolve((window as any).google as typeof google);
  }
  if (loaderPromise) return loaderPromise;
  if (!BROWSER_KEY) {
    return Promise.reject(new Error("Google Maps browser key is not configured"));
  }

  loaderPromise = new Promise((resolve, reject) => {
    const callbackName = "__vantageInitMaps";
    (window as any)[callbackName] = () => {
      resolve((window as any).google as typeof google);
    };

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      libraries: "places,geometry",
      loading: "async",
      callback: callbackName,
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return loaderPromise;
}
