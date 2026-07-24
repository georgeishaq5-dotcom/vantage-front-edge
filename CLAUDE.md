# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # start dev server (Vite + TanStack Start)
bun run build        # production build (Nitro + Vite)
bun run lint         # ESLint
bun run format       # Prettier (write)
```

The project uses **bun** as the package manager (`bun.lock`, `bunfig.toml`). Use `bun` instead of `npm` for installs and scripts.

## Architecture

**Vantage** is a field service management (FSM) SaaS for trades businesses (landscaping, HVAC, plumbing, etc.). It runs on **TanStack Start** (SSR React) + **Supabase** backend, deployed to Vercel via Nitro.

### Dual-hostname split

The same codebase serves two distinct sites:

| Host | Purpose |
|------|---------|
| `vantage-fsm.com` | Public marketing site |
| `app.vantage-fsm.com` | The product app (dashboard, jobs, customers…) |

`src/routes/__root.tsx` handles the redirect logic. `MARKETING_PATHS` (`/`, `/features`, `/pricing`, `/about`) are public; everything else requires auth and the `app.` subdomain. The helpers live in `src/lib/site-host.ts` using `createIsomorphicFn` so server-only imports are tree-shaken from the client bundle.

### Routing

TanStack Start file-based routing — every `.tsx` file in `src/routes/` is a route. Dynamic segments use bare `$` (e.g., `customers.$customerId.tsx`). `src/routeTree.gen.ts` is auto-generated; **never edit it by hand**. See `src/routes/README.md` for the full convention table.

### Data layer

All data access goes through Supabase. Two patterns are used:

- **Client queries**: `src/integrations/supabase/client.ts` — lazy-initialised proxy; import as `import { supabase } from "@/integrations/supabase/client"`. Used in React Query hooks (`@tanstack/react-query`).
- **Server functions** (`.functions.ts` files in `src/lib/`): called from server-side TanStack Start function routes. Database mutations on the client attach `company_id` explicitly (matching RLS policy `company_id = current_company_id()`); `getCurrentCompanyId()` in `src/lib/fsm.ts` provisions a company on first call if missing.

The canonical domain types (`Customer`, `Job`, `JobStatus`, etc.) and all pure DB helper functions live in `src/lib/fsm.ts`. This is the main data-access module.

### Entitlements / feature gating

`src/lib/entitlements.ts` defines a three-plan model: **Starter** (free), **Growth** ($49/mo), **Crew** ($99/mo). Every workspace starts on a 30-day **reverse trial** with full Crew access, then falls back to its paid `plan` (defaulting to `free`) once `companies.trial_ends_at` passes — never locked out. The *effective* plan is the higher of the paid tier (`companies.plan` when `subscription_status === "active"`) and the Crew-level trial; `resolveEffectivePlan` computes it. `FEATURE_MIN_PLAN` maps each `PremiumFeature` to its minimum plan, and per-plan caps live in `CREW_SEAT_LIMITS` / `CUSTOMER_CAPS` / `ACTIVE_JOB_CAPS`.

`useEntitlements` hook (`src/hooks/useEntitlements.ts`) queries `companies.plan` + `subscription_status` + `trial_ends_at` and exposes `plan`, `isTrial`, `trialDaysRemaining`, `canUseFeature`, and the caps. Components call `useFeatureGate()` → `requireFeature(feature)` to gate premium features (or check `seatLimit`/`customerCap`/`activeJobCap` for resource caps); on failure it opens `PremiumPaywall`, which sells the plan the feature requires. The `FeatureGateProvider` wraps all app routes in `__root.tsx`.

### Auth flow

`AuthGate` (`src/components/AuthGate.tsx`) wraps all app routes. Unauthenticated users see the sign-in screen (email/password, Google OAuth, Apple OAuth via Lovable Cloud Auth). After sign-in, `OnboardingGate` intercepts new users for the trade/profession setup flow before they reach the app.

### AI — "Van"

`POST /api/chat` (`src/routes/api/chat.ts`) streams responses via the Vercel AI SDK (`ai` package) calling **Gemini directly** (`gemini-3-flash-preview`) through the Google provider (`src/lib/google-ai.server.ts`, using `@ai-sdk/google` + `GEMINI_API_KEY`). The chat route verifies the Supabase Bearer token before processing. The chat UI component is `src/components/VanChat.tsx`. Trade-preset generation (`configureTradePresets` in `src/lib/presets.functions.ts`) uses the same Google provider via `generateObject`.

**Van's tools (agentic actions):** Van can actually operate the app via **client-side tools**. Tool *definitions* (names + zod input schemas, no `execute`) live in `src/lib/van-tools.shared.ts` and are passed to `streamText` so Gemini knows what Van can do. Because they have no `execute`, they're fulfilled in the browser: `VanChat`'s `useChat({ onToolCall })` runs `executeVanTool` (`src/lib/van-tools.actions.ts` — must NOT be renamed to `*.client.ts`, that suffix is import-protection-forbidden on the server, and VanChat is SSR-reachable via `__root`), which calls the same `fsm.ts` / `createJob` functions the UI uses (so Van inherits the operator's plan limits + RLS). `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` resumes the model to narrate results. The system prompt forbids Van from claiming an action it didn't perform via a tool. Money/irreversible tools (`send_promo_texts`, `invite_teammate`) intentionally return `confirmation_required` instead of executing. Voice input (`src/hooks/useSpeechInput.ts`, Web Speech API) powers the mic button in `VanChat` and the dashboard "Talk to Van" entry point.

### Server entry

`src/server.ts` / `src/start.ts` are the SSR entry points wired through `vite.config.ts` → `@lovable.dev/vite-tanstack-config`. Do **not** add duplicate Vite plugins already included by that config (tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro, etc.).

### UI components

`src/components/ui/` contains shadcn/ui primitives (Radix UI + Tailwind). Do not edit these directly — regenerate via the shadcn CLI. Business components live directly in `src/components/`.

### Mobile (Capacitor)

`capacitor.config.ts` targets `app.lovable.vantage` bundle ID and loads the live published site (`https://vantage-front-edge.lovable.app`) via a WebView. To ship a native offline build, remove the `server` block from `capacitor.config.ts` and run `bun run build` before `npx cap sync`.

