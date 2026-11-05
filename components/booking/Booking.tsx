import { bookingRules } from "@/content/booking";
import { site } from "@/content/site";
import { planRequestsOpen } from "@/lib/plan/open";
import styles from "./Booking.module.css";
import { BookingApp } from "./BookingApp";

export function Booking() {
  return (
    <section id="book" className={`${styles.booking} on-dark`} aria-labelledby="book-title">
      <div className={`wrap ${styles.wrap}`}>
        <header className={styles.intro}>
          <h2 id="book-title">Book a cleaning</h2>
          <p className={styles.lede}>
            Pick your house and a day{bookingRules.scheduleMode === "day-only" ? "" : " and a start time"}. It takes about
            two minutes, and there&rsquo;s nothing to pay today.
          </p>
          <p className={styles.alt}>
            Rather do it by phone? Call or text Jimmy at <a href={site.phone.href}>{site.phone.display}</a>.
          </p>
        </header>
        <BookingApp planRequests={planRequestsOpen()} />
      </div>
    </section>
  );
}
