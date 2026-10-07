import type { ISODate } from "./types";

// Plain calendar-date arithmetic on "YYYY-MM-DD" strings. All math runs in UTC on the
// date parts, so the result never depends on the server's or the browser's time zone.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== "string") return false;
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!));
  return d.getUTCFullYear() === +m[1]! && d.getUTCMonth() === +m[2]! - 1 && d.getUTCDate() === +m[3]!;
}

function toUTC(date: ISODate): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = toUTC(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTC(d);
}

/** 0 = Sunday */
export function weekday(date: ISODate): number {
  return toUTC(date).getUTCDay();
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(a).getTime() - toUTC(b).getTime()) / 86_400_000);
}

/** Today's calendar date in the given IANA time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): ISODate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function monthStart(date: ISODate): ISODate {
  return `${date.slice(0, 7)}-01`;
}

export function daysInMonth(date: ISODate): number {
  const [y, m] = date.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addMonths(date: ISODate, months: number): ISODate {
  const [y, m] = date.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return fromUTC(d);
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(opts: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify(opts);
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts });
    fmtCache.set(key, f);
  }
  return f;
}

/** "Thursday, October 16" */
export function formatLong(date: ISODate): string {
  return fmt({ weekday: "long", month: "long", day: "numeric" }).format(toUTC(date));
}

/** "Thu, Oct 16" */
export function formatShort(date: ISODate): string {
  return fmt({ weekday: "short", month: "short", day: "numeric" }).format(toUTC(date));
}

/** "October 2026" */
export function formatMonth(date: ISODate): string {
  return fmt({ month: "long", year: "numeric" }).format(toUTC(date));
}
