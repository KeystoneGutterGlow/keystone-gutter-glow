import type { MetadataRoute } from "next";
import { referral } from "@/content/referral";
import { getSiteMode } from "@/content/season";
import { publicUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${publicUrl}/`, changeFrequency: "monthly", priority: 1 },
  ];
  if (getSiteMode() === "firewood") {
    pages.push({ url: `${publicUrl}/gutters`, changeFrequency: "monthly", priority: 0.7 });
  }
  // The referral page stays out until the program is real (see content/referral.ts).
  if (referral.indexable) {
    pages.push({ url: `${publicUrl}/referred`, changeFrequency: "monthly", priority: 0.4 });
  }
  return pages;
}
