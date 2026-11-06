import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "@/components/nav/MobileNav";
import { Rail } from "@/components/nav/Rail";
import { ModeSwitch } from "@/components/season/ModeSwitch";
import { firewood, firewoodExtras, firewoodMethods, firewoodProducts, firewoodStartingPrice, type Confirmable } from "@/content/firewood";
import { firewoodSections, ORDER_ID } from "@/content/nav";
import { modeLinks, type ModeLinks } from "@/content/season";
import { site } from "@/content/site";
import { HemlockBough } from "@/components/botanical/Botanical";
import { CordBand, CordDefs, cordDrawingWidth, CordStack } from "./CordStacks";
import styles from "./Firewood.module.css";
import { OrderForm } from "./OrderForm";
import { PickLink } from "./PickLink";
import { HeroScene, HeroWoods, TreeRings, Treeline } from "./Scene";

// Winter mode. Same bones as the gutter site (left rail, drawn scale figures, everything draining
// to the action at the bottom) in soft white and red, with a stack of logs where the downspout
// was. The logs catch fire as you scroll, down to the order form. A woodpile band and a dark board
// of charges give the page its weight, and it ends at the edge of the hemlocks.

const description = `Firewood delivered and stacked in Bucks County. A quarter cord starts at $${firewoodStartingPrice}. Pick a delivery date and tell us where you want it.`;

export function firewoodMetadata(canonical: string): Metadata {
  return {
    title: { absolute: "Firewood Delivery in Bucks County, PA | Keystone Gutter Glow" },
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: site.name,
      title: "Firewood delivered and stacked in Bucks County",
      description,
      locale: "en_US",
    },
  };
}

export const firewoodViewport: Viewport = { themeColor: "#faf8f4" };

