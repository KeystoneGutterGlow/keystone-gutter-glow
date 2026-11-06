"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef } from "react";
import type { NavItem } from "@/content/nav";
import { site } from "@/content/site";
import styles from "./Rail.module.css";
import { useSectionProgress, type SectionProgress } from "./useSectionProgress";

// Desktop navigation, drawn as the house's downspout. Each section is a strap holding the
// pipe to the wall; water fills the pipe down to wherever you are on the page, and the
// pipe empties out at the bottom into the Book button.

interface Props {
  items: NavItem[];
  endId: string;
  endLabel: string;
  homeHref?: string;
  /** On secondary pages the logo links home and the Book button leaves the page */
  bookHref?: string;
  referLink?: boolean;
  /** A plain link back to the home page, for pages other than home */
  homeLink?: boolean;
}

export function Rail({ items, endId, endLabel, homeHref = "#top", bookHref, referLink, homeLink }: Props) {
  const pipeRef = useRef<HTMLDivElement>(null);
  const strapRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const ids = useRef(items.map((i) => i.id)).current;

  const onFrame = useCallback(({ index, frac }: SectionProgress, heroFrac: number) => {
    const pipe = pipeRef.current;
    if (!pipe) return;
    const pipeTop = pipe.getBoundingClientRect().top;
    const ys = strapRefs.current.map((s) => (s ? s.getBoundingClientRect().top + s.offsetHeight / 2 - pipeTop : 0));
    const bottom = pipe.offsetHeight;
    let level: number;
    if (index < 0) level = (ys[0] ?? 0) * heroFrac;
    else if (index >= ys.length) level = bottom;
    else {
      const here = ys[index] ?? 0;
      const next = ys[index + 1] ?? bottom;
      level = here + (next - here) * frac;
    }
    pipe.style.setProperty("--level", `${Math.round(level)}px`);
  }, []);

  const active = useSectionProgress(ids, endId, onFrame);

  return (
    <nav className={styles.rail} aria-label="Page sections">
      <a href={homeHref} className={styles.logo}>
        <Image
          src="/images/keystone-logo.png"
          alt={`${site.legalName}, back to top`}
          width={168}
          height={57}
          priority
        />
      </a>

      <div className={`${styles.stub} gutter-face`} aria-hidden="true" />

      <div className={styles.spout}>
        <div className={styles.pipe} ref={pipeRef} aria-hidden="true">
          <span className={styles.water} />
        </div>
        <ol className={styles.list}>
          {items.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={styles.link}
                aria-current={active === i ? "location" : undefined}
                data-passed={active > i || undefined}
              >
                <span
                  className={styles.strap}
                  ref={(el) => {
                    strapRefs.current[i] = el;
                  }}
                  aria-hidden="true"
                />
                <span className={styles.label}>{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <svg className={styles.outlet} viewBox="0 0 120 64" aria-hidden="true" data-on={active >= items.length || undefined}>
        {/* elbow out of the downspout, pointing at the button */}
        <path className={styles.elbowBody} d="M28 0 V18 Q28 40 50 40 H104 V56 H50 Q12 56 12 18 V0 Z" />
        <path className={styles.elbowWater} d="M16 0 V18 Q16 52 50 52 H104 V44 H50 Q24 44 24 18 V0 Z" />
        <path className={styles.elbowLine} d="M28 0 V18 Q28 40 50 40 H104 M12 0 V18 Q12 56 50 56 H104" />
        <ellipse className={styles.mouth} cx="104" cy="48" rx="3.5" ry="8" />
      </svg>

      <div className={styles.foot}>
        <a
          href={bookHref ?? `#${endId}`}
          className={`btn btn--wide ${styles.book}`}
          aria-current={active >= items.length ? "location" : undefined}
        >
          {endLabel}
        </a>
        <a href={site.phone.href} className={styles.phone}>
          <span className="vh">Call or text </span>
          {site.phone.display}
        </a>
        {homeLink && (
          <Link href="/" className={styles.refer}>
            Back to the home page
          </Link>
        )}
        {referLink && (
          <Link href="/referred" className={styles.refer}>
            Refer a neighbor
          </Link>
        )}
      </div>
    </nav>
  );
}
