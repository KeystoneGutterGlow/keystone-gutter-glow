import { notFound } from "next/navigation";
import { isFirewoodVisible } from "@/content/season";

// While firewood is hidden (content/season.ts), every page under /firewood is a real 404. The check
// sits here, above the order page's loading screen: once that screen starts streaming, the status
// code can't change any more, and the order page would answer 200.
export default function FirewoodLayout({ children }: { children: React.ReactNode }) {
  if (!isFirewoodVisible()) notFound();
  return children;
}
