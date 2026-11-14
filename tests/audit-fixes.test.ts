import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as bookingPost } from "@/app/api/bookings/route";
import { GET as keepalive } from "@/app/api/keepalive/route";
import { POST as planPost } from "@/app/api/plan-requests/route";
import { POST as referralPost } from "@/app/api/referrals/route";
import { bookingRules } from "@/content/booking";
import { planRules } from "@/content/plans";
import { today } from "@/lib/booking/service";
import { getBookingStore, resetBookingStore } from "@/lib/booking/store";
import { checkLink, signCheck, verifyCheck } from "@/lib/notify/check";
import { bookingNotice, planRequestNotice, referralNotice } from "@/lib/notify/formsubmit";
import { resetRateLimits } from "@/lib/rateLimit";
import { firstBookable } from "./helpers";

// The fixes from the 2026-11-14 audit: a plan added after booking changes that booking, referral
// links belong to the friend they were made for, a referral sent twice is one referral, and every
// email to Jimmy carries a link that proves it's real.

let ip = 0;
const headers = () => ({ "Content-Type": "application/json", "x-forwarded-for": `10.7.0.${++ip % 250}` });

beforeEach(() => {
  vi.stubEnv("BOOKING_DEMO_SEED", "off");
  vi.stubEnv("BOOKING_STORE", "memory");
  vi.stubEnv("NODE_ENV", "development");
  resetBookingStore();
  resetRateLimits();
});
afterEach(() => {
  vi.unstubAllEnvs();
  resetBookingStore();
});

const customer = {
  name: "Sam Neighbor",
  email: "sam@example.com",
  phone: "(215) 555-0111",
  street: "2 Test Ln",
  city: "Warminster",
  zip: "18974",
  notes: "",
};

async function book(over: Record<string, unknown> = {}, skip = 0) {
  const res = await bookingPost(
    new Request("http://localhost/api/bookings", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ ...customer, packageId: "two-story", rinse: false, date: firstBookable(today(), bookingRules, skip), ...over }),
    }),
  );
  return { status: res.status, body: await res.json() };
}

async function addPlan(over: Record<string, unknown>) {
  const res = await planPost(
    new Request("http://localhost/api/plan-requests", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ ...customer, frequencyId: "6-months", planTerms: true, ...over }),
    }),
  );
  return { status: res.status, body: await res.json() };
}

const referral = (over: Record<string, unknown> = {}) =>
  getBookingStore().createReferral({
    referrerName: "Pat Example",
    referrerPhone: "2155550100",
    referrerEmail: "pat@example.com",
    reward: "cash",
    friendName: "Sam Neighbor",
    friendPhone: "2155550111",
    friendEmail: "",
    friendTown: "",
    notes: "",
    ...over,
  });

describe("Make it recurring: the plan starts with the booking just made", () => {
  it("moves that booking to the plan price and records the plan", async () => {
    const { body } = await book();
    expect(body.booking.priceDollars).toBe(229);
    const { status, body: added } = await addPlan({ bookingRef: body.booking.ref });
    expect(status).toBe(201);
    expect(added).toMatchObject({ demo: true, booking: { ref: body.booking.ref, priceDollars: 206, planLabel: "Every 6 months" } });
    const saved = await getBookingStore().findBooking(body.booking.ref);
    expect(saved?.priceDollars).toBe(206);
    expect(saved?.notes).toMatch(
      new RegExp(`^Recurring plan: Every 6 months, 10% off \\(\\$206 a cleaning instead of \\$229; \\$412 for the year.*version ${planRules.termsVersion.replace(".", "\\.")}\\)\\. Plan added after booking\\.$`),
    );
  });

  it("does nothing more when the same plan is sent again, and refuses a different one", async () => {
    const { body } = await book();
    await addPlan({ bookingRef: body.booking.ref });
    const again = await addPlan({ bookingRef: body.booking.ref });
    expect(again.status).toBe(201);
    expect((await getBookingStore().findBooking(body.booking.ref))?.notes.match(/Recurring plan:/g)).toHaveLength(1);
    const other = await addPlan({ bookingRef: body.booking.ref, frequencyId: "3-months" });
    expect(other.status).toBe(409);
    expect(other.body.error).toMatch(/already on a plan \(every 6 months\)/);
  });

  it("only changes a booking made with the same email", async () => {
    const { body } = await book();
    const res = await addPlan({ bookingRef: body.booking.ref, email: "someone@else.com" });
    expect(res.status).toBe(404);
    expect((await getBookingStore().findBooking(body.booking.ref))?.priceDollars).toBe(229);
  });

  it("keeps a referral discount on the first cleaning", async () => {
    const { code } = await referral();
    const { body } = await book({ referralCode: code });
    expect(body.booking.priceDollars).toBe(199);
    const { body: added } = await addPlan({ bookingRef: body.booking.ref });
    expect(added.booking.priceDollars).toBe(176); // $206 plan price, less the $30
  });

  it("tells Jimmy what changed on the booking", () => {
    const n = planRequestNotice({
      frequency: "Every 6 months",
      ...customer,
      phone: "2155550111",
      booking: { ref: "KGG-ABCDE", date: "2026-11-20", priceBefore: 229, priceNow: 206, firstYear: 412, estimate: false },
    });
    expect(n.fields._subject).toBe("Recurring plan added to booking KGG-ABCDE: Every 6 months, Warminster");
    expect(n.fields.Booking).toBe(
      "KGG-ABCDE, Friday, November 20: the plan starts with this cleaning. Its price is now $206 (was $229), already changed in the booking database. The year, $412, is invoiced up front after this cleaning.",
    );
    expect(n.fields["Check it's real"]).toMatch(/\/check\/booking\/KGG-ABCDE\?s=/);
  });
});

