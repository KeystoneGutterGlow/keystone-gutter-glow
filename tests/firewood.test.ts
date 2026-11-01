import { describe, expect, it } from "vitest";
import { firewood, firewoodProducts, type FirewoodConfig } from "@/content/firewood";
import { getSiteMode, isFirewoodVisible, modeLinks } from "@/content/season";
import { checkoutOrigin } from "@/lib/env";
import { checkoutGate, configBlockers, paymentMode } from "@/lib/firewood/gate";
import { formatCents, priceOrder, stripeLines } from "@/lib/firewood/pricing";
import { checkDeliveryDate, deliveryWindow, parseOrder } from "@/lib/firewood/validate";
import { resolveStorage } from "@/lib/storage";

const today = "2026-11-03";

const validOrder = {
  productId: "quarter-cord",
  methodId: "stacked",
  extras: [],
  deliveryDate: "2026-11-20",
  street: "1 Test Ln",
  city: "Jamison",
  zip: "18929",
  name: "Pat Example",
  phone: "215-555-0100",
  email: "pat@example.com",
  instructions: "Stack it against the garage, left side.",
};

function confirmedConfig(): FirewoodConfig {
  const copy = structuredClone(firewood) as FirewoodConfig;
  for (const key of ["products", "deliveryMethods", "extras", "schedule", "deliveryArea", "tax", "policies", "fulfillment"] as const) {
    (copy[key] as { status: string }).status = "confirmed";
  }
  return copy;
}

describe("firewood prices (Addendum A2 values, from config)", () => {
  it("prices each size with delivery and stacking included", () => {
    expect(priceOrder({ productId: "quarter-cord", methodId: "stacked", extras: [] })?.totalCents).toBe(20000);
    expect(priceOrder({ productId: "half-cord", methodId: "stacked", extras: [] })?.totalCents).toBe(35000);
    expect(priceOrder({ productId: "full-cord", methodId: "stacked", extras: [] })?.totalCents).toBe(60000);
  });

  it("takes $30 off for dumping, and adds $25 for steps and $30 for rough ground", () => {
    const order = priceOrder({ productId: "half-cord", methodId: "dumped", extras: ["steps", "rough-terrain"] });
    expect(order?.totalCents).toBe(35000 - 3000 + 2500 + 3000);
    expect(order?.lines.map((l) => l.cents)).toEqual([35000, -3000, 2500, 3000]);
  });

  it("refuses unknown products and methods", () => {
    expect(priceOrder({ productId: "mega" as never, methodId: "stacked", extras: [] })).toBeNull();
    expect(priceOrder({ productId: "half-cord", methodId: "thrown" as never, extras: [] })).toBeNull();
  });

  it("reads prices from config, so changing one changes the total", () => {
    const config = structuredClone(firewood) as FirewoodConfig;
    config.products.value[0]!.price = 225;
    expect(priceOrder({ productId: "quarter-cord", methodId: "stacked", extras: [] }, config)?.totalCents).toBe(22500);
  });

  it("folds the dump discount into Stripe's line, which can't be negative, with the same total", () => {
    const order = priceOrder({ productId: "quarter-cord", methodId: "dumped", extras: ["steps"] })!;
    const lines = stripeLines(order);
    expect(lines).toEqual([
      { name: "Quarter cord, Delivered and dumped", cents: 17000 },
      { name: "Carrying up steps", cents: 2500 },
    ]);
    expect(lines.every((l) => l.cents > 0)).toBe(true);
    expect(lines.reduce((s, l) => s + l.cents, 0)).toBe(order.totalCents);
  });

  it("formats money", () => {
    expect(formatCents(20000)).toBe("$200");
    expect(formatCents(-3000)).toBe("-$30");
    expect(formatCents(1999)).toBe("$19.99");
  });

  it("every product has what the page needs", () => {
    expect(firewoodProducts.map((p) => p.depthLogs)).toEqual([1, 2, 4]);
  });
});

