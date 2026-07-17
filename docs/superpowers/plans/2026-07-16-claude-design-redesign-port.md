# Claude Design Redesign Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port two Claude Design mockups into the live `vantage-front-edge` codebase: the marketing Features page, and the authenticated app's shell (sidebar/topbar) + Dashboard screen.

**Architecture:** Each `.dc.html` file is a static, fully-styled mockup (inline CSS custom properties, oklch colors, keyframe animations) that already matches this repo's established visual language (see `src/routes/index.tsx` / Home page, ported the same way in commit `f3596df`). Porting means re-expressing the same DOM structure, copy, and motion as React components using this repo's existing conventions — Tailwind utility classes with arbitrary `oklch(...)` values for anything static, `style={{}}` for computed/gradient values, and small extracted components for repeated visual units (see `src/components/marketing/home/*` for precedent: `GlitchReveal`, `CornerTicks`, `WeatherHud`). This is a visual/structural port, not new product logic — no new data flows, no new business rules.

**Tech Stack:** TanStack Start (React, file-based routing), Tailwind CSS, lucide-react icons, existing `DesignSync` MCP tool for reading the source design files.

## Global Constraints

- Source of truth for content/structure/animation is the live Claude Design project file — fetch it directly via the `DesignSync` tool (`get_file`), do not work from memory or approximation.
  - Features: `DesignSync get_file` with `projectId: 4919ac84-8934-4d70-8951-f29fa43424e6`, `path: "Features.dc.html"`.
  - App shell + Dashboard: `DesignSync get_file` with `projectId: 25f0e8f1-09f6-4cd8-af04-e54d289a2179`, `path: "App UI.dc.html"` — this file contains 13 screens (App shell, Dashboard, Van's AI Hub, Dispatch Board, Calendar, Estimates, Customers, Time & Timesheets, My Team, Upgrade, Settings, Sign In, Sign Up, Onboarding) in one document, each wrapped in a `<div data-screen-label="...">`. **Only implement the sections labeled `App shell` and `Dashboard`.** Leave the other 11 screens alone — they are out of scope for this plan and will be ported in later sessions.
- Match the design pixel-for-pixel: colors (oklch values), spacing, typography, corner-tick/scanline/HUD decorative details, and animations (including `prefers-reduced-motion` fallbacks where the design defines them).
- Follow existing repo conventions, don't invent new ones:
  - Tailwind arbitrary-value classes for static styling (e.g. `text-[oklch(0.72_0.16_158)]`), `style={{}}` only for values that must be computed or use CSS features Tailwind can't express as a class (gradients, `background-image`, `mask-image`).
  - Extract a component when a visual unit repeats 2+ times, matching the granularity already used in `src/components/marketing/home/`.
  - Reuse existing shared components where the design matches them (`AppLink`, `CornerTicks`, `GlitchReveal`, `Reveal`) instead of re-implementing the same effect.
- No new dependencies unless the design requires something genuinely unavailable (e.g. a chart primitive) — check `package.json` first.
- `bun run lint` and `bun run build` must both pass with zero new errors before a task is considered done.
- Never edit `src/routeTree.gen.ts` by hand — it's auto-generated.
- These are two independent subsystems (marketing routes vs. authenticated app shell/dashboard) touching disjoint files — they can be implemented in parallel with no shared state.

---

## Task 1: Port Features.dc.html to the marketing Features page

**Files:**
- Modify: `src/routes/features.tsx` (currently 901 lines — this is the existing, now-superseded port; expect substantial rewrite, not a patch)
- Modify/Create as needed: `src/components/marketing/home/*.tsx` and/or a new `src/components/marketing/features/` directory, if the design introduces visual units not already covered by existing shared components
- Reference (read-only, do not edit): `src/routes/index.tsx` (Home page — the sibling page already ported from `Home.dc.html`, same design system, same dark theme) for established patterns (hero wordmark treatment, `GlitchReveal` usage, `CornerTicks` usage, `AppLink` usage)
- Reference (read-only): `src/components/marketing/MarketingNav.tsx`, `src/components/marketing/MarketingFooter.tsx` vs. `src/components/marketing/home/HomeNav.tsx`, `src/components/marketing/home/HomeFooter.tsx` — the current `features.tsx` imports the `home/` nav+footer variants; confirm in the fetched design whether Features still uses the same dark nav/footer as Home (it does — the design's `<header>` block is identical to Home's) and keep using `HomeNav`/`HomeFooter`.

**Interfaces:**
- Consumes: `HomeNav`, `HomeFooter`, `GlitchReveal`, `CornerTicks`, `AppLink` from `@/components/marketing/home/*` and `@/components/marketing/AppLink` (existing, no signature changes expected).
- Produces: `FeaturesPage` component exported via `Route.component` in `src/routes/features.tsx` (same export shape as today — `createFileRoute("/features")`).

- [ ] **Step 1: Fetch the current design source**

Call `DesignSync` with `method: "get_file"`, `projectId: "4919ac84-8934-4d70-8951-f29fa43424e6"`, `path: "Features.dc.html"`. This is ~77KB; read it in full before writing any code. Note the five sections in order: `Features hero`, `Statement`, `Feature detail` (six numbered feature panels, 01–06, alternating "full-bleed console panel" and "paired vertical card" layouts, with two inline CTA banners between groups), `Social proof placeholder`, `CTA`.

- [ ] **Step 2: Read the existing implementation for diff context**

Read `src/routes/features.tsx` in full. This is the prior port (built without the canonical design file open) — identify what it got right structurally (it already uses `HomeNav`/`HomeFooter`/`GlitchReveal`/`CornerTicks`/`AppLink` and the `heroCtaClass`/`CtaButton`/`WireframeFloor`/`Kicker` helper pattern) versus what's missing or diverges from the fetched design (exact copy, exact animation keyframes like `lmSlot`/`lmDrop`/`lmPing`/`lmBlip`/`lmFloat`/`lmScan`/`lmSweep`, the six feature panels' specific mini-visualizations, the inline CTA banners, social proof section, closing CTA).

