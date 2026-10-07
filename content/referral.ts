// /referred page content. The referral program isn't designed yet, so nothing here
// commits to a mechanic. Every `draft: true` item renders as a visible placeholder.
// When the program is decided: fill these in, flip `live` to true, and wire the form.

export const referral = {
  live: false,
  /** Keep the page out of search results until the program is real */
  indexable: false,
  headline: "Send a neighbor our way.",
  intro:
    "We're setting up a thank-you for customers who send people to us. The details aren't final, so the reward, the steps and the fine print on this page are placeholders for now.",
  rewards: [
    { who: "You get", value: "Reward to be decided", hint: "A credit, cash, a free rinse? Pick one.", draft: true },
    { who: "Your neighbor gets", value: "Discount to be decided", hint: "Usually a set amount off the first cleaning.", draft: true },
  ],
  steps: [
    { title: "You pass it on", body: "How sharing works: a personal link, a code, or just your name at booking.", draft: true },
    { title: "They book a cleaning", body: "What counts as a referral, and how long the referral stays valid.", draft: true },
    { title: "You get thanked", body: "When the reward is paid out, and how: after their cleaning, by mail, on your next invoice.", draft: true },
  ],
  faqs: [
    { q: "Is there a limit to how many people I can refer?", a: "To be decided.", draft: true },
    { q: "Does my neighbor have to be in your service area?", a: "To be decided. Probably yes.", draft: true },
    { q: "When do I get my reward?", a: "To be decided.", draft: true },
    { q: "Can I combine it with other offers?", a: "To be decided.", draft: true },
  ],
};
