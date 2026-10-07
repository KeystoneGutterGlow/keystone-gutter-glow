import { BookLink } from "@/components/BookLink";
import { Keystone } from "@/components/Keystone";
import { packages } from "@/content/pricing";
import { jobParts } from "@/content/services";
import { site } from "@/content/site";
import { HouseCorner } from "./HouseCorner";
import styles from "./Services.module.css";

export function Services() {
  const large = packages.find((p) => p.id === "large")!;
  return (
    <section id="services" className={styles.services} aria-labelledby="services-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.left}>
          <header className={styles.head}>
            <h2 id="services-title">What we clean</h2>
            <p>The same job on every house. The price changes with the height, not with the list.</p>
          </header>

          <ol className={styles.list}>
            {jobParts.map((part) => (
              <li key={part.n} className={part.addOn ? styles.addOn : undefined}>
                <Keystone n={part.n} size={28} dashed={part.addOn} />
                <div>
                  <h3>{part.title}</h3>
                  <p>{part.body}</p>
                  {part.note && <p className={styles.note}>{part.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.right}>
          <figure className={styles.drawing}>
            <HouseCorner />
          </figure>

          <aside className={styles.aside}>
            <p>
              <strong>Three floors, a big footprint, or a roof that&rsquo;s a puzzle?</strong> Those start at $
              {large.price}. We look at the house and confirm the price before we come out.{" "}
              <BookLink packageId="large" className="textlink">
                Start a quote
              </BookLink>
            </p>
            {site.residentialOnly && (
              <p className={styles.limit}>Houses and townhomes only. We don&rsquo;t take commercial buildings.</p>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
