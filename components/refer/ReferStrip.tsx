import Link from "next/link";
import styles from "./ReferStrip.module.css";

// Says plainly that referrals exist, right before booking. It promises no reward, because the
// program's details aren't decided yet (content/referral.ts).

export function ReferStrip() {
  return (
    <section className={styles.strip} aria-labelledby="refer-title">
      <div className={`wrap ${styles.row}`}>
        <h2 id="refer-title">Know a neighbor with full gutters?</h2>
        <Link href="/referred" className="btn">
          Refer a neighbor
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
