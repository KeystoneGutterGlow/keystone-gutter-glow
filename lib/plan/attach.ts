import { getPlanFrequency, type PlanFrequency } from "@/content/plans";
import { getPackage } from "@/content/pricing";
import { quoteFor, type Quote } from "@/content/quote";
import { planNote, today } from "@/lib/booking/service";
import { getBookingStore } from "@/lib/booking/store";
import type { BookingRecord } from "@/lib/booking/types";

// "Make it recurring" on the booking confirmation. The plan starts with the cleaning just booked,
// so that booking changes to the plan price (10% off, keeping any referral discount) and its notes
// record the plan and the terms version, the same as booking a plan in the first place.
//
// The booking has to be confirmed, still to come, and booked with the same email address, so a
// reference number on its own can't change someone else's booking. Sending the same plan twice
// (a retry after the email to Jimmy failed) changes nothing the second time.

export type AttachOutcome =
  | { ok: true; booking: BookingRecord; plan: PlanFrequency; q: Quote; priceBefore: number; already: boolean }
  | { ok: false; status: 404 | 409 | 422; message: string };

const PLAN_LINE = /Recurring plan: ([^,]+),/;

export async function attachPlanToBooking(input: { ref: string; email: string; frequencyId: string }): Promise<AttachOutcome> {
  const store = getBookingStore();
  const booking = await store.findBooking(input.ref);
  const plan = getPlanFrequency(input.frequencyId);
  if (!booking || booking.status !== "confirmed" || booking.customer.email.toLowerCase() !== input.email.toLowerCase() || !plan) {
    return { ok: false, status: 404, message: "We couldn't find that booking to add the plan to." };
  }
  if (booking.date < today()) {
    return { ok: false, status: 422, message: "That cleaning has already happened, so the plan can't start with it." };
  }

  const pkg = getPackage(booking.packageId)!;
  const referral = await store.findReferralByBooking(booking.ref);
  const q = quoteFor(pkg, booking.rinse, plan.id, !!referral);

  const existing = PLAN_LINE.exec(booking.notes)?.[1];
  if (existing === plan.label) return { ok: true, booking, plan, q, priceBefore: booking.priceDollars, already: true };
  if (existing) {
    return { ok: false, status: 409, message: `That booking is already on a plan (${existing.toLowerCase()}). To change it, call or text Jimmy.` };
  }

  const updated = await store.updateBooking(booking.ref, {
    priceDollars: q.thisCleaning,
    notes: [planNote(plan, q, pkg.needsQuote), "Plan added after booking.", booking.notes].filter(Boolean).join(" "),
  });
  if (!updated) return { ok: false, status: 404, message: "We couldn't find that booking to add the plan to." };
  return { ok: true, booking: updated, plan, q, priceBefore: booking.priceDollars, already: false };
}
