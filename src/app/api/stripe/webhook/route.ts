import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook (raw body + overenie podpisu). Autoritatívne nastaví stav
 * platby objednávky. Idempotentné — opakované doručenie tej istej udalosti
 * nič nepokazí (PAID sa nastaví len ak ešte nie je).
 */
export async function POST(request: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe nie je nakonfigurovaný.", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Chýba podpis.", { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "neznáma chyba";
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (session.payment_status === "paid") {
          await markOrderPaid(session);
        }
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          await prisma.order.updateMany({
            where: { id: orderId, paymentStatus: { not: PaymentStatus.PAID } },
            data: { paymentStatus: PaymentStatus.FAILED },
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler failed:", err);
    return new Response("Spracovanie zlyhalo.", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}

async function markOrderPaid(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: { not: PaymentStatus.PAID } },
    data: {
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.ONLINE,
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    },
  });
}