describe("referral links", () => {
  it("only work for the friend they were made for", async () => {
    const { code } = await referral();
    const stranger = await book({ referralCode: code, phone: "2155550199", email: "stranger@example.com" });
    expect(stranger.status).toBe(410);
    expect(stranger.body.error).toBe("This referral link is for Sam. Book with the mobile number or email the referral was made with.");
    // Their email works as well as their phone
    const { code: byEmail } = await referral({ friendPhone: "", friendEmail: "sam@example.com", referrerPhone: "2155550122" });
    expect((await book({ referralCode: byEmail, phone: "2155550177" })).status).toBe(201);
  });

  it("can't be used by the person who made the referral", async () => {
    const { code } = await referral({ friendEmail: "pat@example.com" });
    const self = await book({ referralCode: code, email: "pat@example.com", phone: "2155550111" });
    expect(self.status).toBe(410);
    expect(self.body.error).toMatch(/can't be used by the person who made the referral/);
  });

  it("refuses the referrer's own email as the friend's on the form", async () => {
    const res = await referralPost(
      new Request("http://localhost/api/referrals", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          name: "Pat",
          phone: "2155550100",
          email: "pat@example.com",
          reward: "cash",
          friendName: "Sam",
          friendEmail: "PAT@example.com",
          consent: true,
        }),
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).errors.friendEmail).toMatch(/your own email/);
  });

  it("sent twice is one referral: the same code, with the latest details", async () => {
    const first = await referral();
    const again = await referral({ reward: "plan", notes: "Call after 5" });
    expect(again.code).toBe(first.code);
    expect(await getBookingStore().findReferral(first.code)).toMatchObject({ reward: "plan", notes: "Call after 5" });
    // A different friend, or a used code, gets a new one
    expect((await referral({ friendPhone: "2155550133" })).code).not.toBe(first.code);
    await book({ referralCode: first.code });
    expect((await referral()).code).not.toBe(first.code);
  });
});

describe("Check it's real links", () => {
  it("are signed, so a made-up email can't have a working one", () => {
    const env = { SUPABASE_SERVICE_ROLE_KEY: "server-secret" };
    const sig = signCheck("booking", "KGG-ABCDE", env);
    expect(verifyCheck("booking", "KGG-ABCDE", sig, env)).toBe(true);
    expect(verifyCheck("booking", "KGG-ABCDF", sig, env)).toBe(false);
    expect(verifyCheck("referral", "KGG-ABCDE", sig, env)).toBe(false);
    expect(verifyCheck("booking", "KGG-ABCDE", sig, { SUPABASE_SERVICE_ROLE_KEY: "another-secret" })).toBe(false);
    expect(verifyCheck("booking", "KGG-ABCDE", "x", env)).toBe(false);
    expect(checkLink("referral", "K7PQ2M9X")).toMatch(/\/check\/referral\/K7PQ2M9X\?s=[\w-]{22}$/);
  });

  it("are in every email to Jimmy", async () => {
    const { body } = await book();
    const record = await getBookingStore().findBooking(body.booking.ref);
    expect(bookingNotice(record!, bookingRules).fields["Check it's real"]).toBe(checkLink("booking", body.booking.ref));
    const r = await referral();
    const n = referralNotice(
      { name: "Pat", phone: "2155550100", email: "", reward: "cash", friendName: "Sam", friendPhone: "2155550111", friendEmail: "", friendTown: "", notes: "", consent: true },
      r.code,
    );
    expect(n.fields["Check it's real"]).toBe(checkLink("referral", r.code));
  });
});

describe("the daily keep-alive", () => {
  it("reads the database once and says nothing about what's in it", async () => {
    const res = await keepalive(new Request("http://localhost/api/keepalive"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("only answers Vercel's scheduler when CRON_SECRET is set", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await keepalive(new Request("http://localhost/api/keepalive"))).status).toBe(401);
    const ok = await keepalive(new Request("http://localhost/api/keepalive", { headers: { authorization: "Bearer s3cret" } }));
    expect(ok.status).toBe(200);
  });

  it("is scheduled daily in vercel.json", async () => {
    const { readFileSync } = await import("node:fs");
    const config = JSON.parse(readFileSync("vercel.json", "utf8")) as { crons: Array<{ path: string; schedule: string }> };
    expect(config.crons).toEqual([{ path: "/api/keepalive", schedule: "0 13 * * *" }]);
  });
});
