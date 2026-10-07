import type { MetadataRoute } from "next";
import { allowIndexing, publicUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (!allowIndexing) {
    // Mockup / preview deployments stay out of search results entirely.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${publicUrl}/sitemap.xml`,
    host: publicUrl,
  };
}
