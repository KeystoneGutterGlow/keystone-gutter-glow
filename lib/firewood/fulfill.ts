import type Stripe from "stripe";
import { firewood, getProduct } from "@/content/firewood";
import { site } from "@/content/site";
import { formatLong } from "@/lib/booking/dates";
import { ownerEmail, sendEmail } from "@/lib/notify/email";
import { paymentMode } from "./gate";
import { formatCents } from "./pricing";
import { getOrderStore } from "./store";
import type { FirewoodOrder, OrderStore } from "./types";

// What a Stripe event does to an order. Stripe can send an event more than once, late, or out of
// order, so nothing here assumes it's the first time:
//   - a status only moves through store.transition(), which changes the row at most once
//   - emails go out only for whoever wins store.claimNotification()
//   - any failure throws, the webhook answers 500, and Stripe retries the event

export class OrderNotFoundError extends Error {
  constructor(ref: string) {
    super(`No firewood order for ${ref}`);
    this.name = "OrderNotFoundError";
  }
}

function refOf(session: Stripe.Checkout.Session): string | null {
  return session.metadata?.order_ref ?? session.client_reference_id ?? null;
}

function intentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  return typeof pi === "string" ? pi : (pi?.id ?? null);
}

export async function applySessionPaid(session: Stripe.Checkout.Session, store: OrderStore = getOrderStore()): Promise<FirewoodOrder> {
  const ref = refOf(session);
  if (!ref) throw new OrderNotFoundError(`session ${session.id}`);
  const order = await store.findByRef(ref);
  if (!order) throw new OrderNotFoundError(ref);

  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    // A delayed payment method hasn't cleared yet. async_payment_succeeded follows if it does.
    return order;
  }

  // The amount paid has to be the amount this server calculated. If it isn't, someone needs to look.
  const amountOk = session.amount_total === order.totalCents && session.currency === order.currency;
  const target = amountOk ? "paid" : "needs_review";
  if (!amountOk) {
    console.error(
      `[firewood] ${ref}: paid ${session.amount_total} ${session.currency}, expected ${order.totalCents} ${order.currency}`,
    );
  }

  // A late payment on an order that had expired or failed still counts.
  const moved = await store.transition(ref, ["pending", "expired", "payment_failed"], target, {
    paidAt: new Date().toISOString(),
    stripePaymentIntent: intentId(session),
  });
  if (!moved) throw new OrderNotFoundError(ref);

  const final = moved.order;
  if (final.status === "paid" || final.status === "needs_review") await notifyOnce(final, store);
  return final;
}

async function notifyOnce(order: FirewoodOrder, store: OrderStore) {
  if (!(await store.claimNotification(order.ref))) return;

  const owner = await sendEmail(ownerNotice(order));
  if (!owner.sent && owner.reason === "failed") {
    // Let the Stripe retry try again. Without this, Jimmy might never hear about a paid order.
    await store.releaseNotification(order.ref);
    throw new Error(`Owner notification failed for ${order.ref}`);
  }
  if (owner.sent === false) console.warn(`[firewood] ${order.ref} is paid but email isn't configured. Check the Stripe dashboard.`);

  if (order.status === "paid") {
    const customer = await sendEmail(customerConfirmation(order));
    // Not worth a retry that would repeat the owner email. It's logged, and the page already confirmed.
    if (!customer.sent && customer.reason === "failed") console.error(`[firewood] customer email failed for ${order.ref}`);
  }
}

function orderLines(order: FirewoodOrder): string[] {
  return order.lines.map((l) => `  ${l.label}: ${formatCents(l.cents)}`);
}

function ownerNotice(order: FirewoodOrder) {
  const review = order.status === "needs_review";
  return {
    to: ownerEmail(),
    replyTo: order.customer.email,
    subject: `${order.testMode ? "[TEST] " : ""}${review ? "CHECK THIS: " : ""}Firewood order ${order.ref}: ${formatCents(order.totalCents)}`,
    text: [
      review ? "The amount Stripe charged doesn't match this order. Check it in the Stripe dashboard before delivering." : "",
      order.testMode ? "This was Stripe test mode. No real money moved." : "",
      `Order: ${order.ref}`,
      `Requested delivery: ${formatLong(order.deliveryDate)}`,
      `Address: ${order.address.street}, ${order.address.city}, ${site.state} ${order.address.zip}`,
      `Customer: ${order.customer.name}, ${order.customer.phone}, ${order.customer.email}`,
      "",
      ...orderLines(order),
      `  Total: ${formatCents(order.totalCents)}`,
      "",
      "Placement and stacking instructions:",
      order.instructions,
    ]
      .filter((line, i) => line !== "" || i > 1)
      .join("\n"),
  };
}

function customerConfirmation(order: FirewoodOrder) {
  const product = getProduct(order.productId);
  const after = firewood.fulfillment.value.afterPayment;
  return {
    to: order.customer.email,
    replyTo: site.email,
    subject: `${order.testMode ? "[TEST] " : ""}Your firewood order ${order.ref}`,
    text: [
      order.testMode ? "This was a test order. You weren't charged." : "",
      `Thanks, ${order.customer.name}. We've got your payment for ${product?.name.toLowerCase() ?? "firewood"}.`,
      "",
      `Order: ${order.ref}`,
      `Requested delivery: ${formatLong(order.deliveryDate)}`,
      `Address: ${order.address.street}, ${order.address.city}, ${site.state} ${order.address.zip}`,
      "",
      ...orderLines(order),
      `  Total paid: ${formatCents(order.totalCents)}`,
      "",
      "Where you asked us to put it:",
      order.instructions,
      "",
      ...(after ? [after, ""] : []),
      `Questions? Call or text ${site.phone.display}.`,
    ]
      .filter((line, i) => !(i === 0 && line === ""))
      .join("\n"),
  };
}

/** Handles one verified event. Returns false for event types this app doesn't act on. */
export async function handleStripeEvent(event: Stripe.Event, store: OrderStore = getOrderStore()): Promise<boolean> {
  // A live event must never touch a test deployment, or the other way round.
  if (event.livemode !== (paymentMode() === "live")) {
    console.warn(`[stripe] ignored ${event.id}: livemode doesn't match this deployment`);
    return false;
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await applySessionPaid(event.data.object, store);
      return true;
    case "checkout.session.async_payment_failed": {
      const ref = refOf(event.data.object);
      if (ref) await store.transition(ref, ["pending"], "payment_failed");
      return true;
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      const ref = refOf(session);
      if (!ref) return true;
      const order = await store.findByRef(ref);
      // Ignore an older session expiring after the customer started a newer one.
      if (order?.stripeSessionId === session.id) await store.transition(ref, ["pending"], "expired");
      return true;
    }
    default:
      return false;
  }
}
