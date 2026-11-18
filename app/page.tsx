import type { Metadata, Viewport } from "next";
import { FirewoodPage, firewoodMetadata, firewoodViewport } from "@/components/firewood/FirewoodPage";
import { GutterHome } from "@/components/home/GutterHome";
import { serviceRadius } from "@/content/area";
import { planRules } from "@/content/plans";
import { startingPrice } from "@/content/pricing";
import { getSiteMode } from "@/content/season";

// "/" shows whichever business content/season.ts says is in season. Gutters unless SITE_MODE says otherwise.

const description = `Gutter cleaning by vacuum within ${serviceRadius.miles} miles of Jamison, PA: much of Bucks County, eastern Montgomery County and northern Philadelphia. From $${startingPrice}, and ${planRules.discountPercent}% off on a recurring plan. Pay after. Book online.`;

const gutterMetadata: Metadata = {
  title: { absolute: "Gutter Cleaning in Bucks County, PA | Keystone Gutter Glow" },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Keystone Gutter Glow",
    title: "Gutter cleaning in Bucks County, done by vacuum",
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gutter cleaning in Bucks County, done by vacuum",
    description,
  },
};

export function generateMetadata(): Metadata {
  return getSiteMode() === "firewood" ? firewoodMetadata("/") : gutterMetadata;
}

export function generateViewport(): Viewport {
  return getSiteMode() === "firewood" ? firewoodViewport : {};
}

export default function HomePage() {
  return getSiteMode() === "firewood" ? <FirewoodPage /> : <GutterHome />;
}
