import { bookingRules, type BookingRules } from "@/content/booking";
import { getPackage, totalFor } from "@/content/pricing";
import { site } from "@/content/site";
import { emailConfigured, ownerEmail, sendEmail } from "@/lib/notify/email";
import { isDemoStorage } from "@/lib/storage";
import { checkDate, dayDetail, firstOpening, rangeSummary } from "./availability";
import { addDays, diffDays, formatLong, todayIn } from "./dates";
import { getBookingStore } from "./store";
import type { BookingRecord, CreateResult, DayDetail, DaySummary, ISODate } from "./types";
import type { CleanBookingRequest } from "./validate";

// What the API routes call. Each function reads "today" in the business time zone, asks
// the store for taken slots, and applies the rules in availability.ts.

export function today(rules: BookingRules = bookingRules): ISODate {
  return todayIn(rules.timeZone);
}

export async function getDay(date: ISODate, rules: BookingRules = bookingRules): Promise<DayDetail> {
  const taken = await getBookingStore().listTaken(date, date);
  return dayDetail(
    date,
    taken.map((t) => t.slotId),
    today(rules),
    rules,
  );
}

export async function getRange(from: ISODate, to: ISODate, rules: BookingRules = bookingRules): Promise<DaySummary[]> {
  const taken = await getBookingStore().listTaken(from, to);
  return rangeSummary(from, to, taken, today(rules), rules);
}

export async function getNextOpening(rules: BookingRules = bookingRules) {
  const t = today(rules);
  const taken = await getBookingStore().listTaken(t, addDays(t, rules.horizonDays));
  return firstOpening(taken, t, rules);
}

export const MAX_RANGE_DAYS = 62;

export function isRangeOk(from: ISODate, to: ISODate): boolean {
  const span = diffDays(to, from);
  return span >= 0 && span <= MAX_RANGE_DAYS;
}

const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
function makeRef(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return "KGG-" + Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
}

export type CreateOutcome =
  | { ok: true; booking: BookingRecord; emailSent: boolean }
  | { ok: false; status: 409 | 422; code: "slot_taken" | "day_full" | "date_unavailable"; message: string; day: DayDetail };

export async function createBooking(req: CleanBookingRequest, rules: BookingRules = bookingRules): Promise<CreateOutcome> {
  const pkg = getPackage(req.packageId)!;
  const dateCheck = checkDate(req.date, today(rules), rules);
  if (!dateCheck.ok) {
    return {
      ok: false,
      status: 422,
      code: "date_unavailable",
      message: "That day can't be booked anymore. Pick another one.",
      day: await getDay(req.date, rules),
    };
  }

  const store = getBookingStore();
  const attempt = (slotId: string) =>
    store.create(
      {
        ref: makeRef(),
        date: req.date,
        slotId,
        packageId: pkg.id,
        rinse: req.rinse,
        priceDollars: totalFor(pkg, req.rinse),
        priceIsEstimate: pkg.needsQuote,
        customer: { name: req.name, email: req.email, phone: req.phone },
        address: { street: req.street, city: req.city, zip: req.zip },
        notes: req.notes,
        idempotencyKey: req.idempotencyKey,
      },
      rules.maxJobsPerDay,
    );

  let result: CreateResult;
  if (rules.scheduleMode === "day-only") {
    // The customer only chose a day, so file the job under the first free slot. If a slot
    // goes between the check and the insert, the store refuses it and the next one is tried.
    result = { ok: false, reason: "day_full" };
    for (const slot of rules.slots) {
      result = await attempt(slot.id);
      if (result.ok || result.reason === "day_full") break;
    }
    if (!result.ok) result = { ok: false, reason: "day_full" };
  } else {
    result = await attempt(req.slotId);
  }

  if (result.ok) {
    const emailSent = result.duplicate ? false : await sendBookingEmails(result.booking, rules);
    return { ok: true, booking: result.booking, emailSent };
  }

  const slot = rules.slots.find((s) => s.id === req.slotId);
  return {
    ok: false,
    status: 409,
    code: result.reason,
    message:
      result.reason === "slot_taken"
        ? `Someone just booked ${slot?.label ?? "that time"}. Here's what's still open that day.`
        : "That day just filled up. Pick another day.",
    day: await getDay(req.date, rules),
  };
}

/** Returns whether the customer's confirmation went out. A failed email never fails a booking. */
async function sendBookingEmails(b: BookingRecord, rules: BookingRules): Promise<boolean> {
  if (isDemoStorage() || !emailConfigured()) return false;

  const pkg = getPackage(b.packageId);
  const when =
    rules.scheduleMode === "day-only"
      ? formatLong(b.date)
      : `${formatLong(b.date)}, ${rules.slots.find((s) => s.id === b.slotId)?.label ?? b.slotId}`;
  const address = `${b.address.street}, ${b.address.city}, ${site.state} ${b.address.zip}`;
  const price = `${b.priceIsEstimate ? "Starting at " : ""}$${b.priceDollars}`;

  const [customer] = await Promise.all([
    sendEmail({
      to: b.customer.email,
      replyTo: site.email,
      subject: `You're booked: ${formatLong(b.date)} (${b.ref})`,
      text: [
        `Thanks, ${b.customer.name}. Your gutter cleaning is on the schedule.`,
        "",
        `Booking: ${b.ref}`,
        `When: ${when}`,
        `Where: ${address}`,
        `House: ${pkg?.name ?? b.packageId}${b.rinse ? ", with a rinse" : ""}`,
        `Price: ${price}. We invoice after the cleaning.`,
        "",
        `Need to change something? Call or text ${site.phone.display}.`,
      ].join("\n"),
    }),
    sendEmail({
      to: ownerEmail(),
      replyTo: b.customer.email,
      subject: `New booking ${b.ref}: ${when}`,
      text: [
        `When: ${when}`,
        `Where: ${address}`,
        `House: ${pkg?.name ?? b.packageId}${b.rinse ? ", with a rinse" : ""}`,
        `Price: ${price}`,
        `Customer: ${b.customer.name}, ${b.customer.phone}, ${b.customer.email}`,
        b.notes ? `Additional information: ${b.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    }),
  ]);
  return customer.sent;
}