export function FirewoodPage() {
  const links = modeLinks();

  return (
    <div data-season="firewood">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <a className="skip" href={`#${ORDER_ID}`}>
        Skip to the order form
      </a>
      <Rail items={firewoodSections} endId={ORDER_ID} endLabel="Order firewood" />
      <MobileNav
        items={firewoodSections}
        endId={ORDER_ID}
        bookLabel="Order firewood"
        topSlot={links && <ModeSwitch links={links} current="firewood" />}
      />
      {links && <ModeSwitch links={links} current="firewood" floating />}
      <CordDefs />

      <main id="main">
        <section id="top" className={styles.hero} aria-labelledby="fw-title">
          <HeroWoods className={styles.heroWoods} />
          <div className={styles.heroCopy}>
            <p className={styles.where}>Year-round firewood from {site.name}, {site.county}</p>
            <h1 id="fw-title">Firewood, delivered and stacked where you want it.</h1>
            <p className={styles.offer}>Delivery and stacking are included in every size.</p>
            <PickLink className="btn btn--sky">
              Order firewood
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </PickLink>
          </div>
          <HeroScene
            className={styles.heroStack}
            label="Drawing of a stack of split firewood and a chopping block with a hatchet set in it, in front of a stand of hemlocks."
          />
        </section>

        <section id="sizes" className={styles.sizes} aria-labelledby="sizes-title">
          <HemlockBough className={styles.sizesBough} />
          <div className="wrap">
            <header className={styles.sizesHead}>
              <h2 id="sizes-title">Three sizes</h2>
              <p className={styles.sizesLede}>
                Each one is the same wall from the front, about 4 ft high and 8 ft long. It&rsquo;s how far back the stack
                runs that changes.
              </p>
            </header>
            <ul
              className={styles.yard}
              style={{ "--lots": firewoodProducts.map((p) => `${cordDrawingWidth(p.depthLogs)}fr`).join(" ") } as React.CSSProperties}
            >
              {firewoodProducts.map((p) => (
                <li key={p.id}>
                  <div className={styles.lot}>
                    <CordStack
                      depthLogs={p.depthLogs}
                      className={styles.stack}
                      label={`Drawing of a ${p.name.toLowerCase()}, stacked ${p.depthLogs} ${p.depthLogs === 1 ? "log" : "logs"} deep.`}
                    />
                  </div>
                  <div className={styles.lotText}>
                    <h3>{p.name}</h3>
                    <p className={styles.price}>${p.price}</p>
                    <p className={styles.dims}>
                      {p.dimensions}. {p.logs}.
                    </p>
                    <PickLink productId={p.id} className="textlink">
                      Order a {p.name.toLowerCase()}
                    </PickLink>
                  </div>
                </li>
              ))}
            </ul>
            <p className={styles.approx}>
              These sizes and log counts are approximate. Split wood doesn&rsquo;t stack the same way twice.
            </p>
          </div>
        </section>

        <CordBand className={styles.band} />

        <section id="charges" className={`${styles.charges} on-dark`} aria-labelledby="charges-title">
          <TreeRings className={styles.chargesRings} />
          <div className={`wrap ${styles.chargesGrid}`}>
            <div className={styles.chargesHead}>
              <h2 id="charges-title">What changes the price</h2>
              {firewood.tax.value.note && <p className={styles.taxNote}>{firewood.tax.value.note}</p>}
            </div>
            <table className={styles.chargeTable}>
              <caption className="vh">Changes to the base price</caption>
              <tbody>
                {firewoodMethods.map((m) => (
                  <tr key={m.id}>
                    <th scope="row">
                      {m.name}
                      <span>{m.description}</span>
                    </th>
                    <td>{m.adjustment === 0 ? "Included" : `-$${Math.abs(m.adjustment)}`}</td>
                  </tr>
                ))}
                {firewoodExtras.map((e) => (
                  <tr key={e.id}>
                    <th scope="row">
                      {e.name}
                      <span>{e.description}</span>
                    </th>
                    <td>+${e.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="delivery" className={styles.delivery} aria-labelledby="delivery-title">
          <HemlockBough className={styles.deliveryBough} seed={12} />
          <div className={`wrap ${styles.deliveryGrid}`}>
            <h2 id="delivery-title">Delivery and rescheduling</h2>
            <dl className={styles.policyList}>
              <Policy
                wide
                term="Which days"
                value={(firewood.schedule as Confirmable<unknown>).status === "confirmed" ? firewood.schedule.value.summary : null}
                missing="Delivery days and notice to be confirmed."
              />
              <Policy term="Availability" value={firewood.schedule.value.availability} missing="Availability to be confirmed." />
              <Policy term="Where we deliver" value={firewood.deliveryArea.value.description} missing="Delivery area to be confirmed." />
              <Policy term="Rescheduling" value={firewood.policies.value.cancellation} missing="Firewood cancellation policy to be confirmed." />
              <Policy term="Refunds" value={firewood.policies.value.refunds} missing="Refund policy to be confirmed." />
            </dl>
          </div>
        </section>

        <section id={ORDER_ID} className={styles.order} aria-labelledby="order-title">
          <TreeRings className={styles.orderRings} />
          <div className="wrap">
            <h2 id="order-title">Order firewood</h2>
            <p className={styles.orderLede}>
              Prefer to order by phone? Call or text <a href={site.phone.href}>{site.phone.display}</a>.
            </p>
            <OrderForm />
          </div>
        </section>
      </main>

      <Treeline className={styles.treeline} />
      <FirewoodFooter links={links} />
    </div>
  );
}

function Policy({ term, value, missing, wide }: { term: string; value: string | null; missing: string; wide?: boolean }) {
  return (
    <div className={wide ? styles.policyWide : undefined}>
      <dt>{term}</dt>
      <dd>{value ?? <span className="ph">{missing}</span>}</dd>
    </div>
  );
}

function FirewoodFooter({ links }: { links: ModeLinks | null }) {
  return (
    <footer className={`${styles.footer} on-dark`}>
      <div className={`wrap ${styles.footGrid}`}>
        <Image src="/images/keystone-logo-light.png" alt={site.legalName} width={190} height={64} />
        <div>
          <a href={site.phone.href} className={styles.footPhone}>
            {site.phone.display}
          </a>
          <p>Calls and texts</p>
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </div>
        {links && (
          <p>
            <Link href={links.gutterHref} className="textlink">
              Looking for gutter cleaning?
            </Link>
          </p>
        )}
      </div>
      <div className={`wrap ${styles.footBase}`}>
        <span>
          © {new Date().getFullYear()} {site.legalName}
        </span>
        <span>Firewood delivered and stacked, {site.county}, {site.state}</span>
      </div>
    </footer>
  );
}
