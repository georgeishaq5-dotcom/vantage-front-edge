import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

export const Route = createFileRoute("/api/billing/portal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response("Unauthorized", { status: 401 });
          }
          const token = authHeader.slice(7);

          const SUPABASE_URL = process.env.SUPABASE_URL;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
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

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("company_id")
            .eq("id", userId)
            .single();

          if (profileError || !profile?.company_id) {
            return new Response("Company not found", { status: 404 });
          }

          const { data: company, error: companyError } = await supabaseAdmin
            .from("companies")
            .select("stripe_customer_id")
            .eq("id", profile.company_id)
            .single();

          if (companyError || !company?.stripe_customer_id) {
            return new Response("No billing account", { status: 404 });
          }

          const stripeKey = process.env.STRIPE_SECRET_KEY;
          if (!stripeKey) {
            return new Response("Stripe not configured", { status: 500 });
          }

          const stripe = new Stripe(stripeKey);
          const session = await stripe.billingPortal.sessions.create({
            customer: company.stripe_customer_id,
            return_url: "https://app.vantage-fsm.com/settings",
          });

          return Response.json({ url: session.url });
        } catch (err) {
          console.error("[api/billing/portal] error:", err);
          return new Response("Failed to create billing session", { status: 500 });
        }
      },
    },
  },
});
