import type { Metadata } from "next";
import { ReferredPage, type ReferredState } from "@/components/refer/ReferredPage";
import { referralRules } from "@/content/referral";
import { getBookingStore } from "@/lib/booking/store";
import { normalizeReferralCode } from "@/lib/referral/code";

// A referred friend's own page: /referred/<code>, the link Jimmy sends them. The code is looked up
// on every visit, so a used link stops offering the discount straight away. Booking from here
// sends the code along, and the database uses it up with the booking.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `$${referralRules.friendDiscount} off your gutter cleaning`,
  description: `You were referred to Keystone Gutter Glow. Book a vacuum gutter cleaning here and $${referralRules.friendDiscount} comes off.`,
  robots: { index: false, follow: false },
};

export default async function ReferredCodePage({ params }: { params: Promise<{ code: string }> }) {
  const code = normalizeReferralCode(decodeURIComponent((await params).code));
  let state: ReferredState = { kind: "invalid", typed: true };
  if (code) {
    try {
      const referral = await getBookingStore().findReferral(code);
      if (referral) state = referral.bookingRef ? { kind: "used" } : { kind: "ok", referral: { code, referrerName: referral.referrerName } };
    } catch (err) {
      console.error("[referred] lookup failed", err);
      state = { kind: "offline" };
    }
  }
  return <ReferredPage state={state} />;
}
