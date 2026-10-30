"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { NavItem } from "@/content/nav";
import { startingPrice } from "@/content/pricing";
import { site } from "@/content/site";
import styles from "./MobileNav.module.css";
import { MobileRail } from "./MobileRail";

// Under 1100px the desktop rail becomes:
//  - MobileRail: the same downspout, slimmed to a 24px lane on the left edge
//  - a dock at the bottom (Book, Call), where the downspout's elbow empties into the Book button
//  - a plain header with the logo and phone number that scrolls away with the page

interface Props {
  items: NavItem[];
  endId: string;
  homeHref?: string;
  bookHref?: string;
  bookLabel?: string;
  /** Replaces the phone number in the header row. The dock still has a call button. */
  topSlot?: React.ReactNode;
}

export function MobileNav({ items, endId, homeHref = "#top", bookHref, bookLabel, topSlot }: Props) {
  const [dockHidden, setDockHidden] = useState(false);

  // Booking has its own sticky action bar, so the dock steps aside while it's on screen.
  useEffect(() => {
    const target = document.getElementById(endId);
    if (!target || bookHref) return;
    const io = new IntersectionObserver(([entry]) => setDockHidden(!!entry?.isIntersecting), {
      rootMargin: "0px 0px -35% 0px",
    });
    io.observe(target);
    return () => io.disconnect();
  }, [endId, bookHref]);

  const bookText = bookLabel ?? `Book a cleaning · from $${startingPrice}`;
  const shortText = bookLabel ?? `Book · from $${startingPrice}`;

  return (
    <>
      <header className={styles.top}>
        <a href={homeHref} className={styles.logo}>
          <Image src="/images/keystone-logo.png" alt={`${site.legalName}, home`} width={133} height={45} priority />
        </a>
        {topSlot ?? (
          <a href={site.phone.href} className={styles.topPhone}>
            {site.phone.display}
          </a>
        )}
      </header>

      <MobileRail
        items={items}
        endId={endId}
        homeHref={homeHref}
        bookHref={bookHref}
        bookText={bookLabel ?? "Book a cleaning"}
        dockHidden={dockHidden}
      />

      <nav className={styles.dock} aria-label="Quick actions" data-hidden={dockHidden || undefined}>
        <svg className={styles.elbow} viewBox="0 0 24 70" aria-hidden="true">
          {/* the downspout turning out toward the Book button */}
          <path d="M5 0H15V22Q15 31 24 31V41Q5 41 5 24Z" fill="#e9edf0" />
          <path d="M5 0V24Q5 41 24 41M15 0V22Q15 31 24 31" fill="none" stroke="#fff" strokeWidth="1.5" />
        </svg>
        <a href={bookHref ?? `#${endId}`} className={`btn btn--sky ${styles.dockBook}`}>
          <span className={styles.long}>{bookText}</span>
          <span className={styles.short}>{shortText}</span>
        </a>
        <a href={site.phone.href} className={styles.callBtn} aria-label={`Call ${site.phone.display}`}>
          <PhoneIcon />
        </a>
      </nav>
    </>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path
        d="M6.2 2.5 8.7 6 7.3 8.1c.9 2.2 2.6 4 4.6 5l2.2-1.4 3.4 2.6-1 3.2c-.3.8-1.1 1.3-2 1.1C8.4 17.4 4.6 13.6 3.4 7.5c-.2-.9.3-1.7 1.1-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
