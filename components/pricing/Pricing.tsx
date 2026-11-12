import Link from "next/link";
import { BookLink } from "@/components/BookLink";
import { legalPaths } from "@/content/legalPaths";
import { planAnnualTotal, planFrequencies, planPrice, planRules, recommendedPlan } from "@/content/plans";
import { getPackage, packages, priceLabel, rinse } from "@/content/pricing";
import { site } from "@/content/site";
import { House } from "./Houses";
import styles from "./Pricing.module.css";

const pct = planRules.discountPercent;
// The worked example in the plan box: a two-story house every 6 months
const example = getPackage("two-story")!;
const examplePlan = planPrice(example.price);

export function Pricing() {
  return (
    <section id="prices" className={styles.pricing} aria-labelledby="prices-title">
      <div className="wrap">
        <header className={styles.head}>
          <h2 id="prices-title">Prices</h2>
          <p>Find the house that looks like yours. That&rsquo;s the price.</p>
        </header>

        <ul className={styles.street}>
          {packages.map((p) => (
            <li key={p.id} className={styles[p.shape]}>
              <BookLink packageId={p.id} className={styles.house}>
                <House shape={p.shape} className={styles.svg} />
                <span className={styles.meta}>
                  <span className={styles.name}>{p.name}</span>
                  <span className={styles.price}>
                    {p.isFrom ? (
                      <>
                        <small>from</small> ${p.price}
                      </>
                    ) : (
                      `$${p.price}`
                    )}
                  </span>
                  <span className={styles.planPrice}>
                    {p.isFrom ? "from " : ""}${planPrice(p.price)} on a plan
                  </span>
                  <span className={styles.fits}>{p.fits}</span>
                  <span className={styles.go}>
                    {p.needsQuote ? "Request a quote" : "Book this house"}
                    <span aria-hidden="true"> →</span>
                    <span className="vh">
                      {" "}
                      ({p.name}, {priceLabel(p)})
                    </span>
                  </span>
                </span>
              </BookLink>
            </li>
          ))}
        </ul>

        <div className={styles.under}>
          <p className={styles.includes}>
            <strong>Every price includes</strong> all gutter runs vacuumed out, downspouts cleared and flow-tested, and
            before-and-after photos.
          </p>
          <p className={styles.rinse}>
            <strong>Add a rinse: +${rinse.price}</strong>
            {rinse.regularPrice ? <span className={styles.was}> (normally ${rinse.regularPrice})</span> : null}
            <br />
            {rinse.short}
          </p>
          <p className={styles.terms}>
            {site.policies.payAfter && <>No deposit. You pay after the job, from the invoice. </>}
            Recurring plans are paid a year at a time, up front, after the first cleaning. Split-levels count as two-story.
          </p>
        </div>

        {/* Each button picks that plan in the booking form below and jumps to it. The plan travels
            with the booking, so this works with or without email set up. */}
        <div className={styles.plan} id="plans">
          <h3 className={styles.planHead}>
            <span className={styles.planTag}>{pct}% off</span> every cleaning on a recurring plan
          </h3>
          <p>
            Every 3, 4 or 6 months, or once a year. We recommend every 6 months: a {example.name.toLowerCase()} house is $
            {examplePlan} a cleaning instead of ${example.price}, ${planAnnualTotal(examplePlan, "6-months")} for the year.{" "}
            <strong>You pay for the whole year up front,</strong> in one payment after the first cleaning, and the plan renews
            every year until you cancel. See the{" "}
            <Link href={legalPaths.planTerms} className="textlink">
              Recurring Plan Terms
            </Link>
            .
          </p>
          <BookLink className="btn" plan={recommendedPlan}>
            Set up a plan and save {pct}%
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </BookLink>
          <ul className={styles.planChoices} aria-label="Or pick how often">
            {planFrequencies.map((f) => (
              <li key={f.id}>
                <BookLink className={styles.planChoice} plan={f.id}>
                  {f.label}
                  {f.id === recommendedPlan && <span className={styles.planRec}>· recommended</span>}
                </BookLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
