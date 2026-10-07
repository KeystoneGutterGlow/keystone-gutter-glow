"use client";

import { useEffect, useRef, useState } from "react";

export interface SectionProgress {
  /** -1 while still in the hero; ids.length when the booking section is reached */
  index: number;
  /** 0..1 progress through the current section */
  frac: number;
}

/**
 * Tracks which section crosses a line 40% down the viewport. `onFrame` fires on every
 * scroll frame with fresh progress (for the water level, written straight to the DOM);
 * React state only changes when the active section changes.
 */
export function useSectionProgress(
  ids: string[],
  endId: string,
  onFrame?: (p: SectionProgress, heroFrac: number) => void,
): number {
  const [active, setActive] = useState(-1);
  const frameRef = useRef(onFrame);
  frameRef.current = onFrame;

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const probe = window.innerHeight * 0.4;
      let index = -1;
      let frac = 0;
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top <= probe) {
          index = i;
          frac = Math.min(1, Math.max(0, (probe - r.top) / Math.max(1, r.height)));
        }
      });
      const end = document.getElementById(endId);
      if (end && end.getBoundingClientRect().top <= probe) {
        index = ids.length;
        frac = 1;
      }
      const first = document.getElementById(ids[0] ?? "");
      let heroFrac = 1;
      if (first) {
        const top = first.getBoundingClientRect().top + window.scrollY;
        heroFrac = Math.min(1, Math.max(0, (window.scrollY + probe) / Math.max(1, top)));
      }
      setActive((prev) => (prev === index ? prev : index));
      frameRef.current?.({ index, frac }, heroFrac);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ids, endId]);

  return active;
}
