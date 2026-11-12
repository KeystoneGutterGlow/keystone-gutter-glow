import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GutterHome } from "@/components/home/GutterHome";
import { planRules } from "@/content/plans";
import { startingPrice } from "@/content/pricing";
import { getSiteMode } from "@/content/season";

// Where the gutter site lives while firewood mode has "/". In gutter mode this page redirects home.

export const metadata: Metadata = {
  title: { absolute: "Gutter Cleaning in Bucks County, PA | Keystone Gutter Glow" },
  description: `Gutter cleaning by vacuum within 20 miles of Jamison, PA: Bucks County, much of Montgomery County and North Philadelphia. From $${startingPrice}, and ${planRules.discountPercent}% off on a recurring plan. Pay after. Book online.`,
  alternates: { canonical: "/gutters" },
};

export default function GuttersPage() {
  if (getSiteMode() !== "firewood") redirect("/");
  return <GutterHome />;
}
