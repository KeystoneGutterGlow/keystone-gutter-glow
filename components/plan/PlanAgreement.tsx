"use client";

import { legalPaths } from "@/content/legalPaths";
import { getPlanFrequency, planAnnualTotal, planPrice, planRules } from "@/content/plans";
import { site } from "@/content/site";
import styles from "./PlanAgreement.module.css";

// The recurring-plan agreement, wherever someone signs up for a plan: the key terms in plain
// sight (with this customer's own numbers), then a box they have to tick. It is never ticked for
// them. The full wording is the Recurring Plan Terms page (content/legal.tsx).

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export function PlanAgreement({
  id,
  frequencyId,
  regularPrice,
  referralOff = 0,
  priceIsFrom,
  checked,
  onChange,
  error,
}: {
  id: string;
  frequencyId: string;
  /** Regular price of one cleaning, rinse included, or null if not known yet. The plan price is 10% off it. */
  regularPrice: number | null;
  /** A referral discount on the first cleaning, which comes off the first year's payment */
  referralOff?: number;
  /** "Starting at" pricing: the exact price is confirmed before the first cleaning */
  priceIsFrom?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  const plan = getPlanFrequency(frequencyId);
  if (!plan) return null;
  const perCleaning = regularPrice !== null ? planPrice(regularPrice) : null;
  const annual = perCleaning !== null ? planAnnualTotal(perCleaning, plan.id) : null;
  const from = priceIsFrom ? "from " : "";
  const [far, near] = planRules.noticeHours;

  return (
    <div className={styles.box} data-invalid={error ? "" : undefined}>
      <p className={styles.title}>Recurring plan terms</p>
      <ul className={styles.list} id={`${id}-summary`}>
        <li>
          <strong>{plan.label}:</strong> {plan.visits}, each <strong>{planRules.discountPercent}% off</strong>
          {perCleaning !== null ? (
            <>
              : {from}
              {money(perCleaning)} a cleaning instead of {from}
              {money(regularPrice!)}.
            </>
          ) : (
            "."
          )}
        </li>
        <li>
          You pay for the <strong>whole year up front</strong>
          {annual !== null && (
            <>
              , {from}
              <strong>{money(annual)}</strong> ({plan.perYear} &times; {from}
              {money(perCleaning!)})
              {referralOff > 0 && (
                <>
                  , less your {money(referralOff)} referral discount the first year: {from}
                  <strong>{money(annual - referralOff)}</strong>
                </>
              )}
            </>
          )}
          , in one payment after the first cleaning
          {priceIsFrom && ". The exact price is confirmed with you before the first cleaning"}.
        </li>
        <li>
          We show up on each scheduled date and text or email you {far} and {near} hours before. You don&rsquo;t need to be home.
        </li>
        <li>
          It <strong>renews automatically every year until you cancel</strong>.
        </li>
        <li>
          You can cancel any time, and <strong>there&rsquo;s no fee to cancel</strong>. To cancel, call or text <a href={site.phone.href}>{site.phone.display}</a> or email{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </li>
      </ul>
      <label className={styles.check}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-summary${error ? ` ${id}-err` : ""}`}
        />
        <span>
          I have read and agree to the{" "}
          <a href={legalPaths.planTerms} target="_blank" rel="noopener">
            Recurring Plan Terms
          </a>
          , and I understand them.
        </span>
      </label>
      {error && (
        <p id={`${id}-err`} className={styles.err}>
          {error}
        </p>
      )}
    </div>
  );
}
