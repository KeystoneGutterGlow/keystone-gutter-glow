import { createHash } from "node:crypto";
import Stripe from "stripe";
import { firewood, getDeliveryMethod, getProduct, type FirewoodConfig } from "@/content/firewood";
import { todayIn } from "@/lib/booking/dates";
import { checkoutGate, gateMessages, type GateReason } from "./gate";
import { priceOrder, stripeLines, type PriceLine } from "./pricing";
import { getOrderStore } from "./store";
import type { OrderStore } from "./types";
import { parseOrder, type OrderFieldErrors } from "./validate";

// Server side of "Continue to payment". It validates the order again, calculates the total
// itself, saves the order as pending, and only then creates the Stripe Checkout Session. Card
// details are entered on Stripe's hosted page and never reach this app.

/** How long a Checkout Session stays open. 30 minutes is Stripe's minimum. */
const SESSION_MINUTES = 60;

export type StripeSessions = Pick<Stripe["checkout"]["sessions"], "create" | "retrieve">;

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY isn't set");
  client ??= new Stripe(key, { maxNetworkRetries: 2, timeout: 15_000 });
  return client;
}

const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
function makeRef(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return "KGW-" + Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
}

export type CheckoutOutcome =
  | { kind: "redirect"; url: string; ref: string }
  | { kind: "already_paid"; ref: string; sessionId: string | null }
  | { kind: "invalid"; errors: OrderFieldErrors }
  | { kind: "price_changed"; lines: PriceLine[]; totalCents: number }
  | { kind: "spam" }
  | { kind: "closed"; reason: GateReason }
  | { kind: "stripe_error" };

export interface CheckoutDeps {
  sessions?: StripeSessions;
  store?: OrderStore;
  config?: FirewoodConfig;
  today?: string;
}

export async function startCheckout(body: unknown, origin: string, deps: CheckoutDeps = {}): Promise<CheckoutOutcome> {
  const config = deps.config ?? firewood;
  const gate = checkoutGate(process.env, config);
  if (!gate.open) return { kind: "closed", reason: gate.reason };

  const today = deps.today ?? todayIn(config.timeZone);
  const parsed = parseOrder(body, today, config);
  if (!parsed.ok) return parsed.spam ? { kind: "spam" } : { kind: "invalid", errors: parsed.errors };
  const clean = parsed.data;

  const priced = priceOrder(clean, config);
  if (!priced) return { kind: "invalid", errors: { productId: "Pick how much wood you want." } };
  if (clean.expectedTotalCents !== undefined && clean.expectedTotalCents !== priced.totalCents) {
    return { kind: "price_changed", lines: priced.lines, totalCents: priced.totalCents };
  }

  const store = deps.store ?? getOrderStore();

  // The same click sent twice maps to one order. Changing anything in the form makes a new one.
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify([
        clean.idempotencyKey ?? crypto.randomUUID(),
        clean.productId,
        clean.methodId,
        [...clean.extras].sort(),
        clean.deliveryDate,
        clean.street,
        clean.city,
        clean.zip,
        clean.name,
        clean.phone,
        clean.email,
        clean.instructions,
        priced.totalCents,
      ]),
    )
    .digest("hex");

  const newOrder = (idempotencyKey: string) => ({
    ref: makeRef(),
    idempotencyKey,
    productId: clean.productId,
    methodId: clean.methodId,
    extras: clean.extras,
    deliveryDate: clean.deliveryDate,
    address: { street: clean.street, city: clean.city, zip: clean.zip },
    customer: { name: clean.name, email: clean.email, phone: clean.phone },
    instructions: clean.instructions,
    lines: priced.lines,
    totalCents: priced.totalCents,
    currency: config.currency,
    testMode: gate.mode === "test",
  });

  let { order, existing } = await store.create(newOrder(fingerprint));

  if (existing) {
    if (order.status === "paid" || order.status === "needs_review") {
      return { kind: "already_paid", ref: order.ref, sessionId: order.stripeSessionId };
    }
    const ageMinutes = (Date.now() - Date.parse(order.createdAt)) / 60_000;
    if (order.status === "pending" && order.stripeCheckoutUrl && ageMinutes < SESSION_MINUTES - 5) {
      return { kind: "redirect", url: order.stripeCheckoutUrl, ref: order.ref };
    }
    // Stripe needs at least 30 minutes on a new session, and expires_at below comes from the
    // order's age. So anything failed, expired or too old to reuse is a fresh attempt.
    if (order.status !== "pending" || ageMinutes > 20) {
      ({ order } = await store.create(newOrder(`${fingerprint}:${Date.now()}`)));
    }
  }

  const method = getDeliveryMethod(clean.methodId, config);
  const product = getProduct(clean.productId, config);
  try {
    const sessions = deps.sessions ?? getStripe().checkout.sessions;
    const session = await sessions.create(
      {
        mode: "payment",
        customer_email: clean.email,
        client_reference_id: order.ref,
        metadata: { order_ref: order.ref },
        payment_intent_data: {
          metadata: { order_ref: order.ref },
          description: `${product?.name ?? "Firewood"}, ${method?.name ?? ""}, delivery ${clean.deliveryDate} (${order.ref})`,
        },
        line_items: stripeLines(priced).map((line) => ({
          quantity: 1,
          price_data: {
            currency: config.currency,
            unit_amount: line.cents,
            product_data: { name: line.name },
          },
        })),
        // Fixed per order, so a retry sends identical parameters under the same idempotency key.
        expires_at: Math.floor(Date.parse(order.createdAt) / 1000) + SESSION_MINUTES * 60,
        success_url: `${origin}/firewood/order?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/firewood?checkout=canceled#order`,
      },
      { idempotencyKey: `firewood-${order.ref}` },
    );
    if (!session.url) throw new Error("Stripe returned a session with no URL");
    await store.attachSession(order.ref, session.id, session.url);
    return { kind: "redirect", url: session.url, ref: order.ref };
  } catch (err) {
    console.error(`[firewood] couldn't create a Checkout Session for ${order.ref}`, err);
    return { kind: "stripe_error" };
  }
}

export function explainClosed(reason: GateReason): string {
  return gateMessages[reason];
}
