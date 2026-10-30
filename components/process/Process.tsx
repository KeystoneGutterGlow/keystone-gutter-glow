import { bookingRules } from "@/content/booking";
import { site } from "@/content/site";
import styles from "./Process.module.css";

const dayOnly = bookingRules.scheduleMode === "day-only";

const steps = [
  { when: "Now", what: dayOnly ? "Pick your house and a day" : "Pick your house and a start time", note: "Right here on this page. About two minutes." },
  { when: "Then", what: "A confirmation", note: dayOnly ? "Your day and the address we have." : "Your day, your start time, and the address we have." },
  { when: "On the day", what: "We clean", note: "45 to 90 minutes depending on the house. You don't need to be home." },
  { when: "After", what: "Photos, then the invoice", note: "You pay once the job is done. Nothing up front." },
];

export function Process() {
  return (
    <section id="how" className={styles.how} aria-labelledby="how-title">
      <div className={`wrap ${styles.grid}`}>
        <h2 id="how-title" className={styles.title}>
          How booking works
        </h2>
        <ol className={styles.steps}>
          {steps.map((s) => (
            <li key={s.when}>
              <span className={styles.when}>{s.when}</span>
              <span className={styles.what}>{s.what}</span>
              <span className={styles.note}>{s.note}</span>
            </li>
          ))}
        </ol>
        <p className={styles.small}>
          Need to move it? Free with {site.policies.freeRescheduleHours} hours&rsquo; notice. Weather can move it too: heavy
          rain, lightning, ice or high wind, and we&rsquo;ll put you on the next open day.
        </p>
      </div>
    </section>
  );
}
