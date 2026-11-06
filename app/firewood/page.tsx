import { notFound, redirect } from "next/navigation";
import { FirewoodPage, firewoodMetadata, firewoodViewport } from "@/components/firewood/FirewoodPage";
import { getSiteMode, isFirewoodVisible } from "@/content/season";

// Firewood preview. In firewood mode the real page is "/", so this redirects there. With firewood
// mode off it's a 404, so a production deployment can't show it by accident.

export const metadata = firewoodMetadata("/firewood");
export const viewport = firewoodViewport;

export default function FirewoodRoute() {
  if (getSiteMode() === "firewood") redirect("/");
  if (!isFirewoodVisible()) notFound();
  return <FirewoodPage />;
}
