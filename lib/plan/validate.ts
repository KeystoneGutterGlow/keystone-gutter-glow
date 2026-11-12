import { getPlanFrequency, type PlanFrequencyId } from "@/content/plans";
import { cleanText, normalizePhone, PLAN_TERMS_ERROR, validateContact } from "@/lib/booking/validate";

// Shared by the recurring-plan dialog (instant feedback) and its API route (authoritative).

export interface PlanRequest {
  frequencyId: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  notes: string;
  /** Ticked "I agree to the Recurring Plan Terms". Required. */
  planTerms: boolean;
}

export interface CleanPlanRequest extends Omit<PlanRequest, "frequencyId"> {
  frequencyId: PlanFrequencyId;
}

export type PlanFieldErrors = Partial<Record<keyof PlanRequest, string>>;

export function validatePlan(input: PlanRequest): PlanFieldErrors {
  const errors: PlanFieldErrors = validateContact(input);
  if (!getPlanFrequency(input.frequencyId)) errors.frequencyId = "Pick how often you want it cleaned.";
  if (!input.planTerms) errors.planTerms = PLAN_TERMS_ERROR.replace(", or choose Just this once", "");
  return errors;
}

export function parsePlanRequest(
  body: unknown,
): { ok: true; data: CleanPlanRequest } | { ok: false; errors: PlanFieldErrors; spam?: boolean } {
  if (!body || typeof body !== "object") return { ok: false, errors: {} };
  const b = body as Record<string, unknown>;
  if (cleanText(b.company, 200)) return { ok: false, errors: {}, spam: true };

  const req: PlanRequest = {
    frequencyId: cleanText(b.frequencyId, 20),
    name: cleanText(b.name, 120),
    email: cleanText(b.email, 200).toLowerCase(),
    phone: cleanText(b.phone, 40),
    street: cleanText(b.street, 200),
    city: cleanText(b.city, 80),
    zip: cleanText(b.zip, 10),
    notes: cleanText(b.notes, 1000, true),
    planTerms: b.planTerms === true,
  };

  const errors = validatePlan(req);
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { ...req, frequencyId: req.frequencyId as PlanFrequencyId, phone: normalizePhone(req.phone) } };
}
