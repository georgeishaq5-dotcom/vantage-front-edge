import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Unique app identifier (bundle ID). This CANNOT change after first store publish.
  appId: "app.lovable.vantage",
  appName: "Vantage",
  // Folder produced by the production build that gets copied into the native app.
  webDir: "dist",
  server: {
    // Load the live published site so most updates appear without resubmitting to the stores.
    // To ship a fully self-contained/offline build instead, remove this `server` block
    // and run `npm run build` before `npx cap sync`.
    url: "https://vantage-front-edge.lovable.app",
    cleartext: false,
  },
};

export default config;
