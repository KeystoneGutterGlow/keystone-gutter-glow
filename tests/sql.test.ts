import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SupabaseBookingStore } from "@/lib/booking/store/supabase";
import type { NewBooking, NewReferral } from "@/lib/booking/types";
import { SupabaseOrderStore } from "@/lib/firewood/store";
import type { NewOrder } from "@/lib/firewood/types";
import { freshDatabase, postgrestShim } from "./helpers";

// Every migration on PGlite (real Postgres in WASM). PGlite has one connection, so these prove the
// constraints and the logic. They can't prove the advisory lock under two real connections.

let db: PGlite;

beforeAll(async () => {
  db = await freshDatabase();
});
afterAll(async () => {
  await db.close();
});

let n = 0;
async function create(date: string, slot: string, over: Record<string, unknown> = {}) {
  n++;
  const p = {
    ref: `KGG-T${n}`,
    service_date: date,
    slot_id: slot,
    package_id: "two-story",
    rinse: false,
    price_dollars: 229,
    customer_name: "SQL Test",
    customer_email: "sql@example.com",
    customer_phone: "2155550100",
    street: "1 Test Ln",
    city: "Jamison",
    zip: "18929",
    ...over,
  };
  const { rows } = await db.query<{ r: { ok: boolean; reason?: string; duplicate?: boolean; booking?: { ref: string; slot_id: string } } }>(
    "select public.create_booking($1::jsonb) as r",
    [JSON.stringify(p)],
  );
  return rows[0]!.r;
}

describe("bookings table", () => {
  const D = "2026-11-03";

  it("creates a booking, refuses the same slot, and refuses a fifth job", async () => {
    const first = await create(D, "08:00");
    expect(first.ok).toBe(true);
    expect(first.booking?.slot_id).toBe("08:00");

    expect(await create(D, "08:00")).toMatchObject({ ok: false, reason: "slot_taken" });

    for (const slot of ["10:00", "12:00", "14:00"]) await create(D, slot);
    expect(await create(D, "16:00")).toMatchObject({ ok: false, reason: "day_full" });

    const { rows } = await db.query<{ c: number }>("select count(*)::int as c from bookings where service_date = $1 and status = 'confirmed'", [D]);
    expect(rows[0]!.c).toBe(4);
  });

  it("blocks a raw INSERT over the cap with the trigger", async () => {
    await expect(
      db.query(
        `insert into bookings (ref, service_date, slot_id, package_id, price_dollars, customer_name, customer_email, customer_phone, street, city, zip)
         values ('KGG-RAW', $1, '16:00', 'one-story', 169, 'Raw', 'raw@example.com', '1', 'x', 'y', '18929')`,
        [D],
      ),
    ).rejects.toThrow("day_full");
  });

  it("frees the slot on cancellation, and won't let a cancelled booking come back over the cap", async () => {
    const { rows } = await db.query<{ ref: string }>("update bookings set status = 'cancelled' where service_date = $1 and slot_id = '08:00' returning ref", [D]);
    expect((await create(D, "08:00")).ok).toBe(true);
    await expect(db.query("update bookings set status = 'confirmed' where ref = $1", [rows[0]!.ref])).rejects.toThrow();
  });

  it("leaves other days alone and rejects a malformed time", async () => {
    expect((await create("2026-11-04", "08:00")).ok).toBe(true);
    await expect(create("2026-11-05", "8am")).rejects.toThrow(/check/i);
  });

  it("returns the original booking for a repeated idempotency key", async () => {
    const a = await create("2026-11-06", "08:00", { idempotency_key: "abc-12345" });
    const b = await create("2026-11-06", "08:00", { idempotency_key: "abc-12345" });
    expect(a.ok).toBe(true);
    expect(b).toMatchObject({ ok: true, duplicate: true });
    expect(b.booking?.ref).toBe(a.booking?.ref);

    const { rows } = await db.query<{ c: number }>("select count(*)::int as c from bookings where service_date = '2026-11-06'");
    expect(rows[0]!.c).toBe(1);
  });

  it("applies a lower cap sent by the app, but the table's cap still wins over a higher one", async () => {
    const low = { max_jobs_per_day: 3 };
    for (const slot of ["08:00", "10:00", "12:00"]) expect((await create("2026-11-09", slot, low)).ok).toBe(true);
    expect(await create("2026-11-09", "14:00", low)).toMatchObject({ ok: false, reason: "day_full" });

    const high = { max_jobs_per_day: 50 };
    for (const slot of ["08:00", "10:00", "12:00", "14:00"]) expect((await create("2026-11-10", slot, high)).ok).toBe(true);
    expect(await create("2026-11-10", "16:00", high)).toMatchObject({ ok: false, reason: "day_full" });
  });

  it("keeps row-level security on for every table", async () => {
    const { rows } = await db.query<{ relname: string; relrowsecurity: boolean }>(
      "select relname, relrowsecurity from pg_class where relname in ('bookings', 'booking_settings', 'firewood_orders', 'referrals')",
    );
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.relrowsecurity)).toBe(true);
  });
});

