import type { DeliveryMethodId, ExtraId, ProductId } from "@/content/firewood";
import type { PriceLine } from "./pricing";

export type OrderStatus = "pending" | "paid" | "payment_failed" | "expired" | "needs_review";

export interface FirewoodOrder {
  id: string;
  /** Short reference shown to the customer, e.g. KGW-7F3K2 */
  ref: string;
  status: OrderStatus;
  idempotencyKey: string;
  productId: ProductId;
  methodId: DeliveryMethodId;
  extras: ExtraId[];
  deliveryDate: string;
  address: { street: string; city: string; zip: string };
  customer: { name: string; email: string; phone: string };
  instructions: string;
  /** Computed on the server from content/firewood.ts */
  lines: PriceLine[];
  totalCents: number;
  currency: string;
  /** True when it was paid through Stripe test mode, so no real money moved */
  testMode: boolean;
  stripeSessionId: string | null;
  stripeCheckoutUrl: string | null;
  stripePaymentIntent: string | null;
  createdAt: string;
  paidAt: string | null;
  notifiedAt: string | null;
}

export type NewOrder = Omit<
  FirewoodOrder,
  "id" | "status" | "stripeSessionId" | "stripeCheckoutUrl" | "stripePaymentIntent" | "createdAt" | "paidAt" | "notifiedAt"
>;

export interface OrderPatch {
  paidAt?: string;
  stripePaymentIntent?: string | null;
}

/**
 * Persistence boundary, like BookingStore. `transition` is what stops duplicate processing: it
 * must change the row only if its status is still one of `from`, as a single atomic step.
 */
export interface OrderStore {
  /** Inserts the order, or returns the existing one with the same idempotency key. */
  create(order: NewOrder): Promise<{ order: FirewoodOrder; existing: boolean }>;
  attachSession(ref: string, sessionId: string, url: string): Promise<void>;
  findByRef(ref: string): Promise<FirewoodOrder | null>;
  findBySession(sessionId: string): Promise<FirewoodOrder | null>;
  transition(
    ref: string,
    from: OrderStatus[],
    to: OrderStatus,
    patch?: OrderPatch,
  ): Promise<{ order: FirewoodOrder; changed: boolean } | null>;
  /** True for exactly one caller until released. Decides who sends the emails. */
  claimNotification(ref: string): Promise<boolean>;
  releaseNotification(ref: string): Promise<void>;
}
