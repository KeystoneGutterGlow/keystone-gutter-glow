import { describe, expect, it } from "vitest";
import { bookingRules, type BookingRules } from "@/content/booking";
import { checkDate, dayDetail, firstOpening, rangeSummary } from "@/lib/booking/availability";
import { addDays, addMonths, daysInMonth, diffDays, formatLong, isISODate, todayIn, weekday } from "@/lib/booking/dates";
import { isUsPhone, normalizePhone, parseBookingRequest } from "@/lib/booking/validate";
import { lookupArea } from "@/content/area";

const rules: BookingRules = bookingRules;
// A Tuesday, so the closed-Sunday rule is easy to reason about.
const today = "2026-11-03";

const valid = {
  packageId: "one-story",
  date: "2026-11-10",
  slotId: "08:00",
  name: "Pat Example",
  email: "PAT@Example.com",
  phone: "(215) 555-0100",
  street: "1 Test Ln",
  city: "Jamison",
  zip: "18929",
  notes: "",
};

describe("calendar dates", () => {
  it("rejects dates that don't exist", () => {
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("2026-13-01")).toBe(false);
    expect(isISODate("2026-2-3")).toBe(false);
    expect(isISODate(20260203)).toBe(false);
    expect(isISODate("2028-02-29")).toBe(true);
  });

  it("handles month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addMonths("2026-12-01", 1)).toBe("2027-01-01");
    expect(diffDays("2027-01-01", "2026-12-31")).toBe(1);
    expect(daysInMonth("2028-02-01")).toBe(29);
  });

  it("doesn't drift across daylight saving changes", () => {
    // US clocks go back on 2026-11-01.
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    expect(diffDays("2026-11-02", "2026-10-31")).toBe(2);
    expect(weekday("2026-11-01")).toBe(0);
    expect(formatLong("2026-11-01")).toBe("Sunday, November 1");
  });

  it("works out today in the business time zone, not the server's", () => {
    // 2am UTC on Nov 4 is still the evening of Nov 3 in Bucks County.
    expect(todayIn("America/New_York", new Date("2026-11-04T02:00:00Z"))).toBe("2026-11-03");
    expect(todayIn("America/New_York", new Date("2026-11-04T06:00:00Z"))).toBe("2026-11-04");
  });
});

describe("which days can be booked", () => {
  it("refuses past, same-day, closed, blacked-out and too-distant dates", () => {
    expect(checkDate("2026-11-02", today, rules)).toEqual({ ok: false, reason: "past" });
    expect(checkDate(today, today, rules)).toEqual({ ok: false, reason: "too_soon" });
    expect(checkDate("2026-11-08", today, rules)).toEqual({ ok: false, reason: "closed" }); // a Sunday
    expect(checkDate(addDays(today, 61), today, rules)).toEqual({ ok: false, reason: "beyond_horizon" });
    expect(checkDate("2026-11-10", today, { ...rules, blackoutDates: ["2026-11-10"] })).toEqual({ ok: false, reason: "blackout" });
    expect(checkDate("2026-11-04", today, rules)).toEqual({ ok: true });
  });
});

describe("a day's slots", () => {
  it("disables taken slots and leaves the others open", () => {
    const day = dayDetail("2026-11-10", ["08:00", "12:00"], today, rules);
    expect(day.status).toBe("open");
    expect(day.remaining).toBe(2);
    expect(day.slots.find((s) => s.id === "08:00")?.state).toBe("taken");
    expect(day.slots.find((s) => s.id === "10:00")?.state).toBe("open");
  });

  it("closes the whole day at the cap even with a start time unbooked", () => {
    const day = dayDetail("2026-11-10", ["08:00", "10:00", "12:00", "14:00"], today, rules);
    expect(day.status).toBe("full");
    expect(day.remaining).toBe(0);
    expect(day.slots.find((s) => s.id === "16:00")?.state).toBe("day_full");
    expect(day.slots.some((s) => s.state === "open")).toBe(false);
  });

  it("marks every slot closed on a closed day", () => {
    const day = dayDetail("2026-11-08", [], today, rules);
    expect(day.status).toBe("closed");
    expect(day.slots.every((s) => s.state === "closed")).toBe(true);
  });

  it("summarizes a month and finds the next opening past full days", () => {
    const full = ["08:00", "10:00", "12:00", "14:00"].map((slotId) => ({ date: "2026-11-04", slotId }));
    const days = rangeSummary("2026-11-01", "2026-11-30", full, today, rules);
    expect(days).toHaveLength(30);
    expect(days.find((d) => d.date === "2026-11-04")?.status).toBe("full");
    expect(firstOpening(full, today, rules)?.date).toBe("2026-11-05");
  });
});

