import Link from "next/link";
import { BookLink } from "@/components/BookLink";
import { LaurelShrub } from "@/components/botanical/Botanical";
import { startingPrice } from "@/content/pricing";
import { modeLinks } from "@/content/season";
import { GutterStrip } from "./GutterStrip";
import styles from "./Hero.module.css";
import { NextOpening, NextOpeningLine } from "./NextOpening";
import { Rig } from "./Rig";

export function Hero() {
  const links = modeLinks();
  return (
    <section className={styles.hero} id="top" aria-labelledby="hero-title">
      <GutterStrip />
      <span className={styles.pole} aria-hidden="true" />

      <div className={styles.body}>
        <div className={styles.copy}>
          <p className={styles.where}>Jamison, Doylestown, Warwick and around Bucks County</p>
          <h1 id="hero-title" className={styles.title}>
            <span>Gutter cleaning</span> <span>for Bucks County,</span>{" "}
            <span className={styles.titleVac}>done by vacuum.</span>
          </h1>
          <p className={styles.lede}>
            Leaves, pine needles, seed pods and the black sludge underneath all go up a hose and into a sealed tank on
            our cart. None of it ends up in your flower beds.
          </p>
          <div className={styles.actions}>
            <BookLink className="btn">
              Book a cleaning
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </BookLink>
            <p className={styles.fine}>
              <strong>From ${startingPrice}</strong> for a one-story home.
              <br />
              Nothing to pay until the job&rsquo;s done.
            </p>
          </div>
          <NextOpeningLine />
          <p className={styles.more}>
            <a href="#vacuum" className={`textlink ${styles.why}`}>
              Why a vacuum beats a scoop
            </a>
            {links && (
              <Link href={links.firewoodHref} className={`textlink ${styles.why}`}>
                We also deliver firewood
              </Link>
            )}
          </p>
        </div>

        <div className={styles.side}>
          <NextOpening />
        </div>
      </div>

      <Rig />

      {/* The flower bed the debris doesn't land in */}
      <svg className={styles.bed} viewBox="-92 -100 250 102" aria-hidden="true" focusable="false">
        <LaurelShrub />
        <LaurelShrub x={92} s={0.72} />
      </svg>
    </section>
  );
}
