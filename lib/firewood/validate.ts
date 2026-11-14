import { firewood, getDeliveryMethod, getProduct, type DeliveryMethodId, type ExtraId, type FirewoodConfig, type FirewoodExtra, type ProductId } from "@/content/firewood";
import { addDays, diffDays, isISODate, weekday } from "@/lib/booking/dates";
import { cleanIdempotencyKey, cleanText, EMAIL_RE, isUsPhone, normalizePhone } from "@/lib/booking/validate";

// Shared by the order form (instant feedback) and the checkout API (authoritative).

export interface OrderDraft {
  productId: string;
  methodId: string;
  extras: string[];
  deliveryDate: string;
  street: string;
  city: string;
  zip: string;
  name: string;
  phone: string;
  email: string;
  instructions: string;
}

export interface CleanOrder extends Omit<OrderDraft, "productId" | "methodId" | "extras"> {
  productId: ProductId;
  methodId: DeliveryMethodId;
  extras: ExtraId[];
  idempotencyKey?: string;
  expectedTotalCents?: number;
}

export type OrderFieldErrors = Partial<Record<keyof OrderDraft, string>>;

/** The dates the form offers. Both ends are inclusive. */
export function deliveryWindow(today: string, config: FirewoodConfig = firewood) {
  const s = config.schedule.value;
  return { min: addDays(today, s.minLeadDays), max: addDays(today, s.horizonDays) };
}

export function checkDeliveryDate(date: string, today: string, config: FirewoodConfig = firewood): string | null {
  if (!isISODate(date)) return "Pick a delivery date.";
  const s = config.schedule.value;
  const ahead = diffDays(date, today);
  if (ahead < s.minLeadDays) return "That date is too soon. Pick a later one.";
  if (ahead > s.horizonDays) return "That date is too far out. Pick an earlier one.";
  if (s.closedWeekdays.includes(weekday(date))) return "We don't deliver on that day of the week.";
  if (s.blackoutDates.includes(date)) return "We aren't delivering that day. Pick another.";
  return null;
}

export function validateOrder(draft: OrderDraft, today: string, config: FirewoodConfig = firewood): OrderFieldErrors {
  const errors: OrderFieldErrors = {};
  if (!getProduct(draft.productId, config)) errors.productId = "Pick how much wood you want.";
  if (!getDeliveryMethod(draft.methodId, config)) errors.methodId = "Pick stacked or dumped.";

  const dateError = checkDeliveryDate(draft.deliveryDate, today, config);
  if (dateError) errors.deliveryDate = dateError;

  if (draft.street.trim().length < 4) errors.street = "Add the street address for delivery.";
  if (draft.city.trim().length < 2) errors.city = "Which town?";
  const zip = draft.zip.trim();
  const allowed = config.deliveryArea.value.zips;
  if (!/^\d{5}$/.test(zip)) errors.zip = "Five-digit ZIP, please.";
  else if (allowed && !allowed.includes(zip)) errors.zip = "We don't deliver to that ZIP. Call and we'll see what we can do.";

  if (draft.name.trim().length < 2) errors.name = "Who should we ask for?";
  if (!isUsPhone(draft.phone)) errors.phone = "A 10-digit phone number, in case the driver needs you.";
  if (!EMAIL_RE.test(draft.email.trim())) errors.email = "That email doesn't look right. We use it to reach you about your order.";
  if (draft.instructions.trim().length < 8) {
    errors.instructions = "Tell us where the wood should go, so the driver doesn't have to guess.";
  }
  return errors;
}

export function parseOrder(
  body: unknown,
  today: string,
  config: FirewoodConfig = firewood,
): { ok: true; data: CleanOrder } | { ok: false; errors: OrderFieldErrors; spam?: boolean } {
  if (!body || typeof body !== "object") return { ok: false, errors: {} };
  const b = body as Record<string, unknown>;
  if (cleanText(b.company, 200)) return { ok: false, errors: {}, spam: true };

  const known = (config.extras.value as FirewoodExtra[]).map((e) => e.id as string);
  const extras = Array.isArray(b.extras)
    ? [...new Set(b.extras.filter((e): e is string => typeof e === "string" && known.includes(e)))]
    : [];

  const draft: OrderDraft = {
    productId: cleanText(b.productId, 40),
    methodId: cleanText(b.methodId, 40),
    extras,
    deliveryDate: cleanText(b.deliveryDate, 10),
    street: cleanText(b.street, 200),
    city: cleanText(b.city, 80),
    zip: cleanText(b.zip, 10),
    name: cleanText(b.name, 120),
    phone: cleanText(b.phone, 40),
    email: cleanText(b.email, 200).toLowerCase(),
    instructions: cleanText(b.instructions, 1000, true),
  };

  const errors = validateOrder(draft, today, config);
  if (Object.keys(errors).length) return { ok: false, errors };

  const expected = b.expectedTotalCents;
  return {
    ok: true,
    data: {
      ...draft,
      productId: draft.productId as ProductId,
      methodId: draft.methodId as DeliveryMethodId,
      extras: extras as ExtraId[],
      phone: normalizePhone(draft.phone),
      idempotencyKey: cleanIdempotencyKey(b.idempotencyKey),
      expectedTotalCents: typeof expected === "number" && Number.isInteger(expected) ? expected : undefined,
    },
  };
}
