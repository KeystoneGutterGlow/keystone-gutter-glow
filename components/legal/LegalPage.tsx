import Link from "next/link";
import { Footer } from "@/components/footer/Footer";
import { MobileNav } from "@/components/nav/MobileNav";
import { Rail } from "@/components/nav/Rail";
import { LEGAL_UPDATED, legalDocs, type LegalDoc } from "@/content/legal";
import styles from "./Legal.module.css";

// One legal page (content/legal.tsx): the site's rail and menu, a header like the referral page's,
// then each section. The other two legal pages are linked at the bottom.

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const items = doc.sections.map((s) => ({ id: s.id, label: s.nav }));
  const others = Object.values(legalDocs).filter((d) => d.path !== doc.path);
  return (
    <div>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Rail items={items} endId="__none" endLabel="Book a cleaning" homeHref="/" bookHref="/#book" homeLink planOffer />
      <MobileNav items={items} endId="__none" homeHref="/" bookHref="/#book" bookLabel="Book a cleaning" />

      <main id="main">
        <header id="top" className={styles.hero}>
          <div className={`${styles.gutter} gutter-face`} aria-hidden="true" data-gutter-anchor="" />
          <div className="wrap">
            <Link href="/" className={`textlink ${styles.back}`}>
              <span aria-hidden="true">←</span> Back to the home page
            </Link>
            <h1 className={styles.title}>{doc.title}</h1>
            <p className={styles.updated}>Last updated {LEGAL_UPDATED}</p>
            <p className={styles.intro}>{doc.intro}</p>
          </div>
        </header>

        <div className={`wrap ${styles.body}`}>
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className={styles.section} aria-labelledby={`${s.id}-title`}>
              <h2 id={`${s.id}-title`}>{s.title}</h2>
              {s.body}
            </section>
          ))}
          <nav className={styles.others} aria-label="Other policies">
            {others.map((d) => (
              <Link key={d.path} href={d.path} className="textlink">
                {d.title}
              </Link>
            ))}
          </nav>
        </div>
      </main>
      <Footer onHome={false} />
    </div>
  );
}
