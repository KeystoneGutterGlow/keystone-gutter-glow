import { BeforeAfter } from "./BeforeAfter";
import styles from "./Work.module.css";

// The one real before/after from Jimmy's current site, split into its two halves for the slider.
// Placeholder slots for more jobs were removed at Sam's request (2026-11-11); add real pairs only.

export function Work() {
  return (
    <section id="work" className={styles.work} aria-labelledby="work-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.slider}>
          <BeforeAfter
            before={{
              src: "/images/gutter-before.jpg",
              alt: "Looking down a gutter run packed full of brown pine needles and a few leaves.",
            }}
            after={{
              src: "/images/gutter-after.jpg",
              alt: "The same gutter run after vacuuming: bare aluminum with a little water along the bottom.",
            }}
            width={400}
            height={800}
          />
        </div>

        <div className={styles.text}>
          <h2 id="work-title">Before and after</h2>
          <p className={styles.caption}>
            Pine needles packed in solid, then the same stretch after the vacuum. Drag the bar.
          </p>
          <p>
            You get photos like these after your cleaning, weather and light permitting. If you weren&rsquo;t home,
            that&rsquo;s how you know the job got done, and it&rsquo;s the only way most people ever see the inside of
            their gutters.
          </p>
        </div>
      </div>
    </section>
  );
}
