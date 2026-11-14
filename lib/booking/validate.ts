import { stateForZip } from "@/content/area";
import { bookingRules, type BookingRules } from "@/content/booking";
import { getPlanFrequency } from "@/content/plans";
import { getPackage, type PackageId } from "@/content/pricing";
import { normalizeReferralCode } from "@/lib/referral/code";
import { isISODate } from "./dates";

// Shared by the server (authoritative) and the booking form (instant feedback).
// Messages are written to be shown next to the field as-is.

export interface BookingRequest {
  packageId: string;
  rinse: boolean;
  date: string;
  slotId: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  notes: string;
  /** Honeypot. Real people never see or fill it. */
  company?: string;
  idempotencyKey?: string;
  /** The recurring plan they're signing up for, if any (content/plans.ts) */
  planFrequencyId?: string;
  /** Ticked "I agree to the Recurring Plan Terms". Required whenever there's a plan. */
  planTerms?: boolean;
  /**
   * The personal referral code from /referred/<code>: $30 off this cleaning (content/referral.ts).
   * The server looks it up, and the database uses it up with the booking, so it works once.
   */
  referralCode?: string;
}

export interface CleanBookingRequest extends Omit<BookingRequest, "packageId" | "company"> {
  packageId: PackageId;
}

export type FieldErrors = Partial<Record<keyof BookingRequest, string>>;

export const PLAN_TERMS_ERROR = "Tick the box to agree to the recurring plan terms, or choose Just this once.";
export const REFERRAL_LINK_ERROR = "That referral link isn't valid. Use the link Jimmy sent you, or call or text him.";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const IDEMPOTENCY_RE = /^[\w-]{8,80}$/;

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

/** A US number: 10 digits, and neither the area code nor the exchange starts with 0 or 1. */
export function isUsPhone(raw: string): boolean {
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(normalizePhone(raw));
}

export function formatPhone(digits: string): string {
  const d = normalizePhone(digits);
  if (d.length !== 10) return digits;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Trims, caps the length, and strips control characters. Newlines survive only if asked for. */
export function cleanText(v: unknown, max: number, multiline = false): string {
  if (typeof v !== "string") return "";
  const pattern = multiline ? /[\u0000-\u0009\u000b-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g;
  return v.replace(pattern, " ").trim().slice(0, max);
}

export function cleanIdempotencyKey(v: unknown): string | undefined {
  return typeof v === "string" && IDEMPOTENCY_RE.test(v) ? v : undefined;
}

/** Contact + address fields only. Used per-step in the form. */
export function validateContact(input: Pick<BookingRequest, "name" | "email" | "phone" | "street" | "city" | "zip">): FieldErrors {
  const errors: FieldErrors = {};
  if (input.street.trim().length < 4) errors.street = "Add the street address where the gutters are.";
  if (input.city.trim().length < 2) errors.city = "Which town is the house in?";
  if (!/^\d{5}$/.test(input.zip.trim())) errors.zip = "Five-digit ZIP, please.";
  // Jimmy can only do business in Pennsylvania (content/area.ts).
  else if (stateForZip(input.zip.trim()) !== "PA") errors.zip = "We only work in Pennsylvania, so we can't take this address.";
  if (input.name.trim().length < 2) errors.name = "Who should we ask for?";
  if (!isUsPhone(input.phone)) errors.phone = "A 10-digit phone number, in case we need to reach you on the day.";
  if (!EMAIL_RE.test(input.email.trim())) errors.email = "That email doesn't look right. The confirmation goes here.";
  return errors;
}

export function parseBookingRequest(
  body: unknown,
  rules: BookingRules = bookingRules,
): { ok: true; data: CleanBookingRequest } | { ok: false; errors: FieldErrors; spam?: boolean } {
  if (!body || typeof body !== "object") return { ok: false, errors: {} };
  const b = body as Record<string, unknown>;

  if (cleanText(b.company, 200)) return { ok: false, errors: {}, spam: true };

  const req: BookingRequest = {
    packageId: cleanText(b.packageId, 40),
    rinse: b.rinse === true,
    date: cleanText(b.date, 10),
    slotId: cleanText(b.slotId, 5),
    name: cleanText(b.name, 120),
    email: cleanText(b.email, 200).toLowerCase(),
    phone: cleanText(b.phone, 40),
    street: cleanText(b.street, 200),
    city: cleanText(b.city, 80),
    zip: cleanText(b.zip, 10),
    notes: cleanText(b.notes, 1000, true),
    idempotencyKey: cleanIdempotencyKey(b.idempotencyKey),
    // Anything unknown just means no plan.
    planFrequencyId: getPlanFrequency(cleanText(b.planFrequencyId, 20))?.id,
    planTerms: b.planTerms === true,
    referralCode: normalizeReferralCode(b.referralCode) ?? undefined,
  };

  const errors: FieldErrors = validateContact(req);
  // A code that can't be a code is refused here. Whether it exists, and is unused, is up to the database.
  if (b.referralCode != null && b.referralCode !== "" && !req.referralCode) errors.referralCode = REFERRAL_LINK_ERROR;
  if (!getPackage(req.packageId)) errors.packageId = "Pick the house type that fits best.";
  if (!isISODate(req.date)) errors.date = "Pick a day.";
  // In day-only mode the server chooses the slot, so anything the client sends is ignored.
  if (rules.scheduleMode === "day-only") req.slotId = "";
  else if (!rules.slots.some((s) => s.id === req.slotId)) errors.slotId = "Pick a start time.";
  // A plan renews automatically and is paid a year up front, so it needs the customer's explicit agreement.
  if (req.planFrequencyId && !req.planTerms) errors.planTerms = PLAN_TERMS_ERROR;

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: { ...req, packageId: req.packageId as PackageId, phone: normalizePhone(req.phone) },
  };
}
