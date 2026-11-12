import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as bookingPost } from "@/app/api/bookings/route";
import { POST } from "@/app/api/plan-requests/route";
import { bookingRules } from "@/content/booking";
import { planAnnualTotal, planFrequencies, planPrice, planRules, planSaving, recommendedPlan } from "@/content/plans";
import { packages, rinse, totalFor } from "@/content/pricing";
import { today } from "@/lib/booking/service";
import { getBookingStore, resetBookingStore } from "@/lib/booking/store";
import { parsePlanRequest } from "@/lib/plan/validate";
import { firstBookable } from "./helpers";

const valid = {
  frequencyId: "6-months",
  name: "Pat Example",
  email: "Pat@Example.com",
  phone: "(215) 555-0100",
  street: "1 Test Ln",
  city: "Jamison",
  zip: "18929",
  notes: "Enter through the gate",
  planTerms: true,
};

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/plan-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `10.2.0.${Math.floor(Math.random() * 250)}` },
      body: JSON.stringify(body),
    }),
  );

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("recurring plan content", () => {
  it("offers Jimmy's four frequencies and recommends 6 months", () => {
    expect(planFrequencies.map((f) => f.id).sort()).toEqual(["12-months", "3-months", "4-months", "6-months"]);
    expect(recommendedPlan).toBe("6-months");
  });
});

describe("parsePlanRequest", () => {
  it("cleans a valid request", () => {
    const out = parsePlanRequest(valid);
    expect(out.ok && out.data.email).toBe("pat@example.com");
    expect(out.ok && out.data.phone).toBe("2155550100");
  });

  it("refuses an unknown frequency and bad contact details", () => {
    const out = parsePlanRequest({ ...valid, frequencyId: "weekly", zip: "1" });
    expect(!out.ok && Object.keys(out.errors).sort()).toEqual(["frequencyId", "zip"]);
  });

  it("flags the honeypot", () => {
    expect(parsePlanRequest({ ...valid, company: "x" })).toMatchObject({ ok: false, spam: true });
  });

  it("needs the Recurring Plan Terms box ticked", () => {
    for (const planTerms of [undefined, false, "true"]) {
      const out = parsePlanRequest({ ...valid, planTerms });
      expect(!out.ok && Object.keys(out.errors)).toEqual(["planTerms"]);
    }
  });
});

