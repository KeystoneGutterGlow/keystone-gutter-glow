import { OakSprig } from "@/components/botanical/Botanical";
import { areaPlaces, serviceRadius } from "@/content/area";
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
            We work within {serviceRadius.miles} miles of our base in Jamison. That takes in central Bucks County and the
            nearby corner of Montgomery County. Anywhere inside the circle on the map is in our area.
          </p>
          <ZipCheck />
          <OakSprig className={styles.oak} />
        </div>

        <div className={styles.where}>
          <div className={styles.map}>
            <AreaMap />
          </div>
          <p className={styles.mapNote}>
            The dashed circle is {serviceRadius.miles} miles from our base in Jamison.
          </p>
          <ul className="vh" aria-label="Towns inside the circle">
            {areaPlaces.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
