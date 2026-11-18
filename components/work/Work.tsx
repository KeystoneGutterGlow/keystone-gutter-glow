import Image from "next/image";
import { BeforeAfter } from "./BeforeAfter";
import styles from "./Work.module.css";

// Real jobs only. The slider is the before/after from Jimmy's old site, split into its two halves.
// The pair under it (oak leaves, 2026-11-18) was shot from two different spots, so it's shown side by
// side rather than in the slider, which needs two photos taken from the same place.

const oakPair = {
  before: {
    src: "/images/oak-leaves-before.webp",
    width: 828,
    height: 622,
    alt: "Looking down a front gutter packed with brown oak leaves. Below, the vacuum hose runs across the driveway to the car.",
    // The photo is wider than its frame: keep the gutter in view
    position: "44% 50%",
  },
  after: {
    src: "/images/oak-leaves-after.webp",
    width: 828,
    height: 1104,
    alt: "The same gutter after vacuuming: bare aluminum with a few dark streaks, above a driveway with recycling bins.",
    position: "50% 50%",
  },
};

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

      <figure className={`wrap ${styles.pair}`}>
        <div className={styles.pairShots}>
          {(["before", "after"] as const).map((k) => (
            <div key={k} className={styles.shot}>
              <Image
                src={oakPair[k].src}
                alt={oakPair[k].alt}
                width={oakPair[k].width}
                height={oakPair[k].height}
                sizes="(max-width: 899px) 50vw, 410px"
                className={styles.shotImg}
                style={{ objectPosition: oakPair[k].position }}
              />
              <span className={`${styles.shotTag} ${k === "before" ? styles.shotBefore : styles.shotAfter}`} aria-hidden="true">
                {k === "before" ? "Before" : "After"}
              </span>
            </div>
          ))}
        </div>
        <figcaption className={styles.pairCaption}>
          Another job: a front gutter packed with oak leaves, and the same gutter after the vacuum.
        </figcaption>
      </figure>
    </section>
  );
}
