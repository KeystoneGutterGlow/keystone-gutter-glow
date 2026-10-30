import type { PriceLine } from "./pricing";
import { getStripe } from "./checkout";
import { applySessionPaid } from "./fulfill";
import { paymentMode } from "./gate";
import { getOrderStore } from "./store";
import type { OrderStatus, OrderStore } from "./types";

// What the "after Stripe" page shows. The URL only says which session to look up. Whether it's
// paid comes from the order, which comes from Stripe. If the customer gets back here before the
// webhook arrives, ask Stripe directly and run the same idempotent code the webhook runs.

export interface OrderView {
  ref: string;
  status: OrderStatus;
  deliveryDate: string;
  lines: PriceLine[];
  totalCents: number;
  testMode: boolean;
  email: string;
}

const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

export async function getOrderView(sessionId: string | undefined, store: OrderStore = getOrderStore()): Promise<OrderView | null> {
  if (!sessionId || !SESSION_ID_RE.test(sessionId)) return null;

  let order = await store.findBySession(sessionId);
  if (!order) return null;

  if (order.status === "pending" && paymentMode() !== "off") {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      order = await applySessionPaid(session, store);
    } catch (err) {
      // The webhook still gets it. The customer just sees "still processing" for now.
      console.error(`[firewood] couldn't check session for ${order.ref}`, err);
    }
  }

  return {
    ref: order.ref,
    status: order.status,
    deliveryDate: order.deliveryDate,
    lines: order.lines,
    totalCents: order.totalCents,
    testMode: order.testMode,
    email: order.customer.email,
  };
}
