import type { Metadata } from "next";
import { Area } from "@/components/area/Area";
import { Booking } from "@/components/booking/Booking";
import { Faq } from "@/components/faq/Faq";
import { Footer } from "@/components/footer/Footer";
import { Hero } from "@/components/hero/Hero";
import { MobileNav } from "@/components/nav/MobileNav";
import { Rail } from "@/components/nav/Rail";
import { Owner } from "@/components/owner/Owner";
import { Pricing } from "@/components/pricing/Pricing";
import { Process } from "@/components/process/Process";
import { Services } from "@/components/services/Services";
import { Vacuum } from "@/components/vacuum/Vacuum";
import { Work } from "@/components/work/Work";
import { BOOK_ID, homeSections } from "@/content/nav";
import { startingPrice } from "@/content/pricing";
import { homeJsonLd } from "@/lib/schema";

const description = `Gutter cleaning by vacuum for homes in Jamison, Doylestown, Warwick and nearby Bucks County towns. From $${startingPrice}, pay after the job, book a time online.`;

export const metadata: Metadata = {
  title: { absolute: "Gutter Cleaning in Bucks County, PA | Keystone Gutter Glow" },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Keystone Gutter Glow",
    title: "Gutter cleaning in Bucks County, done by vacuum",
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gutter cleaning in Bucks County, done by vacuum",
    description,
  },
};

export default function HomePage() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <a className="skip" href={`#${BOOK_ID}`}>
        Skip to booking
      </a>
      <Rail items={homeSections} endId={BOOK_ID} endLabel="Book a cleaning" />
      <MobileNav items={homeSections} endId={BOOK_ID} />
      <main id="main">
        <Hero />
        <Services />
        <Vacuum />
        <Process />
        <Pricing />
        <Work />
        <Owner />
        <Area />
        <Faq />
        <Booking />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        // JSON.stringify output is safe here: it's built from our own content files.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd()).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
