import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as checkoutRoute } from "@/app/api/firewood/checkout/route";
import { GET as statusRoute } from "@/app/api/firewood/status/route";
import { POST as webhookRoute } from "@/app/api/stripe/webhook/route";
import { addDays, todayIn } from "@/lib/booking/dates";
import { startCheckout, type StripeSessions } from "@/lib/firewood/checkout";
import { applySessionPaid, handleStripeEvent } from "@/lib/firewood/fulfill";
import { getOrderView } from "@/lib/firewood/orderView";
import { getOrderStore, MemoryOrderStore, resetOrderStore } from "@/lib/firewood/store";
import { resetRateLimits } from "@/lib/rateLimit";

// No network and no real keys: the Stripe client is a stand-in for session creation, and webhook
// signatures use Stripe's own signing helper with the real verification code.

const WEBHOOK_SECRET = "whsec_test_secret";
const TEST_KEY = "sk_test_notarealkey";

const body = (over: Record<string, unknown> = {}) => ({
  productId: "half-cord",
  methodId: "dumped",
  extras: ["steps"],
  deliveryDate: addDays(todayIn("America/New_York"), 10),
  street: "1 Test Ln",
  city: "Jamison",
  zip: "18929",
  name: "Pat Example",
  phone: "215-555-0100",
  email: "pat@example.com",
  instructions: "Stack it against the garage, left side.",
  idempotencyKey: "attempt-000001",
  ...over,
});

function fakeSessions() {
  let n = 0;
  const create = vi.fn(async () => {
    n++;
    return { id: `cs_test_session${String(n).padStart(6, "0")}`, url: `https://checkout.stripe.com/c/pay/session${n}` };
  });
  return { sessions: { create, retrieve: vi.fn() } as unknown as StripeSessions, create };
}

function checkoutRequest(json: unknown, ip = "203.0.113.2") {
  return new Request("http://localhost:3100/api/firewood/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(json),
  });
}

function signedWebhook(event: unknown, secret = WEBHOOK_SECRET) {
  const payload = JSON.stringify(event);
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new Request("http://localhost:3100/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": header },
    body: payload,
  });
}

function sessionEvent(type: string, session: Record<string, unknown>, livemode = false, id = "evt_1") {
  return { id, object: "event", type, livemode, data: { object: { object: "checkout.session", ...session } } } as unknown as Stripe.Event;
}

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", TEST_KEY);
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
  vi.stubEnv("BOOKING_STORE", "");
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("EMAIL_FROM", "");
  resetOrderStore();
  resetRateLimits();
});

