import type { Metadata, Viewport } from "next";
import { FirewoodPage, firewoodMetadata, firewoodViewport } from "@/components/firewood/FirewoodPage";
import { GutterHome } from "@/components/home/GutterHome";
import { startingPrice } from "@/content/pricing";
import { getSiteMode } from "@/content/season";

// "/" shows whichever business content/season.ts says is in season. Gutters unless SITE_MODE says otherwise.

const description = `Gutter cleaning by vacuum for homes in Jamison, Doylestown, Warwick and nearby Bucks County towns. From $${startingPrice}, pay after the job, book a time online.`;

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
