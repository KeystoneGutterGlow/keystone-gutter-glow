"use client";

import { legalPaths } from "@/content/legalPaths";
import { getPlanFrequency, planAnnualTotal, planCancellationFee, planRules } from "@/content/plans";
import { site } from "@/content/site";
import styles from "./PlanAgreement.module.css";

// The recurring-plan agreement, wherever someone signs up for a plan: the key terms in plain
// sight (with this customer's own numbers), then a box they have to tick. It is never ticked for
// them. The full wording is the Recurring Plan Terms page (content/legal.tsx).

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export function PlanAgreement({
  id,
  frequencyId,
  pricePerCleaning,
  priceIsFrom,
  checked,
  onChange,
  error,
}: {
  id: string;
  frequencyId: string;
  /** Price of one cleaning, rinse included, or null if not known yet */
  pricePerCleaning: number | null;
  /** "Starting at" pricing: the exact price is confirmed before the first cleaning */
  priceIsFrom?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  const plan = getPlanFrequency(frequencyId);
  if (!plan) return null;
  const annual = pricePerCleaning !== null ? planAnnualTotal(pricePerCleaning, plan.id) : null;
  const from = priceIsFrom ? "from " : "";
  const [far, near] = planRules.noticeHours;

  return (
    <div className={styles.box} data-invalid={error ? "" : undefined}>
      <p className={styles.title}>Recurring plan terms</p>
      <ul className={styles.list} id={`${id}-summary`}>
        <li>
          <strong>{plan.label}:</strong> {plan.visits}.
          {annual !== null && (
            <>
              {" "}
              Annual total {from}
              <strong>{money(annual)}</strong> ({plan.perYear} &times; {from}
              {money(pricePerCleaning!)})
              {priceIsFrom && ", confirmed with you before the first cleaning"}.
            </>
          )}
        </li>
        <li>
          You pay the year <strong>in full after the first cleaning</strong>.
        </li>
        <li>
          We show up on each scheduled date and text or email you {far} and {near} hours before. You don&rsquo;t need to be home.
        </li>
        <li>
          It <strong>renews automatically every year until you cancel</strong>.
        </li>
        <li>
          Cancelling costs <strong>{planRules.cancellationFeePercent}% of the annual total</strong>
          {annual !== null && (
            <>
              {" "}
              ({from}
              {money(planCancellationFee(annual))})
            </>
          )}
          .
        </li>
        <li>
          To cancel, call or text <a href={site.phone.href}>{site.phone.display}</a> or email{" "}
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