describe("starting checkout", () => {
  it("saves a pending order and asks Stripe for the server's total", async () => {
    const { sessions, create } = fakeSessions();
    const store = new MemoryOrderStore();
    const out = await startCheckout(body(), "http://localhost:3100", { sessions, store });
    expect(out.kind).toBe("redirect");

    const params = (create.mock.calls[0] as unknown as [Stripe.Checkout.SessionCreateParams, { idempotencyKey: string }])[0];
    const lines = params.line_items!.map((l) => (l.price_data as { unit_amount: number }).unit_amount);
    expect(lines).toEqual([35000 - 3000, 2500]);
    expect(lines.every((c) => c > 0)).toBe(true);
    expect(params.mode).toBe("payment");
    expect(params.customer_email).toBe("pat@example.com");
    expect(params.success_url).toContain("{CHECKOUT_SESSION_ID}");
    expect(params.cancel_url).toContain("checkout=canceled");
    // No tax or fee was invented.
    expect(params.automatic_tax).toBeUndefined();
    expect(params.shipping_options).toBeUndefined();

    if (out.kind !== "redirect") throw new Error();
    const order = await store.findByRef(out.ref);
    expect(order).toMatchObject({ status: "pending", totalCents: 34500, testMode: true, stripeSessionId: "cs_test_session000001" });
  });

  it("ignores any price the client sends, and notices a stale one", async () => {
    const { sessions } = fakeSessions();
    const store = new MemoryOrderStore();
    const cheap = await startCheckout(body({ totalCents: 1, price: 1, unit_amount: 1 }), "http://x", { sessions, store });
    if (cheap.kind !== "redirect") throw new Error(cheap.kind);
    expect((await store.findByRef(cheap.ref))?.totalCents).toBe(34500);

    const stale = await startCheckout(body({ expectedTotalCents: 100, idempotencyKey: "attempt-000002" }), "http://x", { sessions, store });
    expect(stale).toMatchObject({ kind: "price_changed", totalCents: 34500 });
  });

  it("sends a double click to the same session, and a changed order to a new one", async () => {
    const { sessions, create } = fakeSessions();
    const store = new MemoryOrderStore();
    const a = await startCheckout(body(), "http://x", { sessions, store });
    const b = await startCheckout(body(), "http://x", { sessions, store });
    expect(a).toEqual(b);
    expect(create).toHaveBeenCalledTimes(1);

    const changed = await startCheckout(body({ extras: [] }), "http://x", { sessions, store });
    expect(create).toHaveBeenCalledTimes(2);
    expect(changed.kind === "redirect" && a.kind === "redirect" && changed.ref !== a.ref).toBe(true);
  });

  it("won't charge twice for an order that's already paid", async () => {
    const { sessions, create } = fakeSessions();
    const store = new MemoryOrderStore();
    const first = await startCheckout(body(), "http://x", { sessions, store });
    if (first.kind !== "redirect") throw new Error();
    await store.transition(first.ref, ["pending"], "paid");
    const again = await startCheckout(body(), "http://x", { sessions, store });
    expect(again).toMatchObject({ kind: "already_paid", ref: first.ref });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("starts fresh after a session expired", async () => {
    const { sessions, create } = fakeSessions();
    const store = new MemoryOrderStore();
    const first = await startCheckout(body(), "http://x", { sessions, store });
    if (first.kind !== "redirect") throw new Error();
    await store.transition(first.ref, ["pending"], "expired");
    const again = await startCheckout(body(), "http://x", { sessions, store });
    expect(create).toHaveBeenCalledTimes(2);
    expect(again.kind === "redirect" && again.ref !== first.ref).toBe(true);
  });

  it("survives Stripe being down without losing the order or crashing", async () => {
    const store = new MemoryOrderStore();
    const sessions = { create: vi.fn().mockRejectedValue(new Error("network")), retrieve: vi.fn() } as unknown as StripeSessions;
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await startCheckout(body(), "http://x", { sessions, store })).kind).toBe("stripe_error");
  });

  it("refuses bad input before anything is saved", async () => {
    const { sessions, create } = fakeSessions();
    const out = await startCheckout(body({ email: "nope", deliveryDate: "2020-01-01" }), "http://x", { sessions, store: new MemoryOrderStore() });
    expect(out.kind).toBe("invalid");
    expect(create).not.toHaveBeenCalled();
  });
});

describe("checkout route with missing configuration", () => {
  it("answers 503 and a call-us message with no Stripe key", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await checkoutRoute(checkoutRequest(body()));
    expect(res.status).toBe(503);
    const out = await res.json();
    expect(out.code).toBe("closed");
    expect(out.error).toMatch(/call or text/i);
    expect(JSON.stringify(out)).not.toMatch(/STRIPE/);
  });

  it("refuses a live key while the config is unconfirmed, even when live is allowed", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_notreal");
    vi.stubEnv("STRIPE_ALLOW_LIVE_PAYMENTS", "true");
    vi.stubEnv("BOOKING_STORE", "supabase");
    vi.stubEnv("SUPABASE_URL", "http://db.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "k");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await checkoutRoute(checkoutRequest(body()));
    expect(res.status).toBe(503);
  });

  it("answers bad JSON and rate limits", async () => {
    const bad = await checkoutRoute(new Request("http://localhost:3100/api/firewood/checkout", { method: "POST", body: "{oops" }));
    expect(bad.status).toBe(400);
    let last: Response | undefined;
    for (let i = 0; i < 21; i++) last = await checkoutRoute(checkoutRequest({}, "198.51.100.20"));
    expect(last!.status).toBe(429);
  });

  it("the status route says what the form needs and nothing about keys", async () => {
    const out = await (await statusRoute()).json();
    expect(out).toMatchObject({ open: true, mode: "test", demoStore: true });
    expect(JSON.stringify(out)).not.toContain(TEST_KEY);

    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(await (await statusRoute()).json()).toMatchObject({ open: false, mode: "off" });
  });
});

