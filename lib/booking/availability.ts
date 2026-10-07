import type { BookingRules } from "@/content/booking";
import { addDays, diffDays, weekday } from "./dates";
import type { DayDetail, DaySummary, ISODate, SlotAvailability, TakenSlot } from "./types";

// Pure scheduling rules. No storage, no clock: callers pass "today" and the taken slots,
// which keeps this easy to test and identical on the server and in any future admin tool.

type DateCheck =
  | { ok: true }
  | { ok: false; reason: "past" | "too_soon" | "closed" | "blackout" | "beyond_horizon" };

export function checkDate(date: ISODate, today: ISODate, rules: BookingRules): DateCheck {
  const ahead = diffDays(date, today);
  if (ahead < 0) return { ok: false, reason: "past" };
  if (ahead < rules.minLeadDays) return { ok: false, reason: "too_soon" };
  if (ahead > rules.horizonDays) return { ok: false, reason: "beyond_horizon" };
  if (rules.closedWeekdays.includes(weekday(date))) return { ok: false, reason: "closed" };
  if (rules.blackoutDates.includes(date)) return { ok: false, reason: "blackout" };
  return { ok: true };
}

export function dayDetail(
  date: ISODate,
  takenThatDay: readonly string[],
  today: ISODate,
  rules: BookingRules,
): DayDetail {
  const check = checkDate(date, today, rules);
  const taken = new Set(takenThatDay);
  const full = taken.size >= rules.maxJobsPerDay;

  const slots: SlotAvailability[] = rules.slots.map((s) => ({
    id: s.id,
    label: s.label,
    part: s.part,
    state: taken.has(s.id) ? "taken" : full ? "day_full" : "open",
  }));

  if (!check.ok) {
    return {
      date,
      status: check.reason === "closed" || check.reason === "blackout" ? "closed" : "unavailable",
      remaining: 0,
      reason: check.reason,
      slots: slots.map((s) => ({ ...s, state: s.state === "taken" ? "taken" : "closed" })),
    };
  }

  const openSlots = slots.filter((s) => s.state === "open").length;
  const remaining = Math.max(0, Math.min(rules.maxJobsPerDay - taken.size, openSlots));
  return {
    date,
    status: remaining === 0 ? "full" : "open",
    remaining,
    reason: remaining === 0 ? "full" : undefined,
    slots,
  };
}

export function groupTaken(taken: TakenSlot[]): Map<ISODate, string[]> {
  const byDate = new Map<ISODate, string[]>();
  for (const t of taken) {
    const list = byDate.get(t.date);
    if (list) list.push(t.slotId);
    else byDate.set(t.date, [t.slotId]);
  }
  return byDate;
}

export function rangeSummary(
  from: ISODate,
  to: ISODate,
  taken: TakenSlot[],
  today: ISODate,
  rules: BookingRules,
): DaySummary[] {
  const byDate = groupTaken(taken);
  const days: DaySummary[] = [];
  for (let d = from; diffDays(to, d) >= 0; d = addDays(d, 1)) {
    const { slots: _slots, ...summary } = dayDetail(d, byDate.get(d) ?? [], today, rules);
    days.push(summary);
  }
  return days;
}

export function firstOpening(
  taken: TakenSlot[],
  today: ISODate,
  rules: BookingRules,
): { date: ISODate; slotId: string; slotLabel: string; remaining: number } | null {
  const byDate = groupTaken(taken);
  for (let i = rules.minLeadDays; i <= rules.horizonDays; i++) {
    const date = addDays(today, i);
    const day = dayDetail(date, byDate.get(date) ?? [], today, rules);
    if (day.status !== "open") continue;
    const slot = day.slots.find((s) => s.state === "open");
    if (slot) return { date, slotId: slot.id, slotLabel: slot.label, remaining: day.remaining };
  }
  return null;
}
