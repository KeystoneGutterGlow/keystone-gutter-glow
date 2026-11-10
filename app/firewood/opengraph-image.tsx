import { notFound } from "next/navigation";
import { isFirewoodVisible } from "@/content/season";
import { firewoodCard, ogSize } from "@/lib/og";

export const alt = "Keystone Gutter Glow: firewood delivered and stacked in Bucks County, PA";
export const size = ogSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  if (!isFirewoodVisible()) notFound();
  return firewoodCard();
}
