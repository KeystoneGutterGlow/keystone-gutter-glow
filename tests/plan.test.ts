import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as bookingPost } from "@/app/api/bookings/route";
import { POST } from "@/app/api/plan-requests/route";
import { bookingRules } from "@/content/booking";
import { planFrequencies, recommendedPlan } from "@/content/plans";
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
});

describe("asking for a plan while booking", () => {
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
    const { status, booking } = await book({ planFrequencyId: "6-months" });
    expect(status).toBe(201);
    expect(booking.planLabel).toBe("Every 6 months");
    const saved = await getBookingStore().listTaken(booking.date, booking.date);
    expect(saved).toHaveLength(1);
  });

  it("books normally with no plan, or one it doesn't recognize", async () => {
    expect((await book({ planFrequencyId: "" })).booking.planLabel).toBeNull();
    expect((await book({ planFrequencyId: "weekly" })).booking.planLabel).toBeNull();
  });
});

describe("POST /api/plan-requests", () => {
  it("emails Jimmy the frequency, address and contact details", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Keystone <test@example.com>");
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await post(valid);
    expect(res.status).toBe(201);
    expect((await res.json()).demo).toBeUndefined();

    const sent = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sent.reply_to).toBe("pat@example.com");
    expect(sent.text).toContain("Every 6 months");
    expect(sent.text).toContain("1 Test Ln, Jamison, PA 18929");
    expect(sent.text).toContain("(215) 555-0100");
    expect(sent.text).toContain("Enter through the gate");
    expect(sent.text).toContain("Nothing has been scheduled or billed");
  });

  it("doesn't claim success when the email fails", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Keystone <test@example.com>");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    const res = await post(valid);
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/hasn't seen it/);
  });

  it("marks the answer as a demo on a demo deployment with no email", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("BOOKING_STORE", "memory");
    vi.stubEnv("NODE_ENV", "development");
    const res = await post(valid);
    expect(res.status).toBe(201);
    expect((await res.json()).demo).toBe(true);
  });

  it("refuses on a real deployment with no email, rather than losing the request", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
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
