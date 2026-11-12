import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as bookingPost } from "@/app/api/bookings/route";
import { POST as referralPost } from "@/app/api/referrals/route";
import { bookingRules } from "@/content/booking";
import { getPackage, packages } from "@/content/pricing";
import { quoteFor } from "@/content/quote";
import { referralPaths, referralRules } from "@/content/referral";
import { today } from "@/lib/booking/service";
import { getBookingStore, resetBookingStore } from "@/lib/booking/store";
import { parseBookingRequest } from "@/lib/booking/validate";
import { referralNotice } from "@/lib/notify/formsubmit";
import { resetRateLimits } from "@/lib/rateLimit";
import { parseReferralRequest } from "@/lib/referral/validate";
import { firstBookable } from "./helpers";

// The referral program (content/referral.ts): $25 cash or $50 off a plan for the referrer, $30 off
// one cleaning for the person they refer, booked from /referred.

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
beforeEach(() => resetRateLimits());

const pkg = (id: string) => getPackage(id)!;

describe("the program's rules", () => {
  it("are Sam's: $25 cash or $50 off a plan, and $30 off for the friend", () => {
    expect(referralRules).toEqual({ friendDiscount: 30, cashReward: 25, planCredit: 50 });
    expect(referralPaths).toEqual({ refer: "/refer", friend: "/referred" });
  });
});

describe("quoteFor", () => {
  it("prices a cleaning with no discounts", () => {
    expect(quoteFor(pkg("two-story"), true)).toEqual({
      regular: 254,
      perCleaning: 254,
      referralOff: 0,
      thisCleaning: 254,
      planYear: null,
      firstYear: null,
    });
  });

  it("takes $30 off a referred cleaning", () => {
    expect(packages.map((p) => quoteFor(p, false, null, true).thisCleaning)).toEqual([139, 169, 199, 219]);
  });

  it("on a plan, takes the $30 off the first cleaning and so the first year", () => {
    expect(quoteFor(pkg("two-story"), true, "6-months", true)).toEqual({
      regular: 254,
      perCleaning: 228,
      referralOff: 30,
      thisCleaning: 198,
      planYear: 456,
      firstYear: 426,
    });
    expect(quoteFor(pkg("one-story"), false, "3-months", false).firstYear).toBe(608);
  });
});

describe("booking from the referral page", () => {
  const valid = {
    name: "Sam Neighbor",
    email: "sam@example.com",
    phone: "(215) 555-0111",
    street: "2 Test Ln",
    city: "Warminster",
    zip: "18974",
    notes: "",
  };
  const book = async (over: Record<string, unknown>) => {
    vi.stubEnv("BOOKING_DEMO_SEED", "off");
    resetBookingStore();
    const res = await bookingPost(
      new Request("http://localhost/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": `10.5.0.${Math.floor(Math.random() * 250)}` },
        body: JSON.stringify({ ...valid, packageId: "one-story", rinse: false, date: firstBookable(today(), bookingRules), ...over }),
      }),
    );
    const body = await res.json();
    const rows = (getBookingStore() as unknown as { rows: Array<{ ref: string; notes: string }> }).rows;
    return { status: res.status, body, row: body.booking ? rows.find((r) => r.ref === body.booking.ref) : undefined };
  };

  it("needs the name of whoever referred them", () => {
    for (const referredBy of [undefined, "", " ", "A"]) {
      const out = parseBookingRequest({ ...valid, packageId: "one-story", date: "2030-01-02", referral: true, referredBy });
      expect(!out.ok && out.errors.referredBy).toMatch(/Who sent you our way/);
    }
  });

  it("ignores a name sent without the referral flag", () => {
    const out = parseBookingRequest({ ...valid, packageId: "one-story", date: "2030-01-02", referredBy: "Pat" });
    expect(out.ok && out.data.referral).toBe(false);
    expect(out.ok && out.data.referredBy).toBe("");
  });

  it("saves the cleaning at $30 off, with who referred them in the notes", async () => {
    const { status, body, row } = await book({ referral: true, referredBy: "Pat Example", notes: "Gate code 1234" });
    expect(status).toBe(201);
    expect(body.booking.priceDollars).toBe(139);
    expect(body.booking.referralOff).toBe(30);
    expect(body.booking.referredBy).toBe("Pat Example");
    expect(row!.notes).toBe(
      "Referral: $30 off this cleaning (regular $169), referred by Pat Example. Their thank-you is due once this house is fully cleaned. Gate code 1234",
    );
  });

  it("on a plan, takes the $30 off the first cleaning and records the first year", async () => {
    const { body, row } = await book({
      referral: true,
      referredBy: "Pat Example",
      packageId: "two-story",
      rinse: true,
      planFrequencyId: "6-months",
      planTerms: true,
    });
    expect(body.booking.priceDollars).toBe(198);
    expect(row!.notes).toContain("Referral: $30 off this cleaning (regular $228), referred by Pat Example.");
    expect(row!.notes).toContain("($228 a cleaning instead of $254; $426 for the year, paid up front after the first cleaning, after the $30 referral discount)");
  });

  it("charges the regular price without the referral flag, whatever the browser sends", async () => {
    const { body } = await book({ referredBy: "Pat Example", priceDollars: 1, referralOff: 30 });
    expect(body.booking.priceDollars).toBe(169);
    expect(body.booking.referralOff).toBe(0);
    expect(body.booking.referredBy).toBeNull();
  });
});

