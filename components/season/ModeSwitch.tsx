import Link from "next/link";
import type { ModeLinks, SiteMode } from "@/content/season";
import styles from "./ModeSwitch.module.css";

// The switch between the gutter site and the firewood site. It only renders where firewood mode
// is visible (see content/season.ts), so the production gutter site doesn't show it.

export function ModeSwitch({ links, current, floating }: { links: ModeLinks; current: SiteMode; floating?: boolean }) {
  return (
    <nav className={`${styles.switch} ${floating ? styles.floating : ""}`} aria-label="Gutter cleaning or firewood" data-current={current}>
      <Link href={links.gutterHref} aria-current={current === "gutter" ? "page" : undefined}>
        Gutters
      </Link>
      <Link href={links.firewoodHref} aria-current={current === "firewood" ? "page" : undefined}>
        Firewood
      </Link>
    </nav>
  );
}
