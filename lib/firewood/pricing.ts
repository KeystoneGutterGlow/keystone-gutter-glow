import { firewood, getDeliveryMethod, getProduct, type DeliveryMethodId, type ExtraId, type FirewoodConfig, type FirewoodExtra, type ProductId } from "@/content/firewood";

// The one place a firewood total is calculated. The order summary in the browser and the Stripe
// charge on the server both come from here, and the server never accepts a total from the client.
// No tax or delivery fee is added: nobody has decided on either (see content/firewood.ts).

export interface OrderSelection {
  productId: ProductId;
  methodId: DeliveryMethodId;
  extras: ExtraId[];
}

export interface PriceLine {
  id: string;
  label: string;
  /** Negative for a reduction */
  cents: number;
}

export interface PricedOrder {
  lines: PriceLine[];
  totalCents: number;
}

export function priceOrder(sel: OrderSelection, config: FirewoodConfig = firewood): PricedOrder | null {
  const product = getProduct(sel.productId, config);
  const method = getDeliveryMethod(sel.methodId, config);
  if (!product || !method) return null;

  const lines: PriceLine[] = [{ id: product.id, label: product.name, cents: product.price * 100 }];
  if (method.adjustment !== 0) {
    lines.push({ id: method.id, label: method.name, cents: method.adjustment * 100 });
  }
  for (const extra of config.extras.value as FirewoodExtra[]) {
    if (sel.extras.includes(extra.id)) lines.push({ id: extra.id, label: extra.name, cents: extra.price * 100 });
  }

  const totalCents = lines.reduce((sum, l) => sum + l.cents, 0);
  return totalCents > 0 ? { lines, totalCents } : null;
}

export interface StripeLine {
  name: string;
  cents: number;
}

/**
 * Stripe Checkout refuses negative line items, so a reduction is folded into the line above
 * it: "Quarter cord, Delivered and dumped" at $170. The customer's summary keeps both lines.
 * The total always matches priceOrder().
 */
export function stripeLines(order: PricedOrder): StripeLine[] {
  const out: StripeLine[] = [];
  for (const line of order.lines) {
    const last = out[out.length - 1];
    if (line.cents < 0 && last) {
      last.name = `${last.name}, ${line.label}`;
      last.cents += line.cents;
    } else {
      out.push({ name: line.label, cents: line.cents });
    }
  }
  return out;
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = abs % 100 === 0 ? String(abs / 100) : (abs / 100).toFixed(2);
  return `${sign}$${dollars}`;
}
