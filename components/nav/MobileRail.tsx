"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { NavItem } from "@/content/nav";
import { site } from "@/content/site";
import styles from "./MobileRail.module.css";
import { useSectionProgress, type SectionProgress } from "./useSectionProgress";

// The desktop downspout, slimmed down for phones.
//
// Collapsed: a 24px lane on the left edge with the pipe, a strap per section, and water
// filling to where you are. At the top of the page the pipe hangs off the hero gutter
// (it tracks [data-gutter-anchor]); once that scrolls away the pipe runs to the top.
// Tapping anywhere on the lane opens it.
//
// Open: the lane widens into a panel. The straps stay exactly where they were and the
// section names appear beside them. Tap a name to go there; tap outside, swipe left,
// press Escape or use Close to put it away.

interface Props {
  items: NavItem[];
  endId: string;
  homeHref: string;
  bookHref?: string;
  referLink?: boolean;
  firewoodHref?: string;
  bookText: string;
  dockHidden: boolean;
}

const FLASH_MS = 1300;

export function MobileRail({ items, endId, homeHref, bookHref, bookText, dockHidden, referLink, firewoodHref }: Props) {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<{ i: number; y: number; key: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pipeRef = useRef<HTMLDivElement>(null);
  const laneRef = useRef<HTMLButtonElement>(null);
  const strapRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const openRef = useRef(open);
  openRef.current = open;
  const ids = useRef(items.map((i) => i.id)).current;

  // Runs on every scroll frame: pipe top, buried straps, water level. DOM writes only.
  const onFrame = useCallback(({ index, frac }: SectionProgress, heroFrac: number) => {
    const root = rootRef.current;
    const pipe = pipeRef.current;
    if (!root || !pipe) return;

    let pipeTop = 0;
    const anchor = openRef.current ? null : document.querySelector<HTMLElement>("[data-gutter-anchor]");
    const a = anchor?.getBoundingClientRect();
    if (a && a.bottom > 0) {
      pipeTop = a.bottom;
      root.style.setProperty("--stub-y", `${Math.round(a.top)}px`);
      root.dataset.stub = "";
    } else {
      delete root.dataset.stub;
    }
    root.style.setProperty("--pipe-top", `${Math.round(pipeTop)}px`);

    const ys = strapRefs.current.map((s) => {
      if (!s) return 0;
      const r = s.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    strapRefs.current.forEach((s, i) => s?.toggleAttribute("data-buried", (ys[i] ?? 0) < pipeTop + 6));

    const top = pipeTop;
    const bottom = pipe.getBoundingClientRect().bottom;
    let level: number;
    if (index < 0) level = top + Math.max(0, (ys[0] ?? top) - top) * heroFrac;
    else if (index >= ys.length) level = bottom;
    else {
      const here = ys[index] ?? top;
      const next = ys[index + 1] ?? bottom;
      level = here + (next - here) * frac;
    }
    pipe.style.setProperty("--level", `${Math.max(0, Math.round(level - top))}px`);
  }, []);

  const active = useSectionProgress(ids, endId, onFrame);

  // Briefly name the section you've just scrolled into, beside its strap.
  const lastActive = useRef(active);
  useEffect(() => {
    const prev = lastActive.current;
    lastActive.current = active;
    if (openRef.current || prev === active || active < 0 || active >= items.length) return;
    const s = strapRefs.current[active];
    if (!s) return;
    const r = s.getBoundingClientRect();
    setFlash({ i: active, y: r.top + r.height / 2, key: Date.now() });
  }, [active, items.length]);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(t);
  }, [flash]);

  // Scroll lock while open. Layout effect, so it's released before any scroll we trigger.
  useLayoutEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open]);

  // Focus, Escape, Tab trap, and closing if the screen grows into the desktop layout.
  useEffect(() => {
    if (!open) return;
    setFlash(null);
    const panel = panelRef.current;
    const current = panel?.querySelector<HTMLElement>('a[aria-current="location"]');
    (current ?? panel?.querySelector<HTMLElement>("nav a"))?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const f = panel.querySelectorAll<HTMLElement>("a[href], button:not([tabindex='-1'])");
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 1100px)");
    const onMq = () => mq.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
      if (panel?.contains(document.activeElement)) laneRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  // Swipe left anywhere while open to close.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (open && t) touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const start = touch.current;
    if (!open || !t || !start) return;
    const dx = t.clientX - start.x;
    if (dx < -44 && Math.abs(dx) > Math.abs(t.clientY - start.y)) {
      touch.current = null;
      setOpen(false);
    }
  };

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

  const activeLabel = active >= 0 && active < items.length ? items[active]?.label : active >= items.length ? bookText : null;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-open={open || undefined}
      data-dock-hidden={dockHidden || undefined}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      <div className={styles.scrim} onClick={() => setOpen(false)} aria-hidden="true" />

      <div
        ref={panelRef}
        id="section-rail"
        className={styles.panel}
        data-extras={referLink || firewoodHref ? "" : undefined}
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-label={open ? "Page sections" : undefined}
      >
        <span className={`${styles.stub} gutter-face`} aria-hidden="true" />

        <div className={styles.pipe} ref={pipeRef} aria-hidden="true">
          <span className={styles.water} />
        </div>

        <div className={styles.head} inert={!open}>
          <a href={homeHref} className={styles.logo} onClick={homeHref.startsWith("#") ? (e) => go(e, homeHref.slice(1)) : undefined}>
            <Image src="/images/keystone-logo.png" alt={`${site.legalName}, back to top`} width={118} height={40} />
          </a>
          <button type="button" className={styles.close} onClick={() => setOpen(false)}>
            Close
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <nav className={styles.nav} aria-label="Page sections" inert={!open}>
          <ol className={styles.track}>
            {items.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={styles.link}
                  onClick={(e) => go(e, item.id)}
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
        </nav>

        <div className={styles.foot} inert={!open}>
          <a
            href={bookHref ?? `#${endId}`}
            className="btn btn--sky btn--wide"
            onClick={bookHref ? () => setOpen(false) : (e) => go(e, endId)}
          >
            {bookText}
          </a>
          <a href={site.phone.href} className={styles.phone}>
            Call or text {site.phone.display}
          </a>
          {(referLink || firewoodHref) && (
            <div className={styles.extras}>
              {referLink && (
                <Link href="/referred" className={styles.extra}>
                  Refer a neighbor
                </Link>
              )}
              {firewoodHref && (
                <Link href={firewoodHref} className={styles.extra}>
                  Firewood
                </Link>
              )}
            </div>
          )}
        </div>

        <button
          ref={laneRef}
          type="button"
          className={styles.lane}
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="section-rail"
          inert={open}
        >
          <span className="vh">
            Sections menu{activeLabel ? `, you're at ${activeLabel}` : ""}
          </span>
        </button>
      </div>

      {flash && !open && (
        <span key={flash.key} className={styles.flash} style={{ top: flash.y }} aria-hidden="true">
          {items[flash.i]?.label}
        </span>
      )}
    </div>
  );
}