describe("asking for a plan while booking", () => {
  const bookRaw = async (over: Record<string, unknown>) => {
    vi.stubEnv("BOOKING_DEMO_SEED", "off");
    resetBookingStore();
    const res = await bookingPost(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": `10.4.0.${Math.floor(Math.random() * 250)}` },
        body: JSON.stringify({ ...valid, packageId: "one-story", rinse: false, date: firstBookable(today(), bookingRules), ...over }),
      }),
    );
    return { status: res.status, ...((await res.json()) as { errors: Record<string, string> }) };
  };
  const book = async (over: Record<string, unknown>) => {
    vi.stubEnv("BOOKING_DEMO_SEED", "off");
    resetBookingStore();
    const res = await bookingPost(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": `10.3.0.${Math.floor(Math.random() * 250)}` },
        body: JSON.stringify({ ...valid, packageId: "one-story", rinse: false, date: firstBookable(today(), bookingRules), ...over }),
      }),
    );
    return { status: res.status, booking: (await res.json()).booking };
  };

  it("confirms the plan and leaves it on the booking for Jimmy", async () => {
    const { status, booking } = await book({ planFrequencyId: "6-months", planTerms: true });
    expect(status).toBe(201);
    expect(booking.planLabel).toBe("Every 6 months");
    const saved = await getBookingStore().listTaken(booking.date, booking.date);
    expect(saved).toHaveLength(1);
  });

  it("refuses a plan without the Recurring Plan Terms box ticked, and books nothing", async () => {
    for (const planTerms of [undefined, false, "true", 1]) {
      const { status, errors } = await bookRaw({ planFrequencyId: "6-months", planTerms });
      expect(status).toBe(400);
      expect(errors.planTerms).toMatch(/recurring plan terms/);
    }
    expect(await getBookingStore().listTaken("2000-01-01", "2100-01-01")).toEqual([]);
  });

  it("records the terms version the customer agreed to with the booking", async () => {
    const { booking } = await book({ planFrequencyId: "4-months", planTerms: true, notes: "Gate code 1234" });
    // The demo store keeps its rows privately; reading them directly is fine in a test.
    const rows = (getBookingStore() as unknown as { rows: Array<{ ref: string; notes: string }> }).rows;
    const row = rows.find((r) => r.ref === booking.ref)!;
    expect(row.notes).toBe(
      `Recurring plan: Every 4 months, 10% off ($152 a cleaning instead of $169; $456 for the year, paid up front after the first cleaning). ` +
        `Agreed to the Recurring Plan Terms (version ${planRules.termsVersion}). Gate code 1234`,
    );
  });

  it("charges the plan price, 10% off, and the regular price without a plan", async () => {
    const cases: Array<[Record<string, unknown>, number, boolean]> = [
      [{ packageId: "one-story", planFrequencyId: "6-months", planTerms: true }, 152, false],
      [{ packageId: "two-story", rinse: true, planFrequencyId: "3-months", planTerms: true }, 228, false],
      [{ packageId: "large", planFrequencyId: "12-months", planTerms: true }, 224, true],
      [{ packageId: "one-story", planFrequencyId: "" }, 169, false],
      [{ packageId: "two-story", rinse: true, planFrequencyId: "" }, 254, false],
    ];
    for (const [over, price, estimate] of cases) {
      const { status, booking } = await book(over);
      expect(status).toBe(201);
      expect(booking.priceDollars).toBe(price);
      expect(booking.priceIsEstimate).toBe(estimate);
    }
    // The browser can't set the price: a sent price is ignored.
    expect((await book({ planFrequencyId: "6-months", planTerms: true, priceDollars: 1 })).booking.priceDollars).toBe(152);
  });

  it("returns the plan's id with the confirmation", async () => {
    expect((await book({ planFrequencyId: "4-months", planTerms: true })).booking.planFrequencyId).toBe("4-months");
    expect((await book({ planFrequencyId: "" })).booking.planFrequencyId).toBeNull();
  });

  it("books normally with no plan, or one it doesn't recognize", async () => {
    expect((await book({ planFrequencyId: "" })).booking.planLabel).toBeNull();
    expect((await book({ planFrequencyId: "weekly" })).booking.planLabel).toBeNull();
  });
});

describe("the plan discount", () => {
  it("is 10% off every price on the site, rounded down so it's never less than 10%", () => {
    expect(planRules.discountPercent).toBe(10);
    expect(packages.map((p) => planPrice(p.price))).toEqual([152, 179, 206, 224]);
    for (const p of packages) {
      for (const withRinse of [false, true]) {
        const regular = totalFor(p, withRinse);
        const plan = planPrice(regular);
        expect(Number.isInteger(plan)).toBe(true);
        expect(plan).toBeLessThanOrEqual(regular * 0.9);
        expect(plan).toBeGreaterThan(regular * 0.9 - 1);
        expect(planSaving(regular)).toBe(regular - plan);
      }
    }
    expect(planPrice(250)).toBe(225);
    expect(planPrice(rinse.price)).toBe(22);
  });

  it("sets the annual total from the plan price", () => {
    expect(planAnnualTotal(planPrice(229), "6-months")).toBe(412);
    expect(planAnnualTotal(planPrice(169), "3-months")).toBe(608);
  });
});

describe("POST /api/plan-requests", () => {
  // What the notice says, and that it's only sent through FormSubmit, is in tests/notify.test.ts.

  it("marks the answer as a demo on a demo deployment, and sends nothing", async () => {
    vi.stubEnv("FORMSUBMIT_ENABLED", "true");
    vi.stubEnv("BOOKING_STORE", "memory");
    vi.stubEnv("NODE_ENV", "development");
    const res = await post(valid);
    expect(res.status).toBe(201);
    expect((await res.json()).demo).toBe(true);
  });

  it("refuses on a real deployment with notifications off, rather than losing the request", async () => {
    vi.stubEnv("FORMSUBMIT_ENABLED", "");
    vi.stubEnv("BOOKING_STORE", "supabase");
    vi.stubEnv("SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "key");
    expect((await post(valid)).status).toBe(503);
  });

  it("answers 400 with field errors, and quietly accepts bots", async () => {
    const bad = await post({ ...valid, email: "nope" });
    expect(bad.status).toBe(400);
    expect((await bad.json()).errors.email).toBeTruthy();
    expect((await post({ ...valid, company: "spam" })).status).toBe(201);
  });
});
