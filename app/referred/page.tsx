import type { Metadata } from "next";
import { ReferredPage } from "@/components/refer/ReferredPage";
import { referralPaths, referralRules } from "@/content/referral";

// /referred with no code: explains that the $30 off comes with a personal link from Jimmy.
// Each friend's page is /referred/<code> (app/referred/[code]/page.tsx).

export const metadata: Metadata = {
  title: `$${referralRules.friendDiscount} off when a neighbor refers you`,
  description: "Referred to Keystone Gutter Glow? Your discount comes with a personal link from Jimmy.",
  alternates: { canonical: referralPaths.friend },
  robots: { index: false, follow: false },
};

export default function ReferredLandingPage() {
  return <ReferredPage state={{ kind: "invalid", typed: false }} />;
}