describe("the referral form", () => {
  const valid = {
    name: "Pat Example",
    phone: "(215) 555-0100",
    email: "Pat@Example.com",
    reward: "cash",
    friendName: "Sam Neighbor",
    friendPhone: "215-555-0111",
    friendEmail: "",
    friendTown: "Warminster",
    notes: "Call after 5",
    consent: true,
  };

  it("cleans a valid referral", () => {
    const out = parseReferralRequest(valid);
    expect(out.ok && out.data).toMatchObject({ phone: "2155550100", email: "pat@example.com", friendPhone: "2155550111", reward: "cash" });
  });

  it("lets the referrer leave their email blank, and takes the friend's phone or email", () => {
    expect(parseReferralRequest({ ...valid, email: "" }).ok).toBe(true);
    expect(parseReferralRequest({ ...valid, friendPhone: "", friendEmail: "sam@example.com" }).ok).toBe(true);
  });

  it("needs a thank-you, a way to reach the friend, and their OK", () => {
    const out = parseReferralRequest({ ...valid, reward: "gift card", friendPhone: "", friendEmail: "", consent: "true" });
    expect(!out.ok && Object.keys(out.errors).sort()).toEqual(["consent", "friendPhone", "reward"]);
  });

  it("refuses the referrer's own number as the friend's", () => {
    const out = parseReferralRequest({ ...valid, friendPhone: "2155550100" });
    expect(!out.ok && out.errors.friendPhone).toMatch(/your own number/);
  });

  it("flags the honeypot", () => {
    expect(parseReferralRequest({ ...valid, company: "x" })).toMatchObject({ ok: false, spam: true });
  });

  it("tells Jimmy who to contact, where to send them, and what he owes once they're cleaned", () => {
    vi.stubEnv("SITE_URL", "https://example.test");
    const out = parseReferralRequest({ ...valid, reward: "plan" });
    const f = referralNotice(out.ok ? out.data : (null as never)).fields;
    expect(f._subject).toBe("New referral: Sam Neighbor, from Pat Example");
    expect(f._replyto).toBe("pat@example.com");
    expect(f.Referral).toMatch(/^Pat Example referred Sam Neighbor\. Get in touch with Sam and send them the \$30-off booking page: https?:\/\/.+\/referred$/);
    expect(f["Thank-you"]).toBe("$50 off a recurring plan for Pat Example. Call them to set it up. Only once Sam has booked and their house is fully cleaned.");
    expect(f["Their phone"]).toBe("(215) 555-0100");
    expect(f["Friend's phone"]).toBe("(215) 555-0111");
    expect(f["Friend's email"]).toBeUndefined();
    expect(f["Friend's town"]).toBe("Warminster");
    const cash = parseReferralRequest({ ...valid, email: "" });
    const c = referralNotice(cash.ok ? cash.data : (null as never)).fields;
    expect(c["Thank-you"]).toBe("$25 cash for Pat Example. Only once Sam has booked and their house is fully cleaned.");
    expect(c._replyto).toBeUndefined();
    expect(c.email).toBeUndefined();
  });

  const post = (body: unknown) =>
    referralPost(
      new Request("http://localhost/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": `10.6.0.${Math.floor(Math.random() * 250)}` },
        body: JSON.stringify(body),
      }),
    );

  it("hands the browser Jimmy's notice when notifications are on, and sends nothing itself", async () => {
    vi.stubEnv("FORMSUBMIT_ENABLED", "true");
    vi.stubEnv("BOOKING_STORE", "supabase");
    vi.stubEnv("SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "k");
    vi.stubEnv("VERCEL_ENV", "production");
    const fetched: string[] = [];
    vi.stubGlobal("fetch", (async (u: string) => {
      fetched.push(String(u));
      throw new Error("no network in tests");
    }) as unknown as typeof fetch);
    const res = await post(valid);
    expect(res.status).toBe(201);
    const { notice } = await res.json();
    expect(notice.endpoint).toBe("https://formsubmit.co/ajax/jimmyesmond@keystonegutterglow.com");
    expect(notice.fields["Friend's name"]).toBe("Sam Neighbor");
    expect(fetched).toEqual([]);
  });

  it("says demo on a demo deployment, and refuses on a real one with notifications off", async () => {
    vi.stubEnv("FORMSUBMIT_ENABLED", "true");
    vi.stubEnv("BOOKING_STORE", "memory");
    vi.stubEnv("NODE_ENV", "development");
    expect(await (await post(valid)).json()).toEqual({ ok: true, demo: true });

    vi.stubEnv("FORMSUBMIT_ENABLED", "");
    vi.stubEnv("BOOKING_STORE", "supabase");
    vi.stubEnv("SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "k");
    vi.stubEnv("NODE_ENV", "production");
    expect((await post(valid)).status).toBe(503);
  });

  it("returns field errors for bad input", async () => {
    const res = await post({ ...valid, reward: "" });
    expect(res.status).toBe(400);
    expect((await res.json()).errors.reward).toBe("Pick your thank-you.");
  });
});
