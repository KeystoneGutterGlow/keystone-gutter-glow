import { IvyRun } from "@/components/botanical/Botanical";
import { faqs } from "@/content/faqs";
import { site } from "@/content/site";
import styles from "./Faq.module.css";

// Native <details>: keyboard, screen readers and find-in-page all work with zero JS.

export function Faq() {
  return (
    <section id="faq" className={styles.faq} aria-labelledby="faq-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.side}>
          <h2 id="faq-title">Questions</h2>
          <p>
            Yours isn&rsquo;t here? Call or text{" "}
            <a href={site.phone.href} className="textlink">
              {site.phone.display}
            </a>
            .
          </p>
          <IvyRun className={styles.ivy} vertical length={420} seed={19} />
        </div>
        <div className={styles.list}>
          {faqs.map((f) => (
            <details key={f.q} className={styles.item}>
              <summary>
                <span>{f.q}</span>
                <svg className={styles.chev} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
