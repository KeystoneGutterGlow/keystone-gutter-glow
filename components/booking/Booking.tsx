import { bookingRules } from "@/content/booking";
import { referralRules } from "@/content/referral";
import { site } from "@/content/site";
import styles from "./Booking.module.css";
import { BookingApp } from "./BookingApp";

/** The booking section. `referral` is the referral page's version: $30 off, and who referred them. */
export function Booking({ referral = false }: { referral?: boolean }) {
  return (
    <section id="book" className={`${styles.booking} on-dark`} aria-labelledby="book-title">
      <div className={`wrap ${styles.wrap}`}>
        <header className={styles.intro}>
          <h2 id="book-title">{referral ? `Book with $${referralRules.friendDiscount} off` : "Book a cleaning"}</h2>
          <p className={styles.lede}>
            Pick your house and a day{bookingRules.scheduleMode === "day-only" ? "" : " and a start time"}
            {referral ? ", and tell us who sent you" : ""}. It takes about two minutes, and there&rsquo;s nothing to pay
            today.
          </p>
          <p className={styles.alt}>
            Rather do it by phone? Call or text Jimmy at <a href={site.phone.href}>{site.phone.display}</a>
            {referral ? " and mention your referral" : ""}.
          </p>
        </header>
        <BookingApp referral={referral} />
      </div>
    </section>
  );
}
