import { PhotoSlot } from "@/components/PhotoSlot";
import { BeforeAfter } from "./BeforeAfter";
import styles from "./Work.module.css";

// The one real before/after on the current site, split into its two halves for the
// slider. More jobs go in the photo slots as they're shot.

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

          {/* Real pairs go in public/images/work/ as job-02-before.jpg and job-02-after.jpg, and so on */}
          <div className={styles.more}>
            <PhotoSlot
              label="Next job"
              want="A before/after pair from a Bucks County job. Shoot both from exactly the same spot."
              ratio="1 / 1"
            />
            <PhotoSlot
              label="Next job"
              want="A clogged downspout outlet, then water running clear out of it."
              ratio="1 / 1"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
