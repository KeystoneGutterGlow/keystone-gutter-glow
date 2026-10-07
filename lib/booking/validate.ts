import { bookingRules } from "@/content/booking";
import { getPackage, type PackageId } from "@/content/pricing";
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
}

export interface CleanBookingRequest extends Omit<BookingRequest, "packageId" | "company"> {
  packageId: PackageId;
}

export type FieldErrors = Partial<Record<keyof BookingRequest, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export function formatPhone(digits: string): string {
  const d = normalizePhone(digits);
  if (d.length !== 10) return digits;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Contact + address fields only. Used per-step in the form. */
export function validateContact(input: Pick<BookingRequest, "name" | "email" | "phone" | "street" | "city" | "zip">): FieldErrors {
  const errors: FieldErrors = {};
  if (input.street.trim().length < 4) errors.street = "Add the street address where the gutters are.";
  if (input.city.trim().length < 2) errors.city = "Which town is the house in?";
  if (!/^\d{5}$/.test(input.zip.trim())) errors.zip = "Five-digit ZIP, please.";
  if (input.name.trim().length < 2) errors.name = "Who should we ask for?";
  if (normalizePhone(input.phone).length !== 10) errors.phone = "A 10-digit phone number, in case we need to reach you on the day.";
  if (!EMAIL_RE.test(input.email.trim())) errors.email = "That email doesn't look right. The confirmation goes here.";
  return errors;
}

export function parseBookingRequest(
  body: unknown,
): { ok: true; data: CleanBookingRequest } | { ok: false; errors: FieldErrors; spam?: boolean } {
  if (!body || typeof body !== "object") return { ok: false, errors: {} };
  const b = body as Record<string, unknown>;

  if (str(b.company, 200)) return { ok: false, errors: {}, spam: true };

  const req: BookingRequest = {
    packageId: str(b.packageId, 40),
    rinse: b.rinse === true,
    date: str(b.date, 10),
    slotId: str(b.slotId, 5),
    name: str(b.name, 120),
    email: str(b.email, 200).toLowerCase(),
    phone: str(b.phone, 40),
    street: str(b.street, 200),
    city: str(b.city, 80),
    zip: str(b.zip, 10),
    notes: str(b.notes, 1000),
  };

  const errors: FieldErrors = validateContact(req);
  if (!getPackage(req.packageId)) errors.packageId = "Pick the house type that fits best.";
  if (!isISODate(req.date)) errors.date = "Pick a day.";
  if (!bookingRules.slots.some((s) => s.id === req.slotId)) errors.slotId = "Pick a start time.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: { ...req, packageId: req.packageId as PackageId, phone: normalizePhone(req.phone) },
  };
}