### Environment variables

Required at runtime:

| Variable | Used by |
|----------|---------|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Supabase client (client/server) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | Supabase client (client/server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin client (`client.server.ts`), Stripe webhook |
| `GEMINI_API_KEY` | Van AI — chat (`/api/chat`) + trade presets (`configureTradePresets`) |
| `LOVABLE_API_KEY` | Inbound auth + Lovable email service for the `/lovable/email/*` routes |
| `STRIPE_SECRET_KEY` | Stripe checkout / portal / webhook |
| `STRIPE_WEBHOOK_SECRET` | Verifies `/api/billing/webhook` signatures |
| `STRIPE_PRICE_GROWTH` / `STRIPE_PRICE_CREW` | Stripe Price IDs per paid plan (`/api/billing/checkout`) |

### Billing (Stripe)

Paid plans are sold via **Stripe Checkout** and applied by a **webhook** — the client never sets `plan` directly. `PremiumPaywall` → `POST /api/billing/checkout` creates a subscription Checkout session for the plan the locked feature requires (`requiredPlanFor`); on success Stripe calls `POST /api/billing/webhook`, which writes `companies.plan` + `subscription_status` (and `stripe_customer_id`) via the service-role client. `prevent_company_billing_change` (DB trigger) freezes those columns for everyone except admins and the service role. `ManageSubscriptionSection` → `POST /api/billing/portal` opens the Stripe billing portal. Plan↔Price mapping lives in `src/lib/billing.server.ts`. For QA/manual ops, admins can set the plan directly (no payment) via `setCompanyPlan` (`src/lib/billing.functions.ts`), surfaced by `PlanSwitcherSection` in Settings.

### Database migrations

`supabase/migrations/` contains timestamped SQL migrations managed by the Supabase CLI. Run migrations against a local Supabase instance with `supabase db push` or `supabase migration up`.

### Path alias

`@/` maps to `src/` (configured in `tsconfig.json` and picked up automatically by the vite config).
