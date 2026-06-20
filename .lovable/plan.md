# App Store Review Compliance Plan

Four compliance features for the Vantage app, built to work in both the web preview and the native Capacitor build.

## 1. Privacy Policy — AI Data Processing section (`/privacy`)

The `/privacy` route already exists. Add a clearly **bolded "AI Data Processing"** section that explicitly covers Apple's required disclosures:

- **What is collected:** chat prompts you type to Van, plus related job/customer/operational data referenced in the conversation.
- **Why:** to generate automated insights, recommendations, and responses.
- **Where processed:** on our backend and forwarded to a third-party AI provider (LLM) for processing; not used to train their models.
- **External LLM:** explicit statement that prompt and job data are sent to an external large language model provider.

Keep the existing B2B SaaS placeholder copy; insert this as a new emphasized section.

## 2. Explicit AI Consent Gate (Van's AI Hub)

**Database:** add a boolean column `ai_consent_granted` (default `false`) to `public.profiles` via migration.

**Gate behavior:**
- On first interaction with Van (opening the chat panel and the AI Hub page), if `ai_consent_granted` is not true, show an **un-dismissible modal** (no overlay-click / no escape / no close button).
- Required copy: *"To provide automated insights, your chat prompts and job data will be sent to a third-party AI provider for processing."*
- Two buttons: **I Agree** (sets `ai_consent_granted = true` on the user's profile and unlocks the chat/hub) and **Decline** (closes the gate and blocks AI access).
- If declined: block access to the AI Hub tab — the AI Hub route renders a "consent required" state with a button to re-open the consent modal, and Van's chat send is disabled until consent is granted.

Consent is read/written with the browser Supabase client (profiles RLS already lets users read/update their own row), cached via TanStack Query and invalidated on change.

## 3. Apple Sign-In (managed)

On the existing auth screen (`AuthGate` → `AuthScreen`), add a **"Continue with Apple"** button beside Google.

- Enable the Apple provider through Lovable's managed social auth.
- Wire the button to `lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin })` (the supported managed path; same pattern as the existing Google button), with redirect/error handling.
- Button styled to Apple Human Interface Guidelines: black Apple logo + "Continue with Apple" on a contrasting background, correct padding, readable in the app's dark sidebar context.

## 4. Adapty SDK + Paywall screen

Install `@adapty/capacitor` and add a new **Subscription / Upgrade** route (e.g. `/upgrade`), linked from navigation.

- A small Adapty wrapper module initializes the SDK with a **placeholder Public SDK key** (clearly marked `TODO` constant) and detects whether it's running natively.
- **Web/preview fallback:** Adapty native calls don't run in the browser; when not on a native platform the screen renders a graceful placeholder card set (sample tiers) and a disabled-with-note purchase action, so the UI is reviewable now and goes live after the native build + real key.
- **Native:** fetch the Adapty paywall + products and render them dynamically; wire purchase to Adapty's `makePurchase`.
- **Restore Purchases:** a highly visible text button pinned at the **absolute bottom** of the paywall screen, wired to Adapty's `restorePurchases()` (with toast feedback), per Apple's requirement.

## Technical Notes

- Migration adds `ai_consent_granted boolean NOT NULL DEFAULT false` to `public.profiles`; existing grants/RLS already cover user self-access. Types regenerate after the migration runs, then consent code is wired.
- Apple provider is enabled via the managed social-auth tool in the same change; no raw `supabase.auth` Apple call (managed broker is the supported route on this stack).
- The Adapty placeholder key will need to be replaced with your real Public SDK key before the native release; everything else is wired and ready.
- New files: consent modal/provider component, `/upgrade` route, Adapty wrapper module. Edited: `privacy.tsx`, `AuthGate.tsx`, `VanChat.tsx`, `ai-hub.tsx`, and a nav entry for Upgrade.
