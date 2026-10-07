"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { NavItem } from "@/content/nav";
import { startingPrice } from "@/content/pricing";
import { site } from "@/content/site";
import styles from "./MobileNav.module.css";
import { useSectionProgress } from "./useSectionProgress";

// Under 1100px the downspout rail turns into two things:
//  - a dock at the bottom of the screen (Menu, Book, Call), where thumbs already are
//  - a full-screen menu sheet that keeps the downspout-and-straps drawing at thumb size

interface Props {
  items: NavItem[];
  endId: string;
  homeHref?: string;
  bookHref?: string;
  bookLabel?: string;
}

export function MobileNav({ items, endId, homeHref = "#top", bookHref, bookLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [dockHidden, setDockHidden] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const ids = useRef(items.map((i) => i.id)).current;
  const active = useSectionProgress(ids, endId);

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

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    sheet.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !sheet.current) return;
      const focusables = sheet.current.querySelectorAll<HTMLElement>("a[href], button");
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      menuBtn.current?.focus({ preventScroll: true });
    };
  }, [open]);

  function go(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    setOpen(false);
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      history.replaceState(null, "", `#${id}`);
    });
  }

  const bookText = bookLabel ?? `Book a cleaning · from $${startingPrice}`;
  const shortText = bookLabel ?? `Book · from $${startingPrice}`;

  return (
    <>
      <header className={styles.top}>
        <a href={homeHref} className={styles.logo}>
          <Image src="/images/keystone-logo.png" alt={`${site.legalName}, home`} width={133} height={45} priority />
        </a>
        <a href={site.phone.href} className={styles.topPhone}>
          {site.phone.display}
        </a>
      </header>

      <nav className={styles.dock} aria-label="Quick actions" data-hidden={dockHidden || open || undefined}>
        <button
          ref={menuBtn}
          type="button"
          className={styles.menuBtn}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path d="M3 6h16M3 11h16M3 16h10" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          </svg>
          Menu
        </button>
        <a href={bookHref ?? `#${endId}`} className={`btn btn--sky ${styles.dockBook}`}>
          <span className={styles.long}>{bookText}</span>
          <span className={styles.short}>{shortText}</span>
        </a>
        <a href={site.phone.href} className={styles.callBtn} aria-label={`Call ${site.phone.display}`}>
          <PhoneIcon />
        </a>
      </nav>

      <div
        id="mobile-menu"
        ref={sheet}
        className={`${styles.sheet} on-dark`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!open}
      >
        <div className={styles.sheetTop}>
          <Image src="/images/keystone-logo-light.png" alt="" width={133} height={45} />
          <button type="button" className={styles.close} onClick={() => setOpen(false)}>
            Close
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <nav aria-label="Page sections" className={styles.sheetNav}>
          <span className={styles.sheetPipe} aria-hidden="true">
            <span
              className={styles.sheetWater}
              style={{ height: `${active < 0 ? 0 : Math.min(100, ((active + 0.5) / items.length) * 100)}%` }}
            />
          </span>
          <ol>
            {items.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => go(e, item.id)}
                  aria-current={active === i ? "location" : undefined}
                >
                  <span className={styles.sheetStrap} aria-hidden="true" />
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.sheetFoot}>
          <a
            href={bookHref ?? `#${endId}`}
            className="btn btn--sky btn--wide"
            onClick={bookHref ? undefined : (e) => go(e, endId)}
          >
            {bookText}
          </a>
          <p>
            Call or text <a href={site.phone.href}>{site.phone.display}</a>
            <br />
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </p>
        </div>
      </div>
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
