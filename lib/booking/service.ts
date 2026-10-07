import { bookingRules } from "@/content/booking";
import { getPackage, totalFor } from "@/content/pricing";
import { checkDate, dayDetail, firstOpening, rangeSummary } from "./availability";
import { addDays, diffDays, todayIn } from "./dates";
import { getBookingStore } from "./store";
import type { BookingRecord, DayDetail, DaySummary, ISODate } from "./types";
import type { CleanBookingRequest } from "./validate";

// What the API routes call. Each function reads "today" in the business time zone, asks
// the store for taken slots, and applies the rules in availability.ts.

const rules = bookingRules;

export function today(): ISODate {
  return todayIn(rules.timeZone);
}

export async function getDay(date: ISODate): Promise<DayDetail> {
  const taken = await getBookingStore().listTaken(date, date);
  return dayDetail(
    date,
    taken.map((t) => t.slotId),
    today(),
    rules,
  );
}

export async function getRange(from: ISODate, to: ISODate): Promise<DaySummary[]> {
  const taken = await getBookingStore().listTaken(from, to);
  return rangeSummary(from, to, taken, today(), rules);
}

export async function getNextOpening() {
  const t = today();
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
  | { ok: true; booking: BookingRecord }
  | { ok: false; status: 409 | 422; code: "slot_taken" | "day_full" | "date_unavailable"; message: string; day: DayDetail };

export async function createBooking(req: CleanBookingRequest): Promise<CreateOutcome> {
  const pkg = getPackage(req.packageId)!;
  const dateCheck = checkDate(req.date, today(), rules);
  if (!dateCheck.ok) {
    return {
      ok: false,
      status: 422,
      code: "date_unavailable",
      message: "That day can't be booked anymore. Pick another one.",
      day: await getDay(req.date),
    };
  }

  const result = await getBookingStore().create(
    {
      ref: makeRef(),
      date: req.date,
      slotId: req.slotId,
      packageId: pkg.id,
      rinse: req.rinse,
      priceDollars: totalFor(pkg, req.rinse),
      priceIsEstimate: pkg.needsQuote,
      customer: { name: req.name, email: req.email, phone: req.phone },
      address: { street: req.street, city: req.city, zip: req.zip },
      notes: req.notes,
    },
    rules.maxJobsPerDay,
  );

  if (result.ok) {
    // TODO(production): send the confirmation email to the customer and a heads-up to Jimmy.
    return result;
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
    day: await getDay(req.date),
  };
}
