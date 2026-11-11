import { OakSprig } from "@/components/botanical/Botanical";
import { areaCounties, areaPlaces, countyName, serviceRadius, type AreaState } from "@/content/area";
import { AreaMap } from "./AreaMap";
import styles from "./Area.module.css";
import { ZipCheck } from "./ZipCheck";

const STATES: Array<{ state: AreaState; label: string }> = [
  { state: "PA", label: "Pennsylvania" },
  { state: "NJ", label: "New Jersey" },
];

/** "Bucks, Montgomery and Philadelphia": the county names without the word "County". */
function countyList(state: AreaState) {
  const names = areaCounties.filter((c) => c.state === state).map((c) => c.county);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : (names[0] ?? "");
}

export function Area() {
  return (
    <section id="area" className={styles.area} aria-labelledby="area-title">
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.intro}>
          <h2 id="area-title">Where we work</h2>
          <p>
            We work within {serviceRadius.miles} miles of our base in Jamison. That takes in Bucks, Montgomery and Philadelphia
            Counties and parts of the counties around them, and reaches across the Delaware River into New Jersey, from
            Flemington and Princeton down to Cherry Hill. Anywhere inside the circle on the map is in our area.
          </p>
          <ZipCheck />
          <OakSprig className={styles.oak} />
        </div>

        <div className={styles.where}>
          <div className={styles.map}>
            <AreaMap />
          </div>
          <p className={styles.mapNote}>
            The dashed circle is {serviceRadius.miles} miles from our base in Jamison. Near its edge, check your ZIP.
          </p>
          <h3 className={styles.townsTitle}>Counties inside the circle</h3>
          <dl className={styles.counties}>
            {STATES.map(({ state, label }) => (
              <div key={state}>
                <dt>{label}</dt>
                <dd>{countyList(state)}</dd>
              </div>
            ))}
          </dl>
          {/* Every place, from content/area.ts. Closed by default: there are a couple of hundred. */}
          <details className={styles.allTowns}>
            <summary>Every town inside the circle ({areaPlaces.length})</summary>
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