describe("the Stripe webhook", () => {
  async function pendingOrder() {
    const store = getOrderStore();
    const { sessions } = fakeSessions();
    const out = await startCheckout(body(), "http://x", { sessions, store });
    if (out.kind !== "redirect") throw new Error(out.kind);
    return { store, ref: out.ref, sessionId: (await store.findByRef(out.ref))!.stripeSessionId! };
  }

  const paid = (ref: string, sessionId: string, over: Record<string, unknown> = {}) => ({
    id: sessionId,
    metadata: { order_ref: ref },
    payment_status: "paid",
    amount_total: 34500,
    currency: "usd",
    payment_intent: "pi_123",
    ...over,
  });

  it("rejects a missing signature, a bad one, and one signed with another secret", async () => {
    const missing = await webhookRoute(new Request("http://x/api/stripe/webhook", { method: "POST", body: "{}" }));
    expect(missing.status).toBe(400);
    const forged = await webhookRoute(new Request("http://x/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": "t=1,v1=abc" }, body: "{}" }));
    expect(forged.status).toBe(400);
    const wrong = await webhookRoute(signedWebhook(sessionEvent("checkout.session.completed", {}), "whsec_someone_else"));
    expect(wrong.status).toBe(400);
  });

  it("can't mark an order paid with a forged event", async () => {
    const { store, ref, sessionId } = await pendingOrder();
    const event = sessionEvent("checkout.session.completed", paid(ref, sessionId));
    await webhookRoute(signedWebhook(event, "whsec_attacker"));
    expect((await store.findByRef(ref))?.status).toBe("pending");
  });

  it("answers 503 when the secret isn't set", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await webhookRoute(signedWebhook({ id: "x" }))).status).toBe(503);
  });

  it("marks the order paid on a verified event", async () => {
    const { store, ref, sessionId } = await pendingOrder();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await webhookRoute(signedWebhook(sessionEvent("checkout.session.completed", paid(ref, sessionId))));
    expect(res.status).toBe(200);
    expect(await store.findByRef(ref)).toMatchObject({ status: "paid", stripePaymentIntent: "pi_123" });
  });

  it("processes a repeated event once, including the emails", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Keystone <orders@example.com>");
    const sent = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", sent);

    const { store, ref, sessionId } = await pendingOrder();
    const event = sessionEvent("checkout.session.completed", paid(ref, sessionId));
    await Promise.all([webhookRoute(signedWebhook(event)), webhookRoute(signedWebhook(event)), webhookRoute(signedWebhook(event))]);
    await webhookRoute(signedWebhook(event));

    expect((await store.findByRef(ref))?.status).toBe("paid");
    expect(sent).toHaveBeenCalledTimes(2); // one to Jimmy, one to the customer
    const [owner, customer] = sent.mock.calls.map((c) => JSON.parse(String((c as unknown as [string, RequestInit])[1].body)));
    expect(owner.subject).toContain("[TEST]");
    expect(owner.text).toContain("Stack it against the garage");
    expect(customer.to).toEqual(["pat@example.com"]);
    vi.unstubAllGlobals();
  });

  it("asks Stripe to retry if Jimmy's notification fails, then sends it", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Keystone <orders@example.com>");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { store, ref, sessionId } = await pendingOrder();
    const event = sessionEvent("checkout.session.completed", paid(ref, sessionId));

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    expect((await webhookRoute(signedWebhook(event))).status).toBe(500);
    expect((await store.findByRef(ref))?.status).toBe("paid");
    expect((await store.findByRef(ref))?.notifiedAt).toBeNull();

    const retried = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", retried);
    expect((await webhookRoute(signedWebhook(event))).status).toBe(200);
    expect(retried).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it("sends an order to review if the amount paid doesn't match", async () => {
    const { store, ref, sessionId } = await pendingOrder();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await handleStripeEvent(sessionEvent("checkout.session.completed", paid(ref, sessionId, { amount_total: 100 })), store);
    expect((await store.findByRef(ref))?.status).toBe("needs_review");
  });

  it("waits for a delayed payment, then handles success and failure", async () => {
    const { store, ref, sessionId } = await pendingOrder();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await handleStripeEvent(sessionEvent("checkout.session.completed", paid(ref, sessionId, { payment_status: "unpaid" })), store);
    expect((await store.findByRef(ref))?.status).toBe("pending");

    await handleStripeEvent(sessionEvent("checkout.session.async_payment_failed", paid(ref, sessionId, { payment_status: "unpaid" })), store);
    expect((await store.findByRef(ref))?.status).toBe("payment_failed");

    await handleStripeEvent(sessionEvent("checkout.session.async_payment_succeeded", paid(ref, sessionId)), store);
    expect((await store.findByRef(ref))?.status).toBe("paid");
  });

  it("marks expired sessions, but never undoes a paid order", async () => {
    const { store, ref, sessionId } = await pendingOrder();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await handleStripeEvent(sessionEvent("checkout.session.expired", paid(ref, "cs_test_older", { payment_status: "unpaid" })), store);
    expect((await store.findByRef(ref))?.status).toBe("pending");

    await handleStripeEvent(sessionEvent("checkout.session.expired", paid(ref, sessionId, { payment_status: "unpaid" })), store);
    expect((await store.findByRef(ref))?.status).toBe("expired");

    await handleStripeEvent(sessionEvent("checkout.session.completed", paid(ref, sessionId)), store);
    expect((await store.findByRef(ref))?.status).toBe("paid");
    await handleStripeEvent(sessionEvent("checkout.session.expired", paid(ref, sessionId)), store);
    expect((await store.findByRef(ref))?.status).toBe("paid");
  });

  it("ignores a live event on a test deployment", async () => {
    const { store, ref, sessionId } = await pendingOrder();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const handled = await handleStripeEvent(sessionEvent("checkout.session.completed", paid(ref, sessionId), true), store);
    expect(handled).toBe(false);
    expect((await store.findByRef(ref))?.status).toBe("pending");
  });

  it("acknowledges event types it doesn't use", async () => {
    const res = await webhookRoute(signedWebhook({ id: "evt_x", object: "event", type: "customer.created", livemode: false, data: { object: {} } }));
    expect(res.status).toBe(200);
  });

  it("asks Stripe to retry when the order can't be found, rather than dropping a payment", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await webhookRoute(signedWebhook(sessionEvent("checkout.session.completed", paid("KGW-MISSING", "cs_test_x"))));
    expect(res.status).toBe(500);
  });
});

describe("the page after Stripe", () => {
  it("won't take the URL's word for it, and only shows an order for a real session", async () => {
    const store = new MemoryOrderStore();
    expect(await getOrderView(undefined, store)).toBeNull();
    expect(await getOrderView("../../etc/passwd", store)).toBeNull();
    expect(await getOrderView("cs_test_doesnotexist000", store)).toBeNull();
  });

  it("shows the paid status once the webhook has run", async () => {
    const store = new MemoryOrderStore();
    const { sessions } = fakeSessions();
    const out = await startCheckout(body(), "http://x", { sessions, store });
    if (out.kind !== "redirect") throw new Error();
    const order = (await store.findByRef(out.ref))!;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await applySessionPaid(
      {
        id: order.stripeSessionId,
        metadata: { order_ref: out.ref },
        payment_status: "paid",
        amount_total: order.totalCents,
        currency: "usd",
        payment_intent: "pi_1",
      } as unknown as Stripe.Checkout.Session,
      store,
    );
    expect(await getOrderView(order.stripeSessionId!, store)).toMatchObject({ ref: out.ref, status: "paid", totalCents: 34500, testMode: true });
  });
});
