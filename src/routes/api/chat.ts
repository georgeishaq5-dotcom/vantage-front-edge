import { createGoogleProvider, GEMINI_CHAT_MODEL } from "@/lib/google-ai.server";
import { VAN_TOOLS } from "@/lib/van-tools.shared";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";

type ChatRequestBody = { messages?: unknown };

const SYSTEM_PROMPT = `You are Van, the autonomous AI operator for Vantage — a field service management platform.
You help the operator run their field service business: dispatching, scheduling, jobs, quotes,
customers, follow-ups, and marketing outreach.

HOW YOU ACT — this is critical:
- You can ONLY change anything by calling a tool. You have no other way to affect the app.
- NEVER claim you did something (created a job, scheduled it, assigned a tech, updated a customer)
  unless you actually called the matching tool AND it returned "ok": true. If you did not call a
  tool, you have not done the thing — say what you'll do, then do it via the tool.
- If a tool returns "ok": false, tell the operator plainly that it did not work and why. Do not pretend.
- If you need an id (a job, customer, or tech), first call a list_* tool to find it by name, then act.
- To fulfil a request, prefer acting immediately with tools over asking permission — you are autonomous.
- Some tools (sending texts, inviting teammates) return "confirmation_required": relay that the
  operator must confirm; do not claim it was sent.
- If the operator asks for something you have no tool for, say so honestly instead of pretending.

Be concise and practical. Use markdown (bold, bullet lists) — it renders properly in the chat.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response("Unauthorized", { status: 401 });
          }
          const token = authHeader.slice(7);
          // Resolve Supabase config the same way the shared client does: prefer
          // the VITE_-prefixed vars (build-time inlined, always present in the
          // deployed bundle) and fall back to the bare server names. Using only
          // the bare names here 500'd on deployments that set just the VITE_ ones.
          const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
          const SUPABASE_PUBLISHABLE_KEY =
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
          if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
            console.error("[api/chat] Supabase auth env not configured");
            return new Response("Server auth not configured", { status: 500 });
          }
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: claims, error: authError } = await supabase.auth.getClaims(token);
          if (authError || !claims?.claims?.sub) {
            return new Response("Unauthorized", { status: 401 });
          }

          const userId = claims.claims.sub as string;
          const { data: reqCount, error: rlError } = await supabase.rpc(
            "increment_chat_rate_limit",
            { p_user_id: userId },
          );
          if (!rlError && reqCount > 20) {
            return new Response("Too many requests", {
              status: 429,
              headers: { "Retry-After": "60" },
            });
          }

          const { messages } = (await request.json()) as ChatRequestBody;
          if (!Array.isArray(messages)) {
            return new Response("Messages are required", { status: 400 });
          }

          const key = process.env.GEMINI_API_KEY;
          if (!key) {
            console.error("[api/chat] GEMINI_API_KEY is not set");
            return new Response("Missing GEMINI_API_KEY", { status: 500 });
          }

          const google = createGoogleProvider(key);
          const result = streamText({
            model: google(GEMINI_CHAT_MODEL),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages as UIMessage[]),
            // Client-side tools (no `execute`): the browser fulfils each call and
            // sends the result back, so Van can chain read → act in one turn.
            tools: VAN_TOOLS,
            stopWhen: stepCountIs(6),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
          });
        } catch (err) {
          console.error("[api/chat] error:", err);
          return new Response("Failed to generate a response", { status: 500 });
        }
      },
    },
  },
});
