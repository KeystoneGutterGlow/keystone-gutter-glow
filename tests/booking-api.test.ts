import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/availability/route";
import { POST } from "@/app/api/bookings/route";
import { bookingRules, type BookingRules } from "@/content/booking";
import { packages, rinse } from "@/content/pricing";
import { createBooking, today } from "@/lib/booking/service";
import { resetBookingStore } from "@/lib/booking/store";
import { MemoryBookingStore } from "@/lib/booking/store/memory";
import type { NewBooking } from "@/lib/booking/types";
import { resetRateLimits } from "@/lib/rateLimit";
import { firstBookable } from "./helpers";

// Calls the real route handlers with real Request objects, against the in-memory store.

function book(over: Record<string, unknown> = {}, ip = "203.0.113.1") {
  return POST(
    new Request("http://localhost/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({
        packageId: "one-story",
        rinse: false,
        name: "API Test",
        email: "api-test@example.com",
        phone: "2155550100",
        street: "1 Test Ln",
        city: "Jamison",
        zip: "18929",
        notes: "",
        ...over,
      }),
    }),
  );
}

const availability = (query: string) => GET(new Request(`http://localhost/api/availability?${query}`));

beforeEach(() => {
  vi.stubEnv("BOOKING_DEMO_SEED", "off");
  resetBookingStore();
  resetRateLimits();
});

describe("POST /api/bookings", () => {
  const slots = bookingRules.slots.map((s) => s.id);

  it("creates a booking, with the price from the server", async () => {
    const date = firstBookable(today(), bookingRules);
    const res = await book({ date, slotId: slots[0], priceDollars: 1, rinse: true });
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.booking.priceDollars).toBe(packages[0]!.price + rinse.price); // whatever the client sent
    expect(body.booking.ref).toMatch(/^KGG-/);
    expect(body.booking.demo).toBe(true);
    expect(body.booking.emailSent).toBe(false);
  });

  it("books up to the cap when 10 people want the same day at once, and tells the rest it's full", async () => {
    const date = firstBookable(today(), bookingRules);
    const results = await Promise.all(Array.from({ length: 10 }, () => book({ date })));
    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 201)).toHaveLength(bookingRules.maxJobsPerDay);
    expect(statuses.filter((s) => s === 409)).toHaveLength(10 - bookingRules.maxJobsPerDay);
    const loser = await results.find((r) => r.status === 409)!.json();
    expect(loser.code).toBe("day_full");
    expect(Array.isArray(loser.day.slots)).toBe(true);
  });

  it("holds the four-a-day cap when every slot is requested at once", async () => {
    const date = firstBookable(today(), bookingRules);
    const results = await Promise.all(slots.map((slotId) => book({ date, slotId })));
    expect(results.filter((r) => r.status === 201)).toHaveLength(4);
    const refused = results.find((r) => r.status === 409)!;
    expect((await refused.json()).code).toBe("day_full");

    const after = await (await availability(`date=${date}`)).json();
    expect(after.day.status).toBe("full");
    expect(after.day.slots.every((s: { state: string }) => s.state !== "open")).toBe(true);
  });

  it("gives a retry the booking it already made, not a second one", async () => {
    const date = firstBookable(today(), bookingRules);
    const key = "retry-key-0001";
    const [a, b] = await Promise.all([book({ date, slotId: slots[1], idempotencyKey: key }), book({ date, slotId: slots[1], idempotencyKey: key })]);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect((await a.json()).booking.ref).toBe((await b.json()).booking.ref);
    const after = await (await availability(`date=${date}`)).json();
    expect(after.day.remaining).toBe(3);
  });

  it("refuses closed and past dates, even with a valid form", async () => {
    const closed = await book({ date: "2020-01-02", slotId: slots[0] });
    expect(closed.status).toBe(422);
    expect((await closed.json()).code).toBe("date_unavailable");
  });

  it("answers bad input with field errors, and bad JSON with 400", async () => {
    const date = firstBookable(today(), bookingRules);
    const bad = await book({ date, email: "x", zip: "1" });
    expect(bad.status).toBe(400);
    const { errors } = await bad.json();
    expect(errors.zip).toBeTruthy();
    expect(errors.email).toBeTruthy();

    const notJson = await POST(new Request("http://localhost/api/bookings", { method: "POST", body: "{oops" }));
    expect(notJson.status).toBe(400);
  });

  it("refuses an oversized body", async () => {
    const huge = await POST(
      new Request("http://localhost/api/bookings", { method: "POST", body: JSON.stringify({ notes: "x".repeat(40_000) }) }),
    );
    expect(huge.status).toBe(400);
  });

  it("swallows a bot submission without booking anything", async () => {
    const date = firstBookable(today(), bookingRules);
    const res = await book({ date, slotId: slots[2], company: "Spam LLC" });
    expect(res.status).toBe(201);
    expect((await res.json()).booking).toBeNull();
    const after = await (await availability(`date=${date}`)).json();
    expect(after.day.remaining).toBe(4);
  });

  it("rate limits one address without affecting another", async () => {
    const date = firstBookable(today(), bookingRules);
    let last: Response | undefined;
    for (let i = 0; i < 41; i++) last = await book({ date, email: "x" }, "198.51.100.9");
    expect(last!.status).toBe(429);
    expect((await book({ date, email: "x" }, "198.51.100.10")).status).toBe(400);
  });
});

