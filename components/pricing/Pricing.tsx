import Link from "next/link";
import { BookLink } from "@/components/BookLink";
import { legalPaths } from "@/content/legalPaths";
import { planFrequencies, recommendedPlan } from "@/content/plans";
import { packages, priceLabel, rinse } from "@/content/pricing";
import { site } from "@/content/site";
import { House } from "./Houses";
import styles from "./Pricing.module.css";

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
            Split-levels count as two-story.
          </p>
        </div>

        {/* Each button picks that plan in the booking form below and jumps to it. The plan travels
            with the booking, so this works with or without email set up. */}
        <div className={styles.plan}>
          <p>
            <strong>Want it on a schedule?</strong> Every 3, 4 or 6 months, or once a year. We recommend every 6
            months. Pick one and book the first cleaning. Plans renew yearly until you cancel; see the{" "}
            <Link href={legalPaths.planTerms} className="textlink">
              Recurring Plan Terms
            </Link>
            .
          </p>
          <BookLink className="btn" plan={recommendedPlan}>
            Set up a recurring plan
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
