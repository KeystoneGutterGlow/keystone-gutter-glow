import type { PackageId } from "@/content/pricing";

/** Calendar date in the business time zone, "YYYY-MM-DD". Never a JS Date, to dodge TZ drift. */
export type ISODate = string;
/** Start time id from bookingRules.slots, "HH:MM" */
export type SlotId = string;

export interface BookingRecord {
  id: string;
  /** Short reference shown to the customer, e.g. KGG-7F3K2 */
  ref: string;
  date: ISODate;
  slotId: SlotId;
  packageId: PackageId;
  rinse: boolean;
  /** Computed on the server from content/pricing.ts */
  priceDollars: number;
  priceIsEstimate: boolean;
  customer: { name: string; email: string; phone: string };
  address: { street: string; city: string; zip: string };
  notes: string;
  /** Sent by the browser once per booking attempt, so a retry can't book twice */
  idempotencyKey?: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
}

export type NewBooking = Omit<BookingRecord, "id" | "status" | "createdAt">;

export type CreateResult =
  | { ok: true; booking: BookingRecord; duplicate?: boolean }
  /** referral_invalid / referral_used: the referral code doesn't exist, or another booking already used it */
  | { ok: false; reason: "slot_taken" | "day_full" | "referral_invalid" | "referral_used" };

/** A referral from the /refer form (db/migrations/004_referrals.sql) */
export interface NewReferral {
  referrerName: string;
  referrerPhone: string;
  /** "" when they didn't give one */
  referrerEmail: string;
  reward: "cash" | "plan";
  friendName: string;
  friendPhone: string;
  friendEmail: string;
  friendTown: string;
  notes: string;
}

export interface ReferralRecord extends NewReferral {
  /** The friend's personal code: /referred/<code>. Works for one booking. */
  code: string;
  createdAt: string;
  /** The booking that used the code, once the friend books */
  bookingRef: string | null;
  bookedAt: string | null;
  /** Set by Jimmy once he's paid the thank-you */
  thankedAt: string | null;
}

export interface TakenSlot {
  date: ISODate;
  slotId: SlotId;
}

/**
 * Persistence boundary. The UI and API never touch storage directly, so swapping the
 * in-memory mock for Postgres/Supabase is a matter of choosing a different implementation.
 */
export interface BookingStore {
  /** Confirmed bookings between two dates, inclusive. Only what availability needs. */
  listTaken(from: ISODate, to: ISODate): Promise<TakenSlot[]>;
  /**
   * Create a booking or refuse it. MUST be atomic with respect to other creates: the
   * implementation itself guarantees one booking per (date, slot) and at most
   * `maxPerDay` per date, even under concurrent requests. With a referral code, it also
   * refuses a code that doesn't exist or was already used, and links the code to the new
   * booking in the same step, so one code can never pay for two bookings.
   */
  create(input: NewBooking, maxPerDay: number, opts?: { referralCode?: string }): Promise<CreateResult>;
  /** The booking with this reference, or null. */
  findBooking(ref: string): Promise<BookingRecord | null>;
  /** Change a confirmed booking's price and notes. Returns the updated booking, or null if there's none to change. */
  updateBooking(ref: string, patch: { priceDollars: number; notes: string }): Promise<BookingRecord | null>;
  /** The referral a booking used, or null. */
  findReferralByBooking(ref: string): Promise<ReferralRecord | null>;
  /**
   * Save a referral with a new, unique code. If the same person already referred the same friend and
   * that code hasn't been used yet (they sent the form again), that referral is updated and returned
   * instead, so the friend never ends up with two codes.
   */
  createReferral(input: NewReferral): Promise<ReferralRecord>;
  /** The referral with this code, or null. */
  findReferral(code: string): Promise<ReferralRecord | null>;
}

export type SlotState = "open" | "taken" | "day_full" | "closed";

export interface SlotAvailability {
  id: SlotId;
  label: string;
  part: string;
  state: SlotState;
}

export type DayStatus = "open" | "full" | "closed" | "unavailable";

export interface DaySummary {
  date: ISODate;
  status: DayStatus;
  /** Bookable jobs left that day (min of cap headroom and open slots) */
  remaining: number;
  /** Why a day can't be booked, for the calendar's accessible label */
  reason?: "past" | "too_soon" | "closed" | "blackout" | "beyond_horizon" | "full";
}

export interface DayDetail extends DaySummary {
  slots: SlotAvailability[];
}
