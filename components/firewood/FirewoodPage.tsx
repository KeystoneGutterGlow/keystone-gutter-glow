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
import { configBlockers } from "@/lib/firewood/gate";
import { CordDefs, cordDrawingWidth, CordStack } from "./CordStacks";
import styles from "./Firewood.module.css";
import { OrderForm } from "./OrderForm";
import { PickLink } from "./PickLink";

// Winter mode. Same bones as the gutter site (left rail, drawn scale figures, everything draining
// to the action at the bottom) in soft white and red, with a stack of logs where the downspout
// was. The logs catch fire as you scroll, down to the order form.

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

const FLAKES = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37 + 7) % 100}%`,
  size: 3 + (i % 4),
  duration: `${9 + (i * 7) % 11}s`,
  delay: `-${(i * 3) % 13}s`,
}));

export function FirewoodPage() {
  const links = modeLinks();
  const blockers = configBlockers();
  const unconfirmed = blockers.length > 0;

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
          <div className={styles.snow} aria-hidden="true">
            {FLAKES.map((f, i) => (
              <span
                key={i}
                style={{ left: f.left, width: f.size, height: f.size, animationDuration: f.duration, animationDelay: f.delay }}
              />
            ))}
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.where}>Winter firewood from {site.name}, {site.county}</p>
            <h1 id="fw-title">Firewood, delivered and stacked where you want it.</h1>
            <p className={styles.offer}>
              <strong>A quarter cord is ${firewoodStartingPrice}.</strong> Delivery and stacking are in that price.
              {unconfirmed && <Unconfirmed>price not final</Unconfirmed>}
            </p>
            <PickLink className="btn btn--sky">
              Order firewood
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </PickLink>
          </div>
          <CordStack
            depthLogs={1}
            className={styles.heroStack}
            label="Drawing of a quarter cord: a wall of split logs one log deep, with snow along the top."
          />
        </section>

        {unconfirmed && <NotReady blockers={blockers} />}

        <section id="sizes" className={styles.sizes} aria-labelledby="sizes-title">
          <div className="wrap">
            <h2 id="sizes-title">Three sizes</h2>
            <p className={styles.sizesLede}>
              Each one is the same wall from the front, about 4 ft high and 8 ft long. It&rsquo;s how far back the stack
              runs that changes.
            </p>
            <ul className={styles.yard}>
              {firewoodProducts.map((p) => (
                <li key={p.id} style={{ flexGrow: cordDrawingWidth(p.depthLogs) }}>
                  <CordStack
                    depthLogs={p.depthLogs}
                    className={styles.stack}
                    label={`Drawing of a ${p.name.toLowerCase()}, stacked ${p.depthLogs} ${p.depthLogs === 1 ? "log" : "logs"} deep.`}
                  />
                  <h3>{p.name}</h3>
                  <p className={styles.price}>${p.price}</p>
                  <p className={styles.dims}>
                    {p.dimensions}. {p.logs}.
                  </p>
                  <PickLink productId={p.id} className="textlink">
                    Order a {p.name.toLowerCase()}
                  </PickLink>
                </li>
              ))}
            </ul>
            <p className={styles.approx}>
              These sizes and log counts are approximate. Split wood doesn&rsquo;t stack the same way twice.
            </p>
          </div>
        </section>

        <section id="charges" className={styles.charges} aria-labelledby="charges-title">
          <div className="wrap">
            <h2 id="charges-title">What changes the price</h2>
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
            {firewood.tax.value.note ? (
              <p className={styles.taxNote}>{firewood.tax.value.note}</p>
            ) : (
              <p className={`ph ${styles.taxNote}`}>Sales tax: no tax is added until Jimmy confirms how it applies.</p>
            )}
          </div>
        </section>

        <section id="delivery" className={styles.delivery} aria-labelledby="delivery-title">
          <div className="wrap">
            <h2 id="delivery-title">Delivery and cancellations</h2>
            <dl className={styles.policyList}>
              <Policy term="Where we deliver" value={firewood.deliveryArea.value.description} missing="Delivery area to be confirmed." />
              <Policy
                term="Which days"
                value={(firewood.schedule as Confirmable<unknown>).status === "confirmed" ? firewood.schedule.value.summary : null}
                missing="Delivery days and notice to be confirmed."
              />
              <Policy term="Availability" value={firewood.schedule.value.availability} missing="Availability to be confirmed." />
              <Policy term="Rescheduling" value={firewood.policies.value.cancellation} missing="Firewood cancellation policy to be confirmed." />
              <Policy term="Refunds" value={firewood.policies.value.refunds} missing="Refund policy to be confirmed." />
            </dl>
          </div>
        </section>

        <section id={ORDER_ID} className={styles.order} aria-labelledby="order-title">
          <div className="wrap">
            <h2 id="order-title">Order firewood</h2>
            <p className={styles.orderLede}>
              Prefer to order by phone? Call or text <a href={site.phone.href}>{site.phone.display}</a>.
            </p>
            <OrderForm />
          </div>
        </section>
      </main>

      <FirewoodFooter links={links} />
    </div>
  );
}

function Unconfirmed({ children }: { children: React.ReactNode }) {
  return <span className={`ph ${styles.flag}`}>{children}</span>;
}

function Policy({ term, value, missing }: { term: string; value: string | null; missing: string }) {
  return (
    <div>
      <dt>{term}</dt>
      <dd>{value ?? <span className="ph">{missing}</span>}</dd>
    </div>
  );
}

function NotReady({ blockers }: { blockers: ReturnType<typeof configBlockers> }) {
  return (
    <aside className={styles.notReady} aria-labelledby="not-ready-title">
      <div className="wrap">
        <details>
          <summary>
            <strong id="not-ready-title">This page isn&rsquo;t taking real orders yet.</strong> {blockers.length}{" "}
            {blockers.length === 1 ? "item needs" : "items need"} Jimmy&rsquo;s answer.
          </summary>
          <p>
            Real payments stay blocked until each item is marked confirmed in <code>content/firewood.ts</code>.
          </p>
          <ul>
            {blockers.map((b) => (
              <li key={b.key}>
                <strong>{b.label}</strong> ({b.status === "contract" ? "from the agreement, not confirmed" : "still open"}). {b.ask}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </aside>
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
    </footer>
  );
}
