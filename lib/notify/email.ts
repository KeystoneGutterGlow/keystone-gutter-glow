// Transactional email over Resend's HTTP API. Optional: with no RESEND_API_KEY nothing is sent,
// the caller is told so, and the UI doesn't promise an email. Plain text only, so customer-typed
// values can't inject markup. Resend needs a free account and approval of the sending domain.
//
//   RESEND_API_KEY      turns sending on
//   EMAIL_FROM          e.g. "Keystone Gutter Glow <orders@keystonegutterglow.com>"
//   NOTIFY_OWNER_EMAIL  where owner notices go. Defaults to content/site.ts email.

import { site } from "@/content/site";

export interface Email {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export type SendResult = { sent: true } | { sent: false; reason: "not_configured" | "failed"; detail?: string };

export function emailConfigured(env: Record<string, string | undefined> = process.env) {
  return !!(env.RESEND_API_KEY && env.EMAIL_FROM);
}

export function ownerEmail(): string {
  return process.env.NOTIFY_OWNER_EMAIL || site.email;
}

export async function sendEmail(email: Email): Promise<SendResult> {
  if (!emailConfigured()) {
    console.warn(`[email] not configured, skipped: ${email.subject}`);
    return { sent: false, reason: "not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        reply_to: email.replyTo,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { sent: true };
    console.error(`[email] send failed (${res.status}): ${email.subject}`);
    return { sent: false, reason: "failed", detail: String(res.status) };
  } catch (err) {
    console.error("[email] send failed", err);
    return { sent: false, reason: "failed" };
  }
}
