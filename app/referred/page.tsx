import type { Metadata } from "next";
import Link from "next/link";
import { Booking } from "@/components/booking/Booking";
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
import styles from "./referred.module.css";

// The page Jimmy sends people who were referred: the same booking form, with $30 off the cleaning
// they book here and a "Who referred you?" field. It isn't a personal link, so it stays out of
// search results and the sitemap; only people Jimmy sends here should find it.

const off = referralRules.friendDiscount;

export const metadata: Metadata = {
  title: `$${off} off your gutter cleaning`,
  description: `You were referred to Keystone Gutter Glow. Book a vacuum gutter cleaning here and $${off} comes off.`,
  alternates: { canonical: referralPaths.friend },
  robots: { index: false, follow: false },
};

const sections: NavItem[] = [
  { id: "prices", label: "Your price" },
  { id: "what", label: "What you get" },
];

export default function ReferredPage() {
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
            <p className={styles.kicker}>Referred by a neighbor</p>
            <h1 className={styles.title}>${off} off your gutter cleaning.</h1>
            <p className={styles.intro}>
              Someone you know sent you our way. Book here and tell us who it was: ${off} comes off your cleaning, and they get
              a thank-you from us once your gutters are done.
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

        <Booking referral />
      </main>
      <Footer onHome={false} />
    </div>
  );
}
