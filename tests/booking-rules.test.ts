import { describe, expect, it } from "vitest";
import { bookingRules, type BookingRules } from "@/content/booking";
import { checkDate, dayDetail, firstOpening, rangeSummary } from "@/lib/booking/availability";
import { addDays, addMonths, daysInMonth, diffDays, formatLong, isISODate, todayIn, weekday } from "@/lib/booking/dates";
import { isUsPhone, normalizePhone, OUTSIDE_AREA_ERROR, parseBookingRequest, validateContact } from "@/lib/booking/validate";
import { areaCounties, areaZips, lookupArea, serviceRadius, serviceShape, stateForZip } from "@/content/area";

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
  it("knows a ZIP and a town, and says no to anything outside the area", () => {
    expect(lookupArea("18929")).toEqual({ status: "yes", town: "Jamison" });
    expect(lookupArea("Doylestown, PA")).toEqual({ status: "yes", town: "Doylestown" });
    expect(lookupArea("19464")).toEqual({ status: "outside" }); // Pottstown, PA: past the edge
    expect(lookupArea("15213")).toEqual({ status: "outside" }); // Pittsburgh
    expect(lookupArea("123")).toEqual({ status: "invalid" });
  });

  it("covers everything within 15 miles in Pennsylvania, and nothing past it", () => {
    expect(serviceRadius.miles).toBe(15);
    // The old 10-mile area, the towns just past it, and well-known places further out
    for (const zip of ["18974", "19044", "19040", "18954", "18966", "18938", "19006", "19053", "19067", "18977", "19047"]) {
      expect(lookupArea(zip).status).toBe("yes");
    }
    for (const zip of ["19446", "19020", "19111", "19118", "19462"]) expect(lookupArea(zip).status).toBe("yes");
    expect(areaZips.every((z) => z.miles <= serviceRadius.miles)).toBe(true);
    expect(areaZips).toHaveLength(71);
    expect(areaZips.filter((z) => z.miles <= 10)).toHaveLength(33);
    expect(new Set(areaZips.map((z) => z.zip)).size).toBe(areaZips.length);
    // Past 15 miles, still Pennsylvania: outside the area (Levittown, Bristol, Norristown, Quakertown, King of Prussia...)
    for (const zip of ["19054", "19007", "19401", "18951", "19406", "18930", "19131", "19103", "19464"]) {
      expect(lookupArea(zip)).toEqual({ status: "outside" });
    }
    expect(lookupArea("Yardley")).toEqual({ status: "yes", town: "Yardley" });
    expect(lookupArea("King of Prussia")).toEqual({ status: "unknown" });
  });

  it("leaves New Jersey out entirely, even the parts inside 20 miles", () => {
    expect(areaZips.every((z) => z.state === "PA" && !z.zip.startsWith("0"))).toBe(true);
    // Lambertville, Trenton, Princeton and Ewing are all within 20 miles of Jamison
    for (const zip of ["08530", "08618", "08540", "08628"]) expect(lookupArea(zip)).toEqual({ status: "outOfState", state: "NJ" });
    expect(lookupArea("Princeton, NJ")).toEqual({ status: "unknown" });
    expect(lookupArea("19801")).toEqual({ status: "outOfState", state: "DE" });
  });

  it("draws the map's area inside the 15-mile circle and on the Pennsylvania side of the river only", () => {
    // Points in degrees, measured in miles from the center the same way the ZIP distances were
    const miles = ([lat, lon]: [number, number]) =>
      Math.hypot((lon - serviceRadius.lon) * 69.172 * Math.cos((serviceRadius.lat * Math.PI) / 180), (lat - serviceRadius.lat) * 69.0);
    const inside = ([lat, lon]: [number, number]) => {
      let c = false;
      for (let i = 0, j = serviceShape.length - 1; i < serviceShape.length; j = i++) {
        const [yi, xi] = serviceShape[i]!;
        const [yj, xj] = serviceShape[j]!;
        if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    expect(serviceShape.length).toBeGreaterThan(50);
    expect(Math.max(...serviceShape.map(miles))).toBeLessThan(15.05);
    // Pennsylvania towns near the river are in
    for (const p of [[40.2546, -75.0868], [40.3643, -74.9513], [40.2457, -74.846], [40.229, -74.9368], [40.3101, -75.1299]] as Array<[number, number]>) {
      expect(inside(p)).toBe(true);
    }
    // New Jersey across the river is out: Lambertville, Stockton, Titusville, Ewing, Trenton
    for (const p of [[40.3659, -74.9429], [40.4073, -74.9799], [40.3018, -74.8604], [40.2696, -74.7999], [40.2206, -74.7597]] as Array<[number, number]>) {
      expect(inside(p)).toBe(false);
    }
  });

  it("refuses addresses outside Pennsylvania when booking", () => {
    const contact = { name: "Pat", email: "pat@example.com", phone: "2155550100", street: "1 Test Ln", city: "Lambertville" };
    expect(validateContact({ ...contact, zip: "08530" }).zip).toMatch(/only work in Pennsylvania/);
    expect(validateContact({ ...contact, zip: "18929" }).zip).toBeUndefined();
    // Only the ZIPs inside the 15-mile area can book: just past the edge, or across the state, is refused
    for (const zip of ["19054", "19401", "19464", "15213", "16501", "19103"]) expect(validateContact({ ...contact, zip }).zip).toBe(OUTSIDE_AREA_ERROR);
    expect(OUTSIDE_AREA_ERROR).toBe("That ZIP is outside our area. We only work within 15 miles of Jamison, in Pennsylvania.");
  });

  it("knows each address's state from its ZIP", () => {
    expect(stateForZip("18929")).toBe("PA");
    expect(stateForZip("08540")).toBe("NJ");
    expect(stateForZip("18103")).toBe("PA");
    expect(stateForZip("19801")).toBe("DE");
  });

  it("groups the towns by county, Bucks first", () => {
    expect(areaCounties.map((c) => c.county)).toEqual(["Bucks", "Montgomery", "Philadelphia"]);
    for (const c of areaCounties) expect(c.towns).toEqual([...c.towns].sort((a, b) => a.localeCompare(b)));
  });

  it("matches other names for places in the area", () => {
    expect(lookupArea("Holland, PA")).toEqual({ status: "yes", town: "Southampton" });
    expect(lookupArea("warwick township")).toEqual({ status: "yes", town: "Jamison" });
    expect(lookupArea("Ivyland")).toEqual({ status: "yes", town: "Warminster" });
    expect(lookupArea("18940-1234")).toEqual({ status: "yes", town: "Newtown" });
  });

  it("doesn't call nonsense outside the area", () => {
    expect(lookupArea("abc")).toEqual({ status: "unknown" });
    expect(lookupArea("   ")).toEqual({ status: "invalid" });
  });
});
