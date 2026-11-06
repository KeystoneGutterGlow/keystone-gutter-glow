import { machine } from "@/content/machine";
import styles from "./Machine.module.css";
import { MachineTour } from "./MachineTour";

// Sits right under "Vacuum vs. scoop": that section makes the case, this one shows the machine
// that does it. The tour itself is a client component; this is the frame around it.

export function Machine() {
  return (
    <section id="machine" className={styles.machine} aria-labelledby="machine-title">
      <div className="wrap">
        <header className={styles.head}>
          <h2 id="machine-title">Why choose Keystone Gutter Glow</h2>
          <p>
            It starts with the machine. Jimmy cleans gutters with a {machine.model}, a commercial gutter vacuum built
            for this job. Here&rsquo;s how it works, one leaf at a time, and what a ladder and scoop leaves behind.
          </p>
        </header>
        <MachineTour />
        <div className={styles.outro}>
          <p>Figures are the manufacturer&rsquo;s published specs for this machine and pole kit.</p>
          <a href="#prices" className="btn btn--sky">
            What it costs for your house
            <span className="arrow" aria-hidden="true">
              ↓
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
