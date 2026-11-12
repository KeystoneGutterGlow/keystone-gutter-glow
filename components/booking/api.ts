import type { DayDetail, DaySummary } from "@/lib/booking/types";
import type { FieldErrors } from "@/lib/booking/validate";
import type { Notice } from "@/lib/notify/notice";

// Thin client for the booking API. The UI only ever talks to these endpoints, never to
// storage, so the backend can change without touching the components.

export interface Meta {
  today: string;
  minLeadDays: number;
  horizonDays: number;
  maxJobsPerDay: number;
  /** True when this deployment runs on the demo store, so nothing booked here is real. */
  demo: boolean;
}

async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(15_000);
  const res = await fetch(url, { cache: "no-store", signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

export function fetchRange(from: string, to: string, signal?: AbortSignal) {
  return getJSON<{ meta: Meta; days: DaySummary[] }>(`/api/availability?from=${from}&to=${to}`, signal);
}

export function fetchDay(date: string, signal?: AbortSignal) {
  return getJSON<{ meta: Meta; day: DayDetail }>(`/api/availability?date=${date}`, signal);
}

export interface Confirmation {
  ref: string;
  date: string;
  slotId: string;
  packageId: string;
  rinse: boolean;
  priceDollars: number;
  priceIsEstimate: boolean;
  email: string;
  address: { street: string; city: string; zip: string };
  demo: boolean;
  /** The recurring plan they asked for, if any */
  planLabel?: string | null;
  planFrequencyId?: string | null;
}

export type SubmitResult =
  /** `notice` is Jimmy's FormSubmit notification to send now, or null when notifications are off. */
  | { kind: "ok"; booking: Confirmation; notice: Notice | null }
  | { kind: "conflict"; code: "slot_taken" | "day_full" | "date_unavailable"; message: string; day: DayDetail }
  | { kind: "invalid"; errors: FieldErrors }
  | { kind: "error"; message: string };

export async function submitBooking(body: Record<string, unknown>): Promise<SubmitResult> {
  let res: Response;
  try {
    res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return { kind: "error", message: "We couldn't reach the server. Check your connection and try again." };
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 201 && data.booking) {
    return { kind: "ok", booking: data.booking as Confirmation, notice: (data.notice as Notice | null | undefined) ?? null };
  }
  if (res.status === 409 || res.status === 422) {
    return {
      kind: "conflict",
      code: data.code as "slot_taken" | "day_full" | "date_unavailable",
      message: String(data.message ?? "That time isn't available anymore."),
      day: data.day as DayDetail,
    };
  }
  if (res.status === 400 && data.errors) return { kind: "invalid", errors: data.errors as FieldErrors };
  return { kind: "error", message: String(data.error ?? "Something went wrong. Please try again.") };
}
