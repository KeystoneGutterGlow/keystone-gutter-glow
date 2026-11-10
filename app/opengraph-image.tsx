import { getSiteMode, isFirewoodVisible } from "@/content/season";
import { firewoodCard, gutterCard, ogSize } from "@/lib/og";

// "/" is whichever business is in season, so its share card follows content/season.ts.

export const alt = `Keystone Gutter Glow, Bucks County, PA: gutter cleaning by vacuum${isFirewoodVisible() ? ", and firewood delivery" : ""}`;
export const size = ogSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return getSiteMode() === "firewood" ? firewoodCard() : gutterCard();
}
