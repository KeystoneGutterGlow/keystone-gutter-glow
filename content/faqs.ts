// FAQ answers rewritten from the current site's FAQ and its cancellation policy.
// The FAQPage schema is built from this list, so every question here is also on the page.
// The cost, schedule and towns answers are built from content/, so they can't drift from the page.

import { areaZips, serviceRadius } from "./area";
import { recommendedWhy } from "./plans";
import { getPackage, rinse } from "./pricing";

export interface Faq {
  q: string;
  a: string;
}

const price = (id: Parameters<typeof getPackage>[0]) => getPackage(id)?.price;
/** Better-known places inside the circle, named in the towns answer. Any that leave the list drop out. */
const namedTowns = ["Doylestown", "Warminster", "Warrington", "Horsham", "Hatboro", "Richboro", "Southampton", "Newtown", "Chalfont", "New Hope", "Willow Grove"].filter(
  (t) => areaZips.some((z) => z.name === t),
);

export const faqs: Faq[] = [
  {
    q: "How much does gutter cleaning cost?",
    a: `One-story homes are $${price("one-story")}, townhomes $${price("townhome")} and two-story homes $${price("two-story")}. Three floors, a big footprint or a complicated roofline start at $${price("large")}, and we confirm that price before we come out. The rinse is $${rinse.price} extra. Nothing is due until the job is done.`,
  },
  {
    q: "How often should gutters be cleaned?",
    a: `${recommendedWhy} That's why we recommend every 6 months. Plans every 3 or 4 months, or once a year, are available too.`,
  },
  {
    q: "Which towns do you cover?",
    a: `Anywhere within ${serviceRadius.miles} miles of our base in Jamison. That includes ${namedTowns.slice(0, -1).join(", ")} and ${namedTowns.at(-1)}, among others. Not sure about your street? Check your ZIP in the Where we work section, or call or text.`,
  },
  {
    q: "Do I need to be home?",
    a: "No. If we can get to the gutters, you can be at work. The before-and-after photos come to you either way.",
  },
  {
    q: "Is it safe on a two-story house?",
    a: "Yes. The carbon vacuum pole goes up to 40 feet, which covers a normal two-story home with room to spare. Taller or awkward houses go through a quick quote first so we can plan for them.",
  },
  {
    q: "What does a standard cleaning include?",
    a: "Vacuuming every gutter run, clearing each downspout and running water down it to check that it drains, and before-and-after photos when conditions allow. The rinse is the only extra.",
  },
  {
    q: "Can I put it on a schedule?",
    a: "Yes. You can ask for a cleaning every 3, 4 or 6 months, or once a year, when you book or from the Prices section. We recommend every 6 months, to catch spring seeds and fall leaves. It's a request, so Jimmy sets it up with you and nothing bills automatically.",
  },
  {
    q: "What's the rinse, and do I need it?",
    a: "After the vacuum pass we flush the troughs with water. That lifts the fine grit and residue that sits on the bottom, the stuff a scoop never gets and a vacuum mostly gets. We'd do it at least once a year, ideally after the leaves are down. It's $25.",
  },
  {
    q: "How long does it take?",
    a: "Most one-story homes take 45 minutes to an hour. Two-story, 60 to 90.",
  },
  {
    q: "When do I pay?",
    a: "After the job. Nothing is charged when you book; we send an invoice once the cleaning is finished.",
  },
  {
    q: "What happens if the weather turns?",
    a: "Heavy rain, lightning, ice or high wind and we'll move you to the next open day at no cost. We'll tell you as early as we can.",
  },
  {
    q: "Can I cancel or reschedule?",
    a: "Yes, free with at least 24 hours' notice. Call, text or email. Inside 24 hours a cancellation fee may apply, and we'll tell you what it is before charging anything.",
  },
  {
    q: "What if I'm not happy with it?",
    a: "Tell us within 48 hours and we'll come back and sort it out at no charge. If a second visit doesn't fix it, we'll talk about a partial or full refund.",
  },
];
