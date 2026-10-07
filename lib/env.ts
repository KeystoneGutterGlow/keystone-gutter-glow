import { site } from "@/content/site";

// Deployment-dependent settings. Server-side only (read at build time for static pages).
//
// SITE_URL        Override the public URL. Otherwise Vercel's production domain is used, and
//                 once keystonegutterglow.com is attached to the project, that becomes it.
// ALLOW_INDEXING  "true" lets search engines index the site. Leave it unset on the
//                 .vercel.app mockup so it can't compete with the live site in Google.

const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const publicUrl = (process.env.SITE_URL ?? (vercelProd ? `https://${vercelProd}` : site.url)).replace(/\/$/, "");

export const allowIndexing = process.env.ALLOW_INDEXING === "true";
