import type { MetadataRoute } from "next";
import { referralPaths } from "@/content/referral";
import { getSiteMode, isFirewoodVisible } from "@/content/season";
import { publicUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${publicUrl}/`, changeFrequency: "monthly", priority: 1 },
  ];
  // In firewood mode "/" is firewood and the gutter site moves to /gutters. Otherwise firewood has
  // its own page whenever it's switched on (FIREWOOD_PREVIEW on production).
  if (getSiteMode() === "firewood") {
    pages.push({ url: `${publicUrl}/gutters`, changeFrequency: "monthly", priority: 0.9 });
  } else if (isFirewoodVisible()) {
    pages.push({ url: `${publicUrl}/firewood`, changeFrequency: "monthly", priority: 0.7 });
  }
  // Refer a neighbor. The $30-off booking page (/referred) stays out: Jimmy sends people there.
  pages.push({ url: `${publicUrl}${referralPaths.refer}`, changeFrequency: "monthly", priority: 0.4 });
  return pages;
}
