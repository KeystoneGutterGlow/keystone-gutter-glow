import Link from "next/link";
import { referralOffer, referralPaths } from "@/content/referral";
import styles from "./ReferStrip.module.css";

// The referral program, right before booking (content/referral.ts).

export function ReferStrip() {
  return (
    <section className={styles.strip} aria-labelledby="refer-title">
      <div className={`wrap ${styles.row}`}>
        <div>
          <h2 id="refer-title">Know a neighbor with full gutters?</h2>
          <p className={styles.offer}>{referralOffer}</p>
        </div>
        <Link href={referralPaths.refer} className="btn">
          Refer a neighbor
          <span className="arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
