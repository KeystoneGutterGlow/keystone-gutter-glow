import { isReferralReward, type ReferralReward } from "@/content/referral";
import { cleanText, EMAIL_RE, isUsPhone, normalizePhone } from "@/lib/booking/validate";

// The "Refer someone" form on /refer. Shared by the form (instant feedback) and its API route
// (authoritative). The customer gives their own details, picks their thank-you, and gives their
// friend's details so Jimmy can get in touch and send them the $30-off booking page.

export interface ReferralRequest {
  name: string;
  phone: string;
  /** Optional: Jimmy can reach them by phone */
  email: string;
  reward: ReferralReward | "";
  friendName: string;
  friendPhone: string;
  friendEmail: string;
  /** Optional */
  friendTown: string;
  notes: string;
  /** Ticked "they're happy to hear from Jimmy". Required. */
  consent: boolean;
}

export interface CleanReferralRequest extends Omit<ReferralRequest, "reward"> {
  reward: ReferralReward;
}

export type ReferralFieldErrors = Partial<Record<keyof ReferralRequest, string>>;

/** The order fields appear in, for focusing the first one with a problem */
export const REFERRAL_FIELDS: Array<keyof ReferralRequest> = [
  "name",
  "phone",
  "email",
  "reward",
  "friendName",
  "friendPhone",
  "friendEmail",
  "friendTown",
  "notes",
  "consent",
];

export function validateReferral(input: ReferralRequest): ReferralFieldErrors {
  const errors: ReferralFieldErrors = {};
  if (input.name.trim().length < 2) errors.name = "Your name, so we know who to thank.";
  if (!isUsPhone(input.phone)) errors.phone = "A 10-digit phone number, so Jimmy can reach you about your thank-you.";
  if (input.email.trim() && !EMAIL_RE.test(input.email.trim())) errors.email = "That email doesn't look right. You can leave it blank.";
  if (!input.reward) errors.reward = "Pick your thank-you.";
  if (input.friendName.trim().length < 2) errors.friendName = "Who are you referring?";
  const friendPhone = input.friendPhone.trim();
  const friendEmail = input.friendEmail.trim();
  if (!friendPhone && !friendEmail) errors.friendPhone = "Their phone number or email, so Jimmy can reach them.";
  else {
    if (friendPhone && !isUsPhone(friendPhone)) errors.friendPhone = "A 10-digit phone number, or leave it blank and give their email.";
    if (friendEmail && !EMAIL_RE.test(friendEmail)) errors.friendEmail = "That email doesn't look right.";
  }
  if (friendPhone && isUsPhone(friendPhone) && isUsPhone(input.phone) && normalizePhone(friendPhone) === normalizePhone(input.phone)) {
    errors.friendPhone = "That's your own number. Give us theirs.";
  }
  if (!input.consent) errors.consent = "Tick the box to confirm they're happy to hear from Jimmy.";
  return errors;
}

export function parseReferralRequest(
  body: unknown,
): { ok: true; data: CleanReferralRequest } | { ok: false; errors: ReferralFieldErrors; spam?: boolean } {
  if (!body || typeof body !== "object") return { ok: false, errors: {} };
  const b = body as Record<string, unknown>;
  if (cleanText(b.company, 200)) return { ok: false, errors: {}, spam: true };

  const req: ReferralRequest = {
    name: cleanText(b.name, 120),
    phone: cleanText(b.phone, 40),
    email: cleanText(b.email, 200).toLowerCase(),
    reward: isReferralReward(b.reward) ? b.reward : "",
    friendName: cleanText(b.friendName, 120),
    friendPhone: cleanText(b.friendPhone, 40),
    friendEmail: cleanText(b.friendEmail, 200).toLowerCase(),
    friendTown: cleanText(b.friendTown, 80),
    notes: cleanText(b.notes, 1000, true),
    consent: b.consent === true,
  };

  const errors = validateReferral(req);
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      ...req,
      reward: req.reward as ReferralReward,
      phone: normalizePhone(req.phone),
      friendPhone: req.friendPhone ? normalizePhone(req.friendPhone) : "",
    },
  };
}
