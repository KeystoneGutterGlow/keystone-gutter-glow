import { rinse } from "@/content/pricing";
import { Compare } from "./Compare";
import { ScoopSection, VacuumSection } from "./CrossSection";
import styles from "./Vacuum.module.css";

const rows = [
  {
    what: "The leaves and needles",
    vac: "Up the hose into a sealed tank on the cart. It leaves with us.",
    scoop: "Into a bucket or a bag, or flicked over the side.",
  },
  {
    what: "The wet layer underneath",
    vac: "Pulled out with everything else.",
    scoop: "Often left behind. It's heavy, and it smears.",
  },
  {
    what: "Corners and downspout openings",
    vac: "The nozzle fits into them.",
    scoop: "Hard to get a hand into.",
  },
  {
    what: "Your lawn and beds",
    vac: "Nothing lands on them.",
    scoop: "Whatever missed the bucket.",
  },
];

export function Vacuum() {
  return (
    <section id="vacuum" className={`${styles.vac} on-dark`} aria-labelledby="vacuum-title">
      <div className="wrap">
        <h2 id="vacuum-title" className={styles.slogan}>
          <span className={styles.we}>We vacuum.</span>{" "}
          <span className={styles.they}>They scoop.</span>
        </h2>

        <p className={styles.lede}>
          Most gutter cleaning is still a person on a ladder with a scoop. A scoop gets the top layer. The wet, packed
          stuff at the bottom of the trough tends to stay, and some of what comes out ends up in your flower beds. We
          pull it all up a hose instead.
        </p>

        <Compare
          vacuum={
            <figure className={`${styles.pane} ${styles.paneVac}`} data-pane="vacuum">
              <VacuumSection />
              <figcaption>
                <strong>Ours.</strong> The nozzle sits on the bottom of the trough, so it takes the sludge along with the
                leaves.
              </figcaption>
            </figure>
          }
          scoop={
            <figure className={`${styles.pane} ${styles.paneScoop}`} data-pane="scoop">
              <ScoopSection />
              <figcaption>
                <strong>By hand.</strong> The bulk comes out. The bottom layer, and anything that slips off the scoop,
                doesn&rsquo;t.
              </figcaption>
            </figure>
          }
        />

        <div className={styles.lower}>
          <div className={styles.ledger}>
            <h3>Where it all goes</h3>
            <table>
              <thead>
                <tr>
                  <td />
                  <th scope="col">Vacuum</th>
                  <th scope="col">Scoop</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.what}>
                    <th scope="row">{r.what}</th>
                    <td data-label="Vacuum">{r.vac}</td>
                    <td data-label="Scoop">{r.scoop}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className={styles.honest}>
              A vacuum isn&rsquo;t magic. Fine grit sticks to the bottom of a gutter, and water is what lifts it. That&rsquo;s
              what the ${rinse.price} rinse is for.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
