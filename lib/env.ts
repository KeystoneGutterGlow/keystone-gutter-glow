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

/**
 * Where Stripe sends the customer back to. Never the request's Host header on a deployed site,
 * because a forged header could send a customer somewhere else after they pay.
 */
export function checkoutOrigin(request: Request, env: Record<string, string | undefined> = process.env): string {
  if (env.SITE_URL) return env.SITE_URL.replace(/\/$/, "");
  if (env.VERCEL_ENV === "preview" && env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const origin = new URL(request.url).origin;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : publicUrl;
}
