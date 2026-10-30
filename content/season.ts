// Which business the site is showing. This is the one switch between the gutter-cleaning site
// and winter firewood mode. Read on the server only: client components get the result as props.
//
//   SITE_MODE=gutter    (default) "/" is the gutter site. /firewood is hidden on production.
//   SITE_MODE=firewood  "/" is the firewood site and the gutter site moves to /gutters.
//   FIREWOOD_PREVIEW=true  shows /firewood and the mode switch without changing "/".
//
// Next dev and Vercel preview deployments show /firewood automatically, so it can be reviewed.
// A Vercel production deployment never does unless one of the variables above says so.
// Static pages read these at build time, so redeploy after changing one.

export type SiteMode = "gutter" | "firewood";

type Env = Record<string, string | undefined>;

export function getSiteMode(env: Env = process.env): SiteMode {
  return env.SITE_MODE === "firewood" ? "firewood" : "gutter";
}

export function isFirewoodVisible(env: Env = process.env): boolean {
  if (getSiteMode(env) === "firewood" || env.FIREWOOD_PREVIEW === "true") return true;
  if (env.VERCEL_ENV) return env.VERCEL_ENV === "preview";
  return env.NODE_ENV !== "production";
}

export interface ModeLinks {
  mode: SiteMode;
  gutterHref: string;
  firewoodHref: string;
}

/** Where each side of the mode switch points. null when the switch shouldn't show. */
export function modeLinks(env: Env = process.env): ModeLinks | null {
  if (!isFirewoodVisible(env)) return null;
  const mode = getSiteMode(env);
  return mode === "firewood"
    ? { mode, gutterHref: "/gutters", firewoodHref: "/" }
    : { mode, gutterHref: "/", firewoodHref: "/firewood" };
}
