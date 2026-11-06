"use client";

import { useEffect, useState } from "react";
import { BookLink } from "@/components/BookLink";
import { bookingRules } from "@/content/booking";
import { formatShort } from "@/lib/booking/dates";
import styles from "./Hero.module.css";

// Live "next opening" from the schedule. Two forms share one request:
//  - the tag hanging off the vacuum pole (tablet and desktop), fixed height while loading
//  - a single line under the Book button (phones), where the tag would be below the fold
// While the schedule loads they show skeleton bars laid out like the answer, so nothing moves when it
// arrives. If the API is unreachable they fall back to a plain link of the same size.

const dayOnly = bookingRules.scheduleMode === "day-only";

interface Next {
  date: string;
  slotId: string;
  slotLabel: string;
  remaining: number;
}

type State = { status: "loading" } | { status: "ok"; next: Next | null; demo: boolean } | { status: "error" };

let shared: Promise<{ next: Next | null; demo: boolean }> | null = null;
function load() {
  shared ??= fetch("/api/availability?next=1", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data: { next: Next | null; meta?: { demo?: boolean } }) => ({ next: data.next, demo: !!data.meta?.demo }))
    .catch((err) => {
      shared = null;
      throw err;
    });
  return shared;
}

function useNextOpening() {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    let live = true;
    load().then(
      (d) => live && setState({ status: "ok", ...d }),
      () => live && setState({ status: "error" }),
    );
    return () => {
      live = false;
    };
  }, []);
  return state;
}

export function NextOpening() {
  const state = useNextOpening();

  return (
    <aside className={styles.tag} aria-live="polite" aria-busy={state.status === "loading"}>
      <span className={styles.tagHole} aria-hidden="true" />
      <p className={styles.tagLabel}>{state.status === "ok" && state.demo ? "Next opening · demo" : "Next opening"}</p>
      {state.status === "loading" && (
        <>
          <span className="vh">Checking the schedule…</span>
          <p className={styles.tagWhen} aria-hidden="true">
            <span className="skel-text">Sat, Nov 7</span>
          </p>
          <p className={styles.tagLeft} aria-hidden="true">
            <span className="skel-text">4 spots left that day</span>
          </p>
          <span className={`${styles.tagLink} skel-text`} aria-hidden="true">
            Book this day →
          </span>
        </>
      )}
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
          <p className={styles.tagLeft}>Monday to Saturday</p>
          <BookLink className={styles.tagLink}>
            {dayOnly ? "Open days" : "Open times"} <span aria-hidden="true">→</span>
          </BookLink>
        </>
      )}
    </aside>
  );
}

/** Phones: one line under the Book button. A link to the calendar if the schedule can't be read. */
export function NextOpeningLine() {
  const state = useNextOpening();
  return (
    <p className={styles.nextLine} aria-live="polite">
      {state.status === "loading" && (
        <>
          <span className="vh">Checking the schedule…</span>
          <span className="skel-text" aria-hidden="true">
            Next opening Sat, Nov 7 →
          </span>
        </>
      )}
      {state.status === "ok" && state.next && (
        <BookLink className={styles.nextLink} date={state.next.date} slotId={dayOnly ? undefined : state.next.slotId}>
          <span className={styles.nextLabel}>Next opening{state.demo ? " (demo)" : ""}</span>{" "}
          <strong>{formatShort(state.next.date)}</strong>
          <span aria-hidden="true"> →</span>
        </BookLink>
      )}
      {(state.status === "error" || (state.status === "ok" && !state.next)) && (
        <BookLink className={styles.nextLink}>
          <span className={styles.nextLabel}>Booking</span> <strong>See open days</strong>
          <span aria-hidden="true"> →</span>
        </BookLink>
      )}
    </p>
  );
}
