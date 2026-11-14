import { createHmac, timingSafeEqual } from "node:crypto";
import { publicUrl } from "@/lib/env";

// "Check it's real" links in Jimmy's emails. The emails are sent from the customer's browser
// through FormSubmit, so anyone could send Jimmy an email that looks like a booking or a referral.
// Each real email carries a link signed with a secret only the server knows. Opening it shows the
// booking or referral straight from the database. A made-up email can't have a working link.
//
// The secret is NOTICE_SECRET if it's set, otherwise it's derived from SUPABASE_SERVICE_ROLE_KEY,
// which the production server already has and nobody else does. Changing either one makes the
// links in older emails stop working; the bookings themselves are untouched.
// Server only.

export type CheckKind = "booking" | "referral";

function secret(env: Record<string, string | undefined> = process.env): string {
  const base = env.NOTICE_SECRET || env.SUPABASE_SERVICE_ROLE_KEY || "local-development-only";
  return createHmac("sha256", base).update("kgg-notice-check-v1").digest("hex");
}

export function signCheck(kind: CheckKind, id: string, env?: Record<string, string | undefined>): string {
  return createHmac("sha256", secret(env)).update(`${kind}:${id}`).digest("base64url").slice(0, 22);
}

export function verifyCheck(kind: CheckKind, id: string, sig: string, env?: Record<string, string | undefined>): boolean {
  const want = Buffer.from(signCheck(kind, id, env));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** The link that goes in Jimmy's email */
export function checkLink(kind: CheckKind, id: string): string {
  return `${publicUrl}/check/${kind}/${encodeURIComponent(id)}?s=${signCheck(kind, id)}`;
}
