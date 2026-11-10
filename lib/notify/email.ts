// Server-side email over Resend's HTTP API, used ONLY by firewood's Stripe webhook now (firewood is
// switched off, and no RESEND_API_KEY is set, so it's dormant). Bookings and recurring-plan requests
// reach Jimmy through FormSubmit instead (lib/notify/formsubmit.ts). FormSubmit is sent from the
// visitor's browser, which a Stripe webhook doesn't have, so firewood needs its own answer before it
// returns: this, or Stripe's own payment emails. See README, "Notifications to Jimmy".
//
// With no RESEND_API_KEY nothing is sent and the caller is told so. Plain text only, so
// customer-typed values can't inject markup. Notices go to content/site.ts `email`.
//
//   RESEND_API_KEY   The only thing needed for Jimmy's notices. Without EMAIL_FROM they come from
//                    Resend's shared address, onboarding@resend.dev, which Resend only delivers to
//                    the Resend account's own address. So the account must be opened with the
//                    business email above, and customer confirmations are skipped.
//   EMAIL_FROM       e.g. "Keystone Gutter Glow <bookings@keystonegutterglow.com>". Set it once
//                    keystonegutterglow.com is verified in Resend; customers get confirmations then.

import { site } from "@/content/site";

/** Resend's shared sender for accounts with no verified domain. */
export const SHARED_SENDER = "Keystone Gutter Glow <onboarding@resend.dev>";

export interface Email {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export type SendResult = { sent: true } | { sent: false; reason: "not_configured" | "failed"; detail?: string };

type Env = Record<string, string | undefined>;

/** Whether Jimmy's notices can be sent. */
export function emailConfigured(env: Env = process.env) {
  return !!env.RESEND_API_KEY;
}

/** Whether customers can be emailed too. That needs a sender on Keystone's own verified domain. */
export function customerEmailConfigured(env: Env = process.env) {
  return !!(env.RESEND_API_KEY && env.EMAIL_FROM);
}

export function ownerEmail(): string {
  return site.email;
}

export async function sendEmail(email: Email): Promise<SendResult> {
  if (!emailConfigured()) {
    console.warn(`[email] not configured, skipped: ${email.subject}`);
    return { sent: false, reason: "not_configured" };
  }
  const toOwner = email.to.trim().toLowerCase() === ownerEmail().toLowerCase();
  if (!toOwner && !customerEmailConfigured()) {
    // The shared sender can't reach customers, so don't try.
    console.warn(`[email] customer emails need EMAIL_FROM on a verified domain, skipped: ${email.subject}`);
    return { sent: false, reason: "not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || SHARED_SENDER,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        reply_to: email.replyTo,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { sent: true };
    // Resend says why (a bad key, an unverified domain, the shared sender's own-address rule).
    const why = (await res.text().catch(() => "")).slice(0, 300);
    console.error(`[email] send failed (${res.status}): ${email.subject}${why ? ` | ${why}` : ""}`);
    return { sent: false, reason: "failed", detail: String(res.status) };
  } catch (err) {
    console.error("[email] send failed", err);
    return { sent: false, reason: "failed" };
  }
}
