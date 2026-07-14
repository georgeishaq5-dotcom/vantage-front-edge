// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import contentCollections from "@content-collections/vite";

export default defineConfig({
  // Force Vercel preset so Nitro generates .vercel/output instead of
  // relying on env-var auto-detection. Lovable sandbox overrides this to
  // cloudflare-module regardless (see @lovable.dev/vite-tanstack-config line 650).
  nitro: { preset: "vercel" },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // contentCollections() must run before the tanstackStart plugin resolves
  // routes/modules, since routes import from the generated
  // .content-collections/generated output. Passed first here; NOT verified
  // against @lovable.dev/vite-tanstack-config's internal plugin merge order
  // in this environment (see PR description) — confirm with `bun run dev`.
  vite: {
    plugins: [contentCollections()],
  },
});
