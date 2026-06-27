import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

/**
 * Stripe webhook: the only writer of `companies.plan` / `subscription_status`
 * for web subscriptions. Authenticated by the Stripe signature (not a Bearer
 * token) and writes via the service-role admin client, which the billing-guard
 * trigger now permits (see 20260626180000_billing_service_role_bypass.sql).
 *
 * Register this endpoint in the Stripe dashboard for the events:
 *   checkout.session.completed, customer.subscription.updated,
 *   customer.subscription.deleted
 */
export const Route = createFileRoute("/api/billing/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        const { getStripeConfig } = await import("@/lib/billing.server");
        const webhookSecret = getStripeConfig().webhookSecret;
        if (!stripeKey || !webhookSecret) {
          return new Response("Stripe not configured", { status: 500 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        const stripe = new Stripe(stripeKey);
        const rawBody = await request.text();

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            rawBody,
            signature,
            webhookSecret,
          );
        } catch (err) {
          console.error("[api/billing/webhook] signature verification failed:", err);
          return new Response("Invalid signature", { status: 400 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { planForPriceId } = await import("@/lib/billing.server");

          // Map a Stripe subscription status to our coarse subscription_status.
          const mapStatus = (s: Stripe.Subscription.Status): string => {
            if (s === "active" || s === "trialing") return "active";
            if (s === "past_due" || s === "unpaid") return "past_due";
            return "canceled";
          };

          type CompanyPatch = {
            plan?: string;
            subscription_status?: string;
            stripe_customer_id?: string;
          };
          const updateCompany = async (
            where: { companyId?: string | null; customerId?: string | null },
            patch: CompanyPatch,
          ) => {
            let q = supabaseAdmin.from("companies").update(patch);
            if (where.companyId) q = q.eq("id", where.companyId);
            else if (where.customerId) q = q.eq("stripe_customer_id", where.customerId);
            else return;
            const { error } = await q;
            if (error) console.error("[api/billing/webhook] company update failed:", error);
          };

          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object;
              const companyId =
                session.client_reference_id ?? session.metadata?.company_id ?? null;
              const customerId =
                typeof session.customer === "string" ? session.customer : null;
              const subscriptionId =
                typeof session.subscription === "string" ? session.subscription : null;

              let plan = planForPriceId(null);
              let status = "active";
              if (subscriptionId) {
                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                plan = planForPriceId(sub.items.data[0]?.price?.id);
                status = mapStatus(sub.status);
              }

              await updateCompany(
                { companyId, customerId },
                {
                  subscription_status: status,
                  ...(plan ? { plan } : {}),
                  ...(customerId ? { stripe_customer_id: customerId } : {}),
                },
              );
              break;
            }

            case "customer.subscription.updated": {
              const sub = event.data.object;
              const plan = planForPriceId(sub.items.data[0]?.price?.id);
              await updateCompany(
                {
                  companyId: sub.metadata?.company_id ?? null,
                  customerId: typeof sub.customer === "string" ? sub.customer : null,
                },
                {
                  subscription_status: mapStatus(sub.status),
                  ...(plan ? { plan } : {}),
                },
              );
              break;
            }

            case "customer.subscription.deleted": {
              const sub = event.data.object;
              // Leave `plan` as-is; resolveEffectivePlan only honors it while
              // subscription_status === "active", so the workspace falls back
              // to Starter automatically.
              await updateCompany(
                {
                  companyId: sub.metadata?.company_id ?? null,
                  customerId: typeof sub.customer === "string" ? sub.customer : null,
                },
                { subscription_status: "canceled" },
              );
              break;
            }

            default:
              break;
          }

          return Response.json({ received: true });
        } catch (err) {
          console.error("[api/billing/webhook] handler error:", err);
          return new Response("Webhook handler failed", { status: 500 });
        }
      },
    },
  },
});
