import { makeReferralCode } from "@/lib/referral/code";
import type { BookingRecord, BookingStore, CreateResult, ISODate, NewBooking, NewReferral, ReferralRecord, TakenSlot } from "../types";

/**
 * DEMO AND DEVELOPMENT ONLY. lib/storage.ts refuses to select it on a production server unless
 * BOOKING_DEMO_MODE=true, and the booking UI labels every booking made through it as a demo.
 *
 * Creates run through a single queue, so the check ("is the slot free, is the day under the
 * cap?") and the insert happen as one step even when requests arrive at the same moment.
 * That mirrors what the Postgres version does with a unique index plus a per-day lock.
 *
 * Data lives in memory, so it resets on restart and isn't shared between server instances.
 */
export class MemoryBookingStore implements BookingStore {
  private rows: BookingRecord[];
  private referrals: ReferralRecord[] = [];
  private queue: Promise<unknown> = Promise.resolve();

  constructor(seed: BookingRecord[] = []) {
    this.rows = [...seed];
  }

  async listTaken(from: ISODate, to: ISODate): Promise<TakenSlot[]> {
    return this.rows
      .filter((r) => r.status === "confirmed" && r.date >= from && r.date <= to)
      .map((r) => ({ date: r.date, slotId: r.slotId }));
  }

  create(input: NewBooking, maxPerDay: number, opts: { referralCode?: string } = {}): Promise<CreateResult> {
    const attempt = async (): Promise<CreateResult> => {
      // A retried request (double tap, dropped connection) gets the booking it already made.
      if (input.idempotencyKey) {
        const earlier = this.rows.find((r) => r.idempotencyKey === input.idempotencyKey);
        if (earlier) return { ok: true, booking: earlier, duplicate: true };
      }
      // A referral code has to exist and be unused, and is used up by this booking.
      const referral = opts.referralCode ? this.referrals.find((r) => r.code === opts.referralCode) : undefined;
      if (opts.referralCode && !referral) return { ok: false, reason: "referral_invalid" };
      if (referral?.bookingRef) return { ok: false, reason: "referral_used" };
      const sameDay =this.rows.filter((r) => r.status === "confirmed" && r.date === input.date);
      if (sameDay.some((r) => r.slotId === input.slotId)) return { ok: false, reason: "slot_taken" };
      if (sameDay.length >= maxPerDay) return { ok: false, reason: "day_full" };

      const booking: BookingRecord = {
        ...input,
        id: crypto.randomUUID(),
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };
      this.rows.push(booking);
      if (referral) {
        referral.bookingRef = booking.ref;
        referral.bookedAt = booking.createdAt;
      }
      return { ok: true, booking };
    };

    const result = this.queue.then(attempt, attempt);
    this.queue = result.catch(() => undefined);
    return result;
  }

  async createReferral(input: NewReferral): Promise<ReferralRecord> {
    let code = makeReferralCode();
    while (this.referrals.some((r) => r.code === code)) code = makeReferralCode();
    const record: ReferralRecord = { ...input, code, createdAt: new Date().toISOString(), bookingRef: null, bookedAt: null, thankedAt: null };
    this.referrals.push(record);
    return { ...record };
  }

  async findReferral(code: string): Promise<ReferralRecord | null> {
    const r = this.referrals.find((x) => x.code === code);
    return r ? { ...r } : null;
  }
}
