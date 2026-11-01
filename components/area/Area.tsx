import { serviceRadius, towns } from "@/content/area";
import { AreaMap } from "./AreaMap";
import styles from "./Area.module.css";
import { ZipCheck } from "./ZipCheck";

export function Area() {
  return (
    <section id="area" className={styles.area} aria-labelledby="area-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.intro}>
          <h2 id="area-title">Where we work</h2>
          <p>
            We work within {serviceRadius.miles} miles of our base in Jamison, across central and lower Bucks County. The
            list grows, so if your town isn&rsquo;t on it, ask.
          </p>
          <ZipCheck />
        </div>

        <div className={styles.where}>
          {/* The map is a wide-screen view; on phones the list below does the job at a readable size. */}
          <div className={styles.map}>
            <AreaMap />
          </div>
          <ul className={styles.list} aria-label="Towns we serve">
            {towns.map((t) => (
              <li key={t.name}>
                {t.name}
                {t.sub && <span className={styles.sub}> ({t.sub})</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
