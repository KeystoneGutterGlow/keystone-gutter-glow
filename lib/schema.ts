import { areaCounties, countyName, serviceRadius } from "@/content/area";
import { faqs } from "@/content/faqs";
import { packages, rinse } from "@/content/pricing";
import { isFirewoodVisible } from "@/content/season";
import { site } from "@/content/site";
import { publicUrl } from "./env";

// JSON-LD for the gutter and firewood pages. Everything is built from content/, so prices, towns
// and FAQs in the markup can't drift from what's on the page, and every URL comes from publicUrl.
// No street address, opening hours, coordinates, ratings or reviews are published: Keystone is a
// service-area business and none of those are confirmed. If a public business address or real
// reviews exist later, add them to the business node.

const bizId = () => `${publicUrl}/#business`;

/** Every county the service area reaches (content/area.ts), nearest first. Pennsylvania only. */
function areaServed() {
  return areaCounties.map((c) => ({ "@type": "AdministrativeArea", name: `${countyName(c)}, ${c.state}` }));
}

function businessNode() {
  const firewood = isFirewoodVisible();
  return {
    "@type": "HomeAndConstructionBusiness",
    "@id": bizId(),
    name: site.legalName,
    alternateName: site.name,
    url: `${publicUrl}/`,
    logo: `${publicUrl}/images/keystone-logo.png`,
    image: `${publicUrl}/opengraph-image`,
    telephone: site.phone.schema,
    email: site.email,
    priceRange: `$${Math.min(...packages.map((p) => p.price))}+`,
    description: `Residential gutter cleaning by vacuum within ${serviceRadius.miles} miles of Jamison, Pennsylvania: most of Bucks County, much of Montgomery County and the northern part of Philadelphia. Pennsylvania only. Every gutter run vacuumed, downspouts cleared and flow-tested, before-and-after photos, and online booking.${firewood ? " Firewood delivery too." : ""}`,
    areaServed: areaServed(),
    founder: { "@type": "Person", name: site.owner },
    knowsAbout: ["Gutter cleaning", "Gutter vacuuming", "Downspout clearing", "Gutter rinsing", ...(firewood ? ["Firewood delivery"] : [])],
  };
}

export function homeJsonLd() {
  const bizId = `${publicUrl}/#business`;
  const areaServed_ = areaServed();

  const offers = [
    ...packages.map((p) => ({
      "@type": "Offer",
      name: `Gutter cleaning, ${p.name.toLowerCase()} home`,
      description: p.fits,
      priceCurrency: "USD",
      ...(p.isFrom
        ? { priceSpecification: { "@type": "PriceSpecification", minPrice: p.price, priceCurrency: "USD" } }
        : { price: p.price }),
    })),
    {
      "@type": "Offer",
      name: `${rinse.name} add-on`,
      description: rinse.short,
      priceCurrency: "USD",
      price: rinse.price,
    },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${publicUrl}/#website`,
        url: `${publicUrl}/`,
        name: site.name,
        publisher: { "@id": bizId },
      },
      {
        ...businessNode(),
        potentialAction: {
          "@type": "ReserveAction",
          target: { "@type": "EntryPoint", urlTemplate: `${publicUrl}/#book` },
          result: { "@type": "Reservation", name: "Gutter cleaning appointment" },
        },
      },
      {
        "@type": "Service",
        "@id": `${publicUrl}/#gutter-cleaning`,
        serviceType: "Gutter cleaning",
        name: "Residential gutter cleaning by vacuum",
        description:
          "Every gutter run vacuumed out from the ground with a carbon pole, downspouts cleared and flow-tested, and before-and-after photos. Optional rinse.",
        provider: { "@id": bizId },
        areaServed: areaServed_,
        offers,
      },
      {
        "@type": "FAQPage",
        "@id": `${publicUrl}/#faq`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}

/** JSON-LD for the firewood page. `path` is where it's served: /firewood, or / in firewood mode. */
export function firewoodJsonLd(path: string) {
  const pageUrl = path === "/" ? `${publicUrl}/` : `${publicUrl}${path}`;
  const graph: Record<string, unknown>[] = [
    businessNode(),
    {
      "@type": "Service",
      "@id": `${pageUrl}#firewood-delivery`,
      serviceType: "Firewood delivery",
      name: "Firewood delivered and stacked",
      description:
        "Split firewood delivered and stacked where you want it, all year, in quarter, half and full cords. Order online with a delivery date at least a week out.",
      provider: { "@id": bizId() },
      areaServed: areaServed(),
      url: pageUrl,
    },
  ];
  if (path !== "/") {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Gutter cleaning", item: `${publicUrl}/` },
        { "@type": "ListItem", position: 2, name: "Firewood delivery", item: pageUrl },
      ],
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
