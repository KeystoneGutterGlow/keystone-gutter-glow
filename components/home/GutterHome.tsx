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
import { ModeSwitch } from "@/components/season/ModeSwitch";
import { Services } from "@/components/services/Services";
import { Vacuum } from "@/components/vacuum/Vacuum";
import { Work } from "@/components/work/Work";
import { BOOK_ID, homeSections } from "@/content/nav";
import { modeLinks } from "@/content/season";
import { homeJsonLd } from "@/lib/schema";

// The gutter-cleaning site. Lives at "/" normally, and at /gutters in firewood mode.

export function GutterHome() {
  const links = modeLinks();
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <a className="skip" href={`#${BOOK_ID}`}>
        Skip to booking
      </a>
      <Rail items={homeSections} endId={BOOK_ID} endLabel="Book a cleaning" referLink />
      <MobileNav items={homeSections} endId={BOOK_ID} topSlot={links && <ModeSwitch links={links} current="gutter" />} />
      {links && <ModeSwitch links={links} current="gutter" floating />}
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