describe("Supabase adapters against the real migrations", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", postgrestShim(db));
  });

  const newBooking = (over: Partial<NewBooking>): NewBooking => ({
    ref: `KGG-A${++n}`,
    date: "2026-11-16",
    slotId: "08:00",
    packageId: "one-story",
    rinse: true,
    priceDollars: 218,
    priceIsEstimate: false,
    customer: { name: "Pat", email: "pat@example.com", phone: "2155550100" },
    address: { street: "1 Test Ln", city: "Jamison", zip: "18929" },
    notes: "Gate code 1234",
    ...over,
  });

  it("round-trips a booking and reports conflicts", async () => {
    const store = new SupabaseBookingStore("http://db.test", "service-key");
    const made = await store.create(newBooking({}), 4);
    expect(made.ok).toBe(true);
    if (made.ok) {
      expect(made.booking.rinse).toBe(true);
      expect(made.booking.customer.email).toBe("pat@example.com");
      expect(made.booking.status).toBe("confirmed");
    }
    expect(await store.create(newBooking({}), 4)).toEqual({ ok: false, reason: "slot_taken" });
    expect(await store.listTaken("2026-11-16", "2026-11-16")).toEqual([{ date: "2026-11-16", slotId: "08:00" }]);
    expect(await store.listTaken("2026-11-17", "2026-11-18")).toEqual([]);
  });

  it("enforces the cap passed in, and honors the idempotency key", async () => {
    const store = new SupabaseBookingStore("http://db.test", "service-key");
    for (const slotId of ["08:00", "10:00", "12:00"]) {
      expect((await store.create(newBooking({ date: "2026-11-17", slotId }), 3)).ok).toBe(true);
    }
    expect(await store.create(newBooking({ date: "2026-11-17", slotId: "14:00" }), 3)).toEqual({ ok: false, reason: "day_full" });

    const once = await store.create(newBooking({ date: "2026-11-18", idempotencyKey: "same-key-999" }), 4);
    const again = await store.create(newBooking({ date: "2026-11-18", idempotencyKey: "same-key-999" }), 4);
    expect(once.ok && again.ok && once.booking.ref === again.booking.ref).toBe(true);
    expect(again.ok && again.duplicate).toBe(true);
  });

  const newOrder = (over: Partial<NewOrder> = {}): NewOrder => ({
    ref: `KGW-A${++n}`,
    idempotencyKey: `order-key-${n}`,
    productId: "half-cord",
    methodId: "dumped",
    extras: ["steps"],
    deliveryDate: "2026-12-01",
    address: { street: "1 Test Ln", city: "Jamison", zip: "18929" },
    customer: { name: "Pat", email: "pat@example.com", phone: "2155550100" },
    instructions: "Behind the garage",
    lines: [{ id: "half-cord", label: "Half cord", cents: 35000 }],
    totalCents: 34500,
    currency: "usd",
    testMode: true,
    ...over,
  });

  it("saves an order once per idempotency key", async () => {
    const store = new SupabaseOrderStore("http://db.test", "service-key");
    const input = newOrder();
    const first = await store.create(input);
    expect(first.existing).toBe(false);
    expect(first.order.status).toBe("pending");
    expect(first.order.extras).toEqual(["steps"]);
    expect(first.order.lines[0]?.cents).toBe(35000);

    const second = await store.create({ ...input, ref: "KGW-DIFFERENT" });
    expect(second.existing).toBe(true);
    expect(second.order.ref).toBe(first.order.ref);
  });

  it("finds an order by session, and only moves its status once", async () => {
    const store = new SupabaseOrderStore("http://db.test", "service-key");
    const { order } = await store.create(newOrder());
    await store.attachSession(order.ref, "cs_test_abc", "https://checkout.stripe.com/x");
    expect((await store.findBySession("cs_test_abc"))?.ref).toBe(order.ref);

    const first = await store.transition(order.ref, ["pending"], "paid", { paidAt: new Date().toISOString(), stripePaymentIntent: "pi_1" });
    expect(first).toMatchObject({ changed: true });
    expect(first?.order.status).toBe("paid");
    expect(first?.order.stripePaymentIntent).toBe("pi_1");

    const second = await store.transition(order.ref, ["pending"], "paid");
    expect(second).toMatchObject({ changed: false });
    expect(await store.transition("KGW-NOPE", ["pending"], "paid")).toBeNull();
  });

  it("lets one caller claim the notification until it's released", async () => {
    const store = new SupabaseOrderStore("http://db.test", "service-key");
    const { order } = await store.create(newOrder());
    expect(await store.claimNotification(order.ref)).toBe(true);
    expect(await store.claimNotification(order.ref)).toBe(false);
    await store.releaseNotification(order.ref);
    expect(await store.claimNotification(order.ref)).toBe(true);
  });

  it("refuses a status the table doesn't know", async () => {
    await expect(db.query("update firewood_orders set status = 'refunded'")).rejects.toThrow(/check/i);
  });

  const newReferral = (over: Partial<NewReferral> = {}): NewReferral => ({
    referrerName: "Pat Example",
    referrerPhone: "2155550100",
    referrerEmail: "",
    reward: "cash",
    friendName: "Sam Neighbor",
    friendPhone: "2155550111",
    friendEmail: "",
    friendTown: "Warminster",
    notes: "",
    ...over,
  });

  it("saves a referral with a personal code, and finds it again", async () => {
    const store = new SupabaseBookingStore("http://db.test", "service-key");
    const made = await store.createReferral(newReferral({ reward: "plan", referrerEmail: "pat@example.com" }));
    expect(made.code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/);
    expect(made).toMatchObject({ referrerName: "Pat Example", reward: "plan", friendTown: "Warminster", bookingRef: null, thankedAt: null });
    expect(await store.findReferral(made.code)).toEqual(made);
    expect(await store.findReferral("ZZZZZZZZ")).toBeNull();
  });

  it("uses a code up with its booking, and refuses it for a second one", async () => {
    const store = new SupabaseBookingStore("http://db.test", "service-key");
    const { code } = await store.createReferral(newReferral());
    const first = await store.create(newBooking({ date: "2026-11-23", priceDollars: 139 }), 4, { referralCode: code });
    expect(first.ok).toBe(true);
    const linked = await store.findReferral(code);
    expect(linked?.bookingRef).toBe(first.ok ? first.booking.ref : "");
    expect(linked?.bookedAt).not.toBeNull();

    const before = await db.query<{ c: number }>("select count(*)::int as c from bookings");
    expect(await store.create(newBooking({ date: "2026-11-24", priceDollars: 139 }), 4, { referralCode: code })).toEqual({
      ok: false,
      reason: "referral_used",
    });
    const after = await db.query<{ c: number }>("select count(*)::int as c from bookings");
    expect(after.rows[0]!.c).toBe(before.rows[0]!.c);
  });

  it("refuses a code that doesn't exist, and books nothing", async () => {
    const store = new SupabaseBookingStore("http://db.test", "service-key");
    expect(await store.create(newBooking({ date: "2026-11-25" }), 4, { referralCode: "ZZZZZZZZ" })).toEqual({
      ok: false,
      reason: "referral_invalid",
    });
    expect(await store.listTaken("2026-11-25", "2026-11-25")).toEqual([]);
  });

  it("leaves the code unused when the booking itself fails", async () => {
    const store = new SupabaseBookingStore("http://db.test", "service-key");
    const { code } = await store.createReferral(newReferral());
    expect((await store.create(newBooking({ date: "2026-11-26" }), 4)).ok).toBe(true);
    expect(await store.create(newBooking({ date: "2026-11-26" }), 4, { referralCode: code })).toEqual({ ok: false, reason: "slot_taken" });
    expect((await store.findReferral(code))?.bookingRef).toBeNull();
    expect((await store.create(newBooking({ date: "2026-11-26", slotId: "10:00" }), 4, { referralCode: code })).ok).toBe(true);
  });

  it("gives a retried referral booking the booking it already made", async () => {
    const store = new SupabaseBookingStore("http://db.test", "service-key");
    const { code } = await store.createReferral(newReferral());
    const once = await store.create(newBooking({ date: "2026-11-27", idempotencyKey: "ref-retry-1" }), 4, { referralCode: code });
    const again = await store.create(newBooking({ date: "2026-11-27", idempotencyKey: "ref-retry-1" }), 4, { referralCode: code });
    expect(once.ok && again.ok && again.duplicate && once.booking.ref === again.booking.ref).toBe(true);
  });

  it("only takes the two thank-yous, and only well-formed codes", async () => {
    await expect(
      db.query("insert into referrals (code, referrer_name, referrer_phone, reward, friend_name) values ('ABCDEFGH', 'A', '1', 'gift', 'B')"),
    ).rejects.toThrow(/check/i);
    await expect(
      db.query("insert into referrals (code, referrer_name, referrer_phone, reward, friend_name) values ('abc', 'A', '1', 'cash', 'B')"),
    ).rejects.toThrow(/check/i);
  });
});
