import Image from "next/image";
import Link from "next/link";
import { IvyRun } from "@/components/botanical/Botanical";
import { legalPaths } from "@/content/legalPaths";
import { planRules } from "@/content/plans";
import { modeLinks } from "@/content/season";
import { site } from "@/content/site";
import styles from "./Footer.module.css";
import { MadeBy } from "./MadeBy";

export function Footer({ onHome = true }: { onHome?: boolean }) {
  const links = modeLinks();
  const h = (id: string) => (onHome ? `#${id}` : `/#${id}`);
  return (
    <footer className={`${styles.footer} on-dark`}>
      <IvyRun className={styles.ivy} length={780} seed={4} />
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.brand}>
          <Image src="/images/keystone-logo-light.png" alt={site.legalName} width={190} height={64} />
          <p>
            Gutter cleaning by vacuum for Jamison, Doylestown, Warwick and the towns around them in {site.county},{" "}
            {site.state}.
          </p>
        </div>

        <div className={styles.contact}>
          <a href={site.phone.href} className={styles.phone}>
            {site.phone.display}
          </a>
          <p>Calls and texts</p>
          <a href={`mailto:${site.email}`} className={styles.email}>
            {/* Break after the @ when it doesn't fit, not inside the domain */}
            {site.email.split("@")[0]}@<wbr />
            {site.email.split("@")[1]}
          </a>
        </div>

        <nav className={styles.links} aria-label="Footer">
          <a href={h("book")}>Book a cleaning</a>
          <a href={h("prices")}>Prices</a>
          <a href={h("plans")}>Recurring plans, {planRules.discountPercent}% off</a>
          <a href={h("faq")}>Questions</a>
          <Link href="/referred">Refer a neighbor</Link>
          {links && (
            <Link href={links.firewoodHref} prefetch={false} className={styles.fire}>
              Firewood delivery
            </Link>
          )}
        </nav>

        <p className={styles.policy}>
          Free to reschedule with {site.policies.freeRescheduleHours} hours&rsquo; notice. Not happy with a cleaning? Tell
          us within {site.policies.returnVisitHours} hours and we&rsquo;ll come back at no charge.
        </p>
      </div>
      <div className={`wrap ${styles.base}`}>
        <span>
          © {new Date().getFullYear()} {site.legalName}
        </span>
        {site.insured && <span>Insured</span>}
        <span>Residential gutter cleaning, {site.county}, {site.state}</span>
        <Link href={legalPaths.terms}>Terms of Service</Link>
        <Link href={legalPaths.privacy}>Privacy Policy</Link>
        <Link href={legalPaths.planTerms}>Recurring Plan Terms</Link>
        <MadeBy className={styles.madeBy} />
      </div>
    </footer>
  );
}
