import { configGroups, firewood, type FirewoodConfig } from "@/content/firewood";
import { isFirewoodVisible } from "@/content/season";
import { resolveStorage } from "@/lib/storage";

// Decides whether a checkout may start. The order of the checks matters: this is what keeps real
// money from moving on an incomplete configuration.
//
//   sk_test_ / rk_test_   Test mode. Allowed with placeholders, because nothing real is charged.
//                         Refused on the real domain, where a customer could mistake it.
//   sk_live_ / rk_live_   Needs ALL of: STRIPE_ALLOW_LIVE_PAYMENTS=true, every group in
//                         content/firewood.ts "confirmed", and Supabase storage.
//   no key                Checkout is off. The page still works and shows a call-us message.

type Env = Record<string, string | undefined>;

export type PaymentMode = "off" | "test" | "live";

export function paymentMode(env: Env = process.env): PaymentMode {
  const key = env.STRIPE_SECRET_KEY ?? "";
  if (/^(sk|rk)_test_/.test(key)) return "test";
  if (/^(sk|rk)_live_/.test(key)) return "live";
  return "off";
}

export interface Blocker {
  key: string;
  label: string;
  status: string;
  ask: string;
}

/** Every config group Jimmy hasn't confirmed. An empty list means the config is complete. */
export function configBlockers(config: FirewoodConfig = firewood): Blocker[] {
  return configGroups(config)
    .filter((g) => g.group.status !== "confirmed")
    .map((g) => ({ key: g.key, label: g.label, status: g.group.status, ask: g.group.ask }));
}

export type GateReason =
  | "firewood_hidden"
  | "stripe_not_configured"
  | "webhook_not_configured"
  | "storage_unavailable"
  | "test_key_on_real_domain"
  | "live_not_allowed"
  | "config_incomplete"
  | "live_needs_database";

export type Gate = { open: true; mode: "test" | "live" } | { open: false; mode: PaymentMode; reason: GateReason };

export function checkoutGate(env: Env = process.env, config: FirewoodConfig = firewood): Gate {
  const mode = paymentMode(env);
  if (!isFirewoodVisible(env)) return { open: false, mode, reason: "firewood_hidden" };
  if (mode === "off") return { open: false, mode, reason: "stripe_not_configured" };
  // Without the webhook a customer could pay and the order would never be marked paid.
  if (!env.STRIPE_WEBHOOK_SECRET) return { open: false, mode, reason: "webhook_not_configured" };

  const storage = resolveStorage(env);
  if (storage.kind === "unavailable") return { open: false, mode, reason: "storage_unavailable" };

  if (mode === "test") {
    if (env.ALLOW_INDEXING === "true") return { open: false, mode, reason: "test_key_on_real_domain" };
    return { open: true, mode };
  }

  if (env.STRIPE_ALLOW_LIVE_PAYMENTS !== "true") return { open: false, mode, reason: "live_not_allowed" };
  if (configBlockers(config).length > 0) return { open: false, mode, reason: "config_incomplete" };
  if (storage.kind !== "supabase") return { open: false, mode, reason: "live_needs_database" };
  return { open: true, mode };
}

/** Why checkout is closed, for the deployment logs and the "not ready" panel. */
export const gateMessages: Record<GateReason, string> = {
  firewood_hidden: "Firewood mode is off on this deployment.",
  stripe_not_configured: "STRIPE_SECRET_KEY isn't set.",
  webhook_not_configured: "STRIPE_WEBHOOK_SECRET isn't set, so paid orders couldn't be recorded.",
  storage_unavailable: "Order storage isn't configured.",
  test_key_on_real_domain: "A Stripe test key can't run on the real domain.",
  live_not_allowed: "A live Stripe key is set, but STRIPE_ALLOW_LIVE_PAYMENTS isn't true.",
  config_incomplete: "Live payments need every item in content/firewood.ts confirmed.",
  live_needs_database: "Live payments need BOOKING_STORE=supabase.",
};
