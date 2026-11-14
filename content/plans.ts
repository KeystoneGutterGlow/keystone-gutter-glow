// Recurring cleaning plans. The frequencies are Jimmy's; the plan rules below are Sam's, for Jimmy
// (2026-11-11, and the 10% plan discount 2026-11-12). The full wording is the Recurring Plan Terms
// page (content/legal.tsx), and the customer has to tick a box agreeing to it before booking a plan
// or sending a plan request.

export type PlanFrequencyId = "3-months" | "4-months" | "6-months" | "12-months";

export interface PlanFrequency {
  id: PlanFrequencyId;
  label: string;
  visits: string;
  /** Cleanings in a plan year */
  perYear: number;
}

export const planFrequencies: PlanFrequency[] = [
  { id: "6-months", label: "Every 6 months", visits: "2 cleanings a year", perYear: 2 },
  { id: "3-months", label: "Every 3 months", visits: "4 cleanings a year", perYear: 4 },
  { id: "4-months", label: "Every 4 months", visits: "3 cleanings a year", perYear: 3 },
  { id: "12-months", label: "Once a year", visits: "1 cleaning a year", perYear: 1 },
];

/** Recommended to every customer, and selected when the dialog opens. */
export const recommendedPlan: PlanFrequencyId = "6-months";

export const recommendedWhy =
  "Gutters fill up fastest in two seasons: spring seeds and fall leaves. A cleaning every 6 months clears each one before it can clog or overflow.";

export function getPlanFrequency(id: string) {
  return planFrequencies.find((f) => f.id === id);
}

/** The plan rules every customer agrees to. Change them here and on the terms page together. */
export const planRules = {
  /** Bump this whenever the Recurring Plan Terms change, so each agreement records which version it was. */
  termsVersion: "2026-11-14.2",
  /** Every cleaning on a plan is this much off the regular price */
  discountPercent: 10,
  /** Notice before every visit, in hours */
  noticeHours: [72, 24] as const,
  /** The year is paid up front: the whole annual total in one payment, after the year's first cleaning */
  paidInFullAfterFirst: true,
  /** Renews every plan year until the customer cancels */
  autoRenews: true,
  /** Cancelling is free: no cancellation fee (Sam, 2026-11-14) */
  cancellationFee: false,
  /** What's already been paid isn't refunded on cancelling, unused cleanings included (Sam, 2026-11-14) */
  refundOnCancel: false,
};

/**
 * One cleaning's price on a plan: the regular price less the plan discount, rounded down to the
 * whole dollar. Rounding down means the saving is never less than the advertised 10%, and the
 * booking database keeps prices in whole dollars.
 */
export function planPrice(regularPrice: number): number {
  return Math.floor((regularPrice * (100 - planRules.discountPercent)) / 100);
}

/** What a plan saves on one cleaning, in whole dollars. */
export function planSaving(regularPrice: number): number {
  return regularPrice - planPrice(regularPrice);
}

/** The ad line, wherever the site promotes plans. */
export const planOffer = {
  /** "10% off" */
  off: `${planRules.discountPercent}% off`,
  /** "Save 10%" */
  save: `Save ${planRules.discountPercent}%`,
};

/** Price per cleaning (the plan price) times the cleanings in a plan year. */
export function planAnnualTotal(pricePerCleaning: number, frequencyId: string): number | null {
  const f = getPlanFrequency(frequencyId);
  return f ? pricePerCleaning * f.perYear : null;
}

