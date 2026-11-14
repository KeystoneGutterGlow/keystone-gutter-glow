import { OakSprig } from "@/components/botanical/Botanical";
import { areaCounties, areaPlaces, countyName, serviceRadius } from "@/content/area";
import { AreaMap } from "./AreaMap";
import styles from "./Area.module.css";
import { ZipCheck } from "./ZipCheck";

/** "Bucks, Montgomery and Philadelphia": the county names without the word "County". */
function countyList() {
  const names = areaCounties.map((c) => c.county);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : (names[0] ?? "");
}

export function Area() {
  return (
    <section id="area" className={styles.area} aria-labelledby="area-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.intro}>
          <h2 id="area-title">Where we work</h2>
          <p>
            We work within {serviceRadius.miles} miles of our base in Jamison, in Pennsylvania. That takes in most of Bucks County,
            much of Montgomery County and the northern part of Philadelphia. Anywhere inside the circle on the Pennsylvania side of
            the Delaware River is in our area. We don&rsquo;t work in New Jersey.
          </p>
          <ZipCheck />
          <OakSprig className={styles.oak} />
        </div>

        <div className={styles.where}>
          <div className={styles.map}>
            <AreaMap />
          </div>
          <p className={styles.mapNote}>
            The dashed circle is {serviceRadius.miles} miles from our base in Jamison. The part across the river is New Jersey,
            which we don&rsquo;t serve. Near the edge, check your ZIP: only the ZIPs inside the circle can book.
          </p>
          <h3 className={styles.townsTitle}>Counties we cover</h3>
          <p className={styles.counties}>{countyList()} Counties, Pennsylvania</p>
          {/* Every place, from content/area.ts. Closed by default: there are a couple of hundred. */}
          <details className={styles.allTowns}>
            <summary>Every town we cover ({areaPlaces.length})</summary>
            {areaCounties.map((c) => (
              <div key={`${c.state}-${c.county}`} className={styles.countyTowns}>
                <h4>
                  {countyName(c)}, {c.state}
                </h4>
                <ul className={styles.towns}>
                  {c.towns.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </details>
        </div>
      </div>
    </section>
  );
}
