import { getPlanFrequency, planAnnualTotal, planPrice } from "./plans";
import { type Package, totalFor } from "./pricing";
import { referralRules } from "./referral";

// What a booking costs, worked out the same way in the booking form and on the server (which
// decides). Two discounts can apply:
//  - a recurring plan: 10% off every cleaning (content/plans.ts)
//  - a referral: $30 off the one cleaning booked from the referral page (content/referral.ts).
//    On a plan that's the first cleaning, so it comes off the first year's payment.

export interface Quote {
  /** One cleaning with no discounts: house plus rinse */
  regular: number;
  /** One cleaning at the plan price, or the regular price without a plan */
  perCleaning: number;
  /** The referral discount on this cleaning: 0, or $30 (never more than the cleaning) */
  referralOff: number;
  /** What the cleaning being booked costs */
  thisCleaning: number;
  /** On a plan, the plan's annual total (the figure the plan terms work from) */
  planYear: number | null;
  /** On a plan, what the first year actually costs, paid up front: the annual total less any referral discount */
  firstYear: number | null;
}

export function quoteFor(pkg: Package, rinse: boolean, planFrequencyId?: string | null, referral = false): Quote {
  const regular = totalFor(pkg, rinse);
  const plan = planFrequencyId ? getPlanFrequency(planFrequencyId) : undefined;
  const perCleaning = plan ? planPrice(regular) : regular;
  const referralOff = referral ? Math.min(referralRules.friendDiscount, perCleaning) : 0;
  const planYear = plan ? planAnnualTotal(perCleaning, plan.id) : null;
  return {
    regular,
    perCleaning,
    referralOff,
    thisCleaning: perCleaning - referralOff,
    planYear,
    firstYear: planYear !== null ? planYear - referralOff : null,
  };
}