describe("booking request validation", () => {
  it("accepts a good request and cleans it up", () => {
    const r = parseBookingRequest(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.email).toBe("pat@example.com");
      expect(r.data.phone).toBe("2155550100");
    }
  });

  it("reports each bad field", () => {
    const bad = { ...valid, email: "nope", zip: "12", phone: "123", packageId: "mansion", date: "soon", slotId: "03:00" };
    const r = parseBookingRequest(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(["date", "email", "packageId", "phone", "zip"]);
    }
    const withSlots = parseBookingRequest(bad, { ...rules, scheduleMode: "time-slots" });
    expect(!withSlots.ok && withSlots.errors.slotId).toBeTruthy();
  });

  it("flags the honeypot as spam", () => {
    const r = parseBookingRequest({ ...valid, company: "Spam LLC" });
    expect(r).toMatchObject({ ok: false, spam: true });
  });

  it("refuses non-objects without throwing", () => {
    expect(parseBookingRequest(null).ok).toBe(false);
    expect(parseBookingRequest("hi").ok).toBe(false);
    expect(parseBookingRequest([]).ok).toBe(false);
  });

  it("caps long text and strips control characters", () => {
    const r = parseBookingRequest({ ...valid, name: "Pat\u0000 Example", notes: "x".repeat(5000) });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.name).toBe("Pat  Example");
      expect(r.data.notes).toHaveLength(1000);
    }
  });

  it("only takes a well-formed idempotency key", () => {
    const good = parseBookingRequest({ ...valid, idempotencyKey: "0f8fad5b-d9cb-469f-a165-70867728950e" });
    const bad = parseBookingRequest({ ...valid, idempotencyKey: "' or 1=1 --" });
    expect(good.ok && good.data.idempotencyKey).toBe("0f8fad5b-d9cb-469f-a165-70867728950e");
    expect(bad.ok && bad.data.idempotencyKey).toBeUndefined();
  });

  it("needs a real-looking US phone number", () => {
    expect(isUsPhone("1 (215) 555-0100")).toBe(true);
    expect(normalizePhone("1 (215) 555-0100")).toBe("2155550100");
    expect(isUsPhone("0000000000")).toBe(false);
    expect(isUsPhone("1234567890")).toBe(false);
    expect(isUsPhone("215555010")).toBe(false);
  });

  it("doesn't need a slot in day-only mode, and ignores one that's sent", () => {
    const dayOnly: BookingRules = { ...rules, scheduleMode: "day-only", maxJobsPerDay: 3 };
    const r = parseBookingRequest({ ...valid, slotId: "03:00" }, dayOnly);
    expect(r.ok && r.data.slotId).toBe("");
  });
});

describe("service area lookup", () => {
  it("knows a ZIP and a town, and asks about anything else", () => {
    expect(lookupArea("18929")).toEqual({ status: "yes", town: "Jamison" });
    expect(lookupArea("Doylestown, PA")).toEqual({ status: "yes", town: "Doylestown" });
    expect(lookupArea("90210")).toEqual({ status: "ask" });
    expect(lookupArea("123")).toEqual({ status: "invalid" });
  });
});
