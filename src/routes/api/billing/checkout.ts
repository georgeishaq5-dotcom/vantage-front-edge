import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

import type { PaidPlan } from "@/lib/billing.server";

const APP_ORIGIN = "https://app.vantage-fsm.com";

/**
 * Creates a Stripe Checkout session for the caller's company to subscribe to a
 * paid plan (Growth or Crew). The company's plan is set by the webhook
 * (src/routes/api/billing/webhook.ts) once Stripe confirms the payment — never
 * trusted from the client.
 */
export const Route = createFileRoute("/api/billing/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response("Unauthorized", { status: 401 });
          }
          const token = authHeader.slice(7);

          let plan: PaidPlan;
          try {
            const body = (await request.json()) as { plan?: string };
            if (body.plan !== "growth" && body.plan !== "crew") {
              return new Response("Invalid plan", { status: 400 });
            }
            plan = body.plan;
          } catch {
            return new Response("Invalid request body", { status: 400 });
          }

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

          const { priceIdForPlan } = await import("@/lib/billing.server");
          const priceId = priceIdForPlan(plan);
          if (!priceId) {
            return new Response(`Plan "${plan}" is not configured`, { status: 500 });
          }

          const stripeKey = process.env.STRIPE_SECRET_KEY;
          if (!stripeKey) {
            return new Response("Stripe not configured", { status: 500 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("company_id, email")
            .eq("id", userId)
            .single();
          if (profileError || !profile?.company_id) {
            return new Response("Company not found", { status: 404 });
          }
          const companyId = profile.company_id;

          const { data: company, error: companyError } = await supabaseAdmin
            .from("companies")
            .select("stripe_customer_id, name")
            .eq("id", companyId)
            .single();
          if (companyError || !company) {
            return new Response("Company not found", { status: 404 });
          }

          const stripe = new Stripe(stripeKey);

          // Reuse the company's Stripe customer, or create one and persist it so
          // the billing portal (and future checkouts) can find it.
          let customerId = company.stripe_customer_id;
          if (!customerId) {
            const customer = await stripe.customers.create({
              email: profile.email ?? undefined,
              name: company.name,
              metadata: { company_id: companyId },
            });
            customerId = customer.id;
            await supabaseAdmin
              .from("companies")
              .update({ stripe_customer_id: customerId })
              .eq("id", companyId);
          }

          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            allow_promotion_codes: true,
            client_reference_id: companyId,
            metadata: { company_id: companyId, plan },
            subscription_data: { metadata: { company_id: companyId, plan } },
            success_url: `${APP_ORIGIN}/settings?upgraded=1`,
            cancel_url: `${APP_ORIGIN}/upgrade`,
          });

          return Response.json({ url: session.url });
        } catch (err) {
          console.error("[api/billing/checkout] error:", err);
          return new Response("Failed to create checkout session", { status: 500 });
        }
      },
    },
  },
});
