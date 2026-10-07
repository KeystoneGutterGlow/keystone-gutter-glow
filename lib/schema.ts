import { towns } from "@/content/area";
import { faqs } from "@/content/faqs";
import { packages, rinse } from "@/content/pricing";
import { site } from "@/content/site";
import { publicUrl } from "./env";

// JSON-LD for the home page. Everything is built from content/, so prices, towns and FAQs
// in the markup can't drift from what's on the page.
// No street address is published: Keystone works as a service-area business. If a public
// business address exists, add it under `address` on the business node.

export function homeJsonLd() {
  const bizId = `${publicUrl}/#business`;
  const areaServed = [
    { "@type": "AdministrativeArea", name: `${site.county}, ${site.state}` },
    ...towns.map((t) => ({
      "@type": "City",
      name: `${t.name}, ${site.state}`,
      containedInPlace: { "@type": "AdministrativeArea", name: site.county },
    })),
  ];

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
        "@type": "HomeAndConstructionBusiness",
        "@id": bizId,
        name: site.legalName,
        alternateName: site.name,
        url: `${publicUrl}/`,
        logo: `${publicUrl}/images/keystone-logo.png`,
        image: `${publicUrl}/opengraph-image`,
        telephone: site.phone.schema,
        email: site.email,
        priceRange: `$${Math.min(...packages.map((p) => p.price))}+`,
        description:
          "Residential gutter cleaning by vacuum in Jamison, Doylestown, Warwick and nearby Bucks County towns. Downspouts cleared and tested, before-and-after photos, online booking.",
        areaServed,
        founder: { "@type": "Person", name: site.owner },
        knowsAbout: ["Gutter cleaning", "Gutter vacuuming", "Downspout clearing", "Gutter rinsing"],
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
        name: "Vacuum gutter cleaning",
        description:
          "Every gutter run vacuumed out, downspouts cleared and flow-tested, and before-and-after photos. Optional rinse.",
        provider: { "@id": bizId },
        areaServed,
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