- [ ] **Step 3: Rewrite `features.tsx` to match the design exactly**

Keep the existing helper-component pattern (`CtaButton`, `Kicker`, `WireframeFloor`, small per-section subcomponents) but rewrite content/markup so every section matches the fetched HTML: exact copy, exact icon choices (map inline SVGs in the design to the closest `lucide-react` icon already imported, or add the specific icon import if missing), exact keyframe animations (translate the design's raw `@keyframes` blocks into Tailwind's `tailwind.config` `keyframes`/`animation` extensions if not already defined there, or a small scoped `<style>`/CSS module if one-off — check `tailwind.config.ts` first for existing `lm*`/`glx*` keyframes since Home.dc.html's port likely already added some of these).

- [ ] **Step 4: Verify build and lint**

Run: `bun run lint`
Expected: no new errors introduced by this file.

Run: `bun run build`
Expected: build succeeds, no TypeScript errors in `features.tsx` or any new component files.

- [ ] **Step 5: Visual QA against the design**

Run `bun run dev`, navigate to `/features`, and compare side-by-side against the fetched `Features.dc.html` (open the persisted HTML directly in a browser tab, or use the Claude Design preview URL) for: hero wordmark animation, all six feature panels in order with correct alternating layout, both inline CTA banners, social proof section, closing CTA, and footer. Check `prefers-reduced-motion` behavior (existing `@media (prefers-reduced-motion: reduce)` block in the design disables `.feat-card`/`.feat-bar`/`.feat-num` transitions and the `lm-scan`/`lm-sweep` overlays — confirm the port respects this the same way the Home page port does).

- [ ] **Step 6: Commit**

```bash
git add src/routes/features.tsx src/components/marketing
git commit -m "Re-port Features page from canonical Features.dc.html design"
```

---

## Task 2: Port App UI.dc.html's "App shell" and "Dashboard" sections

**Files:**
- Modify: `src/components/AppSidebar.tsx` (190 lines — current sidebar, already once-refreshed but not matched against this canonical design)
- Modify: `src/components/HeaderBar.tsx` (45 lines — current topbar)
- Modify: `src/routes/dashboard.tsx` (476 lines — current dashboard route)
- Reference (read-only): `src/routes/__root.tsx:240-250` — confirms how `AppSidebar` and `HeaderBar` are composed (`<AppSidebar />` then `<main>` wrapping `<HeaderBar />` + route content); do not change this composition unless the design genuinely requires a different shell structure (e.g. a different sidebar width, a persistent top strip above both sidebar and main) — if so, note the change explicitly rather than silently altering `__root.tsx`.
- Reference (read-only): `src/components/BottomNav.tsx` — mobile nav equivalent of `AppSidebar`; the design may or may not define mobile behavior. If `App UI.dc.html`'s shell section has no mobile treatment, leave `BottomNav.tsx` as-is and only update it if its nav item list has drifted from the new `AppSidebar` nav item list (compare `OPERATIONS_NAV`/`ACCOUNT_NAV`).

**Interfaces:**
- Consumes: existing `supabase` client (`@/integrations/supabase/client`), `cn` (`@/lib/utils`), `fetchMyProfile` (`@/lib/fsm`), `useVanChat` (`@/components/VanChat`), `NotificationBell` (`@/components/NotificationBell`) — do not change these integration points, only the visual shell around them.
- Produces: `AppSidebar` and `HeaderBar` keep their current no-props signatures (both are called with no arguments in `__root.tsx:244-246`); `DashboardPage` keeps its current `Route.component` export shape in `dashboard.tsx`.

- [ ] **Step 1: Fetch the current design source, scoped to the two in-scope sections**

Call `DesignSync` with `method: "get_file"`, `projectId: "25f0e8f1-09f6-4cd8-af04-e54d289a2179"`, `path: "App UI.dc.html"`. This is ~193KB covering 13 screens. Locate and read in full only the two blocks marked `<div data-screen-label="App shell" ...>` and `<div data-screen-label="Dashboard" ...>`. Skim past (do not implement) the other 11 screens — note their presence for future sessions but do not port them now.

- [ ] **Step 2: Read the existing shell + dashboard implementation for diff context**

Read `src/components/AppSidebar.tsx`, `src/components/HeaderBar.tsx`, and `src/routes/dashboard.tsx` in full (already partially read above — re-confirm current nav items, collapse behavior, user menu, and dashboard widget layout before rewriting).

- [ ] **Step 3: Rewrite the app shell (sidebar + topbar) to match the design**

Update `AppSidebar.tsx` and `HeaderBar.tsx` structure/styling to match the fetched `App shell` section exactly: nav grouping, icons, active-state treatment, collapse/expand behavior, user account footer, topbar content and any HUD/status decoration the design adds. Preserve all existing behavior (`toggleCollapsed`, `localStorage` persistence via `COLLAPSE_KEY`, `handleSignOut`, the `Van` AI trigger button, `NotificationBell`) — this is a visual restyle of working functionality, not a rewrite of the functionality itself. Keep the same nav route list (`OPERATIONS_NAV`, `ACCOUNT_NAV`) unless the design explicitly adds/removes/renames an item — if it does, cross-check the target route exists in `src/routes/` before wiring it.

- [ ] **Step 4: Rewrite the Dashboard route to match the design**

Update `dashboard.tsx` to match the fetched `Dashboard` section: widget layout, the "Ask Van" banner (already added in the prior port per commit `6287e67` — verify it matches the canonical design's copy/placement), the live weekly revenue chart, and any other cards/panels the design defines. Preserve existing data-fetching hooks and query keys already in the file — this task changes presentation, not data logic.

- [ ] **Step 5: Verify build and lint**

Run: `bun run lint`
Expected: no new errors introduced by these files.

Run: `bun run build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 6: Visual QA against the design**

Run `bun run dev`, sign in, and compare `/dashboard` plus the sidebar/topbar chrome (visible on every authenticated route) against the fetched `App shell` and `Dashboard` sections. Confirm sidebar collapse/expand still persists across reload, sign-out still works, and the Van AI button still opens the chat panel. Confirm no other authenticated route (e.g. `/jobs`, `/customers`) visually breaks as a side effect of the shell restyle, since every route nests inside it.

- [ ] **Step 7: Commit**

```bash
git add src/components/AppSidebar.tsx src/components/HeaderBar.tsx src/routes/dashboard.tsx
git commit -m "Re-port app shell and Dashboard from canonical App UI.dc.html design"
```

---

## Explicitly out of scope for this plan

The remaining 11 screens in `App UI.dc.html` — Van's AI Hub, Dispatch Board, Calendar, Estimates, Customers, Time & Timesheets, My Team, Upgrade, Settings, Sign In, Sign Up, Onboarding — are not implemented by this plan. They exist in the same design file and can be ported the same way (fetch the relevant `data-screen-label` section, diff against the current route, rewrite) in future sessions, one or a few at a time.
