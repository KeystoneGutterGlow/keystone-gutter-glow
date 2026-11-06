"use client";

import { useEffect, useRef, useState } from "react";
import { bookingRules } from "@/content/booking";
import { addDays, daysInMonth, formatLong, formatMonth, weekday } from "@/lib/booking/dates";
import type { DaySummary } from "@/lib/booking/types";
import styles from "./Booking.module.css";

// Month grid. Every day is a focusable button (unavailable ones use aria-disabled, not
// disabled, so keyboard and screen-reader users still learn *why* a day is out).
// Arrow keys move by day/week, PageUp/PageDown change month, Home/End jump within the week.

interface Props {
  month: string; // first of the month, YYYY-MM-01
  days: Map<string, DaySummary> | null;
  selected: string | null;
  today: string;
  maxPerDay: number;
  canPrev: boolean;
  canNext: boolean;
  onMonth: (delta: number) => void;
  onSelect: (date: string) => void;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const closedNote = bookingRules.closedWeekdays.length
  ? ` Closed ${bookingRules.closedWeekdays.map((d) => `${WEEKDAYS[d]}s`).join(" and ")}.`
  : "";

function describe(d: DaySummary | undefined): string {
  if (!d) return "loading";
  switch (d.status) {
    case "open":
      return d.remaining === 1 ? "1 opening" : `${d.remaining} openings`;
    case "full":
      return "fully booked";
    case "closed":
      return "closed";
    default:
      return "not bookable";
  }
}

export function Calendar({ month, days, selected, today, maxPerDay, canPrev, canNext, onMonth, onSelect }: Props) {
  const count = daysInMonth(month);
  const lead = weekday(month);
  const dates = Array.from({ length: count }, (_, i) => addDays(month, i));
  const gridRef = useRef<HTMLDivElement>(null);

  const firstOpen = days ? dates.find((d) => days.get(d)?.status === "open") : undefined;
  const initialFocus = selected && selected.startsWith(month.slice(0, 7)) ? selected : (firstOpen ?? dates[0]!);
  const [focusDate, setFocusDate] = useState(initialFocus);
  const [moveFocus, setMoveFocus] = useState(false);

  useEffect(() => {
    setFocusDate(initialFocus);
  }, [month, firstOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!moveFocus) return;
    const target = gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`);
    // After a month change the old date is gone for one render. Keep waiting for the new one.
    if (!target) return;
    target.focus();
    setMoveFocus(false);
  }, [focusDate, moveFocus]);

  function onKey(e: React.KeyboardEvent, date: string) {
    const idx = dates.indexOf(date);
    let next = idx;
    switch (e.key) {
      case "ArrowLeft":
        next = idx - 1;
        break;
      case "ArrowRight":
        next = idx + 1;
        break;
      case "ArrowUp":
        next = idx - 7;
        break;
      case "ArrowDown":
        next = idx + 7;
        break;
      case "Home":
        next = idx - weekday(date);
        break;
      case "End":
        next = idx + (6 - weekday(date));
        break;
      case "PageUp":
        if (canPrev) {
          onMonth(-1);
          setMoveFocus(true);
        }
        e.preventDefault();
        return;
      case "PageDown":
        if (canNext) {
          onMonth(1);
          setMoveFocus(true);
        }
        e.preventDefault();
        return;
      default:
        return;
    }
    e.preventDefault();
    // Arrowing off either end of the month moves to the next month, where there is one.
    if (next < 0 && canPrev) {
      onMonth(-1);
      setMoveFocus(true);
      return;
    }
    if (next >= count && canNext) {
      onMonth(1);
      setMoveFocus(true);
      return;
    }
    next = Math.max(0, Math.min(count - 1, next));
    setFocusDate(dates[next]!);
    setMoveFocus(true);
  }

  return (
    <div className={styles.cal}>
      <div className={styles.calHead}>
        <button
          type="button"
          className={styles.calNav}
          onClick={() => onMonth(-1)}
          disabled={!canPrev}
          aria-label="Previous month"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M11 3L5 9l6 6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <h4 className={styles.calTitle} aria-live="polite">
          {formatMonth(month)}
        </h4>
        <button
          type="button"
          className={styles.calNav}
          onClick={() => onMonth(1)}
          disabled={!canNext}
          aria-label="Next month"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M7 3l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      <div className={styles.calWeek} aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w.slice(0, 1)}</span>
        ))}
      </div>

      <div
        ref={gridRef}
        className={styles.calGrid}
        role="group"
        aria-label={`${formatMonth(month)}. Use arrow keys to move between days.`}
        aria-busy={!days}
      >
        {Array.from({ length: lead }, (_, i) => (
          <span key={`b${i}`} aria-hidden="true" />
        ))}
        {dates.map((date) => {
          const d = days?.get(date);
          const open = d?.status === "open";
          const isSel = date === selected;
          const dayNum = Number(date.slice(8));
          return (
            <button
              key={date}
              type="button"
              data-date={date}
              data-status={d?.status ?? "loading"}
              className={styles.day}
              tabIndex={date === focusDate ? 0 : -1}
              aria-pressed={isSel}
              aria-disabled={!open}
              aria-current={date === today ? "date" : undefined}
              onKeyDown={(e) => onKey(e, date)}
              onFocus={() => setFocusDate(date)}
              onClick={() => {
                if (open) onSelect(date);
              }}
            >
              {/* Accessible name reads "Friday, October 9, 3 openings"; sighted users see "9" and the ticks */}
              <span className={styles.dayNum}>
                <span className="vh">{formatLong(date).replace(/\s\d+$/, "")} </span>
                {dayNum}
              </span>
              {d?.status === "open" && (
                <span className={styles.ticks} aria-hidden="true">
                  {Array.from({ length: maxPerDay }, (_, i) => (
                    <i key={i} data-on={i < d.remaining || undefined} />
                  ))}
                </span>
              )}
              {d?.status === "full" ? (
                <span className={styles.fullTag}> Full</span>
              ) : (
                <span className="vh">, {describe(d)}</span>
              )}
            </button>
          );
        })}
      </div>

      <p className={styles.legend}>
        <span>
          <span className={styles.ticks} aria-hidden="true">
            {Array.from({ length: maxPerDay }, (_, i) => (
              <i key={i} data-on={i < Math.ceil(maxPerDay / 2) || undefined} />
            ))}
          </span>{" "}
          spots left
        </span>
        <span>
          We book at most {maxPerDay} houses a day.{closedNote}
        </span>
      </p>
    </div>
  );
}