describe("GET /api/availability", () => {
  it("validates its parameters", async () => {
    expect((await availability("date=2026-02-30")).status).toBe(400);
    expect((await availability("from=2026-01-01")).status).toBe(400);
    expect((await availability("from=2026-01-01&to=2026-12-31")).status).toBe(400);
    expect((await availability("from=2026-02-01&to=2026-01-01")).status).toBe(400);
  });

  it("returns a month and the next opening, flagged as demo data", async () => {
    const t = today();
    const month = await (await availability(`from=${t}&to=${t}`)).json();
    expect(month.days).toHaveLength(1);
    expect(month.meta.demo).toBe(true);
    const next = await (await availability("next=1")).json();
    expect(next.next.date).toBe(firstBookable(t, bookingRules));
  });
});

describe("production safety", () => {
  it("refuses to fall back to the memory store on a production server", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BOOKING_STORE", "");
    vi.stubEnv("BOOKING_DEMO_MODE", "");
    resetBookingStore();
    const date = firstBookable(today(), bookingRules);
    const created = await book({ date, slotId: "08:00" });
    expect(created.status).toBe(503);
    expect((await created.json()).error).toMatch(/call or text/i);
    expect((await availability("next=1")).status).toBe(503);
  });

  it("allows it on a production demo deployment only when asked", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BOOKING_STORE", "");
    vi.stubEnv("BOOKING_DEMO_MODE", "true");
    resetBookingStore();
    const date = firstBookable(today(), bookingRules);
    expect((await book({ date, slotId: "08:00" })).status).toBe(201);
  });

  it("answers 503 rather than crashing when Supabase is half configured", async () => {
    vi.stubEnv("BOOKING_STORE", "supabase");
    vi.stubEnv("SUPABASE_URL", "");
    resetBookingStore();
    expect((await availability("next=1")).status).toBe(503);
  });
});

describe("day-only scheduling at the contract's cap of three", () => {
  const dayOnly: BookingRules = { ...bookingRules, scheduleMode: "day-only", maxJobsPerDay: 3 };
  const request = (date: string, email: string) => ({
    packageId: "one-story" as const,
    rinse: false,
    date,
    slotId: "",
    name: "Pat Example",
    email,
    phone: "2155550100",
    street: "1 Test Ln",
    city: "Jamison",
    zip: "18929",
    notes: "",
  });

  it("files jobs under free slots and stops at three a day, even at the same moment", async () => {
    const date = firstBookable(today(), dayOnly);
    const results = await Promise.all(["a", "b", "c", "d", "e"].map((n) => createBooking(request(date, `${n}@example.com`), dayOnly)));
    const won = results.filter((r) => r.ok);
    expect(won).toHaveLength(3);
    const slots = won.map((r) => (r.ok ? r.booking.slotId : ""));
    expect(new Set(slots).size).toBe(3);
    const lost = results.find((r) => !r.ok);
    expect(lost && !lost.ok && lost.code).toBe("day_full");
  });
});

describe("time-slot scheduling, if it's ever switched back on", () => {
  const timeSlots: BookingRules = { ...bookingRules, scheduleMode: "time-slots" };

  it("lets exactly one of 10 simultaneous requests have a slot", async () => {
    const date = firstBookable(today(), timeSlots);
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        createBooking(
          {
            packageId: "one-story",
            rinse: false,
            date,
            slotId: "08:00",
            name: "Pat Example",
            email: `p${i}@example.com`,
            phone: "2155550100",
            street: "1 Test Ln",
            city: "Jamison",
            zip: "18929",
            notes: "",
          },
          timeSlots,
        ),
      ),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const lost = results.find((r) => !r.ok);
    expect(lost && !lost.ok && lost.code).toBe("slot_taken");
  });
});

describe("memory store", () => {
  const base: NewBooking = {
    ref: "KGG-1",
    date: "2026-11-10",
    slotId: "08:00",
    packageId: "one-story",
    rinse: false,
    priceDollars: 169,
    priceIsEstimate: false,
    customer: { name: "A", email: "a@example.com", phone: "2155550100" },
    address: { street: "1", city: "J", zip: "18929" },
    notes: "",
  };

  it("frees nothing it wasn't told to, and serializes concurrent creates", async () => {
    const store = new MemoryBookingStore();
    const out = await Promise.all(["08:00", "10:00", "12:00", "14:00", "16:00"].map((slotId, i) => store.create({ ...base, ref: `R${i}`, slotId }, 3)));
    expect(out.filter((r) => r.ok)).toHaveLength(3);
    expect(await store.listTaken("2026-11-10", "2026-11-10")).toHaveLength(3);
    expect(await store.listTaken("2026-11-11", "2026-11-11")).toHaveLength(0);
  });

  it("still has the rules Jimmy has confirmed so far, until he changes them", () => {
    expect(bookingRules.maxJobsPerDay).toBe(4);
    expect(bookingRules.scheduleMode).toBe("day-only");
    expect(bookingRules.closedWeekdays).toEqual([0]);
  });
});
