import { createGoogleProvider, GEMINI_CHAT_MODEL } from "@/lib/google-ai.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = { messages?: unknown };

const SYSTEM_PROMPT = `You are Van, the AI operator for Vantage — a field service management platform.
You help the operator run their field service business: dispatching, scheduling, quotes,
customer follow-ups, marketing outreach, and operational recommendations.
Be concise, practical, and proactive. Use markdown when helpful.`;

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
