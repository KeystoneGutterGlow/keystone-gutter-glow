import Stripe from "stripe";
import { handleStripeEvent } from "@/lib/firewood/fulfill";

// POST /api/stripe/webhook. The only thing that can mark a firewood order as paid.
// The raw body must be read before anything parses it: the signature covers the exact bytes.
//   200 { received: true }   handled, or an event type we don't act on
//   400                      missing or invalid signature
//   500                      couldn't process it. Stripe retries for up to three days.
//   503                      webhook secret isn't set

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe] webhook called but STRIPE_WEBHOOK_SECRET isn't set");
    return Response.json({ error: "Webhook isn't configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(raw, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
    return Response.json({ received: true });
  } catch (err) {
    console.error(`[stripe] failed to process ${event.id} (${event.type})`, err);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }
}
