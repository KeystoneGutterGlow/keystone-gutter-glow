import { bookingRules, type BookingRules } from "@/content/booking";
import { getPlanFrequency, planRules } from "@/content/plans";
import { getPackage } from "@/content/pricing";
import { quoteFor } from "@/content/quote";
import { referralRewards } from "@/content/referral";
import { bookingNotice, formSubmitEnabled } from "@/lib/notify/formsubmit";
import type { Notice } from "@/lib/notify/notice";
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
  /** `notice` is Jimmy's notification for the browser to send, or null when notices are off. */
  | {
      ok: true;
      booking: BookingRecord;
      notice: Notice | null;
      /** The referral discount on this cleaning, 0 if none */
      referralOff: number;
      /** Who referred them, from the referral the code belongs to */
      referredBy: string | null;
    }
  /** The referral code doesn't exist, or another booking already used it */
  | { ok: false; status: 410; code: "referral_invalid" | "referral_used"; message: string }
  | { ok: false; status: 409 | 422; code: "slot_taken" | "day_full" | "date_unavailable"; message: string; day: DayDetail };

function referralRefused(code: "referral_invalid" | "referral_used"): CreateOutcome {
  return {
    ok: false,
    status: 410,
    code,
    message:
      code === "referral_used"
        ? "This referral link has already been used for a booking, so it can't take $30 off again."
        : "That referral link isn't valid.",
  };
}

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

  const plan = req.planFrequencyId ? getPlanFrequency(req.planFrequencyId) : undefined;
  const store = getBookingStore();
  // A referral code has to belong to a real referral; who referred them comes from that, not from
  // the browser. Whether it's still unused is checked again by the store as it books (a retry of
  // the booking that used it gets that booking back).
  const referral = req.referralCode ? await store.findReferral(req.referralCode) : null;
  if (req.referralCode && !referral) return referralRefused("referral_invalid");
  // A plan's cleanings are 10% off, this first one included, and a referral takes $30 off this
  // cleaning. The server works the price out itself (content/quote.ts).
  const q = quoteFor(pkg, req.rinse, plan?.id, !!referral);
  const from = pkg.needsQuote ? "from " : "";
  const attempt = (slotId: string) =>
    store.create(
      {
        ref: makeRef(),
        date: req.date,
        slotId,
        packageId: pkg.id,
        rinse: req.rinse,
        priceDollars: q.thisCleaning,
        priceIsEstimate: pkg.needsQuote,
        customer: { name: req.name, email: req.email, phone: req.phone },
        address: { street: req.street, city: req.city, zip: req.zip },
        // The plan, and the version of the terms the customer agreed to, are kept with the booking as the record.
        // So are a referral and who made it, since that's who Jimmy owes a thank-you once this house is cleaned.
        notes: [
          referral
            ? `Referral ${referral.code}: $${q.referralOff} off this cleaning (regular ${from}$${q.perCleaning}), referred by ${referral.referrerName}, ` +
              `who chose ${referralRewards[referral.reward].label}. Their thank-you is due once this house is fully cleaned.`
            : "",
          plan
            ? `Recurring plan: ${plan.label}, ${planRules.discountPercent}% off (${from}$${q.perCleaning} a cleaning instead of $${q.regular}; ` +
              `${from}$${q.firstYear} for the year, paid up front after the first cleaning${q.referralOff ? `, after the $${q.referralOff} referral discount` : ""}). ` +
              `Agreed to the Recurring Plan Terms (version ${planRules.termsVersion}).`
            : "",
          req.notes,
        ]
          .filter(Boolean)
          .join(" "),
        idempotencyKey: req.idempotencyKey,
      },
      rules.maxJobsPerDay,
      { referralCode: referral?.code },
    );

  let result: CreateResult;
  if (rules.scheduleMode === "day-only") {
    // The customer only chose a day, so file the job under the first free slot. If a slot
    // goes between the check and the insert, the store refuses it and the next one is tried.
    result = { ok: false, reason: "day_full" };
    for (const slot of rules.slots) {
      result = await attempt(slot.id);
      if (result.ok || result.reason !== "slot_taken") break;
    }
    if (!result.ok && result.reason === "slot_taken") result = { ok: false, reason: "day_full" };
  } else {
    result = await attempt(req.slotId);
  }

  if (result.ok) {
    // A repeat of the same request gets the notice too: the browser only sends one per booking,
    // and if the first answer was lost on the way, this is its only chance.
    const notice = formSubmitEnabled()
      ? bookingNotice(result.booking, rules, {
          plan,
          notes: req.notes,
          referral: referral
            ? { by: referral.referrerName, off: q.referralOff, code: referral.code, reward: referral.reward }
            : undefined,
        })
      : null;
    return { ok: true, booking: result.booking, notice, referralOff: q.referralOff, referredBy: referral?.referrerName ?? null };
  }
  if (result.reason === "referral_invalid" || result.reason === "referral_used") return referralRefused(result.reason);

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
