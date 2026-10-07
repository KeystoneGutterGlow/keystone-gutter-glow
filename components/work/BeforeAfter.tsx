"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./Work.module.css";

// Drag (or arrow-key) comparison. The control is a real range input laid over the photo,
// so keyboard and screen-reader support come from the browser, not custom ARIA.

interface Props {
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  width: number;
  height: number;
}

export function BeforeAfter({ before, after, width, height }: Props) {
  const [pos, setPos] = useState(50);
  return (
    <div className={styles.ba} style={{ "--pos": `${pos}%` } as React.CSSProperties}>
      <Image
        src={after.src}
        alt={after.alt}
        width={width}
        height={height}
        sizes="(max-width: 899px) 100vw, 460px"
        className={styles.img}
      />
      <div className={styles.beforeLayer}>
        <Image
          src={before.src}
          alt={before.alt}
          width={width}
          height={height}
          sizes="(max-width: 899px) 100vw, 460px"
          className={styles.img}
        />
      </div>
      <span className={`${styles.tagLabel} ${styles.tagBefore}`} aria-hidden="true">
        Before
      </span>
      <span className={`${styles.tagLabel} ${styles.tagAfter}`} aria-hidden="true">
        After
      </span>
      <span className={styles.handle} aria-hidden="true">
        <span className={styles.grip}>
          <svg width="22" height="14" viewBox="0 0 22 14">
            <path d="M7 1L1 7l6 6M15 1l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className={styles.range}
        aria-label="Slide to compare before and after"
        aria-valuetext={`${pos}% before`}
      />
    </div>
  );
}
