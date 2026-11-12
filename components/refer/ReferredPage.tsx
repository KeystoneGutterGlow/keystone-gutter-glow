import Link from "next/link";
import { Booking } from "@/components/booking/Booking";
import type { ReferralLink } from "@/components/booking/BookingApp";
import { Footer } from "@/components/footer/Footer";
import { Keystone } from "@/components/Keystone";
import { MobileNav } from "@/components/nav/MobileNav";
import { Rail } from "@/components/nav/Rail";
import type { NavItem } from "@/content/nav";
import { planRules } from "@/content/plans";
import { packages } from "@/content/pricing";
import { quoteFor } from "@/content/quote";
import { referralPaths, referralRules } from "@/content/referral";
import { jobParts } from "@/content/services";
import { site } from "@/content/site";
import styles from "./Referred.module.css";

// The referral booking page. Jimmy sends each referred friend their own link, /referred/<code>:
//   ok        the code is real and unused: $30 off, and the booking form takes the code with it
//   used      another booking already used the code
//   invalid   no such code, or /referred with no code at all
//   offline   the database couldn't be reached

export type ReferredState =
  | { kind: "ok"; referral: ReferralLink }
  | { kind: "used" }
  | { kind: "invalid"; typed: boolean }
  | { kind: "offline" };

const off = referralRules.friendDiscount;

const sections: NavItem[] = [
  { id: "prices", label: "Your price" },
  { id: "what", label: "What you get" },
];

export function ReferredPage({ state }: { state: ReferredState }) {
  if (state.kind !== "ok") return <NoDiscount state={state} />;
  const { referral } = state;
  const first = referral.referrerName.split(/\s+/)[0];
  return (
    <div>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <a className="skip" href="#book">
        Skip to booking
      </a>
      <Rail items={sections} endId="book" endLabel={`Book with $${off} off`} homeHref="/" homeLink planOffer />
      <MobileNav items={sections} endId="book" homeHref="/" bookLabel={`Book · $${off} off`} />

      <main id="main">
        <header id="top" className={styles.hero}>
          <div className={`${styles.gutter} gutter-face`} aria-hidden="true" data-gutter-anchor="" />
          <div className="wrap">
            <p className={styles.kicker}>Referred by {first}</p>
            <h1 className={styles.title}>${off} off your gutter cleaning.</h1>
            <p className={styles.intro}>
              {first} sent you our way. Book here and ${off} comes off your cleaning, and {first} gets a thank-you from us once
              your gutters are done. This link is yours and works for one booking.
            </p>
            <a href="#book" className="btn">
              Book with ${off} off
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </a>
          </div>
        </header>

        <section id="prices" className={styles.prices} aria-labelledby="prices-title">
          <div className="wrap">
            <h2 id="prices-title">Your price</h2>
            <ul className={styles.priceList}>
              {packages.map((p) => (
                <li key={p.id}>
                  <span className={styles.house}>
                    <strong>{p.name}</strong>
                    <span>{p.fits}</span>
                  </span>
                  <span className={styles.price}>
                    <s>
                      <span className="vh">Regular price </span>${p.price}
                    </s>{" "}
                    <span className="vh">, yours </span>
                    {p.isFrom && <small>from </small>}${quoteFor(p, false, null, true).thisCleaning}
                  </span>
                </li>
              ))}
            </ul>
            <p className={styles.note}>
              The ${off} comes off the one cleaning you book here. Want it on a schedule? Recurring plans are{" "}
              {planRules.discountPercent}% off every cleaning, and your ${off} comes off the first one. Nothing is charged when
              you book; you pay after the job.
            </p>
          </div>
        </section>

        <section id="what" className={styles.what} aria-labelledby="what-title">
          <div className="wrap">
            <h2 id="what-title">What you get</h2>
            <ol className={styles.whatList}>
              {jobParts
                .filter((j) => !j.addOn)
                .map((j) => (
                  <li key={j.n}>
                    <Keystone n={j.n} size={28} />
                    <div>
                      <h3>{j.title}</h3>
                      <p>{j.body}</p>
                    </div>
                  </li>
                ))}
            </ol>
            <p className={styles.more}>
              Done by vacuum from the ground, so nothing lands in your flower beds, and you don&rsquo;t need to be home.{" "}
              <Link href="/" className="textlink">
                More about how we work
              </Link>{" "}
              or call or text Jimmy at <a href={site.phone.href}>{site.phone.display}</a>.
            </p>
          </div>
        </section>

        <Booking referral={referral} />
      </main>
      <Footer onHome={false} />
    </div>
  );
}

/** Any page without a usable code: says why, and offers booking at the regular price. */
function NoDiscount({ state }: { state: Exclude<ReferredState, { kind: "ok" }> }) {
  const copy = {
    used: {
      title: "This referral link has been used.",
      body: `Each referral link takes $${off} off one booking, and this one already has its booking. If that wasn't you, or you'd like to book another house, call or text Jimmy.`,
    },
    invalid: {
      title: state.kind === "invalid" && state.typed ? "That referral link isn't valid." : `$${off} off when a neighbor refers you.`,
      body:
        state.kind === "invalid" && state.typed
          ? "Check you have the whole link from Jimmy's text or email. If it still doesn't work, call or text him."
          : `Referred by someone? Jimmy sends you your own link, which takes $${off} off a cleaning. Don't have one? Ask whoever referred you to fill in our referral form, or call or text Jimmy.`,
    },
    offline: {
      title: "We can't check your link right now.",
      body: "Try again in a few minutes, or call or text Jimmy and he'll book you with your referral.",
    },
  }[state.kind];

  return (
    <div>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Rail items={[]} endId="__none" endLabel="Book a cleaning" homeHref="/" bookHref="/#book" homeLink planOffer />
      <MobileNav items={[]} endId="__none" homeHref="/" bookHref="/#book" bookLabel="Book a cleaning" />
      <main id="main">
        <header id="top" className={`${styles.hero} ${styles.heroOnly}`}>
          <div className={`${styles.gutter} gutter-face`} aria-hidden="true" data-gutter-anchor="" />
          <div className="wrap">
            <p className={styles.kicker}>Referrals</p>
            <h1 className={styles.title}>{copy.title}</h1>
            <p className={styles.intro}>{copy.body}</p>
            <div className={styles.actions}>
              <a href={site.phone.href} className="btn">
                Call or text {site.phone.display}
              </a>
              <Link href="/#book" className="textlink">
                Book at the regular price
              </Link>
              <Link href={referralPaths.refer} className="textlink">
                Refer someone yourself
              </Link>
            </div>
          </div>
        </header>
      </main>
      <Footer onHome={false} />
    </div>
  );
}