describe("firewood order validation", () => {
  it("accepts a good order", () => {
    const r = parseOrder(validOrder, today);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.phone).toBe("2155550100");
  });

  it("reports each bad field", () => {
    const r = parseOrder(
      { ...validOrder, productId: "x", methodId: "y", deliveryDate: "nope", street: "", city: "", zip: "1", name: "", phone: "1", email: "x", instructions: "" },
      today,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual(
        ["city", "deliveryDate", "email", "instructions", "methodId", "name", "phone", "productId", "street", "zip"].sort(),
      );
    }
  });

  it("drops extras it doesn't know and repeats", () => {
    const r = parseOrder({ ...validOrder, extras: ["steps", "steps", "free-wood", 7] }, today);
    expect(r.ok && r.data.extras).toEqual(["steps"]);
  });

  it("flags the honeypot", () => {
    expect(parseOrder({ ...validOrder, company: "x" }, today)).toMatchObject({ ok: false, spam: true });
  });

  it("enforces the delivery window and closed days from config", () => {
    const { min, max } = deliveryWindow(today);
    expect(checkDeliveryDate(min, today)).toBeNull();
    expect(checkDeliveryDate(max, today)).toBeNull();
    expect(checkDeliveryDate(today, today)).toMatch(/too soon/);
    expect(checkDeliveryDate("2028-06-01", today)).toMatch(/too far/);
    expect(checkDeliveryDate("not-a-date", today)).toMatch(/Pick/);

    const config = structuredClone(firewood) as FirewoodConfig;
    config.schedule.value.closedWeekdays = [5];
    config.schedule.value.blackoutDates = ["2026-11-19"];
    expect(checkDeliveryDate("2026-11-20", today, config)).toMatch(/day of the week/); // a Friday
    expect(checkDeliveryDate("2026-11-19", today, config)).toMatch(/aren't delivering/);
  });

  it("restricts ZIPs only once a delivery area is configured", () => {
    const config = structuredClone(firewood) as FirewoodConfig;
    config.deliveryArea.value.zips = ["18929"];
    expect(parseOrder(validOrder, today, config).ok).toBe(true);
    const out = parseOrder({ ...validOrder, zip: "90210" }, today, config);
    expect(!out.ok && out.errors.zip).toMatch(/don't deliver/);
  });
});

describe("the gate that keeps real money out", () => {
  const keys = { STRIPE_WEBHOOK_SECRET: "whsec_test", NODE_ENV: "development" };

  it("reads the key type", () => {
    expect(paymentMode({})).toBe("off");
    expect(paymentMode({ STRIPE_SECRET_KEY: "sk_test_1" })).toBe("test");
    expect(paymentMode({ STRIPE_SECRET_KEY: "rk_test_1" })).toBe("test");
    expect(paymentMode({ STRIPE_SECRET_KEY: "sk_live_1" })).toBe("live");
    expect(paymentMode({ STRIPE_SECRET_KEY: "garbage" })).toBe("off");
  });

  it("lists everything Jimmy hasn't confirmed", () => {
    const blockers = configBlockers();
    expect(blockers.map((b) => b.key)).toEqual(["products", "deliveryMethods", "extras", "deliveryArea", "tax", "policies"]);
    expect(configBlockers(confirmedConfig())).toEqual([]);
  });

  it("shuts when Stripe or the webhook isn't configured", () => {
    expect(checkoutGate({ NODE_ENV: "development" })).toMatchObject({ open: false, reason: "stripe_not_configured" });
    expect(checkoutGate({ NODE_ENV: "development", STRIPE_SECRET_KEY: "sk_test_1" })).toMatchObject({ open: false, reason: "webhook_not_configured" });
  });

  it("opens in test mode with placeholders, because nothing real is charged", () => {
    expect(checkoutGate({ ...keys, STRIPE_SECRET_KEY: "sk_test_1" })).toEqual({ open: true, mode: "test" });
  });

  it("won't run a test key on the real domain", () => {
    expect(checkoutGate({ ...keys, STRIPE_SECRET_KEY: "sk_test_1", ALLOW_INDEXING: "true", BOOKING_STORE: "supabase", SUPABASE_URL: "http://x", SUPABASE_SERVICE_ROLE_KEY: "k" })).toMatchObject({
      open: false,
      reason: "test_key_on_real_domain",
    });
  });

  it("refuses a live key without every condition met", () => {
    const live = { ...keys, STRIPE_SECRET_KEY: "sk_live_1" };
    const db = { BOOKING_STORE: "supabase", SUPABASE_URL: "http://x", SUPABASE_SERVICE_ROLE_KEY: "k" };

    expect(checkoutGate({ ...live, ...db }, confirmedConfig())).toMatchObject({ open: false, reason: "live_not_allowed" });
    expect(checkoutGate({ ...live, ...db, STRIPE_ALLOW_LIVE_PAYMENTS: "true" })).toMatchObject({ open: false, reason: "config_incomplete" });
    expect(checkoutGate({ ...live, STRIPE_ALLOW_LIVE_PAYMENTS: "true" }, confirmedConfig())).toMatchObject({ open: false, reason: "live_needs_database" });
    expect(checkoutGate({ ...live, ...db, STRIPE_ALLOW_LIVE_PAYMENTS: "true" }, confirmedConfig())).toEqual({ open: true, mode: "live" });
  });

  it("stays shut when firewood mode is hidden on production", () => {
    expect(checkoutGate({ ...keys, NODE_ENV: "production", VERCEL_ENV: "production", BOOKING_DEMO_MODE: "true", STRIPE_SECRET_KEY: "sk_test_1" })).toMatchObject({
      open: false,
      reason: "firewood_hidden",
    });
  });
});

describe("the seasonal switch", () => {
  it("defaults to gutters", () => {
    expect(getSiteMode({})).toBe("gutter");
    expect(getSiteMode({ SITE_MODE: "nonsense" })).toBe("gutter");
    expect(getSiteMode({ SITE_MODE: "firewood" })).toBe("firewood");
  });

  it("never shows firewood on a production deployment by default", () => {
    expect(isFirewoodVisible({ NODE_ENV: "production", VERCEL_ENV: "production" })).toBe(false);
    expect(isFirewoodVisible({ NODE_ENV: "production" })).toBe(false);
    expect(modeLinks({ NODE_ENV: "production", VERCEL_ENV: "production" })).toBeNull();
  });

  it("shows it for review on previews and in development", () => {
    expect(isFirewoodVisible({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe(true);
    expect(isFirewoodVisible({ NODE_ENV: "development" })).toBe(true);
    expect(isFirewoodVisible({ NODE_ENV: "production", VERCEL_ENV: "production", FIREWOOD_PREVIEW: "true" })).toBe(true);
  });

  it("points the switch at the right pages in each mode", () => {
    expect(modeLinks({ NODE_ENV: "development" })).toEqual({ mode: "gutter", gutterHref: "/", firewoodHref: "/firewood" });
    expect(modeLinks({ SITE_MODE: "firewood" })).toEqual({ mode: "firewood", gutterHref: "/gutters", firewoodHref: "/" });
  });
});

describe("where bookings and orders are stored", () => {
  it("uses memory only for development or an explicit demo", () => {
    expect(resolveStorage({ NODE_ENV: "development" }).kind).toBe("memory");
    expect(resolveStorage({ NODE_ENV: "production" }).kind).toBe("unavailable");
    expect(resolveStorage({ NODE_ENV: "production", BOOKING_DEMO_MODE: "true" }).kind).toBe("memory");
    expect(resolveStorage({ NODE_ENV: "production", BOOKING_DEMO_MODE: "true", ALLOW_INDEXING: "true" }).kind).toBe("unavailable");
  });

  it("needs both Supabase values, and trims the URL", () => {
    expect(resolveStorage({ BOOKING_STORE: "supabase" }).kind).toBe("unavailable");
    expect(resolveStorage({ BOOKING_STORE: "supabase", SUPABASE_URL: "https://x.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "k" })).toEqual({
      kind: "supabase",
      url: "https://x.supabase.co",
      serviceKey: "k",
    });
  });
});

describe("where Stripe sends people back to", () => {
  const req = (url: string) => new Request(url);

  it("uses localhost in development, never a forged host on a deployment", () => {
    expect(checkoutOrigin(req("http://localhost:3100/api/x"), {})).toBe("http://localhost:3100");
    expect(checkoutOrigin(req("https://evil.example/api/x"), { SITE_URL: "https://keystonegutterglow.com/" })).toBe("https://keystonegutterglow.com");
    expect(checkoutOrigin(req("https://evil.example/api/x"), { VERCEL_ENV: "preview", VERCEL_URL: "kgg-abc.vercel.app" })).toBe("https://kgg-abc.vercel.app");
    expect(checkoutOrigin(req("https://evil.example/api/x"), { VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "kgg.vercel.app" })).toBe("https://kgg.vercel.app");
    expect(checkoutOrigin(req("https://evil.example/api/x"), {})).not.toContain("evil");
  });
});
