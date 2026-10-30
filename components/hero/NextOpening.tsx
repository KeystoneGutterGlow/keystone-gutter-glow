"use client";

import { useEffect, useState } from "react";
import { BookLink } from "@/components/BookLink";
import { bookingRules } from "@/content/booking";
import { formatShort } from "@/lib/booking/dates";
import styles from "./Hero.module.css";

// Live "next opening" tag hanging off the vacuum pole. Fixed height while loading, so no
// layout shift. If the API is unreachable it quietly falls back to a plain link.

const dayOnly = bookingRules.scheduleMode === "day-only";

interface Next {
  date: string;
  slotId: string;
  slotLabel: string;
  remaining: number;
}

export function NextOpening() {
  const [state, setState] = useState<{ status: "loading" } | { status: "ok"; next: Next | null } | { status: "error" }>({
    status: "loading",
  });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/availability?next=1", { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { next: Next | null }) => setState({ status: "ok", next: data.next }))
      .catch((err) => {
        if ((err as Error).name !== "AbortError") setState({ status: "error" });
      });
    return () => ctrl.abort();
  }, []);

  return (
    <aside className={styles.tag} aria-live="polite" aria-busy={state.status === "loading"}>
      <span className={styles.tagHole} aria-hidden="true" />
      <p className={styles.tagLabel}>Next opening</p>
      {state.status === "loading" && <p className={styles.tagWhen}>Checking the schedule…</p>}
      {state.status === "ok" && state.next && (
        <>
          <p className={styles.tagWhen}>
            {formatShort(state.next.date)}
            {!dayOnly && <span className={styles.tagTime}>{state.next.slotLabel}</span>}
          </p>
          <p className={styles.tagLeft}>
            {state.next.remaining === 1 ? "Last spot that day" : `${state.next.remaining} spots left that day`}
          </p>
          <BookLink className={styles.tagLink} date={state.next.date} slotId={dayOnly ? undefined : state.next.slotId}>
            {dayOnly ? "Book this day" : "Book this time"} <span aria-hidden="true">→</span>
          </BookLink>
        </>
      )}
      {((state.status === "ok" && !state.next) || state.status === "error") && (
        <>
          <p className={styles.tagWhen}>See the calendar</p>
          <BookLink className={styles.tagLink}>
            {dayOnly ? "Open days" : "Open times"} <span aria-hidden="true">→</span>
          </BookLink>
        </>
      )}
    </aside>
  );
}
